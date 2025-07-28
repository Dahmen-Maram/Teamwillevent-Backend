// src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/common/models/types/notification.entity';
import { NotificationService } from './api/notification.service';
import { NotificationController } from './api/notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationService],
    controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
