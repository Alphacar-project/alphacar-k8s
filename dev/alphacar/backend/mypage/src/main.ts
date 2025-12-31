// 1️⃣ [필수] Tracing 설정을 맨 위에서 import 합니다.
import { setupTracing } from './tracing';

// 2️⃣ [필수] bootstrap 함수 밖에서, 즉시 실행하여 NestJS 로딩 전에 Hooking 하도록 합니다.
const serviceName = process.env.SERVICE_NAME || 'mypage-backend';
setupTracing(serviceName);

// 3️⃣ 그 다음 NestJS 및 앱 관련 모듈을 import 합니다.
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Tracing은 이미 위에서 초기화되었습니다.

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    // FE 주소 허용 (현재 환경: alphacar.cloud)
    origin: [
      'https://alphacar.cloud',
      'https://www.alphacar.cloud',
      /^https:\/\/alphacar\.cloud(:[0-9]+)?$/,  // alphacar.cloud (포트 포함)
      /^https:\/\/www\.alphacar\.cloud(:[0-9]+)?$/,  // www.alphacar.cloud (포트 포함)
      /^https:\/\/.*\.ngrok-free\.dev$/,  // 모든 ngrok 도메인 허용
      /^https:\/\/.*\.ngrok\.io$/,        // ngrok.io 도메인도 허용
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3006;

  // 3006 포트로 열고 0.0.0.0 바인딩 (IP 접속 문제 해결)
  await app.listen(port, '0.0.0.0');
  
  console.log(`${serviceName} is running on port ${port}`);
}
bootstrap();
