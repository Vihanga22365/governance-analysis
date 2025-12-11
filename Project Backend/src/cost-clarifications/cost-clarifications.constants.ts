export const CLARIFICATION_CODES = [
  'resource_count',
  'cost_per_resource',
  'project_duration',
  'licensed_software',
] as const;

export type ClarificationCode = (typeof CLARIFICATION_CODES)[number];

export const CLARIFICATION_STATUSES = ['pending', 'completed'] as const;
export type ClarificationStatus = (typeof CLARIFICATION_STATUSES)[number];

export const CLARIFICATION_DEFINITIONS: Array<{
  unique_code: ClarificationCode;
  clarification: string;
}> = [
  {
    unique_code: 'resource_count',
    clarification: 'Resource Count (SE, QA, PM)',
  },
  {
    unique_code: 'cost_per_resource',
    clarification: 'Cost per Resource',
  },
  {
    unique_code: 'project_duration',
    clarification: 'Project Duration',
  },
  // {
  //   unique_code: 'licensed_software',
  //   clarification:
  //     'Licensed Software Required (JetBrains IntelliJ (per user), Jira, Confluence, GitHub Enterprise)',
  // },
];
