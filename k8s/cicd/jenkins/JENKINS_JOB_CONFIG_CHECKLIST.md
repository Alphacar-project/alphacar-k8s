# Jenkins Job 설정 확인 체크리스트

## 현재 설정 확인

### ✅ Pipeline 설정

1. **Pipeline script from SCM** - ✅ 설정됨
2. **Repository URL**: `https://github.com/Alphacar-project/alphacar-k8s.git` - ✅ 올바름
3. **Credentials**: `pogiri1207-ally` - ✅ 설정됨
4. **Branch Specifier**: `*/main` - ✅ 올바름
5. **Script Path**: `k8s/cicd/jenkins/Jenkinsfile.alphacar-main` - ✅ 올바름

### ✅ 매개변수 (Parameters)

1. **ACTION**: Choice Parameter
   - Choices: `build_and_deploy`, `skip_build` - ✅ 올바름
   - Description: "alphacar-main 빌드 및 배포를 진행하시겠습니까?" - ✅

2. **VERSION**: String Parameter
   - Default Value: `1.0` - ✅
   - Description: "기본 버전" - ✅

### ✅ Triggers

- 현재 트리거 없음 (수동 빌드) - ✅ 올바름
- Generic Webhook Trigger 제거됨 - ✅ 올바름

## 빌드 실행 방법

1. Jenkins 대시보드 → `alphacar-main` Job 선택
2. **지금 빌드(Build Now)** 클릭
3. 매개변수 선택:
   - **ACTION**: `build_and_deploy` 선택
   - **VERSION**: 기본값 `1.0` 유지 (또는 원하는 버전 입력)
4. **빌드(Build)** 클릭

## 예상되는 빌드 단계

1. ✅ **Prepare**: Docker 리소스 정리, 소스 체크아웃
2. ✅ **Security & Analysis**: SonarQube 분석 (sonar-scanner 설정 필요)
3. ✅ **Docker Build & Push to ECR**: 
   - Docker 이미지 빌드
   - AWS CLI로 ECR 로그인
   - ECR에 이미지 푸시
4. ✅ **Update Manifest**: 
   - 매니페스트 파일 업데이트
   - Git에 푸시 (자격 증명 포함)

## 확인 사항

### ✅ 완료된 설정:

- [x] Jenkinsfile 경로: `k8s/cicd/jenkins/Jenkinsfile.alphacar-main`
- [x] Git 저장소: `https://github.com/Alphacar-project/alphacar-k8s.git`
- [x] 브랜치: `main`
- [x] 자격 증명: 설정됨
- [x] 매개변수: ACTION, VERSION

### ⚠️ 추가 확인 필요:

1. **SonarQube Scanner 도구 설정**
   - Jenkins 관리 → Global Tool Configuration
   - SonarQube Scanner → Name: `sonar-scanner` (필수)
   - 설치 안 되어 있으면 SonarQube Analysis 단계에서 오류 발생

2. **SonarQube 서버 연결**
   - Jenkins 관리 → 시스템 설정 → SonarQube servers
   - Name: `sonarqube`
   - Server URL: `http://localhost:9000` (또는 적절한 URL)

## 바로 빌드 가능 여부

**✅ 네, 바로 빌드 가능합니다!**

단, SonarQube Scanner가 설정되지 않았다면:
- SonarQube Analysis 단계에서 오류 발생 가능
- 이 경우 SonarQube Analysis 단계는 실패하지만, 나머지 단계는 진행됨
- 또는 SonarQube Scanner를 먼저 설정하는 것을 권장

## 권장 순서

1. ✅ Jenkins Job 설정 확인 (완료)
2. ⚠️ SonarQube Scanner 설정 (선택사항, 하지만 권장)
3. ✅ 빌드 실행

