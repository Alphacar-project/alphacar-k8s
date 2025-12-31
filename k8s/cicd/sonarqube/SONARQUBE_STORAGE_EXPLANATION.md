# SonarQube 데이터 저장 방식 설명

## 개념 정리

### PV/PVC vs PostgreSQL

**PV/PVC (PersistentVolume/PersistentVolumeClaim)**
- Kubernetes의 **영구 저장소 관리 방식**
- 데이터를 영구적으로 저장하기 위한 저장소
- SonarQube의 데이터(프로젝트 정보, 분석 결과 등)를 저장

**PostgreSQL**
- **데이터베이스 선택 옵션**
- SonarQube가 데이터를 저장할 때 사용하는 DB
- 두 가지 옵션:
  1. **내장 H2 데이터베이스** (기본값, 개발/테스트용)
  2. **외부 PostgreSQL** (프로덕션 권장)

## Kubernetes 환경 (기존)

### 현재 설정 확인
- `sonarqube-install.yaml`을 보면 **PV/PVC를 사용하지 않음**
- **내장 H2 데이터베이스 사용** (PostgreSQL 미사용)
- Pod이 재시작되면 데이터가 사라질 수 있음 (영구 저장소 없음)

### PV/PVC를 사용했다면?
```yaml
# 예시 (실제로는 사용하지 않았지만, 만약 사용했다면)
volumeMounts:
  - name: sonarqube-data
    mountPath: /opt/sonarqube/data
volumes:
  - name: sonarqube-data
    persistentVolumeClaim:
      claimName: sonarqube-pvc
```

## AWS EC2 환경

### 옵션 1: Docker 볼륨 사용 (PV/PVC와 유사, 권장)

**내장 H2 데이터베이스 + Docker 볼륨**

```yaml
# docker-compose.yml
services:
  sonarqube:
    image: sonarqube:lts-community
    volumes:
      - sonarqube-data:/opt/sonarqube/data    # 데이터 영구 저장
      - sonarqube-extensions:/opt/sonarqube/extensions
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"

volumes:
  sonarqube-data:      # Docker 볼륨 (PV/PVC와 유사)
  sonarqube-extensions:
```

**장점:**
- Kubernetes의 PV/PVC와 유사한 개념
- 간단하게 설정 가능
- 내장 H2 사용 (추가 DB 설치 불필요)

**단점:**
- 내장 H2는 프로덕션 환경에서 권장되지 않음
- 대규모 프로젝트에는 부적합

### 옵션 2: PostgreSQL 사용 (프로덕션 권장)

**외부 PostgreSQL + Docker 볼륨**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar

  sonarqube:
    image: sonarqube:lts-community
    volumes:
      - sonarqube-data:/opt/sonarqube/data
      - sonarqube-extensions:/opt/sonarqube/extensions
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
    depends_on:
      - postgres

volumes:
  postgres-data:       # PostgreSQL 데이터
  sonarqube-data:      # SonarQube 데이터
  sonarqube-extensions:
```

**장점:**
- 프로덕션 환경에 적합
- 대규모 프로젝트 처리 가능
- 데이터 안정성 향상

**단점:**
- 설정이 약간 더 복잡
- PostgreSQL 컨테이너 추가 필요 (메모리 사용 증가)

## 비교표

| 환경 | 저장소 (PV/PVC 역할) | 데이터베이스 | 권장 상황 |
|------|---------------------|-------------|----------|
| **Kubernetes (기존)** | 없음 (임시 저장) | 내장 H2 | 개발/테스트 |
| **Kubernetes (PV/PVC)** | PV/PVC | 내장 H2 또는 PostgreSQL | 프로덕션 |
| **EC2 (옵션 1)** | Docker 볼륨 | 내장 H2 | 개발/테스트, 소규모 |
| **EC2 (옵션 2)** | Docker 볼륨 | PostgreSQL | 프로덕션, 대규모 |

## 권장사항

### 현재 상황 (Jenkins + SonarQube 함께 운영)

**옵션 1 (Docker 볼륨 + 내장 H2) 추천**
- Kubernetes 환경과 유사하게 구성
- 설정이 간단
- 8GB RAM에서 Jenkins와 함께 운영하기 적합
- 소규모/중규모 프로젝트에 충분

**옵션 2 (PostgreSQL) 사용 시기**
- 프로덕션 환경
- 대규모 프로젝트 다수
- 높은 가용성 필요 시
- AWS RDS PostgreSQL 사용 권장 (EC2가 아닌 별도 서비스)

## 결론

**PV/PVC = 영구 저장소 (데이터 저장 공간)**
**PostgreSQL = 데이터베이스 선택 사항**

EC2에서는:
- **Docker 볼륨**이 PV/PVC 역할을 함
- **내장 H2** 또는 **PostgreSQL** 중 선택 가능
- Kubernetes에서 PV/PVC를 사용했다면, EC2에서는 Docker 볼륨 사용
- PostgreSQL은 필수가 아니라 선택 사항

