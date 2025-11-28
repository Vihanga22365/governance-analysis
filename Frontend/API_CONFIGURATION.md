# API Configuration Guide

## Chatbot Integration

This application integrates with a chatbot backend using two main APIs:

### 1. Create Session API

Creates a new chat session with user information.

**Endpoint:** `POST /apps/{appName}/users/{userId}/sessions/{sessionId}`

**Example:**

```bash
curl --location 'http://pc_ip_address:7350/apps/main_agent/users/Chathusha/sessions/s_1234' \
--header 'Content-Type: application/json' \
--data '{"state": {"name": "Chathusha Wijenayake", "designation": "Software Architect"}}'
```

### 2. Chat with Agent API

Sends messages to the chatbot and receives responses.

**Endpoint:** `POST /run`

**Example:**

```bash
curl --location 'http://pc_ip_address:7350/run' \
--header 'Content-Type: application/json' \
--data '{
  "appName": "main_agent",
  "userId": "Chathusha",
  "sessionId": "s_1234",
  "newMessage": {
    "role": "user",
    "parts": [{
      "text": "Hello"
    }]
  }
}'
```

## Configuration

### Setting the PC IP Address

1. Open `src/app/services/api-config.service.ts`
2. Find the line: `private readonly PC_IP_ADDRESS = 'localhost';`
3. Replace `'localhost'` with your PC's IP address (e.g., `'192.168.1.100'`)

**Example:**

```typescript
private readonly PC_IP_ADDRESS = '192.168.1.100';
```

### Default Configuration

- **App Name:** `main_agent`
- **User ID:** `Chathusha`
- **Port:** `7350`
- **Session ID:** Auto-generated UUID (e.g., `abc123-def456-...`)

### How It Works

1. **On Component Init:** Creates a new session automatically with UUID
2. **On Send Message:**
   - Extracts text from uploaded PDF/Word documents
   - Logs formatted XML to console with `<from_user>` tags
   - Sends message to chatbot API
   - Displays user message and chatbot response in chat UI
3. **On New Session Button:**
   - Generates new UUID
   - Creates new chatbot session
   - Clears chat history

### Configuration Locations

All API configurations are centralized in:

- **Service:** `src/app/services/api-config.service.ts` - URL configuration
- **Service:** `src/app/services/chatbot.service.ts` - HTTP requests
- **Component:** `src/app/chat-interface/chat-interface.component.ts` - Integration logic

### Troubleshooting

If you see connection errors:

1. Check that the chatbot backend is running on the configured IP and port
2. Verify CORS is enabled on the backend
3. Check browser console for detailed error messages
4. Ensure the PC IP address is correctly configured in `api-config.service.ts`
