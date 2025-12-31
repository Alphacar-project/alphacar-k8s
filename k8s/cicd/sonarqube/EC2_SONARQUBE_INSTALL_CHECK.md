# EC2에 SonarQube 설치 전 확인 사항

## 현재 상황

- **EC2 인스턴스**: Jenkins가 설치된 EC2
- **호스트명**: `ubuntu@ip-172-31-35-146`
- **인스턴스 타입**: c5a.xlarge (4 vCPU, 8GB RAM)
- **OS**: Ubuntu 24.04

## SonarQube 설치 위치

✅ **네, 이 EC2 인스턴스에 SonarQube를 설치하면 됩니다!**

### 이유:
1. Jenkins와 SonarQube는 함께 사용하는 것이 일반적
2. 같은 인스턴스에 설치하면 네트워크 지연 최소화
3. 8GB RAM으로 충분히 운영 가능
4. 관리가 편리함

## 설치 전 확인 사항

### 1. 현재 리소스 사용량 확인

```bash
# 메모리 사용량 확인
free -h

# 디스크 사용량 확인
df -h

# 현재 실행 중인 프로세스 확인
docker ps
# 또는
systemctl list-units --type=service --state=running
```

### 2. Jenkins 설치 상태 확인

```bash
# Jenkins 확인
docker ps | grep jenkins
# 또는
systemctl status jenkins

# Jenkins 포트 확인
sudo netstat -tlnp | grep jenkins
# 또는
sudo ss -tlnp | grep jenkins
```

### 3. 포트 확인

SonarQube는 기본적으로 **포트 9000**을 사용합니다.

```bash
# 포트 9000이 사용 중인지 확인
sudo netstat -tlnp | grep 9000
# 또는
sudo ss -tlnp | grep 9000
```

### 4. Docker 설치 확인

SonarQube를 Docker로 설치할 예정이므로:

```bash
# Docker 설치 확인
docker --version
docker-compose --version

# Docker가 없으면 설치 필요
```

## 설치 방법 선택

### 옵션 1: Docker Compose로 설치 (권장)

**장점:**
- 간단하고 빠름
- Jenkins와 함께 관리 용이
- 업그레이드/제거 쉬움

**구조:**
```
/opt/sonarqube/
├── docker-compose.yml
└── volumes/
    ├── sonarqube-data/
    └── sonarqube-extensions/
```

### 옵션 2: 직접 설치

**장점:**
- 더 세밀한 제어 가능

**단점:**
- 설정이 복잡
- 업그레이드가 어려움

## 예상 리소스 사용량

```
총 8GB RAM:
├── Ubuntu OS:              ~1GB
├── Jenkins:                ~1-2GB (빌드 시)
├── SonarQube:              ~2-4GB (분석 실행 시)
├── PostgreSQL (선택사항):   ~500MB-1GB
└── 여유 공간:              ~1-2GB
```

## 설치 위치 권장

```bash
# 권장 디렉토리 구조
/opt/
├── jenkins/          # Jenkins (이미 설치됨)
└── sonarqube/        # SonarQube (새로 설치)
    ├── docker-compose.yml
    └── volumes/
```

또는

```bash
/home/ubuntu/
├── jenkins/          # Jenkins
└── sonarqube/        # SonarQube
```

## 다음 단계

1. ✅ 현재 리소스 확인 (위 명령어 실행)
2. ✅ Docker 설치 확인
3. ✅ 포트 9000 사용 가능 여부 확인
4. ✅ 설치 디렉토리 생성
5. ⏸️ SonarQube 설치 (사용자 요청 시)

## 주의사항

- **보안 그룹 설정**: EC2 보안 그룹에서 포트 9000 인바운드 허용 필요
- **Jenkinsfile 수정**: SonarQube URL을 새 주소로 변경 필요
  - 기존: `http://192.168.0.170:32000`
  - 변경: `http://43.201.105.210:9000` 또는 `http://localhost:9000` (같은 EC2 내부)

