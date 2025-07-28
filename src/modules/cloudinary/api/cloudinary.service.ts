// src/modules/cloudinary/api/cloudinary.service.ts

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ✅ Fonction générique pour tout type de fichier (image, vidéo)
  async uploadFromBuffer(file: Express.Multer.File, folder = 'avatars'): Promise<string> {
    if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Fichier invalide.');
    }

    const isVideo = file.mimetype.startsWith('video/');

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? 'video' : 'image',
          transformation: !isVideo
            ? [{ width: 500, height: 500, crop: 'limit' }]
            : undefined,
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message || 'Erreur Cloudinary'));
          }
          if (!result) {
            return reject(new InternalServerErrorException('Aucun résultat retourné par Cloudinary.'));
          }
          resolve(result.secure_url);
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }
}
