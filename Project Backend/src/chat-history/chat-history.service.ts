import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import { SaveChatHistoryDto } from './dto/save-chat-history.dto';
import {
  ChatHistoryRecord,
  ChatHistoryResponse,
} from './interfaces/chat-history.interface';
import { AgenticConfig } from '../config/agentic.config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ChatHistoryService {
  private readonly tableName = 'chat_history';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  /**
   * Filters events to preserve complete conversation flow.
   * Keeps all events including those after function responses.
   */
  private filterEventsUpToFunctionResponse(events: any[]): any[] {
    if (!events || events.length === 0) {
      return events;
    }

    // Return all events - preserve complete conversation including
    // model responses after function calls and subsequent user interactions
    return events;
  }

  async fetchChatHistoryFromAgentic(
    userName: string,
    sessionId: string,
  ): Promise<ChatHistoryResponse> {
    try {
      const url = AgenticConfig.getChatHistoryUrl(userName, sessionId);
      const response = await fetch(url);

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Failed to fetch chat history from agentic API: ${response.statusText}`,
        );
      }

      const chatHistory: ChatHistoryResponse = await response.json();
      return chatHistory;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching chat history: ${error.message}`,
      );
    }
  }

  async saveChatHistory(
    saveChatHistoryDto: SaveChatHistoryDto,
  ): Promise<{ message: string; data: ChatHistoryRecord }> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const chatHistoryRef = database.ref(this.tableName);

      // Fetch chat history from external agentic API
      const chatHistory = await this.fetchChatHistoryFromAgentic(
        saveChatHistoryDto.user_name,
        saveChatHistoryDto.user_chat_session_id,
      );

      // Filter events to only include up to the last functionResponse
      const filteredEvents = this.filterEventsUpToFunctionResponse(
        chatHistory.events,
      );
      chatHistory.events = filteredEvents;

      // Get relevant documents from the UUID folder
      const uuidDir = path.join(
        process.cwd(),
        'documents',
        saveChatHistoryDto.user_chat_session_id,
      );
      let relevantDocuments: string[] = [];

      if (fs.existsSync(uuidDir)) {
        const files = fs.readdirSync(uuidDir);
        relevantDocuments = files.map((file) =>
          path.join('documents', saveChatHistoryDto.user_chat_session_id, file),
        );
      }

      const chatHistoryData: ChatHistoryRecord = {
        governance_id: saveChatHistoryDto.governance_id,
        user_chat_session_id: saveChatHistoryDto.user_chat_session_id,
        user_name: saveChatHistoryDto.user_name,
        relevant_documents: relevantDocuments,
        chat_history: chatHistory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to Firebase
      const newChatHistoryRef = chatHistoryRef.push();
      await newChatHistoryRef.set(chatHistoryData);

      return {
        message: 'Chat history saved successfully',
        data: chatHistoryData,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to save chat history: ${error.message}`,
      );
    }
  }

  async getChatHistoryByGovernanceId(
    governanceId: string,
  ): Promise<ChatHistoryRecord | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const chatHistoryRef = database.ref(this.tableName);

      const snapshot = await chatHistoryRef
        .orderByChild('governance_id')
        .equalTo(governanceId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Get the first match (or most recent)
      const key = Object.keys(data)[0];
      return {
        ...data[key],
        id: key,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch chat history: ${error.message}`,
      );
    }
  }
}
