import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async createMessage(@Body() body: { userId: string; eventId: string; content: string }) {
    return this.chatService.saveMessage(body.userId, body.eventId, body.content);
  }
  @Get('count')
countMessages() {
  return this.chatService.countAll();   // { count: 1234 }
}
  
}
