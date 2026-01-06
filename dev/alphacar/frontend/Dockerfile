# 0. 공통 베이스: npm을 최신으로 올려서 취약점 줄이기
FROM node:20-alpine AS base
WORKDIR /app

# 🔹 여기서 전역 npm을 최신으로 올림 (cross-spawn / glob / brace-expansion 같이 올라감)
RUN npm install -g npm@latest

# 1. 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# 2. 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# npm config 설정: Next.js가 자동으로 패키지를 설치할 때 --legacy-peer-deps 사용
RUN npm config set legacy-peer-deps true
# 빌드 시점 환경변수 (ARG는 빌드 시점에만 사용 가능)
ARG NEXT_PUBLIC_KAKAO_REST_API_KEY
ARG NEXT_PUBLIC_KAKAO_MAP_API_KEY
ENV NEXT_PUBLIC_KAKAO_REST_API_KEY=${NEXT_PUBLIC_KAKAO_REST_API_KEY}
ENV NEXT_PUBLIC_KAKAO_MAP_API_KEY=${NEXT_PUBLIC_KAKAO_MAP_API_KEY}
RUN npm run build

# 3. 실행
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]

