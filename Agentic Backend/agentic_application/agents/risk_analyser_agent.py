from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, RISK_ANALYSER_AGENT_TOOLS
from ..prompts.risk_analyser_prompt import RISK_ANALYSER_AGENT_INSTRUCTION, RISK_ANALYSER_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.genai import types

# Risk Analyser Agent Definition
risk_analyser_agent = LlmAgent(
    name="RiskAnalyserAgent",
    model=OPENAI_GPT_MODEL,
    instruction=RISK_ANALYSER_AGENT_INSTRUCTION,
    description=RISK_ANALYSER_AGENT_DESCRIPTION,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=MCP_SERVER_URL
            ),
            tool_filter=RISK_ANALYSER_AGENT_TOOLS
        )
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.0,
    ),
)
