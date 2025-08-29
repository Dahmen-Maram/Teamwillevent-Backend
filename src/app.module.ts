import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ParticipantsModule } from './modules/participant/participant.module';
import { EventsModule } from './modules/event/event.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { SmsModule } from './modules/sms/sms.module';

// Ici on importe ChatModule (que tu dois créer)
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notification/notification.module';
import { Task } from './common/models/types/task.entity';
import { TaskModule } from './modules/task/task.module';
import { GoogleSheetModule } from './modules/googlesheet/googleSheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    EventsModule,
    ParticipantsModule,
    CloudinaryModule,
    SmsModule,
    ChatModule, 
    NotificationModule ,
    TaskModule,
    GoogleSheetModule// <-- ici, on importe le module ChatModule
  ],
})
export class AppModule {}
