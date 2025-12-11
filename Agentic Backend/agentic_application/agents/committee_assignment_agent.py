from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, COMMITTEE_ASSIGNMENT_AGENT_TOOLS, GENERATE_CONTENT_CONFIG
from ..prompts.committee_assignment_prompt import COMMITTEE_ASSIGNMENT_AGENT_INSTRUCTION, COMMITTEE_ASSIGNMENT_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.adk.planners import BuiltInPlanner

# Committee Assignment Agent Definition
committee_assignment_agent = LlmAgent(
    name="CommitteeAssignmentAgent",
    model=OPENAI_GPT_MODEL,
    instruction=COMMITTEE_ASSIGNMENT_AGENT_INSTRUCTION,
    description=COMMITTEE_ASSIGNMENT_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=COMMITTEE_ASSIGNMENT_AGENT_TOOLS
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
