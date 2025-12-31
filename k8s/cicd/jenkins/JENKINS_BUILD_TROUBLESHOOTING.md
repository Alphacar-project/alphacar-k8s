# Jenkins 빌드 문제 해결

## 현재 상황 분석

Jenkins 로그를 보면:
- 커밋 `71698ba`를 체크아웃하고 있음
- 최신 커밋 `b0cec9b`가 아닌 이전 커밋을 가져오고 있음

## 원인

Jenkins가 Git 캐시를 사용하거나, 최신 변경사항을 가져오지 못한 경우

## 해결 방법

### 방법 1: Jenkins Job 설정에서 강제 업데이트

1. Jenkins 대시보드 → Job 선택
2. "구성(Configure)" 클릭
3. "소스 코드 관리(Source Code Management)" 섹션
4. "고급(Advanced)" 클릭
5. "정리 전에 저장소 지우기(Clean before checkout)" 또는 "클론 후 정리(Clean after checkout)" 옵션 활성화
6. 저장 후 빌드 재시작

### 방법 2: 수동으로 Git Pull

Jenkins 서버에서 직접:

```bash
# Jenkins 워크스페이스로 이동
cd /var/lib/jenkins/workspace/alphacar-main

# Git 업데이트
git fetch origin
git pull origin main
```

### 방법 3: Jenkins Job 재실행

1. Jenkins 대시보드에서 Job 선택
2. "지금 빌드(Build Now)" 클릭
3. 최신 커밋을 가져오는지 확인

### 방법 4: Jenkins Git 플러그인 캐시 정리

Jenkins 관리 → 시스템 관리 → 스크립트 콘솔에서:

```groovy
// Git 캐시 정리
import jenkins.model.Jenkins
Jenkins.instance.pluginManager.getPlugin('git').doUpdateNow()
```

## 확인 방법

다음 빌드 로그에서 확인:
- `Checking out Revision`이 `b0cec9b`인지 확인
- 커밋 메시지가 "feat: AWS ECR용 Jenkinsfile 생성..."인지 확인

## 예상 결과

최신 커밋(b0cec9b)을 체크아웃하면:
- Generic Webhook Trigger가 제거된 Jenkinsfile 사용
- SonarQube Analysis stage 포함
- ECR 설정 포함

