import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3001', 'http://10.94.85.1:3001'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o Postman)
      if (!origin) return callback(null, true);
      
      // Permitir cualquier origen en desarrollo (para acceso desde celular)
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // En producción, verificar origen
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Cambiar a false para permitir campos extra (se filtrarán automáticamente)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  const port = process.env.PORT || 3000;
  // Escuchar en todas las interfaces de red (0.0.0.0) para permitir acceso desde otros dispositivos
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`🌐 Accesible desde la red local en: http://192.168.1.46:${port}`);
}
bootstrap();



