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
  COMMITTEE_1_CODES,
  COMMITTEE_2_CODES,
  COMMITTEE_3_CODES,
  CLARIFICATION_STATUSES,
  CommitteeType,
} from '../committee-clarifications.constants';

export class ClarificationInputDto {
  @IsString()
  @IsIn([...COMMITTEE_1_CODES, ...COMMITTEE_2_CODES, ...COMMITTEE_3_CODES])
  unique_code: string;

  @IsString()
  @IsOptional()
  user_answer?: string;

  @IsString()
  @IsIn(CLARIFICATION_STATUSES)
  @IsOptional()
  status?: string;
}

export class CreateCommitteeClarificationDto {
  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  @IsNotEmpty()
  risk_level: 'low' | 'medium' | 'high';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClarificationInputDto)
  @IsOptional()
  clarifications?: ClarificationInputDto[];
}
