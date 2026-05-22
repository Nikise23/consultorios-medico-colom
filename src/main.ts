import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
      
      // En producción, si el frontend se sirve desde el mismo dominio, permitir cualquier origen
      // (porque el frontend y el backend están en el mismo servidor)
      // También permitir los orígenes configurados explícitamente
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // En producción unificada, permitir el mismo dominio
        callback(null, true);
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
      // Permitir objetos JSON complejos (como el tema personalizado)
      skipMissingProperties: false,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  // En producción, servir archivos estáticos del frontend
  if (process.env.NODE_ENV === 'production') {
    // Usar process.cwd() para obtener la raíz del proyecto (más confiable que __dirname)
    const frontendPath = join(process.cwd(), 'frontend', 'dist');
    console.log('📁 Frontend path:', frontendPath);
    const express = require('express');
    
    // Servir archivos estáticos (JS, CSS, imágenes, etc.)
    app.use(express.static(frontendPath, {
      index: false, // No servir index.html automáticamente para rutas de API
    }));
    
    // Catch-all handler: servir index.html para todas las rutas que no sean API
    // Este middleware se ejecuta después de que NestJS haya intentado procesar las rutas
    // Si NestJS no manejó la ruta (no envió respuesta), servimos el index.html
    app.use((req, res, next) => {
      // Lista de rutas de API que NestJS maneja
      const apiRoutes = [
        '/auth',
        '/pacientes',
        '/atenciones',
        '/historias-clinicas',
        '/usuarios',
        '/medicos',
        '/pagos',
        '/public',
        '/health'
      ];
      
      const isApiRoute = apiRoutes.some(route => req.path.startsWith(route));
      
      // Si es una ruta de API, dejar que NestJS la maneje
      if (isApiRoute) {
        return next();
      }
      
      // Para todas las demás rutas (rutas del frontend), servir el index.html
      // Esto permite que React Router maneje el routing del frontend
      res.sendFile(join(frontendPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          if (!res.headersSent) {
            res.status(500).send('Error loading application');
          }
        }
      });
    });
  }

  const port = process.env.PORT || 3000;
  // Escuchar en todas las interfaces de red (0.0.0.0) para permitir acceso desde otros dispositivos
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend servido desde el mismo dominio`);
  } else {
    console.log(`🌐 Accesible desde la red local en: http://192.168.1.46:${port}`);
  }
}
bootstrap();



