# EC2 SSH 연결 방법

## 인스턴스 정보
- **퍼블릭 IP**: 43.201.105.210
- **프라이빗 IP**: 172.31.35.146
- **사용자**: ubuntu
- **키 파일**: apc-jenkins.pem
- **호스트명**: ip-172-31-35-146

## SSH 연결 방법

### MobaXterm 사용 시

1. **Remote host**: `43.201.105.210`
2. **Username**: `ubuntu` 체크하고 입력
3. **Port**: `22`
4. **Advanced SSH settings** → **Use private key**: `apc-jenkins.pem` 파일 선택
5. **OK** 클릭

### 명령줄에서 연결

```bash
# 키 파일 경로에 맞게 수정
ssh -i ~/.ssh/apc-jenkins.pem ubuntu@43.201.105.210

# 또는 다른 위치에 키 파일이 있다면
ssh -i /path/to/apc-jenkins.pem ubuntu@43.201.105.210
```

## 연결 후 작업 계획

연결되면 다음 작업을 순서대로 진행:

1. **현재 상태 확인**
2. **Kubernetes 설치 방법 결정** (kubeadm vs k3s)
3. **Kubernetes 설치**
4. **Jenkins Pod 배포**
5. **SonarQube Pod 배포**

