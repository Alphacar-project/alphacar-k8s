# 1단계: 빌드 스테이지
FROM node:20-alpine AS builder
# 테스트: community 필터 테스트 (2024-01-02)
# 테스트: Jenkins 필터 확인용 주석 (2024-01-01)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 네트워크 안정성 설정
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5

# 1. 패키지 파일들 먼저 복사 (캐시 활용)
COPY package*.json ./

# 2. 의존성 설치
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit

# 3. 전역 도구 설치
RUN npm install -g @nestjs/cli

# 4. 소스 코드 복사
COPY . .

# 5. 빌드 수행
RUN nest build

# 2단계: 실행 스테이지
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 6. 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
