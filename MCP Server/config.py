"""Configuration settings for MCP Server"""

import os
from utils import get_local_ip

# API Configuration
# Use environment variable or fallback to auto-detected local IP
BACKEND_HOST = os.getenv('BACKEND_HOST', get_local_ip())
BACKEND_PORT = os.getenv('BACKEND_PORT', '8353')

API_BASE_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/api"
GOVERNANCE_API_URL = f"{API_BASE_URL}/governance"
CHAT_HISTORY_API_URL = f"{API_BASE_URL}/chat-history"
GOVERNANCE_REPORT_API_URL = f"{API_BASE_URL}/generate-report/governance"
RISK_DETAILS_API_URL = f"{API_BASE_URL}/risk-analyse/governance"
COST_DETAILS_API_URL = f"{API_BASE_URL}/cost-details/governance"
ENVIRONMENT_DETAILS_API_URL = f"{API_BASE_URL}/environment-details/governance"
COST_CLARIFICATIONS_API_URL = f"{API_BASE_URL}/cost-clarifications"
ENVIRONMENT_CLARIFICATIONS_API_URL = f"{API_BASE_URL}/environment-clarifications"
COMMITTEE_CLARIFICATIONS_API_URL = f"{API_BASE_URL}/committee-clarifications"

# Backward compatibility
LOCAL_IP = BACKEND_HOST
