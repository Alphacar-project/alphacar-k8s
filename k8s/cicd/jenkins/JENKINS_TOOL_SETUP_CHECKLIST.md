# Jenkins SonarQube Scanner 도구 설정 체크리스트

## 문제 증상
```
ERROR: No tool named sonar-scanner found
```

## 해결 방법

### 1단계: Jenkins Global Tool Configuration 접근

1. Jenkins 대시보드 → **Jenkins 관리** (Manage Jenkins)
2. **도구 구성** (Global Tool Configuration) 클릭
   - 또는 URL: `http://your-jenkins-url/configureTools/`

### 2단계: SonarQube Scanner 섹션 찾기

페이지를 아래로 스크롤하여 **SonarQube Scanner** 섹션을 찾습니다.

### 3단계: SonarQube Scanner 설치 추가

**SonarQube Scanner installations** 섹션에서:

1. **Add SonarQube Scanner** 버튼 클릭
2. 다음 항목 입력:
   - **Name**: `sonar-scanner` ⚠️ **정확히 이 이름이어야 함!** (대소문자 구분)
   - **Install automatically** 체크박스 선택
   - **Version**: 드롭다운에서 선택
     - `Latest` 또는
     - 특정 버전 (예: `5.0.1.3006`)
3. **저장(Save)** 버튼 클릭 (페이지 하단)

### 4단계: 설정 확인

1. Jenkins 관리 → Global Tool Configuration 다시 접근
2. SonarQube Scanner 섹션에서 `sonar-scanner` 항목이 보이는지 확인
3. Name이 정확히 `sonar-scanner`인지 확인

### 5단계: 빌드 재실행

1. Job 페이지로 돌아가기
2. **지금 빌드(Build Now)** 클릭
3. 오류가 해결되었는지 확인

## 주의사항

⚠️ **이름이 정확히 일치해야 합니다:**
- ✅ 올바름: `sonar-scanner`
- ❌ 잘못됨: `SonarQube Scanner`
- ❌ 잘못됨: `sonar_scanner`
- ❌ 잘못됨: `Sonar-scanner`

⚠️ **플러그인 설치와 도구 등록은 다릅니다:**
- SonarQube Scanner 플러그인 설치 ≠ Global Tool Configuration에서 도구 등록
- 플러그인은 통신용, 도구는 실행 파일용

## 문제가 계속되면

1. Jenkins 재시작:
   ```bash
   sudo systemctl restart jenkins
   # 또는 Pod인 경우
   kubectl rollout restart deployment/jenkins -n apc-cicd-ns
   ```

2. Jenkins 로그 확인:
   - Jenkins 관리 → 시스템 로그
   - 또는 `/var/log/jenkins/jenkins.log` 확인

