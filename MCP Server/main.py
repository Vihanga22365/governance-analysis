from mcp.server.fastmcp import FastMCP
from tools.get_weather import get_weather
from tools.create_governance_request import create_governance_request
from tools.get_user_chat_history import get_user_chat_history

mcp = FastMCP("StatefulServer")
mcp.settings.host = "0.0.0.0"
mcp.settings.port = 8000

# Register all tools with the MCP server
mcp.tool()(get_weather)
mcp.tool()(create_governance_request)
mcp.tool()(get_user_chat_history)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
