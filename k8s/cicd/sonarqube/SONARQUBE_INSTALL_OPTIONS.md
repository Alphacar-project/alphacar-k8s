# SonarQube 설치 방법 비교

## 현재 상황

- Jenkins: systemd 서비스로 설치됨 (apt install jenkins)
- Docker: 설치되지 않음
- OS: Ubuntu 24.04

## 설치 방법 비교

### 방법 1: 직접 설치 (systemd 서비스) ⭐ 권장 (현재 상황)

**Jenkins와 동일한 방식으로 설치**

**장점:**
- Jenkins와 설치 방식 통일 (관리 일관성)
- Docker 설치 불필요
- 시스템 서비스로 관리 (systemctl)
- 리소스 효율적 (Docker 오버헤드 없음)

**단점:**
- 설정이 조금 더 복잡
- 업그레이드가 수동

**설치 절차:**
1. PostgreSQL 설치 (또는 내장 H2 사용)
2. SonarQube 다운로드 및 설치
3. systemd 서비스 설정
4. 포트 및 보안 설정

### 방법 2: Docker로 설치

**장점:**
- 설정이 간단
- 격리된 환경
- 업그레이드/제거 쉬움

**단점:**
- Docker 설치 필요
- Docker 오버헤드 (약간의 메모리/CPU 추가 사용)
- Jenkins와 설치 방식이 다름

## 권장사항

### 현재 상황에서는 **방법 1 (직접 설치)** 권장

**이유:**
1. ✅ Jenkins도 systemd로 설치했으니 일관성 유지
2. ✅ Docker 설치 불필요 (추가 작업 없음)
3. ✅ 리소스 효율적 (8GB RAM 환경에서 유리)
4. ✅ 시스템 서비스로 안정적 관리

## 설치 옵션 상세

### 옵션 1-A: 직접 설치 + 내장 H2 (간단)

```bash
# 1. Java 확인 (이미 설치됨)
java -version

# 2. SonarQube 다운로드 및 설치
wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-10.6.1.77163.zip
unzip sonarqube-*.zip
sudo mv sonarqube-* /opt/sonarqube

# 3. systemd 서비스 설정
# 4. 서비스 시작
```

**장점:** 가장 간단 (PostgreSQL 불필요)  
**단점:** 프로덕션 환경에 부적합

### 옵션 1-B: 직접 설치 + PostgreSQL (프로덕션)

```bash
# 1. PostgreSQL 설치
sudo apt install postgresql -y

# 2. SonarQube용 DB 및 사용자 생성
sudo -u postgres psql
CREATE DATABASE sonar;
CREATE USER sonar WITH PASSWORD 'sonar';
GRANT ALL PRIVILEGES ON DATABASE sonar TO sonar;

# 3. SonarQube 설치 및 설정
# 4. systemd 서비스 설정
```

**장점:** 프로덕션 환경에 적합  
**단점:** PostgreSQL 설치 필요

### 옵션 2: Docker 설치 (Docker 설치 필요)

```bash
# 1. Docker 설치
sudo apt install docker.io docker-compose -y

# 2. Docker Compose로 설치
# docker-compose.yml 파일 작성 및 실행
```

**장점:** 간단하고 빠름  
**단점:** Docker 설치 필요, Jenkins와 방식이 다름

## 최종 추천

### 현재 상황: **옵션 1-A (직접 설치 + 내장 H2)** ⭐

**이유:**
1. Jenkins와 동일한 설치 방식
2. Docker 설치 불필요
3. 빠르게 시작 가능
4. 개발/테스트 환경에 적합

**나중에 필요하면:**
- PostgreSQL로 마이그레이션 가능
- 또는 Docker로 재설치 가능

## 결론

**SonarQube는 Docker로 설치할 필요 없습니다!**

Jenkins처럼 systemd 서비스로 직접 설치하는 것을 권장합니다.

