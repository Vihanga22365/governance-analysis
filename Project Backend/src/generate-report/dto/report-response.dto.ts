export class ReportResponseDto {
  user_name: string;
  governance_id: string;
  report_content: string;
  documents: string[];
  created_at?: string;
  report_id?: string;
}
