from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, ENVIRONMENT_SETUP_AGENT_TOOLS
from ..prompts.environment_setup_prompt import ENVIRONMENT_SETUP_AGENT_INSTRUCTION, ENVIRONMENT_SETUP_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.genai import types

# Environment Setup Agent Definition
environment_setup_agent = LlmAgent(
    name="EnvironmentSetupAgent",
    model=OPENAI_GPT_MODEL,
    instruction=ENVIRONMENT_SETUP_AGENT_INSTRUCTION,
    description=ENVIRONMENT_SETUP_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=ENVIRONMENT_SETUP_AGENT_TOOLS
        )
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.0,
    ),
)
