from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, REPORT_GENERATOR_AGENT_TOOLS, GENERATE_CONTENT_CONFIG
from ..prompts.report_generator_prompt import REPORT_GENERATOR_AGENT_INSTRUCTION, REPORT_GENERATOR_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.adk.planners import BuiltInPlanner

# Report Generator Agent Definition
report_generator_agent = LlmAgent(
    name="ReportGeneratorAgent",
    model=OPENAI_GPT_MODEL,
    instruction=REPORT_GENERATOR_AGENT_INSTRUCTION,
    description=REPORT_GENERATOR_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=REPORT_GENERATOR_AGENT_TOOLS
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
