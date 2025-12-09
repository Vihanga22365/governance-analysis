import type {
  EnvClarificationCode,
  EnvClarificationStatus,
} from '../environment-clarifications.constants';

export class EnvClarificationEntryDto {
  clarification: string;
  unique_code: EnvClarificationCode;
  user_answer: string;
  status: EnvClarificationStatus;
}

export class EnvironmentClarificationResponseDto {
  id?: string;
  governance_id: string;
  user_name: string;
  clarifications: EnvClarificationEntryDto[];
  created_at?: string;
  updated_at?: string;
}
