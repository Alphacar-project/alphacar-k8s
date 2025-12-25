// kevin@devserver:~/alphacar/backend/main/src/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    const password = this.configService.get<string>('REDIS_PASSWORD');
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1', // 기본값 추가
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: password ? password : undefined,
      retryStrategy: (times) => {
        // 재연결 시도: 최대 10번, 최대 3초 대기
        const delay = Math.min(times * 50, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    // 연결 이벤트 핸들링
    this.client.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    this.client.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
    });

    this.client.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      console.log(`[Redis] Reconnecting in ${delay}ms`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  // [기능 1] 최근 본 차량 저장 (ZSET 사용)
  async addRecentView(userId: string, vehicleId: string): Promise<void> {
    try {
      const key = `recent_views:${userId}`;
      const score = Date.now(); 

      // 연결 상태 확인 및 재연결 시도
      if (this.client.status !== 'ready') {
        console.warn('[Redis] Connection not ready, attempting to reconnect...');
        await this.client.connect();
      }

      // 이미 있으면 점수(시간)만 업데이트, 없으면 추가
      await this.client.zadd(key, score, vehicleId);

      // 최신 10개 유지 (오래된 것 삭제)
      const count = await this.client.zcard(key);
      if (count > 10) {
        // 점수(시간)가 낮은 순으로 삭제
        await this.client.zremrangebyrank(key, 0, count - 11);
      }

      await this.client.expire(key, 60 * 60 * 24); // 1일 유지
      console.log(`[Main-Redis] Added history: User=${userId}, Vehicle=${vehicleId}`);
    } catch (error) {
      console.error('[Redis] Error adding recent view:', error);
      // 에러 발생 시 조용히 실패 (500 에러 방지)
    }
  }

  // [기능 2] 목록 조회
  async getRecentViews(userId: string): Promise<string[]> {
    try {
      const key = `recent_views:${userId}`;
      // 연결 상태 확인 및 재연결 시도
      if (this.client.status !== 'ready') {
        console.warn('[Redis] Connection not ready, attempting to reconnect...');
        await this.client.connect();
      }
      return await this.client.zrevrange(key, 0, -1);
    } catch (error) {
      console.error('[Redis] Error getting recent views:', error);
      // 연결 오류 시 빈 배열 반환 (에러 대신 빈 결과 반환)
      return [];
    }
  }

  // ✅ [기능 3] 개수 조회 (새로 추가)
  async getHistoryCount(userId: string): Promise<number> {
    try {
      const key = `recent_views:${userId}`;
      // 연결 상태 확인 및 재연결 시도
      if (this.client.status !== 'ready') {
        console.warn('[Redis] Connection not ready, attempting to reconnect...');
        await this.client.connect();
      }
      return await this.client.zcard(key);
    } catch (error) {
      console.error('[Redis] Error getting history count:', error);
      // 연결 오류 시 0 반환 (에러 대신 빈 결과 반환)
      return 0;
    }
  }
}
