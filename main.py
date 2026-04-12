"""
NexusAI Backend — FastAPI Server
Orchestrates AI agents, manages approvals, handles earnings
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import asyncio
import logging
import uvicorn

from src.api.routes import agents, approvals, earnings, webhooks, auth
from src.services.agent_orchestrator import AgentOrchestrator
from src.services.approval_service import ApprovalService
from src.services.earnings_tracker import EarningsTracker
from src.middleware.rate_limiter import RateLimiter
from src.middleware.auth_middleware import AuthMiddleware
from config.settings import Settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = Settings()

# Startup/shutdown lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    logger.info("Starting NexusAI Agent Server...")
    orchestrator = AgentOrchestrator()
    await orchestrator.initialize()
    app.state.orchestrator = orchestrator
    app.state.approval_service = ApprovalService()
    app.state.earnings_tracker = EarningsTracker()
    logger.info("All services initialized. Server ready.")
    yield
    logger.info("Shutting down NexusAI Agent Server...")
    await orchestrator.shutdown()

app = FastAPI(
    title="NexusAI Business Agent API",
    description="Autonomous AI business agent with human approval gates",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Custom middleware
app.add_middleware(RateLimiter, requests_per_minute=60)
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["Approvals"])
app.include_router(earnings.router, prefix="/api/earnings", tags=["Earnings"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

@app.get("/health")
async def health_check():
    return {"status": "operational", "version": "1.0.0", "agents_active": True}

@app.websocket("/ws/agent/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: str):
    """Real-time agent status & approval stream"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "subscribe":
                await websocket.send_json({"type": "subscribed", "agent_id": agent_id})
            elif action == "approve":
                task_id = data.get("task_id")
                await app.state.approval_service.approve(task_id, agent_id)
                await websocket.send_json({"type": "approved", "task_id": task_id})
            elif action == "reject":
                task_id = data.get("task_id")
                await app.state.approval_service.reject(task_id, agent_id)
                await websocket.send_json({"type": "rejected", "task_id": task_id})
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"WebSocket error for agent {agent_id}: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, workers=4)
