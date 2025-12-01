import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateEnvironmentDetailsDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsString()
  @IsNotEmpty()
  environment: string;

  @IsArray()
  @IsNotEmpty()
  environment_breakdown: string[];
}
