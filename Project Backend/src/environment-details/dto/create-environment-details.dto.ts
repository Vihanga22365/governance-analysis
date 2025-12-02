import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EnvironmentService {
  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

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

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentService)
  @IsNotEmpty()
  environment_breakdown: EnvironmentService[];
}
