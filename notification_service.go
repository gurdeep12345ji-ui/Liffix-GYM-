// NexusAI Notification Service — Go Microservice
// Real-time push notifications, webhooks, SMS, email alerts
// High-throughput, low-latency event delivery

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

// Event types
type EventType string

const (
	EventApprovalRequired EventType = "approval_required"
	EventTaskCompleted    EventType = "task_completed"
	EventEarningReceived  EventType = "earning_received"
	EventAgentStatus      EventType = "agent_status"
	EventWithdrawal       EventType = "withdrawal"
	EventFraudAlert       EventType = "fraud_alert"
)

type Event struct {
	ID        string          `json:"id"`
	Type      EventType       `json:"type"`
	AgentID   string          `json:"agent_id"`
	OwnerID   string          `json:"owner_id"`
	Data      json.RawMessage `json:"data"`
	Timestamp time.Time       `json:"timestamp"`
	Priority  int             `json:"priority"` // 1=low, 5=critical
}

type ApprovalPayload struct {
	TaskID             string  `json:"task_id"`
	Description        string  `json:"description"`
	EstimatedEarnings  float64 `json:"estimated_earnings"`
	RiskLevel          string  `json:"risk_level"`
	Steps              []Step  `json:"steps"`
	ExpiresAt          time.Time `json:"expires_at"`
}

type Step struct {
	Number  int    `json:"number"`
	Action  string `json:"action"`
	Detail  string `json:"detail"`
}

type EarningPayload struct {
	TaskID   string  `json:"task_id"`
	Amount   float64 `json:"amount"`
	Platform string  `json:"platform"`
	Total    float64 `json:"total_earned"`
}

// WebSocket client connection
type Client struct {
	ID      string
	OwnerID string
	Conn    *websocket.Conn
	Send    chan []byte
	Hub     *Hub
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		// Handle incoming messages (approval/reject actions)
		var action map[string]interface{}
		if err := json.Unmarshal(msg, &action); err == nil {
			log.Printf("Client %s action: %v", c.ID, action)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(45 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Hub manages all WebSocket connections
type Hub struct {
	clients    map[string]map[*Client]bool // ownerID -> clients
	Broadcast  chan Event
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		Broadcast:  make(chan Event, 1000),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case client := <-h.Register:
			h.mu.Lock()
			if h.clients[client.OwnerID] == nil {
				h.clients[client.OwnerID] = make(map[*Client]bool)
			}
			h.clients[client.OwnerID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered: %s (owner: %s)", client.ID, client.OwnerID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if owners, ok := h.clients[client.OwnerID]; ok {
				delete(owners, client)
				if len(owners) == 0 {
					delete(h.clients, client.OwnerID)
				}
			}
			close(client.Send)
			h.mu.Unlock()

		case event := <-h.Broadcast:
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			h.mu.RLock()
			clients := h.clients[event.OwnerID]
			h.mu.RUnlock()
			for client := range clients {
				select {
				case client.Send <- data:
				default:
					close(client.Send)
					h.mu.Lock()
					delete(h.clients[event.OwnerID], client)
					h.mu.Unlock()
				}
			}
		}
	}
}

// EventBus for internal publish/subscribe
type EventBus struct {
	subscribers map[EventType][]chan Event
	mu          sync.RWMutex
}

func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[EventType][]chan Event),
	}
}

func (eb *EventBus) Subscribe(eventType EventType) <-chan Event {
	ch := make(chan Event, 100)
	eb.mu.Lock()
	eb.subscribers[eventType] = append(eb.subscribers[eventType], ch)
	eb.mu.Unlock()
	return ch
}

func (eb *EventBus) Publish(event Event) {
	eb.mu.RLock()
	subs := eb.subscribers[event.Type]
	eb.mu.RUnlock()
	for _, ch := range subs {
		select {
		case ch <- event:
		default:
			log.Printf("Subscriber channel full for event type %s", event.Type)
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func main() {
	hub := NewHub()
	bus := NewEventBus()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go hub.Run(ctx)

	// Webhook incoming handler
	http.HandleFunc("/webhook/event", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var event Event
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}
		event.ID = uuid.New().String()
		event.Timestamp = time.Now()
		hub.Broadcast <- event
		bus.Publish(event)
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{"status": "queued", "id": event.ID})
	})

	// WebSocket endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ownerID := r.URL.Query().Get("owner_id")
		if ownerID == "" {
			http.Error(w, "owner_id required", http.StatusBadRequest)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		client := &Client{
			ID:      uuid.New().String(),
			OwnerID: ownerID,
			Conn:    conn,
			Send:    make(chan []byte, 256),
			Hub:     hub,
		}
		hub.Register <- client
		go client.writePump()
		go client.readPump()
	})

	// Health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ok",
			"service": "nexusai-notifications",
			"time":    time.Now(),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("NexusAI Notification Service running on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down notification service...")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	srv.Shutdown(shutCtx)
}
