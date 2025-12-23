# 1단계: 빌드 스테이지
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 네트워크 안정성 설정
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5

# 1. 패키지 파일들 먼저 복사 (캐시 활용)
COPY package*.json ./

# 2. 의존성 설치 (여기서 nest cli를 포함한 모든 패키지가 설치됩니다)
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit

# 3. 소스 코드 복사
COPY . .

# 4. 빌드 수행 (전역 설치 대신 npx 또는 로컬 바이너리 사용으로 네트워크 에러 방지)
RUN npx nest build

# 2단계: 실행 스테이지
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 5. 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
