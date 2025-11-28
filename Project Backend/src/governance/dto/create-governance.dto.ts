import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RelevantDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsString()
  @IsNotEmpty()
  documentUrl: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateGovernanceDto {
  @IsUUID('4')
  @IsNotEmpty()
  user_chat_session_id: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  use_case_title: string;

  @IsString()
  @IsNotEmpty()
  use_case_description: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RelevantDocumentDto)
  relevant_documents?: RelevantDocumentDto[];
}
