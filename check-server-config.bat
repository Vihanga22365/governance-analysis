@echo off
REM Server Deployment Checklist Script (Windows)
REM Run this script to verify all services are configured correctly

echo =========================================
echo Server Configuration Verification
echo =========================================
echo.

set ERRORS=0

echo 1. Checking Project Backend...
echo --------------------------------
if exist "Project Backend\.env" (
    echo [OK] Project Backend\.env exists
    findstr /B "FIREBASE_PROJECT_ID=" "Project Backend\.env" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] FIREBASE_PROJECT_ID is set
    ) else (
        echo   [ERROR] FIREBASE_PROJECT_ID is MISSING
        set /a ERRORS+=1
    )
    findstr /B "BACKEND_HOST=" "Project Backend\.env" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] BACKEND_HOST is set
    ) else (
        echo   [ERROR] BACKEND_HOST is MISSING
        set /a ERRORS+=1
    )
) else (
    echo [ERROR] Project Backend\.env is MISSING
    set /a ERRORS+=1
)

if exist "Project Backend\dist" (
    echo   [OK] Compiled code (dist) exists
) else (
    echo   [ERROR] Compiled code (dist) is MISSING - Run: npm run build
    set /a ERRORS+=1
)

if exist "Project Backend\documents" (
    echo   [OK] Documents directory exists
) else (
    echo   [INFO] Documents directory missing (will be created automatically)
)

echo.
echo 2. Checking MCP Server...
echo --------------------------------
if exist "MCP Server\.env" (
    echo [OK] MCP Server\.env exists
    findstr /B "BACKEND_HOST=" "MCP Server\.env" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] BACKEND_HOST is set
    ) else (
        echo   [ERROR] BACKEND_HOST is MISSING
        set /a ERRORS+=1
    )
) else (
    echo [ERROR] MCP Server\.env is MISSING
    set /a ERRORS+=1
)

REM Check python-dotenv
cd "MCP Server"
python -c "import dotenv" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] python-dotenv is installed
) else (
    echo   [ERROR] python-dotenv is NOT installed - Run: pip install python-dotenv
    set /a ERRORS+=1
)
cd ..

echo.
echo 3. Checking Agentic Backend...
echo --------------------------------
if exist "Agentic Backend\.env" (
    echo [OK] Agentic Backend\.env exists
    findstr /B "OPENAI_API_KEY=" "Agentic Backend\.env" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] OPENAI_API_KEY is set
    ) else (
        echo   [INFO] OPENAI_API_KEY is not set
    )
) else (
    echo [INFO] Agentic Backend\.env is missing (optional for server)
)

echo.
echo 4. Checking Frontend...
echo --------------------------------
if exist "Frontend\src\environments\environment.runtime.ts" (
    echo [OK] Frontend\src\environments\environment.runtime.ts exists
) else (
    echo [ERROR] Frontend\src\environments\environment.runtime.ts is MISSING
    set /a ERRORS+=1
)

echo.
echo =========================================
if %ERRORS% EQU 0 (
    echo [OK] All checks passed! Server is ready.
    echo =========================================
    echo.
    echo Next steps:
    echo 1. Start Project Backend: cd "Project Backend" ^&^& npm start
    echo 2. Start MCP Server: cd "MCP Server" ^&^& python main.py
    echo 3. Start Agentic Backend: cd "Agentic Backend" ^&^& python -m agentic_application.entrypoint
    echo 4. Start Frontend: cd "Frontend" ^&^& npm start
) else (
    echo [ERROR] Found %ERRORS% error(s). Please fix them before deployment.
    echo =========================================
    exit /b 1
)

pause
