import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { ChatHistoryWebsocketService } from '../../services/chat-history-websocket.service';
import { Subscription } from 'rxjs';

interface ChatEvent {
  id: string;
  author: string;
  content: {
    parts: Array<{ text?: string; functionCall?: any }>;
    role: string;
    userQuery?: string | null;
    userUploadedDocumentContents?: string | null;
    userUploadedDocuments?: Array<{ name: string; content: string }> | null;
  };
  timestamp: number;
  invocationId?: string;
}

interface ChatHistoryData {
  chat_history?: {
    events: ChatEvent[];
    userId: string;
    id: string;
  };
  user_name?: string;
  governance_id?: string;
}

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [NgClass, NgIf, NgFor],
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.scss'],
})
export class ChatHistoryComponent implements OnInit, OnDestroy {
  @Input() isDarkTheme: boolean = false;

  chatEvents: ChatEvent[] = [];
  userName: string = '';
  governanceId: string = '';
  private chatHistorySubscription?: Subscription;
  isConnected = false;

  constructor(private chatHistoryWebsocket: ChatHistoryWebsocketService) {}

  ngOnInit(): void {
    // Subscribe to WebSocket chat history updates
    this.chatHistorySubscription = this.chatHistoryWebsocket
      .getChatHistoryUpdates()
      .subscribe({
        next: (data) => {
          console.log('Received chat history update:', data);
          this.updateChatHistory(data);
        },
        error: (error) => {
          console.error('Error receiving chat history update:', error);
        },
      });

    // Subscribe to connection status
    this.chatHistoryWebsocket.getConnectionStatus().subscribe({
      next: (status) => {
        this.isConnected = status;
        console.log('WebSocket connection status:', status);
      },
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.chatHistorySubscription) {
      this.chatHistorySubscription.unsubscribe();
    }
  }

  /**
   * Update chat history with data received from WebSocket
   */
  private updateChatHistory(data: any): void {
    console.log('updateChatHistory called with data:', data);

    // Handle the data structure from WebSocket
    // New structure from governance_details_update: data has chat_history already parsed
    if (data?.chat_history?.events) {
      // Direct chat_history structure (already parsed by WebSocket service)
      this.chatEvents = data.chat_history.events;

      // If events are empty (clearing), reset userName and governanceId
      if (this.chatEvents.length === 0) {
        this.userName = '';
        this.governanceId = '';
      } else {
        this.userName = data.user_name || data.chat_history.userId || 'User';
        this.governanceId = data.governance_id || '';
      }
      console.log('Chat events updated (from parsed data):', this.chatEvents);
    } else if (data?.data?.chat_history?.events) {
      // Data is wrapped in a 'data' property (old structure)
      this.chatEvents = data.data.chat_history.events;

      // If events are empty (clearing), reset userName and governanceId
      if (this.chatEvents.length === 0) {
        this.userName = '';
        this.governanceId = '';
      } else {
        this.userName =
          data.data.user_name || data.data.chat_history.userId || 'User';
        this.governanceId = data.data.governance_id || '';
      }
      console.log('Chat events updated (from data.data):', this.chatEvents);
    } else {
      console.warn('Unexpected data structure:', data);
    }
  }

  /**
   * Get formatted timestamp
   */
  getFormattedTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Check if event is from user
   */
  isUserEvent(author: string): boolean {
    return author === 'user';
  }

  /**
   * Get display text for model events
   */
  getModelText(event: ChatEvent): string {
    if (event.content?.parts?.[0]?.text) {
      return event.content.parts[0].text;
    }
    // Don't display function calls
    return '';
  }

  /**
   * Check if event has displayable content
   */
  hasDisplayableContent(event: ChatEvent): boolean {
    // User events with query or document
    if (this.isUserEvent(event.author)) {
      return !!(
        event.content.userQuery ||
        event.content.userUploadedDocuments?.length ||
        event.content.userUploadedDocumentContents
      );
    }
    // Model events with text (not function calls)
    return !!event.content?.parts?.[0]?.text;
  }

  trackByEvent(index: number, event: ChatEvent): string {
    return event.id || `${event.timestamp}-${index}`;
  }

  trackByDocument(
    index: number,
    doc: { name: string; content: string }
  ): string {
    return `${doc.name}-${index}`;
  }

  /**
   * Download document content as a text file
   */
  downloadDocument(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
