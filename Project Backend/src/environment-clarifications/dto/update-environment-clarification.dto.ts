import {
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ENV_CLARIFICATION_STATUSES } from '../environment-clarifications.constants';
import type { EnvClarificationStatus } from '../environment-clarifications.constants';

export class EnvironmentClarificationUpdateItem {
  @IsString()
  @IsNotEmpty()
  unique_code: string;

  @IsString()
  @IsNotEmpty()
  user_answer: string;

  @IsString()
  @IsIn(ENV_CLARIFICATION_STATUSES)
  @IsNotEmpty()
  status: EnvClarificationStatus;
}

export class UpdateEnvironmentClarificationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentClarificationUpdateItem)
  clarifications: EnvironmentClarificationUpdateItem[];
}
