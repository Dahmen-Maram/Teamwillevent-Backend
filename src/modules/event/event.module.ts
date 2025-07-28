import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './api/event.service';
import { UserModule } from '../user/user.module';
import { EventCreatedListener } from './listeners/event-created.listener';
import { MailService } from 'src/common/utils/mail/mail.service';
import { EventsController } from './api/event.controller';
import { Event } from 'src/common/models/types/event.entity';
import { Notification } from 'src/common/models/types/notification.entity';

import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    UserModule,
    ConfigModule.forRoot(),
    NotificationModule,
  ],
  providers: [EventsService, EventCreatedListener, MailService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
