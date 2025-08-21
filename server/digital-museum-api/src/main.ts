import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许前端本地开发端口访问
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  /**
   * 映射静态目录：
   * 将 {项目根}/uploads 作为静态资源目录，挂载到 /uploads 前缀
   * 注意：用 process.cwd()，避免编译到 dist 后 __dirname 变化导致路径找不到
   */
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  await app.listen(3000);
  console.log('[digital-museum-api] listening on http://localhost:3000');
  console.log('[static] /uploads =>', uploadsDir);
}
bootstrap();
