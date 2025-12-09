import {
  ClarificationCode,
  ClarificationStatus,
} from '../cost-clarifications.constants';

export class ClarificationEntryDto {
  clarification: string;
  unique_code: ClarificationCode;
  user_answer: string;
  status: ClarificationStatus;
}

export class CostClarificationResponseDto {
  id?: string;
  governance_id: string;
  user_name: string;
  clarifications: ClarificationEntryDto[];
  created_at?: string;
  updated_at?: string;
}
