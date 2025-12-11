import {
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CLARIFICATION_STATUSES } from '../cost-clarifications.constants';
import type { ClarificationStatus } from '../cost-clarifications.constants';

export class CostClarificationUpdateItem {
  @IsString()
  @IsNotEmpty()
  unique_code: string;

  @IsString()
  @IsNotEmpty()
  user_answer: string;

  @IsString()
  @IsIn(CLARIFICATION_STATUSES)
  @IsNotEmpty()
  status: ClarificationStatus;
}

export class UpdateCostClarificationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostClarificationUpdateItem)
  clarifications: CostClarificationUpdateItem[];
}
