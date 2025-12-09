import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { CLARIFICATION_STATUSES } from '../cost-clarifications.constants';
import type { ClarificationStatus } from '../cost-clarifications.constants';

export class UpdateCostClarificationDto {
  @IsString()
  @IsNotEmpty()
  user_answer: string;

  @IsString()
  @IsIn(CLARIFICATION_STATUSES)
  @IsNotEmpty()
  status: ClarificationStatus;
}
