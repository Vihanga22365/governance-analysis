from mcp.server.fastmcp import FastMCP
from tools.get_weather import get_weather
from tools.create_governance_request import create_governance_request
from tools.get_user_chat_history import get_user_chat_history
import asyncio
import threading
from websocket_manager import ws_manager

mcp = FastMCP("StatefulServer", stateless_http=True)
mcp.settings.host = "0.0.0.0"
mcp.settings.port = 8000

# Register all tools with the MCP server
mcp.tool()(get_weather)
mcp.tool()(create_governance_request)
mcp.tool()(get_user_chat_history)


def start_websocket_server():
    """Start WebSocket server in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def run_ws():
        await ws_manager.start_server(host="0.0.0.0", port=8765)
        print("WebSocket server running on ws://0.0.0.0:8765")
        # Keep the server running
        await asyncio.Future()  # run forever
    
    loop.run_until_complete(run_ws())


if __name__ == "__main__":
    # Start WebSocket server in a separate thread
    ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
    ws_thread.start()
    print("Starting WebSocket server in background thread...")
    
    # Run MCP server (this blocks)
    print("Starting MCP server on http://0.0.0.0:8000")
    mcp.run(transport="streamable-http")
