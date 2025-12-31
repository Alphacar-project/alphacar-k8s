# Monitoring Analysis 개발 코드

이 디렉토리는 모니터링 분석 시스템의 개발 코드를 포함합니다.

## 구조

```
dev/monitoring-analysis/
├── frontend/          # 프론트엔드 (HTML/JS)
│   ├── index.html     # 대시보드 HTML/JS 코드
│   ├── Dockerfile     # 프론트엔드 이미지 빌드 파일
│   └── .dockerignore
├── backend/           # 백엔드 (Node.js)
│   ├── server.js      # 백엔드 서버 코드
│   ├── Dockerfile     # 백엔드 이미지 빌드 파일
│   └── .dockerignore
├── build.sh           # 자동 빌드 스크립트
└── README.md
```

## 빠른 시작

### 자동 빌드 (권장)

```bash
cd dev/monitoring-analysis
./build.sh 1.0.0
```

이 스크립트는 프론트엔드와 백엔드 이미지를 모두 빌드합니다.

### 수동 빌드

#### 프론트엔드 이미지 빌드

```bash
cd dev/monitoring-analysis/frontend
docker build -t 192.168.0.169/bh/monitoring-analysis-frontend:1.0.0 .
docker push 192.168.0.169/bh/monitoring-analysis-frontend:1.0.0
```

#### 백엔드 이미지 빌드

```bash
cd dev/monitoring-analysis/backend
docker build -t 192.168.0.169/bh/monitoring-analysis-backend:1.0.0 .
docker push 192.168.0.169/bh/monitoring-analysis-backend:1.0.0
```

## 배포

이미지 빌드 및 푸시 후:

```bash
# 프론트엔드 업데이트
kubectl set image deployment/monitoring-analysis-frontend \
  frontend=192.168.0.169/bh/monitoring-analysis-frontend:1.0.0 \
  -n apc-obsv-ns

# 백엔드 업데이트
kubectl set image deployment/monitoring-analysis-backend \
  backend=192.168.0.169/bh/monitoring-analysis-backend:1.0.0 \
  -n apc-obsv-ns
```

또는 deployment.yaml 파일의 이미지 태그를 직접 수정 후:

```bash
kubectl apply -f k8s/monitoring-analysis/frontend/deployment.yaml
kubectl apply -f k8s/monitoring-analysis/backend/deployment.yaml
```

## 개발 워크플로우

1. 코드 수정: `dev/monitoring-analysis/` 디렉토리에서 코드 수정
2. 이미지 빌드: `./build.sh <버전>` 실행
3. 이미지 푸시: `docker push` 명령어로 레지스트리에 푸시
4. 배포 업데이트: `kubectl set image` 또는 `kubectl apply`로 배포
