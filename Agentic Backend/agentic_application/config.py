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
MCP_SERVER_URL = f"http://{get_local_ip()}:8000/mcp"

# Model configurations
OPENAI_GPT_MODEL = LiteLlm(model="openai/gpt-4.1")

# Tool Filter Configurations
SUPERVISOR_AGENT_TOOLS = []
REPORT_GENERATOR_AGENT_TOOLS = []
RISK_ANALYSER_AGENT_TOOLS = []
COST_ESTIMATOR_AGENT_TOOLS = []
ENVIRONMENT_SETUP_AGENT_TOOLS = []