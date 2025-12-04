#!/bin/bash

echo "========================================"
echo "Starting All Services"
echo "========================================"
echo ""

# Get the directory where this script is located
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create logs directory if it doesn't exist
mkdir -p "$ROOT_DIR/logs"

# Start Agentic Backend
echo "[1/4] Starting Agentic Backend (Port 8350)..."
cd "$ROOT_DIR/Agentic Backend"
source .venv/bin/activate
nohup python main.py > "$ROOT_DIR/logs/agentic-backend.log" 2>&1 &
AGENTIC_PID=$!
echo "  PID: $AGENTIC_PID"
cd "$ROOT_DIR"
sleep 3

# Start MCP Server
echo "[2/4] Starting MCP Server (Port 8351 HTTP, 8354 WebSocket)..."
cd "$ROOT_DIR/MCP Server"
source .venv/bin/activate
nohup python main.py > "$ROOT_DIR/logs/mcp-server.log" 2>&1 &
MCP_PID=$!
echo "  PID: $MCP_PID"
cd "$ROOT_DIR"
sleep 3

# Start Project Backend
echo "[3/4] Starting Project Backend (Port 8353)..."
cd "$ROOT_DIR/Project Backend"
nohup npm run start > "$ROOT_DIR/logs/project-backend.log" 2>&1 &
PROJECT_PID=$!
echo "  PID: $PROJECT_PID"
cd "$ROOT_DIR"
sleep 5

# Start Frontend
echo "[4/4] Starting Frontend (Port 8352)..."
cd "$ROOT_DIR/Frontend"
nohup ng serve --host 0.0.0.0 --port 8352 -o > "$ROOT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  PID: $FRONTEND_PID"
cd "$ROOT_DIR"

# Save PIDs to file for stop script
echo "$AGENTIC_PID" > "$ROOT_DIR/.pids"
echo "$MCP_PID" >> "$ROOT_DIR/.pids"
echo "$PROJECT_PID" >> "$ROOT_DIR/.pids"
echo "$FRONTEND_PID" >> "$ROOT_DIR/.pids"

echo ""
echo "========================================"
echo "All Services Started!"
echo "========================================"
echo ""
echo "Service Status:"
echo "- Agentic Backend:  http://0.0.0.0:8350 (PID: $AGENTIC_PID)"
echo "- MCP Server:       http://0.0.0.0:8351 (PID: $MCP_PID)"
echo "- Project Backend:  http://0.0.0.0:8353 (PID: $PROJECT_PID)"
echo "- Frontend:         http://0.0.0.0:8352 (PID: $FRONTEND_PID)"
echo "- WebSocket:        ws://0.0.0.0:8354"
echo ""
echo "Logs are being written to: $ROOT_DIR/logs/"
echo "To view logs: tail -f logs/<service-name>.log"
echo "To stop all services: ./stop-all-services.sh"
echo ""
