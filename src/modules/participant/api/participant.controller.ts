// src/participants/participants.controller.ts
import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';

import { ParticipantsService } from './participant.service';
import { CreateParticipantDto } from '../dto/create-participant.dto';
import { Participant } from 'src/common/models/types/participant.entity';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  async register(@Body() dto: CreateParticipantDto): Promise<Participant> {
    return this.participantsService.create(dto);
  }

  @Get()
  async findAll(): Promise<Participant[]> {
    return this.participantsService.findAll();
  }

  @Get('event/:eventId')
  async findByEvent(@Param('eventId') eventId: string): Promise<Participant[]> {
    const cleanId = eventId.trim();
    return this.participantsService.findByEvent(cleanId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.participantsService.remove(id);
  }
  @Delete('event/:eventId/user/:userId')
async removeByEventAndUser(
  @Param('eventId') eventId: string,
  @Param('userId') userId: string,
): Promise<void> {
  return this.participantsService.removeByEventAndUser(eventId.trim(), userId.trim())
}
@Get('user/:userId')
async getByUser(@Param('userId') userId: string): Promise<Participant[]> {
  return this.participantsService.findByUser(userId);
}


}
