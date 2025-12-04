@echo off
echo ========================================
echo Stopping All Services
echo ========================================
echo.

echo Closing all service windows...

REM Close windows by title
taskkill /FI "WINDOWTITLE eq Agentic Backend*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq MCP Server*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Project Backend*" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F 2>nul

echo.
echo All services stopped.
echo.
pause
