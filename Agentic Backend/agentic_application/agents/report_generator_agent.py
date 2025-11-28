from google.adk.agents import LlmAgent
from ..config import OPENAI_GPT_MODEL, MCP_SERVER_URL, REPORT_GENERATOR_AGENT_TOOLS
from ..prompts.report_generator_prompt import REPORT_GENERATOR_AGENT_INSTRUCTION, REPORT_GENERATOR_AGENT_DESCRIPTION
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.genai import types

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
    generate_content_config=types.GenerateContentConfig(
        temperature=0.0,
    ),
)
