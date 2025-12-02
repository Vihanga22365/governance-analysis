export class EnvironmentService {
  service: string;
  reason: string;
}

export class EnvironmentDetailsResponseDto {
  environment_details_id?: string;
  user_name: string;
  governance_id: string;
  environment: string;
  region: string;
  environment_breakdown: EnvironmentService[];
  created_at?: string;
}
