from google.adk.agents import LlmAgent
from .cost_estimator_agent import cost_estimator_agent
from .environment_setup_agent import environment_setup_agent
from .report_generator_agent import report_generator_agent
from .risk_analyser_agent import risk_analyser_agent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, SUPERVISOR_AGENT_TOOLS
from ..prompts.supervisor_prompt import SUPERVISOR_AGENT_INSTRUCTION, SUPERVISOR_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.genai import types

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
        cost_estimator_agent,
        environment_setup_agent
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.0,
    ),
)
