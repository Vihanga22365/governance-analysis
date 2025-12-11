from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, ENVIRONMENT_SETUP_AGENT_TOOLS, GENERATE_CONTENT_CONFIG
from ..prompts.environment_setup_prompt import ENVIRONMENT_SETUP_AGENT_INSTRUCTION, ENVIRONMENT_SETUP_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.adk.planners import BuiltInPlanner

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
    # planner=BuiltInPlanner(
    #     thinking_config=types.ThinkingConfig(
    #         thinking_budget=0,       # ✅ DISABLE thinking
    #         include_thoughts=False
    #     )
    # ),
    generate_content_config=GENERATE_CONTENT_CONFIG,
)
