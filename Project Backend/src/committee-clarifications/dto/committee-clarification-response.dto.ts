export class CommitteeClarificationResponseDto {
  governance_id: string;
  user_name: string;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  id?: string;
  clarifications: {
    committee_1: Array<{
      clarification: string;
      status: 'pending' | 'completed';
      unique_code: string;
      user_answer: string;
    }>;
    committee_2?: Array<{
      clarification: string;
      status: 'pending' | 'completed';
      unique_code: string;
      user_answer: string;
    }>;
    committee_3?: Array<{
      clarification: string;
      status: 'pending' | 'completed';
      unique_code: string;
      user_answer: string;
    }>;
  };
}
