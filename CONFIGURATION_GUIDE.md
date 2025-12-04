# Configuration Guide - Removing Hardcoded Localhost

This document describes the changes made to externalize hardcoded IP addresses and URLs from the codebase.

## Summary of Changes

All hardcoded `localhost` references have been removed and replaced with configurable values that can be easily modified for different deployment environments.

## Frontend Configuration

### Location

`Frontend/src/environments/environment.runtime.ts`

### Configuration Options

```typescript
export const runtimeConfig = {
  pcIpAddress: "localhost", // Backend server IP/domain
  agenticApplicationPort: "8350", // Agentic application port
  backendApiPort: "8353", // Project Backend API port
  mcpServerPort: "8354", // MCP Server WebSocket port
};
```

### How to Configure

1. **For Local Development:**

   - Keep the default value: `pcIpAddress: 'localhost'`

2. **For Network Access (Same Network):**

   - Find your PC's IP address:
     ```cmd
     ipconfig
     ```
   - Update `pcIpAddress` with your IP:
     ```typescript
     pcIpAddress: "192.168.1.100"; // Your actual IP
     ```

3. **For Production Deployment:**
   - Update with your domain or server IP:
     ```typescript
     pcIpAddress: "api.yourdomain.com";
     // or
     pcIpAddress: "203.0.113.5";
     ```

### Files Modified

- `Frontend/src/environments/environment.ts` - Production environment
- `Frontend/src/environments/environment.development.ts` - Development environment
- `Frontend/src/app/services/chat-history-websocket.service.ts` - WebSocket connection
- `Frontend/src/app/governance-details/governance-details.component.ts` - Document URLs

## Project Backend Configuration

### Location

`Project Backend/.env`

### Configuration Options

```env
PORT=8353
BACKEND_HOST=localhost
```

### How to Configure

1. **For Local Development:**

   ```env
   BACKEND_HOST=localhost
   ```

2. **For Network Access:**

   ```env
   BACKEND_HOST=192.168.1.100  # Your server IP
   ```

3. **For Production:**
   ```env
   BACKEND_HOST=api.yourdomain.com
   # or
   BACKEND_HOST=0.0.0.0  # Listen on all interfaces
   ```

### Files Modified

- `Project Backend/.env` - Environment variables
- `Project Backend/src/main.ts` - Server startup log message

## Quick Start Guide

### Development Setup (Default)

No changes needed - everything works with `localhost` by default.

### Network Access Setup

1. Find your PC's IP address
2. Update Frontend configuration:
   ```typescript
   // Frontend/src/environments/environment.runtime.ts
   pcIpAddress: "192.168.1.100"; // Your IP
   ```
3. Update Backend configuration:
   ```env
   # Project Backend/.env
   BACKEND_HOST=192.168.1.100  # Your IP
   ```
4. Rebuild and restart both applications

### Production Deployment

1. Update Frontend configuration with production domain/IP
2. Update Backend `.env` with production host
3. Build Frontend for production: `npm run build`
4. Deploy both applications to your server

## Benefits

✅ No hardcoded IP addresses in source code  
✅ Easy to switch between development and production  
✅ Single place to update configuration  
✅ Better security and maintainability  
✅ Supports different deployment scenarios

## Notes

- Always rebuild the Frontend after changing `environment.runtime.ts`
- Backend automatically picks up `.env` changes on restart (no rebuild needed)
- Never commit sensitive production values to version control
- Consider using environment-specific `.env` files (`.env.production`, `.env.development`)
