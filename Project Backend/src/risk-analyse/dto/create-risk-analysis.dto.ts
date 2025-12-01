import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateRiskAnalysisDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsEnum(RiskLevel)
  @IsNotEmpty()
  risk_level: RiskLevel;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
