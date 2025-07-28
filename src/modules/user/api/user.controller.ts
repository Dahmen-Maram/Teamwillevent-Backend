import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/common/models/types/user.entity';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateParticipantDto } from 'src/modules/participant/dto/create-participant.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 🔐 Get current authenticated user's profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }): Promise<User> {
    return this.userService.findOne(req.user.sub);
  }

  // 👤 Create a new user (e.g. admin creates user or registration)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  // 📄 Get all users
  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // 🔁 Update user by ID (admin use case)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  // ❌ Delete user by ID
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  // 👤 Update current logged-in user's profile (except password)
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(req.user.sub, updateUserDto);
  }

  // 📅 Allow user to participate in an event
  @UseGuards(JwtAuthGuard)
  @Post('participate')
  async participate(@Body() participateDto: CreateParticipantDto) {
    await this.userService.participate(
      participateDto.userId,
      participateDto.eventId,
    );
    return { message: 'Inscription à l’événement réussie' };
  }
}
