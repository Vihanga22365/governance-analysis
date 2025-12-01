import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { CommitteeStatus } from './risk-analysis-response.dto';

export class UpdateCommitteeStatusDto {
  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsEnum(CommitteeStatus)
  @IsOptional()
  committee_1?: CommitteeStatus;

  @IsEnum(CommitteeStatus)
  @IsOptional()
  committee_2?: CommitteeStatus;

  @IsEnum(CommitteeStatus)
  @IsOptional()
  committee_3?: CommitteeStatus;
}
