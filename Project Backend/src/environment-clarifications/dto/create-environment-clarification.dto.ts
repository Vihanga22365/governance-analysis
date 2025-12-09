import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ENV_CLARIFICATION_CODES,
  ENV_CLARIFICATION_STATUSES,
} from '../environment-clarifications.constants';
import type {
  EnvClarificationCode,
  EnvClarificationStatus,
} from '../environment-clarifications.constants';

export class EnvClarificationInputDto {
  @IsString()
  @IsIn(ENV_CLARIFICATION_CODES)
  unique_code: EnvClarificationCode;

  @IsString()
  @IsOptional()
  user_answer?: string;

  @IsString()
  @IsIn(ENV_CLARIFICATION_STATUSES)
  @IsOptional()
  status?: EnvClarificationStatus;
}

export class CreateEnvironmentClarificationDto {
  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvClarificationInputDto)
  @IsOptional()
  clarifications?: EnvClarificationInputDto[];
}
