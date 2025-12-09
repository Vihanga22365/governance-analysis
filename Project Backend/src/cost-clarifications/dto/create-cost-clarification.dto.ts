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
  CLARIFICATION_CODES,
  CLARIFICATION_STATUSES,
} from '../cost-clarifications.constants';
import type {
  ClarificationCode,
  ClarificationStatus,
} from '../cost-clarifications.constants';

export class ClarificationInputDto {
  @IsString()
  @IsIn(CLARIFICATION_CODES)
  unique_code: ClarificationCode;

  @IsString()
  @IsOptional()
  user_answer?: string;

  @IsString()
  @IsIn(CLARIFICATION_STATUSES)
  @IsOptional()
  status?: ClarificationStatus;
}

export class CreateCostClarificationDto {
  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClarificationInputDto)
  @IsOptional()
  clarifications?: ClarificationInputDto[];
}
