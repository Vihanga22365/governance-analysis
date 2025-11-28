import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @IsUUID('4')
  @IsNotEmpty()
  uuid: string;
}
