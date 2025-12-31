# IAM 역할 신뢰 관계 설정 확인 및 수정

## 문제 상황

- IAM 역할을 EC2 인스턴스에 연결했는데
- `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/` 결과가 비어있음
- **원인: 신뢰 관계(Trust Relationship) 설정 문제**

## 해결 방법: IAM 역할 신뢰 관계 확인 및 수정

### 1단계: IAM 역할 신뢰 관계 확인

1. **IAM Console** → **역할** → **Jenkins-ECR-Role** 선택
2. **신뢰 관계(Trust Relationships)** 탭 클릭
3. 현재 신뢰 정책 확인

### 2단계: 신뢰 관계 수정 (필요시)

**올바른 신뢰 관계 정책:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3단계: 신뢰 관계 편집

1. **신뢰 관계** 탭에서 **신뢰 정책 편집(Edit Trust Policy)** 클릭
2. 위의 JSON 정책을 붙여넣기
3. **업데이트(Update)** 클릭

### 4단계: 인스턴스 프로파일 확인

IAM 역할이 **인스턴스 프로파일(Instance Profile)**로 생성되어 있어야 합니다.

1. **IAM Console** → **역할** → **Jenkins-ECR-Role**
2. **요약(Summary)** 섹션에서 **인스턴스 프로파일 ARN** 확인
3. 없다면 역할을 삭제하고 다시 생성하거나, EC2에서 역할 연결 시 자동 생성됨

## 빠른 확인 및 해결 체크리스트

### ✅ 확인 사항:

1. **신뢰 관계 설정**
   - Principal: `ec2.amazonaws.com`
   - Action: `sts:AssumeRole`

2. **인스턴스 프로파일 존재**
   - 역할 요약에서 "인스턴스 프로파일 ARN" 표시되어야 함

3. **EC2 인스턴스에 역할 연결**
   - EC2 Console → 인스턴스 → IAM 역할 확인

4. **인스턴스 재부팅 (필요시)**
   - 역할을 연결한 직후에는 즉시 적용되지만, 가끔 재부팅이 필요할 수 있음

## 문제 해결 단계

### 방법 1: 신뢰 관계 확인 및 수정

```bash
# AWS CLI로 신뢰 관계 확인 (설치되어 있다면)
aws iam get-role --role-name Jenkins-ECR-Role --query 'Role.AssumeRolePolicyDocument'
```

### 방법 2: 역할 재생성 (최후의 수단)

1. IAM → 역할 → Jenkins-ECR-Role 삭제
2. 새 역할 생성:
   - 신뢰할 수 있는 엔티티: AWS 서비스 → EC2
   - 권한: AmazonEC2ContainerRegistryFullAccess
3. EC2 인스턴스에 다시 연결

## 신뢰 관계 JSON 예시

**올바른 설정:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**잘못된 설정 예시:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::382045063773:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## 확인 명령어

역할 연결 및 신뢰 관계 수정 후:

```bash
# 1. 메타데이터 서비스 확인
curl http://169.254.169.254/latest/meta-data/

# 2. IAM 역할 확인 (결과가 나와야 함)
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 3. 역할 자격 증명 확인
ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/$ROLE_NAME
```

