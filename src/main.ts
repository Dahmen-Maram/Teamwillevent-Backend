import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  // ✅ Enable CORS for requests from frontend (http://localhost:3001)
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true, // If using cookies or Authorization headers
  });

  console.log('Application is starting...');
  console.log('AuthController should be registered for /auth/login');
  console.log('Application is running on port 3000');

  await app.listen(3000);
}
bootstrap();
