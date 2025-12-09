import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ENV_CLARIFICATION_STATUSES } from '../environment-clarifications.constants';
import type { EnvClarificationStatus } from '../environment-clarifications.constants';

export class UpdateEnvironmentClarificationDto {
  @IsString()
  @IsNotEmpty()
  user_answer: string;

  @IsString()
  @IsIn(ENV_CLARIFICATION_STATUSES)
  @IsNotEmpty()
  status: EnvClarificationStatus;
}
