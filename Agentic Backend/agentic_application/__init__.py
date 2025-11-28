# Load environment configuration first
from . import config

from .agents import (
    supervisor_agent,
    report_generator_agent,
    risk_analyser_agent,
    cost_estimator_agent,
    environment_setup_agent
)
from .prompts import (
    SUPERVISOR_AGENT_INSTRUCTION,
    SUPERVISOR_AGENT_DESCRIPTION,
    REPORT_GENERATOR_AGENT_INSTRUCTION,
    REPORT_GENERATOR_AGENT_DESCRIPTION,
    RISK_ANALYSER_AGENT_INSTRUCTION,
    RISK_ANALYSER_AGENT_DESCRIPTION,
    COST_ESTIMATOR_AGENT_INSTRUCTION,
    COST_ESTIMATOR_AGENT_DESCRIPTION,
    ENVIRONMENT_SETUP_AGENT_INSTRUCTION,
    ENVIRONMENT_SETUP_AGENT_DESCRIPTION
)

# Expose supervisor_agent as root_agent for Google ADK
root_agent = supervisor_agent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

__all__ = [
    'root_agent',
    'supervisor_agent',
    'report_generator_agent',
    'risk_analyser_agent',
    'cost_estimator_agent',
    'environment_setup_agent',
    'app',
    'SUPERVISOR_AGENT_INSTRUCTION',
    'SUPERVISOR_AGENT_DESCRIPTION',
    'REPORT_GENERATOR_AGENT_INSTRUCTION',
    'REPORT_GENERATOR_AGENT_DESCRIPTION',
    'RISK_ANALYSER_AGENT_INSTRUCTION',
    'RISK_ANALYSER_AGENT_DESCRIPTION',
    'COST_ESTIMATOR_AGENT_INSTRUCTION',
    'COST_ESTIMATOR_AGENT_DESCRIPTION',
    'ENVIRONMENT_SETUP_AGENT_INSTRUCTION',
    'ENVIRONMENT_SETUP_AGENT_DESCRIPTION'
]
