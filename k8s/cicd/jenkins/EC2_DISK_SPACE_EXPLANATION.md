# EC2 디스크 공간 부족 문제 설명

## 문제 원인

**EC2 인스턴스의 디스크 공간이 부족합니다.**

### 왜 발생하는가?

1. **Docker 이미지 누적**
   - 빌드할 때마다 Docker 이미지가 생성됨
   - `node:20-alpine` 같은 베이스 이미지가 다운로드됨
   - 빌드 중간 이미지(intermediate layers)가 쌓임
   - ECR에 푸시한 이미지도 로컬에 남아있음

2. **Docker 빌드 캐시**
   - 빌드 속도 향상을 위한 캐시가 쌓임
   - `BUILDKIT_INLINE_CACHE=1` 옵션 사용 시 더 많은 캐시 생성

3. **Jenkins 워크스페이스**
   - 각 빌드마다 소스 코드 다운로드
   - node_modules 등 의존성 파일들

4. **EC2 인스턴스 디스크 크기**
   - 기본적으로 작은 볼륨 크기로 생성되었을 가능성
   - 예: 8GB 또는 20GB

## 확인 방법

EC2 인스턴스에 SSH 접속 후:

```bash
# 전체 디스크 사용량 확인
df -h

# Docker가 사용하는 디스크 공간 확인
docker system df

# 각 디렉토리별 사용량 확인
du -sh /* 2>/dev/null | sort -h
```

## 해결 방법

### 1. 즉시 해결 (Docker 정리)

```bash
# 사용하지 않는 Docker 리소스 모두 삭제
docker system prune -a --volumes -f

# 또는 단계별
docker image prune -a -f      # 모든 사용하지 않는 이미지
docker container prune -f     # 중지된 컨테이너
docker builder prune -a -f    # 빌드 캐시
```

### 2. EC2 볼륨 크기 증가 (권장)

1. AWS Console → EC2 → 인스턴스 선택
2. **스토리지** 탭에서 볼륨 ID 확인
3. 볼륨 선택 → **수정** → 크기 증가 (예: 20GB → 50GB)
4. EC2에서 파일 시스템 확장:
   ```bash
   # 리사이즈 확인 (xfs 파일 시스템인 경우)
   sudo xfs_growfs /
   
   # 또는 ext4인 경우
   sudo resize2fs /dev/nvme0n1p1
   ```

### 3. Jenkins 빌드 히스토리 정리

Jenkins UI에서:
- Jenkins 관리 → 디스크 사용량 관리
- 오래된 빌드 자동 삭제 설정

### 4. Docker 데이터 디렉토리 변경

큰 EBS 볼륨을 추가로 연결하여 Docker 데이터를 그곳으로 이동:

```bash
# /etc/docker/daemon.json 수정
{
  "data-root": "/mnt/docker-data"
}
```

## 예방 방법

✅ **이미 적용됨**: Jenkinsfile에 빌드 전/후 Docker 정리 로직 추가

추가로 할 수 있는 것:
- EC2 볼륨 크기를 충분히 크게 설정 (최소 50GB 권장)
- 주기적으로 Docker 정리 스크립트 실행 (cron job)
- Jenkins 빌드 히스토리 자동 삭제 설정

