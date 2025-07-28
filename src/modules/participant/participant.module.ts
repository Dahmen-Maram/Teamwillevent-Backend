// src/participants/participants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from 'src/common/models/types/participant.entity';
import { UserModule } from '../user/user.module';
import { EventsModule } from '../event/event.module';
import { ParticipantsService } from './api/participant.service';
import { ParticipantsController } from './api/participant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Participant]), UserModule, EventsModule],
  providers: [ParticipantsService],
  controllers: [ParticipantsController],
})
export class ParticipantsModule {}
