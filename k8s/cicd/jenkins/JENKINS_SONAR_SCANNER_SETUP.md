# Jenkins SonarQube Scanner 설정 가이드

## 문제
```
ERROR: No tool named sonar-scanner found
```

Jenkinsfile에서 `tool name: 'sonar-scanner'`를 사용하지만 Jenkins에 이 도구가 등록되지 않음

## 해결 방법

### 방법 1: Jenkins 관리 페이지에서 도구 추가 (권장)

1. Jenkins 대시보드 → **Jenkins 관리** → **Global Tool Configuration**
2. **SonarQube Scanner** 섹션 찾기 (없으면 추가)
3. **SonarQube Scanner installations** 섹션에서:
   - **Name**: `sonar-scanner` (Jenkinsfile의 tool name과 정확히 일치해야 함)
   - **Install automatically** 체크
   - **Version**: 최신 버전 선택 (예: `latest`)
4. **저장(Save)** 클릭

### 방법 2: Jenkinsfile 수정 (자동 다운로드)

Jenkinsfile을 수정하여 sonar-scanner를 자동으로 다운로드하도록 변경:

```groovy
stage('2. Security & Analysis') {
    when { expression { params.ACTION == 'build_and_deploy' } }
    steps {
        script {
            // SonarQube Scanner 자동 다운로드
            def scannerVersion = '5.0.1.3006'
            def scannerHome = "/tmp/sonar-scanner-${scannerVersion}-linux"
            sh """
                if [ ! -d "${scannerHome}" ]; then
                    echo "📦 SonarQube Scanner 다운로드 중..."
                    wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${scannerVersion}-linux.zip
                    unzip -q sonar-scanner-cli-${scannerVersion}-linux.zip
                    rm sonar-scanner-cli-${scannerVersion}-linux.zip
                    chmod +x ${scannerHome}/bin/sonar-scanner
                fi
            """
            
            dir('dev/alphacar/backend') {
                withSonarQubeEnv('sonarqube') {
                    sh "${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=alphacar-main \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=squ_273d18a8d287084a242da2c1ea88fcebc4090873"
                }
                // ... 나머지 코드
            }
        }
    }
}
```

## 권장 방법

**방법 1 (Jenkins 관리에서 추가)**을 권장합니다:
- Jenkins 표준 방식
- 유지보수가 쉬움
- 버전 관리가 명확함

**방법 2 (Jenkinsfile 수정)**는:
- 임시 해결책
- 매번 다운로드하므로 빌드 시간 증가
- SonarQube가 아직 설치되지 않은 경우 유용

## SonarQube 서버 확인

Jenkinsfile에서 사용하는 SonarQube URL 확인:
- `http://localhost:9000` - 로컬 SonarQube
- `http://192.168.0.170:32000` - 환경 변수에 정의된 SonarQube

SonarQube가 Pod로 실행 중이면 적절한 URL로 변경 필요

