export interface ChatEvent {
  content: {
    parts: Array<{
      text?: string;
      functionCall?: any;
      functionResponse?: any;
    }>;
    role: string;
  };
  invocationId: string;
  author: string;
  actions: {
    stateDelta: Record<string, any>;
    artifactDelta: Record<string, any>;
    requestedAuthConfigs: Record<string, any>;
  };
  longRunningToolIds: string[];
  id: string;
  timestamp: number;
  partial?: boolean;
}

export interface ChatHistoryResponse {
  id: string;
  appName: string;
  userId: string;
  state: {
    user_name: string;
    session_id: string;
  };
  events: ChatEvent[];
  lastUpdateTime: number;
}

export interface ChatHistoryRecord {
  governance_id: string;
  user_chat_session_id: string;
  user_name: string;
  relevant_documents: string[];
  chat_history: ChatHistoryResponse;
  created_at: string;
  updated_at: string;
}
