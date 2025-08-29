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
  UploadedFile,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/common/models/types/user.entity';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateParticipantDto } from 'src/modules/participant/dto/create-participant.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as csv from 'csv-parser';
import { createReadStream } from 'fs';
import { UserRole } from 'src/common/enum/role.enum';

type CsvUser = {
  nom: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  position: string;
  location: string;
  address: string;
  motDePasse?: string; // optionnel, on remplace par défaut
};

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }): Promise<User> {
    return this.userService.findOne(req.user.sub);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }
@UseGuards(JwtAuthGuard)
@Delete('avatar')  // Pas de paramètre userId dans l'URL
async removeAvatar(@Request() req: { user: { sub: string } }) {
  await this.userService.removeAvatar(req.user.sub);
  return { message: 'Avatar supprimé avec succès' };
}
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }



  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(req.user.sub, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('participate')
  async participate(@Body() participateDto: CreateParticipantDto) {
    await this.userService.participate(
      participateDto.userId,
      participateDto.eventId,
    );
    return { message: 'Inscription à l’événement réussie' };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
 async uploadCSV(@UploadedFile() file: Express.Multer.File) {
  if (!file) throw new BadRequestException('Aucun fichier fourni');

  const users: CsvUser[] = [];
  const results: { email: string; status: string; reason?: string }[] = [];

  return new Promise((resolve, reject) => {
    createReadStream(file.path)
      .pipe(csv())
      .on('data', (row: CsvUser) => {
        users.push(row);
      })
      .on('end', async () => {
        for (const userData of users) {
          try {
            // Trouver la valeur correspondante dans l'enum UserRole (insensible à la casse)
            const roleValue = Object.values(UserRole).find(
              (r) => r.toLowerCase() === userData.role.toLowerCase(),
            );
            if (!roleValue) {
              throw new Error(`Role invalide: ${userData.role}`);
            }

            const user = await this.userService.create({
              nom: userData.nom,
              email: userData.email,
              motDePasse: 'teamwill', // mot de passe par défaut
              phone: userData.phone,
              role: roleValue,
              department: userData.department,
              position: userData.position,
              location: userData.location,
              address: userData.address,
            });

            results.push({ email: user.email, status: 'success' });
          } catch (err) {
            results.push({
              email: userData.email,
              status: 'failed',
              reason: err.message,
            });
          }
        }

        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}
}

