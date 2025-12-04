"""WebSocket manager for broadcasting chat history updates to frontend clients"""

import asyncio
import json
import websockets
from typing import Set
from websockets.server import WebSocketServerProtocol

class WebSocketManager:
    def __init__(self):
        self.clients: Set[WebSocketServerProtocol] = set()
        self.server = None
        self.loop = None
        
    async def register(self, websocket: WebSocketServerProtocol):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        print(f"Client connected. Total clients: {len(self.clients)}")
        
    async def unregister(self, websocket: WebSocketServerProtocol):
        """Unregister a WebSocket client"""
        self.clients.discard(websocket)
        print(f"Client disconnected. Total clients: {len(self.clients)}")
        
    async def broadcast_chat_history(self, chat_data: dict):
        """Broadcast chat history update to all connected clients"""
        if not self.clients:
            print("No clients connected to broadcast to")
            return
            
        message = json.dumps({
            "type": "chat_history_update",
            "data": chat_data
        })
        
        # Send to all connected clients
        disconnected_clients = set()
        for client in self.clients:
            try:
                await client.send(message)
                print(f"Broadcasted chat history update to client")
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
                
        # Clean up disconnected clients
        for client in disconnected_clients:
            await self.unregister(client)
    
    async def broadcast_governance_details(self, governance_data: dict):
        """Broadcast governance details (report, risk, cost, environment) to all connected clients"""
        if not self.clients:
            print("No clients connected to broadcast to")
            return
            
        message = json.dumps({
            "type": "governance_details_update",
            "data": governance_data
        })
        
        # Send to all connected clients
        disconnected_clients = set()
        for client in self.clients:
            try:
                await client.send(message)
                print(f"Broadcasted governance details update to client")
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
                
        # Clean up disconnected clients
        for client in disconnected_clients:
            await self.unregister(client)
    
    async def handle_client(self, websocket: WebSocketServerProtocol):
        """Handle individual client connection"""
        await self.register(websocket)
        try:
            # Keep connection alive and listen for messages
            async for message in websocket:
                # Echo or handle incoming messages if needed
                print(f"Received message from client: {message}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)
    
    async def start_server(self, host: str = "0.0.0.0", port: int = 8354):
        """Start the WebSocket server"""
        self.loop = asyncio.get_event_loop()
        print(f"Starting WebSocket server on ws://{host}:{port}")
        self.server = await websockets.serve(
            self.handle_client,
            host,
            port
        )
        print("WebSocket server started successfully")
        
    async def stop_server(self):
        """Stop the WebSocket server"""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            print("WebSocket server stopped")

# Global WebSocket manager instance
ws_manager = WebSocketManager()

def broadcast_chat_history_sync(chat_data: dict):
    """Synchronous wrapper to broadcast chat history from non-async code"""
    import threading
    
    try:
        # Use the stored event loop from the WebSocket manager
        if ws_manager.loop and ws_manager.loop.is_running():
            # Schedule the coroutine in the WebSocket thread's event loop
            asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast_chat_history(chat_data),
                ws_manager.loop
            )
            print("Chat history broadcast scheduled successfully")
        else:
            print("Warning: WebSocket server loop not running, broadcast skipped")
    except Exception as e:
        print(f"Error broadcasting chat history: {e}")

def broadcast_governance_details_sync(governance_data: dict):
    """Synchronous wrapper to broadcast governance details from non-async code"""
    import threading
    
    try:
        # Use the stored event loop from the WebSocket manager
        if ws_manager.loop and ws_manager.loop.is_running():
            # Schedule the coroutine in the WebSocket thread's event loop
            asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast_governance_details(governance_data),
                ws_manager.loop
            )
            print("Governance details broadcast scheduled successfully")
        else:
            print("Warning: WebSocket server loop not running, broadcast skipped")
    except Exception as e:
        print(f"Error broadcasting governance details: {e}")
