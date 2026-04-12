"""
Agent Orchestrator — The Brain of NexusAI
Manages multiple AI agents, coordinates tasks, handles approval gates
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import anthropic
import logging

logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    IDLE = "idle"
    THINKING = "thinking"
    AWAITING_APPROVAL = "awaiting_approval"
    EXECUTING = "executing"
    EARNING = "earning"
    PAUSED = "paused"
    ERROR = "error"

class TaskType(Enum):
    TECH_SUPPORT = "tech_support"
    CONTENT_CREATION = "content_creation"
    FREELANCE = "freelance"
    DATA_ENTRY = "data_entry"
    OUTREACH = "outreach"
    PAYMENT_REQUEST = "payment_request"

@dataclass
class Task:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: TaskType = TaskType.TECH_SUPPORT
    description: str = ""
    estimated_earnings: float = 0.0
    risk_level: str = "low"  # low, medium, high
    requires_approval: bool = True
    approved: Optional[bool] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    earnings_actual: float = 0.0
    steps: List[Dict] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Agent:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "NexusAgent"
    owner_id: str = ""
    status: AgentStatus = AgentStatus.IDLE
    specialization: List[TaskType] = field(default_factory=list)
    total_earned: float = 0.0
    tasks_completed: int = 0
    tasks_pending: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_active: Optional[datetime] = None
    pending_tasks: List[Task] = field(default_factory=list)
    completed_tasks: List[Task] = field(default_factory=list)
    config: Dict[str, Any] = field(default_factory=dict)

class AgentOrchestrator:
    """
    Core orchestrator that manages all AI agents.
    Uses Claude API for intelligent task planning and execution.
    Human approval required for all financial and action tasks.
    """

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.client = anthropic.AsyncAnthropic()
        self.approval_queue: asyncio.Queue = asyncio.Queue()
        self.running = False
        self._background_tasks: List[asyncio.Task] = []

    async def initialize(self):
        """Start background workers"""
        self.running = True
        self._background_tasks = [
            asyncio.create_task(self._task_processor()),
            asyncio.create_task(self._earnings_reporter()),
            asyncio.create_task(self._health_monitor()),
        ]
        logger.info("AgentOrchestrator initialized with 3 background workers")

    async def shutdown(self):
        self.running = False
        for task in self._background_tasks:
            task.cancel()
        await asyncio.gather(*self._background_tasks, return_exceptions=True)
        logger.info("AgentOrchestrator shut down cleanly")

    async def create_agent(self, owner_id: str, name: str,
                           specialization: List[str], config: Dict) -> Agent:
        """Create a new AI business agent for a user"""
        agent = Agent(
            name=name,
            owner_id=owner_id,
            specialization=[TaskType(s) for s in specialization if s in TaskType.__members__],
            config=config
        )
        self.agents[agent.id] = agent
        logger.info(f"Created agent {agent.id} for user {owner_id}")

        # Start agent loop
        asyncio.create_task(self._agent_loop(agent.id))
        return agent

    async def _agent_loop(self, agent_id: str):
        """Main loop for a single agent — think, plan, propose, wait for approval, execute"""
        agent = self.agents.get(agent_id)
        if not agent:
            return

        while self.running and agent_id in self.agents:
            try:
                if agent.status == AgentStatus.IDLE:
                    agent.status = AgentStatus.THINKING
                    task = await self._generate_task(agent)
                    if task:
                        agent.pending_tasks.append(task)
                        agent.status = AgentStatus.AWAITING_APPROVAL
                        agent.tasks_pending += 1
                        logger.info(f"Agent {agent_id} generated task: {task.description[:60]}...")
                    else:
                        agent.status = AgentStatus.IDLE

                await asyncio.sleep(5)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Agent {agent_id} loop error: {e}")
                agent.status = AgentStatus.ERROR
                await asyncio.sleep(30)

    async def _generate_task(self, agent: Agent) -> Optional[Task]:
        """Use Claude to intelligently generate the next best money-earning task"""
        specializations = [t.value for t in agent.specialization]
        context = f"""You are NexusAI, an autonomous business agent.
Your specializations: {', '.join(specializations)}
Total earned so far: ${agent.total_earned:.2f}
Tasks completed: {agent.tasks_completed}

Generate the SINGLE BEST next task to earn money online right now.
The task must be:
1. Realistic and achievable within 2 hours
2. Legal and ethical
3. Specific with clear steps

