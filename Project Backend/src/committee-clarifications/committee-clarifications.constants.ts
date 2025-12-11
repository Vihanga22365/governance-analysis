export type CommitteeType = 'committee_1' | 'committee_2' | 'committee_3';

export const COMMITTEE_TYPES = [
  'committee_1',
  'committee_2',
  'committee_3',
] as const;

export const CLARIFICATION_STATUSES = ['pending', 'completed'] as const;
export type ClarificationStatus = (typeof CLARIFICATION_STATUSES)[number];

export const COMMITTEE_1_CODES = [
  'core_business_impact',
  'internal_users_only',
  'tech_approved_org',
] as const;

export const COMMITTEE_2_CODES = [
  'sensitive_data',
  'system_integration',
  'block_other_teams',
] as const;

export const COMMITTEE_3_CODES = [
  'regulatory_compliance',
  'reputation_impact',
  'multi_business_scale',
] as const;

export type CommitteeCode =
  | (typeof COMMITTEE_1_CODES)[number]
  | (typeof COMMITTEE_2_CODES)[number]
  | (typeof COMMITTEE_3_CODES)[number];

export const COMMITTEE_CLARIFICATION_DEFINITIONS: Record<
  CommitteeType,
  Array<{
    unique_code: string;
    clarification: string;
  }>
> = {
  committee_1: [
    {
      unique_code: 'core_business_impact',
      clarification:
        'Will this use case impact core business operations if it fails?',
    },
    {
      unique_code: 'internal_users_only',
      clarification: 'Is this application used by internal users only?',
    },
    {
      unique_code: 'tech_approved_org',
      clarification:
        'Is the technology already approved and commonly used in the organization?',
    },
  ],
  committee_2: [
    {
      unique_code: 'sensitive_data',
      clarification:
        'Does the application handle sensitive business or customer data?',
    },
    {
      unique_code: 'system_integration',
      clarification:
        'Does the application integrate with multiple internal or external systems?',
    },
    {
      unique_code: 'block_other_teams',
      clarification:
        'Will failure of this application block other teams or systems?',
    },
  ],
  committee_3: [
    {
      unique_code: 'regulatory_compliance',
      clarification:
        'Could this use case cause regulatory, legal, or compliance issues if misused or failed?',
    },
    {
      unique_code: 'reputation_impact',
      clarification:
        "Could failure or misuse of this application negatively impact the organization's reputation?",
    },
    {
      unique_code: 'multi_business_scale',
      clarification:
        'Does this application affect multiple business units or customers at scale?',
    },
  ],
};
