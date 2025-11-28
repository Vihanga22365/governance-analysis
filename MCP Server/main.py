from mcp.server.fastmcp import FastMCP
from tools.get_nearby_location_activities import get_nearby_location_activities
from tools.get_past_activities import get_past_activities
from tools.get_past_locations import get_past_locations
from tools.get_weather import get_weather
from tools.get_all_location_for_designation import get_all_location_for_designation
from tools.validate_future_date import validate_future_date

mcp = FastMCP("StatefulServer")
mcp.settings.host = "0.0.0.0"
mcp.settings.port = 8000

# Register all tools with the MCP server
mcp.tool()(get_nearby_location_activities)
mcp.tool()(get_past_activities)
mcp.tool()(get_past_locations)
mcp.tool()(get_weather)
mcp.tool()(get_all_location_for_designation)
mcp.tool()(validate_future_date)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
