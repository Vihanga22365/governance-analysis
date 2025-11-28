import os

import uvicorn
from google.adk.cli.fast_api import get_fast_api_app
from agentic_application.utils import setup_logger

# Setup logger
logger = setup_logger(__name__)

AGENT_DIR = os.path.dirname(os.path.abspath(__file__))

SESSION_DB_URL = "sqlite:///./sessions.db"

ALLOWED_ORIGINS = ["*"]

SERVE_WEB_INTERFACE = True

logger.info("Initializing FastAPI application...")
app = get_fast_api_app(
    agents_dir=AGENT_DIR,
    session_service_uri=SESSION_DB_URL,
    allow_origins=ALLOWED_ORIGINS,
    web=SERVE_WEB_INTERFACE,
)
logger.info("FastAPI application initialized successfully")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7350))
    logger.info(f"Starting server on host 0.0.0.0, port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)