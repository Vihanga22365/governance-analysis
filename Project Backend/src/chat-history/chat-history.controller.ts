import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { SaveChatHistoryDto } from './dto/save-chat-history.dto';

@Controller('api/chat-history')
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveChatHistory(@Body() saveChatHistoryDto: SaveChatHistoryDto) {
    return this.chatHistoryService.saveChatHistory(saveChatHistoryDto);
  }

  @Get(':governanceId')
  @HttpCode(HttpStatus.OK)
  async getChatHistory(@Param('governanceId') governanceId: string) {
    const data =
      await this.chatHistoryService.getChatHistoryByGovernanceId(governanceId);

    if (!data) {
      return {
        message: 'Chat history not found',
        data: null,
      };
    }

    return {
      message: 'Chat history retrieved successfully',
      data,
    };
  }
}
