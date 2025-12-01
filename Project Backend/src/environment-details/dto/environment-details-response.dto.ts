export class EnvironmentDetailsResponseDto {
  environment_details_id?: string;
  user_name: string;
  governance_id: string;
  environment: string;
  region: string;
  environment_breakdown: string[];
  created_at?: string;
}
