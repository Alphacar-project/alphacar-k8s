# EC2 인스턴스 현재 상태 분석

## 확인된 정보

### 1. 메모리 상태 ✅
```
총 메모리: 7.6GB
사용 중:   869MB
여유:      6.6GB
```
**결론**: SonarQube 설치 가능 (충분한 메모리)

### 2. 디스크 상태 ✅
```
총 디스크: 8.7GB
사용 중:   3.3GB (38%)
여유:      5.4GB
```
**결론**: 디스크 공간 충분

### 3. Docker 상태 ❌
```
Docker가 설치되어 있지 않음
```
**필요**: Docker 및 Docker Compose 설치 필요

### 4. Jenkins 상태 ⚠️
- Docker로 설치되지 않음
- netstat에서 jenkins 프로세스 확인 안 됨
- Jenkins 주소: http://13.125.236.171:8080/
- **확인 필요**: Jenkins가 어떻게 설치되어 있는지

## 다음 단계

### 1. Jenkins 설치 방식 확인

```bash
# systemd 서비스로 설치되었는지 확인
systemctl status jenkins

# 또는 다른 방식으로 실행 중인지 확인
ps aux | grep jenkins

# 포트 8080 사용 확인
sudo netstat -tlnp | grep 8080
# 또는
sudo ss -tlnp | grep 8080
```

### 2. Docker 설치 (SonarQube 설치를 위해 필요)

SonarQube를 Docker로 설치하려면 Docker가 필요합니다.

**설치 방법:**
```bash
# 방법 1: apt로 설치 (권장)
sudo apt update
sudo apt install -y docker.io docker-compose

# Docker 서비스 시작
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (sudo 없이 사용)
sudo usermod -aG docker $USER

# 재로그인 필요 (또는 아래 명령어로 그룹 적용)
newgrp docker
```

### 3. SonarQube 설치 준비

Docker 설치 후:
- Docker Compose로 SonarQube 설치
- 포트 9000 사용
- Docker 볼륨으로 데이터 영구 저장

## 현재 상태 요약

✅ **설치 가능**: 메모리와 디스크 충분
❌ **Docker 필요**: Docker 설치 필요
⚠️ **Jenkins 확인**: Jenkins 설치 방식 확인 필요

## 권장 작업 순서

1. Jenkins 설치 방식 확인
2. Docker 및 Docker Compose 설치
3. SonarQube Docker Compose 파일 작성
4. SonarQube 설치 및 실행

