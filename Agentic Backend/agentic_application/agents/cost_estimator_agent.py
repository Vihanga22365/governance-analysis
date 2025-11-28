from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, COST_ESTIMATOR_AGENT_TOOLS
from ..prompts.cost_estimator_prompt import COST_ESTIMATOR_AGENT_INSTRUCTION, COST_ESTIMATOR_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.genai import types

# Cost Estimator Agent Definition
cost_estimator_agent = LlmAgent(
    name="CostEstimatorAgent",
    model=OPENAI_GPT_MODEL,
    instruction=COST_ESTIMATOR_AGENT_INSTRUCTION,
    description=COST_ESTIMATOR_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=COST_ESTIMATOR_AGENT_TOOLS
        )
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.0,
    ),
)
