#!/bin/bash

echo "========================================"
echo "Starting All Services"
echo "========================================"
echo ""

# Get the directory where this script is located
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Agentic Backend
echo "[1/4] Starting Agentic Backend (Port 8350)..."
gnome-terminal --title="Agentic Backend" -- bash -c "cd '$ROOT_DIR/Agentic Backend' && source .venv/bin/activate && python main.py; exec bash" 2>/dev/null || \
xterm -title "Agentic Backend" -e "cd '$ROOT_DIR/Agentic Backend' && source .venv/bin/activate && python main.py; bash" 2>/dev/null || \
x-terminal-emulator -e "cd '$ROOT_DIR/Agentic Backend' && source .venv/bin/activate && python main.py; bash" 2>/dev/null &
sleep 3

# Start MCP Server
echo "[2/4] Starting MCP Server (Port 8351 HTTP, 8354 WebSocket)..."
gnome-terminal --title="MCP Server" -- bash -c "cd '$ROOT_DIR/MCP Server' && source .venv/bin/activate && python main.py; exec bash" 2>/dev/null || \
xterm -title "MCP Server" -e "cd '$ROOT_DIR/MCP Server' && source .venv/bin/activate && python main.py; bash" 2>/dev/null || \
x-terminal-emulator -e "cd '$ROOT_DIR/MCP Server' && source .venv/bin/activate && python main.py; bash" 2>/dev/null &
sleep 3

# Start Project Backend
echo "[3/4] Starting Project Backend (Port 8353)..."
gnome-terminal --title="Project Backend" -- bash -c "cd '$ROOT_DIR/Project Backend' && npm run start; exec bash" 2>/dev/null || \
xterm -title "Project Backend" -e "cd '$ROOT_DIR/Project Backend' && npm run start; bash" 2>/dev/null || \
x-terminal-emulator -e "cd '$ROOT_DIR/Project Backend' && npm run start; bash" 2>/dev/null &
sleep 5

# Start Frontend
echo "[4/4] Starting Frontend (Port 8352)..."
gnome-terminal --title="Frontend" -- bash -c "cd '$ROOT_DIR/Frontend' && ng serve --host 0.0.0.0 --port 8352; exec bash" 2>/dev/null || \
xterm -title "Frontend" -e "cd '$ROOT_DIR/Frontend' && ng serve --host 0.0.0.0 --port 8352; bash" 2>/dev/null || \
x-terminal-emulator -e "cd '$ROOT_DIR/Frontend' && ng serve --host 0.0.0.0 --port 8352; bash" 2>/dev/null &

echo ""
echo "========================================"
echo "All Services Started!"
echo "========================================"
echo ""
echo "Service Status:"
echo "- Agentic Backend:  http://0.0.0.0:8350"
echo "- MCP Server:       http://0.0.0.0:8351"
echo "- Project Backend:  http://0.0.0.0:8353"
echo "- Frontend:         http://0.0.0.0:8352"
echo "- WebSocket:        ws://0.0.0.0:8354"
echo ""
echo "Press Ctrl+C to exit..."
sleep infinity
