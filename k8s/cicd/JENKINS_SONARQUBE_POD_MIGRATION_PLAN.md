# Jenkins & SonarQube Pod 전환 계획

## 목표

기존 systemd 서비스 → Kubernetes Pod로 전환
- Jenkins: Pod로 전환
- SonarQube: Pod로 설치

## 작업 순서

### Phase 1: k3s 설치 및 설정

1. EC2에 k3s 설치
2. kubectl 설정
3. 네임스페이스 생성

### Phase 2: Jenkins Pod 전환

1. 기존 Jenkins 데이터 백업
2. Jenkins Kubernetes 리소스 생성
3. 데이터 마이그레이션
4. Pod로 배포
5. 기존 systemd Jenkins 중지 (또는 제거)

### Phase 3: SonarQube Pod 설치

1. SonarQube Kubernetes 리소스 생성
2. PVC 생성 (데이터 영구 저장)
3. Pod로 배포
4. 초기 설정

### Phase 4: 설정 업데이트

1. Jenkinsfile에서 SonarQube URL 업데이트
2. 네트워크/보안 그룹 설정
3. 테스트

## 중요 사항

### Jenkins 데이터 백업 (중요!)

기존 Jenkins 데이터를 반드시 백업:

```bash
# Jenkins 홈 디렉토리 백업
sudo tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins
```

### 데이터 마이그레이션

Pod로 전환 시 PVC에 데이터 복사 필요

### 네트워크 설정

- Jenkins: 포트 8080
- SonarQube: 포트 9000
- NodePort 또는 LoadBalancer로 외부 노출

## 예상 시간

- k3s 설치: 10분
- Jenkins 전환: 30분
- SonarQube 설치: 20분
- 총 약 1시간

