// src/task/task.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Task } from 'src/common/models/types/task.entity';
import { Event } from 'src/common/models/types/event.entity';
import { User } from 'src/common/models/types/user.entity';
import { TaskService } from './api/task.service';
import { TaskController } from './api/task.controller';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskScheduler } from './api/task.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Event, User]),
    ScheduleModule.forRoot(),
    MailModule,
    NotificationModule
  ],
  providers: [TaskService, TaskScheduler],
  controllers: [TaskController],
})
export class TaskModule {}
