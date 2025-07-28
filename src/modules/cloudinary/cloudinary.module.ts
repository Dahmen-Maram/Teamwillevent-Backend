// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './api/cloudinary.service';
import { CloudinaryController } from './api/cloudinary.controller';
import { UserModule } from '../user/user.module'; // 👈 importer le bon module

@Module({
  imports: [UserModule], // 👈 importer ici
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
