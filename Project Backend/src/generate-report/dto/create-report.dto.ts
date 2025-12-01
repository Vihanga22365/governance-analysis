import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsString()
  @IsNotEmpty()
  report_content: string;
}
