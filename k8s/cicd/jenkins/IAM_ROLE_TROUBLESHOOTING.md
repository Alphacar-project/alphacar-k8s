# IAM 역할 신뢰 관계가 올바른데도 작동하지 않는 경우

## 현재 상태 확인

✅ **신뢰 관계 정책은 올바릅니다:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"  ✅ 올바름
            },
            "Action": "sts:AssumeRole"  ✅ 올바름
        }
    ]
}
```

## 추가 확인 사항

### 1. 인스턴스 프로파일 확인

IAM 역할 요약에서 확인:
- **인스턴스 프로파일 ARN**이 표시되어야 함
- 예: `arn:aws:iam::382045063773:instance-profile/Jenkins-ECR-Role`

**인스턴스 프로파일이 없다면:**
- EC2에서 IAM 역할을 연결할 때 자동으로 생성되어야 함
- 없다면 역할을 삭제하고 다시 생성 (EC2 서비스용으로 생성)

### 2. EC2 인스턴스에 역할 연결 상태 재확인

1. **EC2 Console** → **인스턴스**
2. Jenkins 서버 인스턴스 선택
3. **보안(Security)** 탭 클릭
4. **IAM 역할(IAM role)** 섹션 확인
   - `Jenkins-ECR-Role`이 표시되어야 함

### 3. 인스턴스 재부팅 시도

때때로 역할 연결 후 즉시 반영되지 않을 수 있습니다:

```bash
# EC2 서버에서
sudo reboot
```

재부팅 후 확인:
```bash
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

### 4. 메타데이터 서비스 확인

```bash
# 메타데이터 서비스가 작동하는지 확인
curl http://169.254.169.254/latest/meta-data/

# IAM 관련 메타데이터 확인
curl http://169.254.169.254/latest/meta-data/iam/

# 보안 자격 증명 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

## 문제 해결 단계

### 방법 1: 역할 연결 해제 후 재연결

1. EC2 → 인스턴스 → 작업 → 보안 → IAM 역할 수정
2. IAM 역할을 **없음(None)**으로 변경 → 업데이트
3. 잠시 대기 (1-2분)
4. 다시 **Jenkins-ECR-Role** 선택 → 업데이트
5. 확인:
   ```bash
   curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```

### 방법 2: 인스턴스 프로파일 수동 생성 (필요시)

일반적으로는 필요 없지만, 문제가 계속되면:

1. IAM → 역할 → Jenkins-ECR-Role
2. 요약에서 "인스턴스 프로파일 ARN" 확인
3. 없다면:
   - IAM → 인스턴스 프로파일 → 인스턴스 프로파일 생성
   - 이름: `Jenkins-ECR-Role`
   - 역할 연결: `Jenkins-ECR-Role`
   - EC2에서 인스턴스 프로파일로 역할 연결

### 방법 3: 역할 재생성 (최후의 수단)

1. IAM → 역할 → Jenkins-ECR-Role 삭제
2. 새 역할 생성:
   - 신뢰할 수 있는 엔티티: **AWS 서비스** → **EC2** 선택
   - 권한: `AmazonEC2ContainerRegistryFullAccess`
   - 역할 이름: `Jenkins-ECR-Role`
3. EC2 인스턴스에 연결

## 확인 체크리스트

- [ ] 신뢰 관계: `ec2.amazonaws.com` ✅ (확인 완료)
- [ ] IAM 역할이 EC2 인스턴스에 연결됨
- [ ] 인스턴스 프로파일 ARN이 표시됨
- [ ] 메타데이터 서비스 작동 확인
- [ ] 인스턴스 재부팅 시도

## 디버깅 명령어

```bash
# 1. 메타데이터 서비스 전체 확인
curl http://169.254.169.254/latest/meta-data/

# 2. IAM 관련 메타데이터 확인
curl http://169.254.169.254/latest/meta-data/iam/

# 3. 보안 자격 증명 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 4. 오류 확인 (404가 나오면 역할이 연결되지 않음)
curl -v http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

