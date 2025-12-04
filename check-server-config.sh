#!/bin/bash

# Server Deployment Checklist Script
# Run this script to verify all services are configured correctly

echo "========================================="
echo "Server Configuration Verification"
echo "========================================="
echo ""

ERRORS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1 exists"
        return 0
    else
        echo "✗ $1 is MISSING"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check environment variable in file
check_env_var() {
    if grep -q "^$2=" "$1" 2>/dev/null; then
        echo "  ✓ $2 is set"
        return 0
    else
        echo "  ✗ $2 is MISSING"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "1. Checking Project Backend..."
echo "--------------------------------"
check_file "Project Backend/.env"
if [ $? -eq 0 ]; then
    check_env_var "Project Backend/.env" "FIREBASE_PROJECT_ID"
    check_env_var "Project Backend/.env" "FIREBASE_CLIENT_EMAIL"
    check_env_var "Project Backend/.env" "FIREBASE_PRIVATE_KEY"
    check_env_var "Project Backend/.env" "FIREBASE_DATABASE_URL"
    check_env_var "Project Backend/.env" "BACKEND_HOST"
fi

if [ -d "Project Backend/dist" ]; then
    echo "  ✓ Compiled code (dist) exists"
else
    echo "  ✗ Compiled code (dist) is MISSING - Run: npm run build"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "Project Backend/documents" ]; then
    echo "  ✓ Documents directory exists"
else
    echo "  ! Documents directory missing (will be created automatically)"
fi

echo ""
echo "2. Checking MCP Server..."
echo "--------------------------------"
check_file "MCP Server/.env"
if [ $? -eq 0 ]; then
    check_env_var "MCP Server/.env" "BACKEND_HOST"
    check_env_var "MCP Server/.env" "BACKEND_PORT"
fi

# Check if python-dotenv is installed
cd "MCP Server"
if python -c "import dotenv" 2>/dev/null; then
    echo "  ✓ python-dotenv is installed"
else
    echo "  ✗ python-dotenv is NOT installed - Run: pip install python-dotenv"
    ERRORS=$((ERRORS + 1))
fi
cd ..

echo ""
echo "3. Checking Agentic Backend..."
echo "--------------------------------"
if [ -f "Agentic Backend/.env" ]; then
    echo "✓ Agentic Backend/.env exists"
    check_env_var "Agentic Backend/.env" "OPENAI_API_KEY"
    check_env_var "Agentic Backend/.env" "MCP_SERVER_HOST"
    check_env_var "Agentic Backend/.env" "MCP_SERVER_PORT"
else
    echo "! Agentic Backend/.env is missing (optional for server)"
fi

echo ""
echo "4. Checking Frontend..."
echo "--------------------------------"
check_file "Frontend/src/environments/environment.runtime.ts"

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✓ All checks passed! Server is ready."
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start Project Backend: cd 'Project Backend' && npm start"
    echo "2. Start MCP Server: cd 'MCP Server' && python main.py"
    echo "3. Start Agentic Backend: cd 'Agentic Backend' && python -m agentic_application.entrypoint"
    echo "4. Start Frontend: cd 'Frontend' && npm start"
else
    echo "✗ Found $ERRORS error(s). Please fix them before deployment."
    echo "========================================="
    exit 1
fi
