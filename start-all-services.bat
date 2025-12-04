@echo off
echo ========================================
echo Starting All Services
echo ========================================
echo.

REM Get the directory where this batch file is located
set ROOT_DIR=%~dp0

REM Start Agentic Backend
echo [1/4] Starting Agentic Backend (Port 8350)...
start "Agentic Backend" cmd /k "cd /d "%ROOT_DIR%Agentic Backend" && .venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

REM Start MCP Server
echo [2/4] Starting MCP Server (Port 8351 HTTP, 8354 WebSocket)...
start "MCP Server" cmd /k "cd /d "%ROOT_DIR%MCP Server" && .venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

REM Start Project Backend
echo [3/4] Starting Project Backend (Port 8353)...
start "Project Backend" cmd /k "cd /d "%ROOT_DIR%Project Backend" && npm run start"
timeout /t 5 /nobreak >nul

REM Start Frontend
echo [4/4] Starting Frontend (Port 8352)...
start "Frontend" cmd /k "cd /d "%ROOT_DIR%Frontend" && ng serve --host 0.0.0.0 --port 8352"

echo.
echo ========================================
echo All Services Started!
echo ========================================
echo.
echo Service Status:
echo - Agentic Backend:  http://0.0.0.0:8350
echo - MCP Server:       http://0.0.0.0:8351
echo - Project Backend:  http://0.0.0.0:8353
echo - Frontend:         http://0.0.0.0:8352
echo - WebSocket:        ws://0.0.0.0:8354
echo.
echo Press any key to close this window...
pause >nul
