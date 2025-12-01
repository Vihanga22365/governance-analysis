export enum CommitteeStatus {
  PENDING = 'Pending',
  NOT_NEEDED = 'Not Needed',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export class RiskAnalysisResponseDto {
  risk_analysis_id?: string;
  user_name: string;
  governance_id: string;
  risk_level: string;
  reason: string;
  committee_1: CommitteeStatus;
  committee_2: CommitteeStatus;
  committee_3: CommitteeStatus;
  created_at?: string;
}
