# glibc 기반 이미지 사용 (Alpine 대신)
FROM node:20-slim
# 테스트: JSONPath 표현식 수정 후 테스트 (2024-01-02)

# 필요한 시스템 라이브러리 설치
RUN apt-get update && apt-get install -y \
    libgomp1 \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 런타임에 필요한mongodb와ts-node 도구를 명시적으로 설치 
RUN npm install mongodb ts-node typescript

# 소스 코드 복사 (aichat 디렉토리 전체)
COPY . .

# 빌드 실행 (aichat만 빌드하므로 APP_NAME 불필요)
RUN npm run build

# 프로덕션 의존성만 유지 (선택사항)
# RUN npm prune --production

# 벡터 스토어 디렉토리 생성
RUN mkdir -p /app/vector_store

# 포트 노출
EXPOSE 4000

# 애플리케이션 실행
CMD ["node", "dist/src/main.js"]
