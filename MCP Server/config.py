"""Configuration settings for MCP Server"""

from utils import get_local_ip

# API Configuration
LOCAL_IP = get_local_ip()
API_BASE_URL = f"http://{LOCAL_IP}:3000/api"
GOVERNANCE_API_URL = f"{API_BASE_URL}/governance"
CHAT_HISTORY_API_URL = f"{API_BASE_URL}/chat-history"
