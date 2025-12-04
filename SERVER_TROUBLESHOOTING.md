# Server Deployment Troubleshooting Guide

## Issue 1: create_governance_request.py returns HTTP 500 Error on Server

### Symptoms
- Works fine on localhost
- Returns error on server: `{"error": "HTTP 500: Failed to save chat history: Error fetching chat history: fetch failed"}`

### Root Causes

This error occurs in two stages:
1. Governance request is created successfully
2. Then fails when trying to save chat history by fetching from the Agentic Application

#### A. Agentic Application Not Reachable

**Problem**: Project Backend cannot connect to Agentic Application to fetch chat history.

**Solution**:
1. Verify Agentic Application is running:
   ```bash
   curl http://localhost:8350/health
   # or with server IP
   curl http://194.163.140.73:8350/health
   ```

2. Check `Project Backend/.env` has correct Agentic Application configuration:
   ```env
   AGENTIC_PC_IP=localhost
   AGENTIC_PORT=8350
   ```
   
   If Agentic Application is on a different server:
   ```env
   AGENTIC_PC_IP=194.163.140.73
   AGENTIC_PORT=8350
   ```

3. Restart Project Backend after updating `.env`

#### B. Missing or Invalid Firebase Configuration

**Problem**: The `.env` file on the server is missing or has incorrect Firebase credentials.

**Solution**:
1. Verify the `.env` file exists on the server at `Project Backend/.env`
2. Ensure it contains all required Firebase variables:
   ```env
   FIREBASE_PROJECT_ID=governance-risk-poc-db
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@governance-risk-poc-db.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_DATABASE_URL=https://governance-risk-poc-db-default-rtdb.firebaseio.com
   ```
3. **Important**: The `FIREBASE_PRIVATE_KEY` must include `\n` for newlines and be wrapped in quotes

**Check**:
```bash
# On the server
cd "Project Backend"
cat .env | grep FIREBASE
cat .env | grep AGENTIC
```

#### C. Outdated Compiled Code

**Problem**: The server is running old compiled JavaScript code that doesn't have the latest fixes.

**Solution**:
1. Rebuild the backend on the server:
   ```bash
   cd "Project Backend"
   npm run build
   ```
2. Restart the backend service

#### D. MCP Server Using Wrong Backend URL

**Problem**: MCP Server can't reach the backend API because it's using the wrong IP address.

**Solution**:
1. Create/update `MCP Server/.env` on the server:
   ```env
   BACKEND_HOST=localhost
   BACKEND_PORT=8353
   ```
   
   Or if services are on different servers:
   ```env
   BACKEND_HOST=194.163.140.73
   BACKEND_PORT=8353
   ```

2. Install python-dotenv if not installed:
   ```bash
   cd "MCP Server"
   pip install python-dotenv
   ```

3. Restart MCP Server

#### 4. Documents Directory Permissions

**Problem**: The backend can't read the `documents` directory due to permission issues.

**Solution**:
```bash
# On the server
cd "Project Backend"
mkdir -p documents
chmod 755 documents
```

#### 5. Network/Firewall Issues

**Problem**: MCP Server can't reach the backend API due to firewall rules.

**Solution**:
1. Verify the backend is accessible:
   ```bash
   curl http://localhost:8353/api/governance
   ```

2. If using different servers, check firewall allows port 8353

3. Update MCP Server `.env` with correct host

---

## Debugging Steps

### Step 1: Check Backend Logs

On the server, check the backend console output for detailed error messages:
```bash
# If using PM2
pm2 logs project-backend

# If running directly
# Check the terminal where the backend is running
```

Look for messages like:
- `Error creating governance details:`
- Firebase connection errors
- Missing environment variables

### Step 2: Test Backend API Directly

Test if the backend API works independently:
```bash
curl -X POST http://localhost:8353/api/governance \
  -H "Content-Type: application/json" \
  -d '{
    "user_chat_session_id": "test-123",
    "user_name": "Test User",
    "use_case_title": "Test Case",
    "use_case_description": "Testing",
    "relevant_documents": []
  }'
```

If this fails with 500, the issue is in the backend configuration.

### Step 3: Verify Environment Variables

On the server:
```bash
cd "Project Backend"
node -e "require('dotenv').config(); console.log('Firebase Project:', process.env.FIREBASE_PROJECT_ID)"
```

Should output: `Firebase Project: governance-risk-poc-db`

If it shows `undefined`, the `.env` file is missing or not being loaded.

### Step 4: Check MCP Server Configuration

```bash
cd "MCP Server"
python -c "from config import BACKEND_HOST, BACKEND_PORT; print(f'Backend: http://{BACKEND_HOST}:{BACKEND_PORT}')"
```

Should show the correct backend URL.

---

## Complete Server Setup Checklist

### Project Backend
- [ ] `.env` file exists with all Firebase credentials
- [ ] `BACKEND_HOST` is set correctly
- [ ] Code is compiled: `npm run build`
- [ ] Service is running on port 8353
- [ ] `documents` directory exists with proper permissions
- [ ] Logs show no Firebase connection errors

### MCP Server
- [ ] `.env` file exists with `BACKEND_HOST` and `BACKEND_PORT`
- [ ] `python-dotenv` is installed
- [ ] Service is running on port 8354
- [ ] Can reach backend API (test with curl)

### Agentic Backend
- [ ] `.env` file exists with `OPENAI_API_KEY`
- [ ] `MCP_SERVER_HOST` and `MCP_SERVER_PORT` are set
- [ ] Service is running on port 8350
- [ ] Can reach MCP Server

### Frontend
- [ ] `environment.runtime.ts` has correct server IP
- [ ] Rebuilt after configuration change: `npm run build`
- [ ] Deployed/served correctly

---

## Quick Fix for Server

If you're experiencing 500 errors on the server, run this script:

```bash
#!/bin/bash

# 1. Ensure .env files exist
echo "Checking environment files..."

# Project Backend
if [ ! -f "Project Backend/.env" ]; then
    echo "ERROR: Project Backend/.env is missing!"
    echo "Copy from localhost or create with Firebase credentials"
    exit 1
fi

# MCP Server
if [ ! -f "MCP Server/.env" ]; then
    echo "Creating MCP Server/.env..."
    cat > "MCP Server/.env" << EOF
BACKEND_HOST=localhost
BACKEND_PORT=8353
EOF
fi

# 2. Install dependencies
echo "Installing MCP Server dependencies..."
cd "MCP Server"
pip install python-dotenv
cd ..

# 3. Rebuild Project Backend
echo "Rebuilding Project Backend..."
cd "Project Backend"
npm run build
cd ..

# 4. Create documents directory
echo "Ensuring documents directory exists..."
mkdir -p "Project Backend/documents"
chmod 755 "Project Backend/documents"

echo "Setup complete! Please restart all services."
```

---

## Prevention

To avoid these issues in the future:

1. **Use environment-specific .env files**: `.env.development`, `.env.production`
2. **Document all required environment variables** in `.env.example`
3. **Add deployment scripts** that verify configuration before starting services
4. **Set up proper logging** to capture detailed error information
5. **Use Docker** for consistent environments across development and production
