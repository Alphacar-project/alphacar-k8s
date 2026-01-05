# 빌드 단계 (필요한 도구만)
FROM node:18-alpine AS builder

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package.json .
RUN npm install --production

# 서버 코드 및 aiops 모듈 복사
COPY server.js .
COPY aiops ./aiops

# 실행 단계 (최소한의 런타임만)
FROM node:18-alpine

# kubectl 설치 (자동 대응 시나리오 실행용)
RUN apk --no-cache upgrade && \
    apk --no-cache add --virtual .deps dumb-init wget curl && \
    wget -O /usr/local/bin/kubectl https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# 빌드 단계에서 서버 코드, aiops 모듈, node_modules 복사
COPY --from=builder /app/server.js .
COPY --from=builder /app/aiops ./aiops
COPY --from=builder /app/node_modules ./node_modules

# 포트 노출
EXPOSE 5000

# 환경 변수
ENV PORT=5000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# dumb-init으로 실행 (시그널 처리 개선)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
