# NexusAI — Autonomous AI Business Agent

> The first AI agent platform that earns real money with human approval at every step.

## Project Structure

```
ai-business-agent/
├── frontend/                    # Next.js + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   └── index.tsx        # Main homepage
│   │   ├── components/
│   │   │   ├── Hero.tsx         # Animated hero with WebGL canvas
│   │   │   ├── Cursor.tsx       # Custom cursor with trail
│   │   │   ├── Services.tsx     # 6 income stream cards
│   │   │   ├── HowItWorks.tsx   # Step-by-step with live demo
│   │   │   ├── Earnings.tsx     # Charts, counters, streams
│   │   │   ├── Navbar.tsx       # Fixed navigation
│   │   │   └── Footer.tsx       # Footer
│   │   ├── styles/
│   │   │   └── globals.css      # Animations, variables, keyframes
│   │   └── hooks/
│   │       ├── useAgentStream.ts
│   │       └── useApproval.ts
│   └── public/
│       └── index.html           # ⭐ STANDALONE WEBSITE (open this!)
│
├── backend/                     # Python FastAPI + Java Spring Boot
│   ├── main.py                  # FastAPI server entry point
│   └── src/
│       ├── api/
│       │   ├── AgentController.java    # Java REST endpoints
│       │   ├── routes/agents.py
│       │   ├── routes/approvals.py
│       │   └── routes/earnings.py
│       ├── services/
│       │   ├── notification_service.go  # Go WebSocket server
│       │   ├── agent_orchestrator.py
│       │   ├── approval_service.py
│       │   └── earnings_tracker.py
│       └── middleware/
│           ├── rate_limiter.py
│           └── auth_middleware.py
│
├── ai-engine/                   # Python + Rust
│   └── src/
│       ├── agents/
│       │   └── orchestrator.py         # Core AI brain (Claude-powered)
│       └── tools/
│           └── task_queue.rs           # Rust high-performance queue
│
├── mobile/                      # React Native (iOS + Android)
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.tsx
│       │   └── ApprovalScreen.tsx
│       └── services/
│           └── agent_service.ts
│
└── database/
    ├── migrations/
    │   └── 001_initial.sql
    └── seeds/
        └── demo_data.sql
```

## Tech Stack

| Layer | Technology | Language |
|-------|-----------|----------|
| Frontend | Next.js 14, React, Tailwind | TypeScript |
| API Gateway | Spring Boot | Java |
| AI Engine | FastAPI + Anthropic Claude | Python |
| Task Queue | Tokio async runtime | Rust |
| Notifications | net/http + Gorilla WebSocket | Go |
| Mobile | React Native | TypeScript |
| Database | PostgreSQL + Redis | SQL |
| Payments | Stripe, Wise, PayPal API | - |

## Quick Start

### 1. View the Website
```bash
open frontend/public/index.html
```

### 2. Start Python Backend
```bash
cd backend
pip install fastapi uvicorn anthropic websockets
python main.py
```

### 3. Start Java API
```bash
cd backend
mvn spring-boot:run
```

### 4. Start Go Notifications
```bash
cd backend/src/services
go run notification_service.go
```

### 5. Start Rust Task Queue
```bash
cd ai-engine/src/tools
cargo build --release && cargo run
```

### 6. Start Frontend
```bash
cd frontend
npm install && npm run dev
```

## How the Human Approval System Works

```
AI generates task → Shows to human → Human approves/rejects → AI executes → Money earned
```

1. Agent scans platforms for opportunities
2. Proposes task with estimated earnings, risk level, and steps
3. Human reviews in dashboard or mobile app
4. Human taps Approve or Reject
5. Agent executes only after approval
6. Earnings deposited automatically

## Income Streams

- **Tech Support** — $15–$85/task (Python, JS, databases)
- **Content Creation** — $8–$45/piece (SEO, blogs, copy)
- **Freelance Projects** — $50–$300/project
- **Data Services** — $10–$60/task
- **Outreach & Sales** — $25–$150/deal
- **AI Consulting** — $75–$400/engagement

## Security

- Human approval required for ALL financial actions
- Withdrawals >$500 require 2FA
- Fraud detection via Rust scoring engine
- All agent actions logged and auditable
- No action taken without explicit user consent

## License

MIT © 2026 NexusAI Inc.
