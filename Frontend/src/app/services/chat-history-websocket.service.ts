import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatHistoryUpdate {
  type: 'chat_history_update';
  data: any;
}

export interface GovernanceDetailsUpdate {
  type: 'governance_details_update';
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class ChatHistoryWebsocketService {
  private socket: WebSocket | null = null;
  private chatHistorySubject = new Subject<any>();
  private governanceDetailsSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // WebSocket server URL - configured from environment
  private wsUrl = environment.mcpServerWsUrl;

  constructor() {
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  private connect(): void {
    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected to MCP Server');
        this.connectionStatusSubject.next(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          console.log('Message type:', message.type);
          console.log('Message data:', message.data);

          if (message.type === 'chat_history_update') {
            const parsedData = this.parseChatHistory(message.data);
            console.log('Parsed data being emitted:', parsedData);
            this.chatHistorySubject.next(parsedData);
          } else if (message.type === 'governance_details_update') {
            console.log('Governance details update received:', message.data);
            // Also parse and emit chat history from governance details
            if (message.data?.chat_history) {
              const parsedChatData = this.parseChatHistory(message.data);
              console.log(
                'Parsed chat history from governance details:',
                parsedChatData
              );
              this.chatHistorySubject.next(parsedChatData);
            }
            this.governanceDetailsSubject.next(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next(false);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatusSubject.next(false);

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  /**
   * Parse chat history data to extract user query and document contents
   */
  private parseChatHistory(data: any): any {
    console.log('parseChatHistory input:', data);

    // Handle nested data structure
    let chatHistoryData = data;

    // New structure: data.chat_history.data.chat_history (from governance_details_update)
    if (data?.chat_history?.data?.chat_history) {
      chatHistoryData = data.chat_history.data;
    }
    // Old structure: data.data.chat_history (from chat_history_update)
    else if (data?.data?.chat_history) {
      chatHistoryData = data.data;
    }

    if (chatHistoryData?.chat_history?.events) {
      chatHistoryData.chat_history.events =
        chatHistoryData.chat_history.events.map((event: any) => {
          if (event.content?.parts?.[0]?.text) {
            const text = event.content.parts[0].text;

            // Extract <user_query> and <user_uploaded_document_contents> tags
            const userQueryMatch = text.match(
              /<user_query>\s*([\s\S]*?)\s*<\/user_query>/i
            );
            const documentContentsMatch = text.match(
              /<user_uploaded_document_contents>\s*([\s\S]*?)\s*<\/user_uploaded_document_contents>/i
            );

            event.content.userQuery = userQueryMatch
              ? userQueryMatch[1].trim()
              : null;

            // Parse multiple documents
            const documentsContent = documentContentsMatch
              ? documentContentsMatch[1].trim()
              : null;

            if (
              documentsContent &&
              documentsContent !== 'NO DOCUMENT CONTENT'
            ) {
              // Parse multiple documents separated by === markers
              const documentRegex =
                /===\s*([^=]+?)\s*Document Content Start\s*===([\s\S]*?)===\s*\1\s*Document Content End\s*===/gi;
              const documents = [];
              let match;

              while ((match = documentRegex.exec(documentsContent)) !== null) {
                documents.push({
                  name: match[1].trim(),
                  content: match[2].trim(),
                });
              }

              // If no documents were parsed with === format, treat entire content as single document
              if (documents.length > 0) {
                event.content.userUploadedDocuments = documents;
                event.content.userUploadedDocumentContents = null;
              } else {
                // Fallback: single document without === markers
                event.content.userUploadedDocumentContents = documentsContent;
                event.content.userUploadedDocuments = null;
              }
            } else {
              event.content.userUploadedDocuments = null;
              event.content.userUploadedDocumentContents = null;
            }

            // Check if user query is "NO USER QUERY"
            if (event.content.userQuery === 'NO USER QUERY') {
              event.content.userQuery = null;
            }
          }
          return event;
        });
    }

    console.log('parseChatHistory output:', chatHistoryData);
    return chatHistoryData;
  }

  /**
   * Get observable for chat history updates
   */
  getChatHistoryUpdates(): Observable<any> {
    return this.chatHistorySubject.asObservable();
  }

  /**
   * Get observable for governance details updates
   */
  getGovernanceDetailsUpdates(): Observable<any> {
    return this.governanceDetailsSubject.asObservable();
  }

  /**
   * Manually emit chat history data (for HTTP search results)
   */
  emitChatHistoryUpdate(data: any): void {
    const parsedData = this.parseChatHistory(data);
    console.log('Manually emitting chat history update:', parsedData);
    this.chatHistorySubject.next(parsedData);
  }

  /**
   * Get observable for connection status
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  /**
   * Send a message to the WebSocket server (if needed)
   */
  sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
