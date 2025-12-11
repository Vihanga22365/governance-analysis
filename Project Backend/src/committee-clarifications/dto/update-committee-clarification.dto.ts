import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  COMMITTEE_1_CODES,
  COMMITTEE_2_CODES,
  COMMITTEE_3_CODES,
  CLARIFICATION_STATUSES,
} from '../committee-clarifications.constants';

export class CommitteeClarificationUpdateItem {
  @IsString()
  @IsNotEmpty()
  unique_code: string;

  @IsString()
  @IsNotEmpty()
  user_answer: string;

  @IsString()
  @IsIn(CLARIFICATION_STATUSES)
  @IsOptional()
  status?: string;
}

export class UpdateCommitteeClarificationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitteeClarificationUpdateItem)
  clarifications: CommitteeClarificationUpdateItem[];
}
