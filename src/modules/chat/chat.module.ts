import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/common/models/types/message.entity';
import { Participant } from 'src/common/models/types/participant.entity';
import { User } from 'src/common/models/types/user.entity';
import { Event } from 'src/common/models/types/event.entity';  // <-- Ajoute cet import !
import { ChatService } from './api/chat.service';
import { ChatGateway } from './api/chat.gateway';
import { ChatController } from './api/chat.controller';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Event, Participant]), 
    NotificationModule,
    MailModule// Maintenant correct
  ],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
