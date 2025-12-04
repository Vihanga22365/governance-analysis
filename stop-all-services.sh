#!/bin/bash

echo "========================================"
echo "Stopping All Services"
echo "========================================"
echo ""

echo "Stopping all service processes..."

# Kill processes by name
pkill -f "python main.py" 2>/dev/null
pkill -f "npm run start" 2>/dev/null
pkill -f "ng serve" 2>/dev/null

# Alternative: Kill by port if the above doesn't work
# lsof -ti:8350 | xargs kill -9 2>/dev/null
# lsof -ti:8351 | xargs kill -9 2>/dev/null
# lsof -ti:8352 | xargs kill -9 2>/dev/null
# lsof -ti:8353 | xargs kill -9 2>/dev/null
# lsof -ti:8354 | xargs kill -9 2>/dev/null

echo ""
echo "All services stopped."
echo ""
