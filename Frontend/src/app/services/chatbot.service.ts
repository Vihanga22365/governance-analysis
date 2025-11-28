import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Create a new session with the chatbot
   */
  createSession(
    sessionId: string,
    name: string,
    designation: string
  ): Observable<any> {
    const url = this.apiConfig.getCreateSessionUrl(sessionId);
    const body = this.apiConfig.buildCreateSessionBody(sessionId, name);

    return this.http.post(url, body, { headers: this.headers });
  }

  /**
   * Send a message to the chatbot
   */
  sendMessage(sessionId: string, message: string): Observable<any> {
    const url = this.apiConfig.getChatUrl();
    const body = this.apiConfig.buildChatBody(sessionId, message);

    return this.http.post(url, body, { headers: this.headers });
  }

  /**
   * Extract the final text response from the API response
   * Handles both simple text responses and complex array structures
   */
  extractResponseText(response: any): string {
    // If response is a string, return it directly
    if (typeof response === 'string') {
      return response;
    }

    // If response is an array, find the last item with text content from the model
    if (Array.isArray(response)) {
      // Iterate from the end to find the last model response with text
      for (let i = response.length - 1; i >= 0; i--) {
        const item = response[i];
        if (
          item?.content?.role === 'model' &&
          item?.content?.parts &&
          Array.isArray(item.content.parts)
        ) {
          // Find text part in the parts array
          for (const part of item.content.parts) {
            if (part?.text) {
              return part.text;
            }
          }
        }
      }
    }

    // If response has a direct text property
    if (response?.text) {
      return response.text;
    }

    // If response has content.parts structure
    if (response?.content?.parts && Array.isArray(response.content.parts)) {
      for (const part of response.content.parts) {
        if (part?.text) {
          return part.text;
        }
      }
    }

    // Fallback: return stringified JSON if no text found
    return JSON.stringify(response, null, 2);
  }
}
