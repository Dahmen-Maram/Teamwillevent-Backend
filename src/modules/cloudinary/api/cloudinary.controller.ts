import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,

  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Express } from 'express';
import { CloudinaryService } from './cloudinary.service';
import { UserService } from 'src/modules/user/api/user.service';

@Controller('upload')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UserService,
  ) {}

  @Post(':id/upload-avatar')
@UseInterceptors(FileInterceptor('file'))
async uploadAvatar(
  @Param('id') userId: string, // ✅ PAS ParseIntPipe
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
  }

  const avatarUrl = await this.cloudinaryService.uploadFromBuffer(file);
  await this.usersService.updateAvatarUrl(userId, avatarUrl);

  return { avatarUrl };
}
 @Post('event-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEventImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Aucun fichier fourni', HttpStatus.BAD_REQUEST);
    }

    try {
      const imageUrl = await this.cloudinaryService.uploadFromBuffer(file);
      return { imageUrl };
    } catch (err) {
        console.error('Erreur lors de l’upload de l’image', err);
      throw new HttpException('Erreur lors de l’upload', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('chat-file')
@UseInterceptors(FileInterceptor('file'))
async uploadChatFile(@UploadedFile() file: Express.Multer.File) {
  if (!file) {
    throw new HttpException('Aucun fichier fourni', HttpStatus.BAD_REQUEST);
  }

  try {
    const chatUrl = await this.cloudinaryService.uploadFromBuffer(file, 'chat');
    return { url: chatUrl };
  } catch (error) {
    console.error('Erreur lors de l’upload du fichier de chat :', error);
    throw new HttpException('Échec de l’upload du fichier', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

}
