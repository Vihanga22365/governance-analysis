from google.adk.agents import LlmAgent
from .cost_estimator_agent import cost_estimator_agent
from .committee_assignment_agent import committee_assignment_agent
from .environment_setup_agent import environment_setup_agent
from .report_generator_agent import report_generator_agent
from .risk_analyser_agent import risk_analyser_agent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, SUPERVISOR_AGENT_TOOLS, GENERATE_CONTENT_CONFIG
from ..prompts.supervisor_prompt import SUPERVISOR_AGENT_INSTRUCTION, SUPERVISOR_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.adk.planners import BuiltInPlanner
from google.adk.tools import agent_tool

# Supervisor Agent Definition
supervisor_agent = LlmAgent(
    name="SupervisorAgent",
    model=OPENAI_GPT_MODEL,
    instruction=SUPERVISOR_AGENT_INSTRUCTION,
    description=SUPERVISOR_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=SUPERVISOR_AGENT_TOOLS
        )
    ],
    sub_agents=[
        report_generator_agent,
        risk_analyser_agent,
        committee_assignment_agent,
        cost_estimator_agent,
        environment_setup_agent
    ],
    # planner=BuiltInPlanner(
    #     thinking_config=types.ThinkingConfig(
    #         thinking_budget=0,       # ✅ DISABLE thinking
    #         include_thoughts=False
    #     )
    # ),
    generate_content_config=GENERATE_CONTENT_CONFIG,
)
