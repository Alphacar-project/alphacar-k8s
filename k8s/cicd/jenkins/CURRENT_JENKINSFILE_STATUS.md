# 현재 Jenkinsfile CI/CD 단계 현황

## 현재 구성된 단계

### CI (Continuous Integration) 단계 ✅

1. **Stage 1: Prepare**
   - 워크스페이스 정리
   - 소스 코드 체크아웃
   - 버전 정보 생성
   - Trivy 설치

2. **Stage 2: Security & Analysis**
   - SonarQube 코드 품질 분석
   - Trivy 취약점 스캔

3. **Stage 3: Docker Build & Push to ECR**
   - Docker 이미지 빌드
   - AWS ECR에 이미지 푸시

### CD (Continuous Deployment) 단계 ⚠️ 부분적

4. **Stage 4: Update Manifest**
   - Kubernetes 매니페스트 파일 업데이트
   - Git에 커밋 및 푸시
   - **⚠️ 실제 Kubernetes 배포는 수행하지 않음**

## 현재 상태

- ✅ **CI는 완전히 구성됨**: 빌드, 테스트, 이미지 푸시까지
- ⚠️ **CD는 부분적**: 매니페스트만 업데이트, 실제 배포는 외부 도구(ArgoCD 등)에 의존

## 실제 배포가 누락된 부분

현재 Jenkinsfile에는 다음이 **없습니다**:
- `kubectl apply` 명령어
- `helm upgrade` 명령어
- Kubernetes 클러스터 배포 단계
- ArgoCD/Argo Rollouts 배포 트리거

## 배포가 이루어지는 방법 (추정)

1. Jenkins가 매니페스트를 Git에 업데이트
2. ArgoCD가 Git 변경사항을 감지
3. ArgoCD가 Kubernetes에 실제 배포 수행

## 배포 단계 추가 여부

실제 Kubernetes 배포 단계를 Jenkinsfile에 추가하려면:
- Kubernetes 클러스터 접근 권한 필요
- kubectl 또는 Helm 설치 필요
- kubeconfig 설정 필요

