import asyncio
import websockets

async def test_websocket():
    uri = "ws://localhost:8765"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            await websocket.send("Test message")
            response = await websocket.recv()
            print("Response from server:", response)
    except Exception as e:
        print(f"Failed to connect: {e}")

asyncio.run(test_websocket())