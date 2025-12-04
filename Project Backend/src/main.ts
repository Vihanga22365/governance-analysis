import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Serve static files from documents directory
  app.useStaticAssets(join(__dirname, '..', 'documents'), {
    prefix: '/documents/',
  });

  await app.listen(process.env.PORT ?? 8353);
  const host = process.env.BACKEND_HOST || 'localhost';
  const port = process.env.PORT ?? 8353;
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
