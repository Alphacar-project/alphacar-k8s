# EC2 인스턴스에 IAM 역할 연결 가이드

## 현재 상태

✅ IAM 역할 생성 완료: `Jenkins-ECR-Role`
✅ 정책 연결 완료: `AmazonEC2ContainerRegistryFullAccess` (ECR 전체 권한)

## 다음 단계: EC2 인스턴스에 역할 연결

### 방법 1: AWS Console에서 연결

1. **EC2 Console** → **인스턴스** 메뉴
2. **Jenkins 서버 인스턴스 선택** (체크박스 선택)
3. **작업(Actions)** → **보안(Security)** → **IAM 역할 수정(Modify IAM role)**
4. **IAM 역할(IAM role)** 드롭다운에서 **Jenkins-ECR-Role** 선택
5. **업데이트(Update)** 클릭

### 방법 2: 인스턴스 속성에서 연결

1. **EC2 Console** → **인스턴스**
2. Jenkins 서버 인스턴스 **클릭** (상세 정보 보기)
3. **보안(Security)** 탭 클릭
4. **IAM 역할(IAM role)** 섹션의 **편집(Edit)** 클릭
5. **IAM 역할** 드롭다운에서 **Jenkins-ECR-Role** 선택
6. **업데이트** 클릭

## 연결 후 확인

### EC2 인스턴스에서 확인 (SSH 접속 후):

```bash
# 1. IAM 역할 이름 확인
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 결과: Jenkins-ECR-Role (또는 역할 이름)

# 2. AWS CLI로 확인
aws sts get-caller-identity

# 결과 예시:
# {
#     "UserId": "AROAXXXXXXXXXXXXXXXXX:i-xxxxxxxxxxxxx",
#     "Account": "382045063773",
#     "Arn": "arn:aws:sts::382045063773:assumed-role/Jenkins-ECR-Role/i-xxxxxxxxxxxxx"
# }

# 3. ECR 접근 테스트
aws ecr get-login-password --region ap-northeast-2

# 결과: 토큰이 출력되면 성공!

# 4. ECR 리포지토리 목록 확인
aws ecr describe-repositories --region ap-northeast-2
```

## 주의사항

### ⚠️ 역할 연결 후 즉시 적용됨
- 연결 직후부터 사용 가능
- 인스턴스 재시작 불필요
- Jenkins 재시작 불필요

### ⚠️ 기존 세션의 경우
- 이미 실행 중인 프로세스는 새로고침 필요할 수 있음
- 새로운 SSH 세션에서는 바로 작동

## 연결 완료 후

1. ✅ EC2 인스턴스에 IAM 역할 연결
2. ✅ AWS CLI 테스트 (`aws ecr get-login-password`)
3. ✅ Jenkins 빌드 재실행
4. ✅ ECR 푸시 성공 확인

## 문제 해결

### 역할이 연결되었는데도 오류가 나는 경우:

```bash
# 1. 메타데이터 서비스 확인
curl http://169.254.169.254/latest/meta-data/

# 2. 역할 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 3. AWS CLI 자격 증명 확인
aws configure list

# 4. 환경 변수 확인 (없어야 함)
env | grep AWS
```

