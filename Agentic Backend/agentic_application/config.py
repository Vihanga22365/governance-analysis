import os
from dotenv import load_dotenv
from google.adk.models.lite_llm import LiteLlm
from agentic_application.utils import get_local_ip

# Load environment variables from .env file
load_dotenv()

# Set environment variables
# os.environ['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# MCP Server Configuration
# Use environment variable or fallback to auto-detected local IP
MCP_SERVER_HOST = os.getenv('MCP_SERVER_HOST', get_local_ip())
MCP_SERVER_PORT = os.getenv('MCP_SERVER_PORT', '8351')
MCP_SERVER_URL = f"http://{MCP_SERVER_HOST}:{MCP_SERVER_PORT}/mcp"

# Model configurations
OPENAI_GPT_MODEL = LiteLlm(model="openai/gpt-4.1")

# Tool Filter Configurations
SUPERVISOR_AGENT_TOOLS = ['create_governance_request', 'get_user_details_history', 'get_governance_report', 'get_risk_details', 'get_cost_details', 'get_environment_details']
REPORT_GENERATOR_AGENT_TOOLS = ['create_report']
RISK_ANALYSER_AGENT_TOOLS = ['create_risk_analysis']
COST_ESTIMATOR_AGENT_TOOLS = ['create_cost_analysis']
ENVIRONMENT_SETUP_AGENT_TOOLS = ['create_environment_details']