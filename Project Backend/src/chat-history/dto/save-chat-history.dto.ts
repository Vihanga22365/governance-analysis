import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SaveChatHistoryDto {
  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsUUID('4')
  @IsNotEmpty()
  user_chat_session_id: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;
}
