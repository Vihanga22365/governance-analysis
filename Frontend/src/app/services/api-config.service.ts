import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  // All configuration now comes from environment files
  private readonly AGENTIC_APPLICATION_URL = environment.agenticApplicationUrl;
  private readonly BACKEND_API = `${environment.backendApiUrl}/governance`;
  private readonly APP_NAME = environment.appName;
  private readonly USER_ID = environment.defaultUserId;

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
