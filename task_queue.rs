// NexusAI Task Queue — Ultra-fast Rust processor
// Handles payment verification, task scheduling, fraud detection

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::{mpsc, RwLock, Semaphore};
use tokio::time::sleep;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::{Result, anyhow};
use tracing::{info, warn, error, instrument};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskPriority {
    Critical,
    High,
    Normal,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Queued,
    PendingApproval,
    Approved,
    Executing,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub agent_id: Uuid,
    pub owner_id: Uuid,
    pub task_type: String,
    pub description: String,
    pub estimated_earnings: f64,
    pub actual_earnings: Option<f64>,
    pub priority: TaskPriority,
    pub status: TaskStatus,
    pub created_at: u64,
    pub approved_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub retry_count: u8,
    pub max_retries: u8,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Task {
    pub fn new(
        agent_id: Uuid,
        owner_id: Uuid,
        task_type: String,
        description: String,
        estimated_earnings: f64,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            agent_id,
            owner_id,
            task_type,
            description,
            estimated_earnings,
            actual_earnings: None,
            priority: TaskPriority::Normal,
            status: TaskStatus::Queued,
            created_at: unix_ts(),
            approved_at: None,
            completed_at: None,
            retry_count: 0,
            max_retries: 3,
            metadata: HashMap::new(),
        }
    }

    pub fn is_approved(&self) -> bool {
        self.status == TaskStatus::Approved || self.status == TaskStatus::Executing
    }

    pub fn can_retry(&self) -> bool {
        self.retry_count < self.max_retries
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRecord {
    pub id: Uuid,
    pub task_id: Uuid,
    pub agent_id: Uuid,
    pub owner_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub platform: String,
    pub status: PaymentStatus,
    pub created_at: u64,
    pub processed_at: Option<u64>,
    pub fraud_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Refunded,
    Suspicious,
}

pub struct TaskQueue {
    queues: Arc<RwLock<HashMap<TaskPriority, VecDeque<Task>>>>,
    processing: Arc<RwLock<HashMap<Uuid, Task>>>,
    completed: Arc<RwLock<Vec<Task>>>,
    capacity: usize,
    semaphore: Arc<Semaphore>,
}

impl TaskQueue {
    pub fn new(capacity: usize, max_concurrent: usize) -> Self {
        let mut queues = HashMap::new();
        queues.insert(TaskPriority::Critical, VecDeque::new());
        queues.insert(TaskPriority::High, VecDeque::new());
        queues.insert(TaskPriority::Normal, VecDeque::new());
        queues.insert(TaskPriority::Low, VecDeque::new());

        Self {
            queues: Arc::new(RwLock::new(queues)),
            processing: Arc::new(RwLock::new(HashMap::new())),
            completed: Arc::new(RwLock::new(Vec::new())),
            capacity,
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
        }
    }

    #[instrument(skip(self))]
    pub async fn enqueue(&self, task: Task) -> Result<Uuid> {
        let total = self.total_queued().await;
        if total >= self.capacity {
            return Err(anyhow!("Queue at capacity: {}/{}", total, self.capacity));
        }

        let task_id = task.id;
        let priority = task.priority.clone();
        let mut queues = self.queues.write().await;
        queues.entry(priority).or_default().push_back(task);
        info!("Enqueued task {} (total: {})", task_id, total + 1);
        Ok(task_id)
    }

    pub async fn dequeue(&self) -> Option<Task> {
        let mut queues = self.queues.write().await;
        // Priority order: Critical > High > Normal > Low
        for priority in &[TaskPriority::Critical, TaskPriority::High,
                          TaskPriority::Normal, TaskPriority::Low] {
            if let Some(q) = queues.get_mut(priority) {
                if let Some(task) = q.pop_front() {
                    return Some(task);
                }
            }
        }
        None
    }

    pub async fn total_queued(&self) -> usize {
        let queues = self.queues.read().await;
        queues.values().map(|q| q.len()).sum()
    }

    pub async fn approve_task(&self, task_id: Uuid) -> Result<()> {
        let mut processing = self.processing.write().await;
        if let Some(task) = processing.get_mut(&task_id) {
            task.status = TaskStatus::Approved;
            task.approved_at = Some(unix_ts());
            info!("Task {} approved", task_id);
            Ok(())
        } else {
            Err(anyhow!("Task {} not found in processing", task_id))
        }
    }
}

pub struct PaymentProcessor {
    records: Arc<RwLock<Vec<PaymentRecord>>>,
    fraud_detector: FraudDetector,
    tx: mpsc::Sender<PaymentRecord>,
}

impl PaymentProcessor {
    pub fn new() -> (Self, mpsc::Receiver<PaymentRecord>) {
        let (tx, rx) = mpsc::channel(1000);
        (Self {
            records: Arc::new(RwLock::new(Vec::new())),
            fraud_detector: FraudDetector::new(),
            tx,
        }, rx)
    }

    #[instrument(skip(self))]
    pub async fn process_payment(
        &self,
        task_id: Uuid,
        agent_id: Uuid,
        owner_id: Uuid,
        amount: f64,
        platform: String,
    ) -> Result<PaymentRecord> {
        // Fraud check before processing
        let fraud_score = self.fraud_detector.score(amount, &platform, owner_id).await;
        if fraud_score > 0.8 {
            warn!("High fraud score {:.2} for payment from {}", fraud_score, owner_id);
            return Err(anyhow!("Payment flagged for review (score: {:.2})", fraud_score));
        }

        let record = PaymentRecord {
            id: Uuid::new_v4(),
            task_id,
            agent_id,
            owner_id,
            amount,
            currency: "USD".into(),
            platform,
            status: PaymentStatus::Processing,
            created_at: unix_ts(),
            processed_at: None,
            fraud_score,
        };

        // In production: integrate with Stripe, PayPal, Wise APIs
        info!("Processing payment of ${:.2} for task {}", amount, task_id);
        sleep(Duration::from_millis(100)).await; // Simulate API call

        let mut completed = record.clone();
        completed.status = PaymentStatus::Completed;
        completed.processed_at = Some(unix_ts());

        self.records.write().await.push(completed.clone());
        self.tx.send(completed.clone()).await.ok();

        Ok(completed)
    }

    pub async fn get_total_earnings(&self, owner_id: Uuid) -> f64 {
        self.records.read().await.iter()
            .filter(|r| r.owner_id == owner_id && r.status == PaymentStatus::Completed)
            .map(|r| r.amount)
            .sum()
    }
}

struct FraudDetector {
    recent_payments: Arc<Mutex<HashMap<Uuid, Vec<(u64, f64)>>>>,
}

impl FraudDetector {
    fn new() -> Self {
        Self { recent_payments: Arc::new(Mutex::new(HashMap::new())) }
    }

    async fn score(&self, amount: f64, platform: &str, owner_id: Uuid) -> f32 {
        let mut score = 0.0f32;

        // Large amount check
        if amount > 10_000.0 { score += 0.5; }
        else if amount > 1_000.0 { score += 0.2; }

        // Velocity check (too many payments in short time)
        let now = unix_ts();
        let mut recent = self.recent_payments.lock().unwrap();
        let owner_history = recent.entry(owner_id).or_default();
        owner_history.retain(|(ts, _)| now - ts < 3600); // last hour

        if owner_history.len() > 20 { score += 0.4; }
        else if owner_history.len() > 10 { score += 0.2; }

        owner_history.push((now, amount));

        // Unknown platform
        let known_platforms = ["upwork", "fiverr", "toptal", "freelancer", "stripe"];
        if !known_platforms.contains(&platform) { score += 0.1; }

        score.min(1.0)
    }
}

fn unix_ts() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_task_enqueue_dequeue() {
        let queue = TaskQueue::new(100, 10);
        let task = Task::new(
            Uuid::new_v4(), Uuid::new_v4(),
            "tech_support".into(), "Fix Python bug".into(), 25.0
        );
        let id = queue.enqueue(task).await.unwrap();
        let dequeued = queue.dequeue().await.unwrap();
        assert_eq!(dequeued.id, id);
    }

    #[tokio::test]
    async fn test_fraud_detection_large_amount() {
        let detector = FraudDetector::new();
        let score = detector.score(15000.0, "unknown", Uuid::new_v4()).await;
        assert!(score > 0.5, "Large amount should have high fraud score");
    }

    #[tokio::test]
    async fn test_queue_capacity() {
        let queue = TaskQueue::new(2, 10);
        for _ in 0..2 {
            let task = Task::new(Uuid::new_v4(), Uuid::new_v4(), "test".into(), "desc".into(), 1.0);
            queue.enqueue(task).await.unwrap();
        }
        let overflow = Task::new(Uuid::new_v4(), Uuid::new_v4(), "test".into(), "overflow".into(), 1.0);
        assert!(queue.enqueue(overflow).await.is_err());
    }
}
