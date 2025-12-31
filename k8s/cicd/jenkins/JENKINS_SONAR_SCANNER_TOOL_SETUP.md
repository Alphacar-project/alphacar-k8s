# Jenkins SonarQube Scanner 도구 설정 방법

## Jenkins Global Tool Configuration 설정

1. **Jenkins 대시보드** → **Jenkins 관리** → **Global Tool Configuration**

2. **SonarQube Scanner** 섹션 찾기

3. **SonarQube Scanner installations** 섹션에서:
   - **Add SonarQube Scanner** 클릭
   - **Name**: `sonar-scanner` (Jenkinsfile의 `tool name: 'sonar-scanner'`와 정확히 일치해야 함)
   - **Install automatically** 체크
   - **Version**: 최신 버전 선택 (예: `Latest`)
   - 또는 특정 버전 선택 (예: `5.0.1.3006`)

4. **저장(Save)** 클릭

## 확인 방법

빌드를 실행하면:
- `tool name: 'sonar-scanner'`가 정상적으로 동작
- 자동 다운로드 없이 즉시 사용 가능
- 빌드 시간 단축

