export interface RelevantDocument {
  documentName: string;
  documentUrl: string;
  description?: string;
  uploadedAt?: string;
}

export interface GovernanceBasicDetails {
  governance_id: string;
  user_chat_session_id: string;
  user_name: string;
  use_case: string;
  relevant_documents?: RelevantDocument[];
  created_at?: string;
  updated_at?: string;
}
