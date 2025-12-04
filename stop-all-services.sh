#!/bin/bash

echo "========================================"
echo "Stopping All Services"
echo "========================================"
echo ""

# Get the directory where this script is located
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$ROOT_DIR/.pids" ]; then
    echo "Stopping services using saved PIDs..."
    while IFS= read -r pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "  Stopping process $pid..."
            kill "$pid" 2>/dev/null
        fi
    done < "$ROOT_DIR/.pids"
    rm -f "$ROOT_DIR/.pids"
    sleep 2
fi

echo "Stopping remaining service processes..."

# Kill processes by name
pkill -f "Agentic Backend.*python main.py" 2>/dev/null
pkill -f "MCP Server.*python main.py" 2>/dev/null
pkill -f "Project Backend.*npm" 2>/dev/null
pkill -f "ng serve.*8352" 2>/dev/null

# Kill by port as fallback
for port in 8350 8351 8352 8353 8354; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "  Killing process on port $port (PID: $PID)..."
        kill -9 $PID 2>/dev/null
    fi
done

echo ""
echo "All services stopped."
echo ""
