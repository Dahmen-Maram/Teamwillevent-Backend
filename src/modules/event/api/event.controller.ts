import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { DataSource, Repository } from 'typeorm';

import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventsService } from './event.service';
import { UserRole } from 'src/common/enum/role.enum';
import { Event } from 'src/common/models/types/event.entity';


@Controller('events')
export class EventsController {
  private eventRepository: Repository<Event>;

  constructor(
    private readonly eventsService: EventsService,
    private readonly dataSource: DataSource,
  ) {
    this.eventRepository = this.dataSource.getRepository(Event);
    console.log('EventsController initialized');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONSABLE)
  @Delete(':id/image')
  async deleteEventImage(@Param('id') id: string): Promise<void> {
    const event = await this.eventsService.findOne(id);
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    await this.eventsService.deleteEventImage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESPONSABLE)
@Post()
async create(
  @Body() createEventDto: CreateEventDto,
  @Request() req: { user: { sub: string } },
): Promise<Event> {
  return this.eventsService.create(createEventDto, req.user.sub);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESPONSABLE)
@Put(':id/sheet')
async updateSheetId(
  @Param('id') id: string,
  @Body('sheetId') sheetId: string,
): Promise<Event> {
  const event = await this.eventsService.findOne(id);
  if (!event) {
    throw new NotFoundException(`Event with ID "${id}" not found`);
  }

  return this.eventsService.update(id, { sheetId });
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESPONSABLE)
@Delete(':id/sheet')
async removeSheetId(@Param('id') id: string): Promise<Event> {
  const event = await this.eventsService.findOne(id);
  if (!event) {
    throw new NotFoundException(`Event with ID "${id}" not found`);
  }

  return this.eventsService.update(id, { sheetId: null });
}

@Get(':id/sheet')
async getSheetId(@Param('id') id: string): Promise<{ sheetId: string | null }> {
  const event = await this.eventsService.findOne(id);
  if (!event) {
    throw new NotFoundException(`Event with ID "${id}" not found`);
  }

  return { sheetId: event.sheetId || null };
}

 
@UseGuards(JwtAuthGuard)
@Get()
async findAll(@Request() req: { user: { sub: string } }): Promise<Event[]> {
  const userId = req.user.sub;
  return this.eventsService.findAll(userId);
}
@Post(':id/add-participant/:userId')
async addParticipant(
  @Param('id') eventId: string,
  @Param('userId') userId: string,
  @Req() req: any, // Assure-toi que req.user.id est dispo
) {
  await this.eventsService.addParticipantToEvent(eventId, userId, req.user.id);
  return { message: 'Participant ajouté avec succès.' };
}



  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONSABLE)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: { user: { sub: string } },
  ): Promise<Event> {
    const cleanId = id.trim();

    const event = await this.eventRepository.findOne({
      where: { id: cleanId },
      relations: ['organisateur'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${cleanId} not found`);
    }

    if (!event.organisateur || typeof event.organisateur.id !== 'string') {
      throw new InternalServerErrorException(
        `Organizer not found for event ${cleanId}`,
      );
    }

   

    return this.eventsService.update(cleanId, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESPONSABLE)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ): Promise<void> {
    const cleanId = id.trim();

    const event = await this.eventRepository.findOne({
      where: { id: cleanId },
      relations: ['organisateur'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${cleanId} not found`);
    }

    if (!event.organisateur || typeof event.organisateur.id !== 'string') {
      throw new InternalServerErrorException(
        `Organizer not found for event ${cleanId}`,
      );
    }

    // // if (req.user.sub !== event.organisateur.id) {
    // //   throw new UnauthorizedException(
    // //     'Seul l’organisateur peut supprimer cet événement',
    // //   );
    // }

    return this.eventsService.remove(cleanId);
  }


  /*@Post('test-event')
  async testEvent(@Body() createEventDto: CreateEventDto): Promise<void> {
    const event = await this.eventsService.create(createEventDto);
    console.log('Test event triggered:', event);
  }*/
}
