import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  // Base configuration
  // TODO: Replace 'localhost' with your PC's IP address (e.g., '192.168.1.100')
  private readonly PC_IP_ADDRESS = 'localhost';
  private readonly AGENTIC_APPLICATION_PORT = '7350';
  private readonly AGENTIC_APPLICATION_URL = `http://${this.PC_IP_ADDRESS}:${this.AGENTIC_APPLICATION_PORT}`;
  private readonly BACKEND_API_PORT = '3000';
  private readonly BACKEND_API = `http://${this.PC_IP_ADDRESS}:${this.BACKEND_API_PORT}/api/governance`;

  // User and app configuration
  private readonly APP_NAME = 'agentic_application';
  private readonly USER_ID = 'Chathusha Wijenayake';

  constructor() {
    console.log('Agentic Application URL:', this.AGENTIC_APPLICATION_URL);
    console.log('Backend API URL:', this.BACKEND_API);
    console.log('User ID:', this.USER_ID);
  }

  getBaseUrl(): string {
    return this.AGENTIC_APPLICATION_URL;
  }

  getAppName(): string {
    return this.APP_NAME;
  }

  getUserId(): string {
    return this.USER_ID;
  }

  /**
   * Create session endpoint
   * POST /apps/{appName}/users/{userId}/sessions/{sessionId}
   */
  getCreateSessionUrl(sessionId: string): string {
    return `${this.AGENTIC_APPLICATION_URL}/apps/${this.APP_NAME}/users/${this.USER_ID}/sessions/${sessionId}`;
  }

  /**
   * Chat with agent endpoint
   * POST /run
   */
  getChatUrl(): string {
    return `${this.AGENTIC_APPLICATION_URL}/run`;
  }

  getDocumentUploadUrl(sessionId: string): string {
    return `${this.BACKEND_API}/upload-multiple/${sessionId}`;
  }

  /**
   * Build create session request body
   */
  buildCreateSessionBody(sessionId: string, name: string): any {
    return {
      user_name: name,
      session_id: sessionId,
    };
  }

  /**
   * Build chat request body
   */
  buildChatBody(sessionId: string, messageText: string): any {
    return {
      appName: this.APP_NAME,
      userId: this.USER_ID,
      sessionId: sessionId,
      newMessage: {
        role: 'user',
        parts: [
          {
            text: messageText,
          },
        ],
      },
    };
  }
}