Respond in this exact JSON format:
{{
  "type": "{specializations[0] if specializations else 'tech_support'}",
  "description": "specific task description",
  "estimated_earnings": 25.00,
  "risk_level": "low",
  "steps": [
    {{"step": 1, "action": "Go to Upwork", "detail": "Search for Python debugging tasks"}},
    {{"step": 2, "action": "Submit proposal", "detail": "Write personalized 3-line proposal"}}
  ],
  "platforms": ["upwork", "fiverr"],
  "time_estimate_minutes": 45
}}"""

        try:
            message = await self.client.messages.create(
                model="claude-opus-4-20250514",
                max_tokens=500,
                messages=[{"role": "user", "content": context}]
            )
            import json
            raw = message.content[0].text
            clean = raw.strip().lstrip('```json').rstrip('```').strip()
            data = json.loads(clean)

            task = Task(
                type=TaskType(data.get("type", "tech_support")),
                description=data.get("description", ""),
                estimated_earnings=float(data.get("estimated_earnings", 10)),
                risk_level=data.get("risk_level", "low"),
                steps=data.get("steps", []),
                metadata={
                    "platforms": data.get("platforms", []),
                    "time_estimate_minutes": data.get("time_estimate_minutes", 60)
                }
            )
            return task
        except Exception as e:
            logger.error(f"Task generation failed: {e}")
            return None

    async def approve_task(self, agent_id: str, task_id: str) -> bool:
        """Human approves a task — agent proceeds to execute"""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        task = next((t for t in agent.pending_tasks if t.id == task_id), None)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        task.approved = True
        agent.status = AgentStatus.EXECUTING
        logger.info(f"Task {task_id} approved by human. Agent {agent_id} executing...")

        # Execute in background
        asyncio.create_task(self._execute_task(agent, task))
        return True

    async def reject_task(self, agent_id: str, task_id: str) -> bool:
        """Human rejects — agent generates a new task"""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        task = next((t for t in agent.pending_tasks if t.id == task_id), None)
        if task:
            task.approved = False
            agent.pending_tasks.remove(task)
            agent.tasks_pending = max(0, agent.tasks_pending - 1)
            agent.status = AgentStatus.IDLE
        return True

    async def _execute_task(self, agent: Agent, task: Task):
        """Simulate task execution with progress updates"""
        try:
            agent.status = AgentStatus.EXECUTING
            for i, step in enumerate(task.steps):
                await asyncio.sleep(2)  # Simulate work
                logger.info(f"Agent {agent.id} executing step {i+1}: {step.get('action', '')}")

            # Simulate earning (in real system, would integrate with payment APIs)
            earned = task.estimated_earnings * (0.8 + 0.4 * __import__('random').random())
            task.earnings_actual = round(earned, 2)
            task.completed_at = datetime.utcnow()

            agent.total_earned += task.earnings_actual
            agent.tasks_completed += 1
            agent.tasks_pending = max(0, agent.tasks_pending - 1)
            agent.pending_tasks.remove(task)
            agent.completed_tasks.append(task)
            agent.last_active = datetime.utcnow()
            agent.status = AgentStatus.IDLE

            logger.info(f"Agent {agent.id} earned ${task.earnings_actual:.2f} from task {task.id}")

        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            agent.status = AgentStatus.ERROR

    async def _task_processor(self):
        """Background: process approval queue"""
        while self.running:
            await asyncio.sleep(1)

    async def _earnings_reporter(self):
        """Background: log earnings every minute"""
        while self.running:
            await asyncio.sleep(60)
            total = sum(a.total_earned for a in self.agents.values())
            logger.info(f"Total platform earnings: ${total:.2f} across {len(self.agents)} agents")

    async def _health_monitor(self):
        """Background: restart stuck agents"""
        while self.running:
            await asyncio.sleep(30)
            for agent in self.agents.values():
                if agent.status == AgentStatus.ERROR:
                    logger.warning(f"Restarting errored agent {agent.id}")
                    agent.status = AgentStatus.IDLE

    def get_agent_stats(self, agent_id: str) -> Dict:
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        return {
            "id": agent.id,
            "name": agent.name,
            "status": agent.status.value,
            "total_earned": agent.total_earned,
            "tasks_completed": agent.tasks_completed,
            "tasks_pending": agent.tasks_pending,
            "pending_tasks": [
                {"id": t.id, "description": t.description,
                 "estimated_earnings": t.estimated_earnings,
                 "risk_level": t.risk_level, "steps": t.steps}
                for t in agent.pending_tasks
            ]
        }
