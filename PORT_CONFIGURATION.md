# Port Configuration

This document lists all the ports used by different services in the application.

## Service Ports

| Service              | Port | Protocol  | Description                               |
| -------------------- | ---- | --------- | ----------------------------------------- |
| **Agentic Backend**  | 8350 | HTTP      | Main agentic application server (FastAPI) |
| **MCP Server**       | 8351 | HTTP      | Model Context Protocol server (FastMCP)   |
| **Frontend**         | 8352 | HTTP      | Angular development server                |
| **Project Backend**  | 8353 | HTTP      | NestJS API server                         |
| **WebSocket Server** | 8354 | WebSocket | Real-time communication server            |

## Configuration Files

### Agentic Backend

- **File**: `Agentic Backend/main.py`
- **Port**: `8350` (default, overridable via `PORT` environment variable)
- **Dependencies**: Connects to MCP Server at port `8351`
- **Config**: `Agentic Backend/agentic_application/config.py`

### MCP Server

- **File**: `MCP Server/main.py`
- **Port**: `8351` (HTTP), `8354` (WebSocket)
- **Dependencies**: Connects to Project Backend API at port `8353`
- **Config**: `MCP Server/config.py`

### Frontend

- **File**: `Frontend/package.json`
- **Port**: `8352` (configured in npm start script)
- **Dependencies**:
  - Connects to Agentic Backend at port `8350`
  - Connects to Project Backend at port `8353`
  - Connects to WebSocket Server at port `8354`
- **Config Files**:
  - `Frontend/src/environments/environment.ts` (production)
  - `Frontend/src/environments/environment.development.ts` (development)

### Project Backend

- **File**: `Project Backend/src/main.ts`
- **Port**: `8353` (default, overridable via `PORT` environment variable)
- **Dependencies**: Connects to Agentic Backend at port `8350`
- **Config Files**:
  - `Project Backend/.env`
  - `Project Backend/src/config/agentic.config.ts`

## Running the Services

### Start Agentic Backend

```cmd
cd "d:\Office Research\Risk Analysis\Agentic Backend"
python main.py
```

Access at: `http://localhost:8350`

### Start MCP Server

```cmd
cd "d:\Office Research\Risk Analysis\MCP Server"
python main.py
```

Access at: `http://localhost:8351` (HTTP) and `ws://localhost:8354` (WebSocket)

### Start Frontend

```cmd
cd "d:\Office Research\Risk Analysis\Frontend"
npm install
npm start
```

Access at: `http://localhost:8352`

### Start Project Backend

```cmd
cd "d:\Office Research\Risk Analysis\Project Backend"
npm install
npm run start:dev
```

Access at: `http://localhost:8353`

## Environment Variables

You can override default ports using environment variables:

### Agentic Backend

```bash
PORT=8350
```

### Project Backend

```bash
PORT=8353
AGENTIC_PORT=8350
```

### MCP Server

Edit `MCP Server/main.py` to change `mcp.settings.port` value.

### Frontend

Edit `Frontend/package.json` start script or use `ng serve --port 8352`.

## Network Access

By default, all services bind to `0.0.0.0` except the Frontend (localhost only during development). To access services from other devices on your network:

1. Find your PC's IP address (e.g., `192.168.1.100`)
2. Update the `pcIpAddress` in Frontend environment files
3. Ensure firewall allows incoming connections on these ports

## Troubleshooting

### Port Already in Use

If you encounter "port already in use" errors:

```cmd
netstat -ano | findstr :<PORT_NUMBER>
taskkill /PID <PID> /F
```

### Service Communication Issues

Verify all services are running:

- Agentic Backend: `http://localhost:8350`
- MCP Server: `http://localhost:8351`
- Frontend: `http://localhost:8352`
- Project Backend: `http://localhost:8353/api`
- WebSocket: `ws://localhost:8354`

## Architecture Overview

```
┌─────────────┐
│  Frontend   │ :8352
│  (Angular)  │
└──────┬──────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌─────────────┐              ┌─────────────┐
│   Agentic   │ :8350        │   Project   │ :8353
│   Backend   │◄─────────────┤   Backend   │
│  (FastAPI)  │              │  (NestJS)   │
└──────┬──────┘              └─────────────┘
       │
       ▼
┌─────────────┐
│ MCP Server  │ :8351 (HTTP)
│  (FastMCP)  │ :8354 (WebSocket)
└─────────────┘
```

## Notes

- All HTTP servers support CORS for local development
- WebSocket server runs on a separate port (8354) managed by MCP Server
- Frontend uses environment-specific configurations for different deployment scenarios
- Backend services use environment variables for flexible port configuration
