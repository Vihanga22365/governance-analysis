export const ENV_CLARIFICATION_CODES = [
  'prefer_environment',
  'pii_data',
  'technologies',
  'expected_user_count',
  'architecture_type',
] as const;

export type EnvClarificationCode = (typeof ENV_CLARIFICATION_CODES)[number];

export const ENV_CLARIFICATION_STATUSES = ['pending', 'completed'] as const;
export type EnvClarificationStatus =
  (typeof ENV_CLARIFICATION_STATUSES)[number];

export const ENV_CLARIFICATION_DEFINITIONS: Array<{
  unique_code: EnvClarificationCode;
  clarification: string;
}> = [
  {
    unique_code: 'prefer_environment',
    clarification: 'Prefer Environment (AWS/ GCP/ Azure)',
  },
  // {
  //   unique_code: 'pii_data',
  //   clarification: 'PII Data Availability',
  // },
  {
    unique_code: 'technologies',
    clarification: 'Frontend / Backend / DB',
  },
  // {
  //   unique_code: 'expected_user_count',
  //   clarification: 'Expected User Count',
  // },
  {
    unique_code: 'architecture_type',
    clarification: 'Architecture Type (Monolith, Microservices, Serverless)',
  },
];
