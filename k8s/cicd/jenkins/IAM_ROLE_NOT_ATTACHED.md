# IAM 역할이 연결되지 않음 - 해결 방법

## 현재 상황

```
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
(결과 없음 - 비어있음)
```

**결과 해석**: IAM 역할이 EC2 인스턴스에 연결되지 않았습니다.

## 해결 방법: AWS Console에서 IAM 역할 연결

### 단계별 가이드

1. **AWS Console 접속**
   - https://console.aws.amazon.com/

2. **EC2 서비스로 이동**
   - 검색창에 "EC2" 입력
   - EC2 서비스 선택

3. **인스턴스 선택**
   - 왼쪽 메뉴 → **인스턴스** 클릭
   - Jenkins 서버 인스턴스 선택 (체크박스 체크)
   - 인스턴스 ID: `i-xxxxxxxxx` (ip-172-31-35-146에 해당하는 인스턴스)

4. **IAM 역할 연결**
   - 상단 메뉴에서 **작업(Actions)** 클릭
   - **보안(Security)** 메뉴
   - **IAM 역할 수정(Modify IAM role)** 클릭

5. **역할 선택**
   - **IAM 역할** 드롭다운 클릭
   - **Jenkins-ECR-Role** 선택
   - **업데이트(Update)** 클릭

6. **확인 메시지**
   - "IAM 역할이 성공적으로 업데이트되었습니다" 메시지 확인

## 연결 후 확인

EC2 서버에서 다시 확인:

```bash
# IAM 역할 확인 (이제 결과가 나와야 함)
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 결과 예시: Jenkins-ECR-Role (역할 이름이 나와야 함)
```

## 중요 사항

⚠️ **IAM 역할을 먼저 연결해야 합니다!**

- IAM 역할이 없으면 AWS CLI를 설치해도 자격 증명을 얻을 수 없습니다
- IAM 역할 연결 후에 AWS CLI 설치 및 테스트를 진행하세요

## 작업 순서

1. ✅ **AWS Console에서 IAM 역할 연결** (필수!)
2. ✅ EC2에서 IAM 역할 확인
3. ✅ AWS CLI 설치
4. ✅ ECR 접근 테스트
5. ✅ Jenkins 빌드 실행

