# 긴급: 디스크 공간 부족 - 즉시 해결 필요

## 현재 상황

빌드 전 Docker 정리 로직이 추가되었지만, **이미 디스크가 가득 차서** 정리할 공간조차 없는 상태입니다.

## 즉시 해결 방법 (필수!)

### Jenkins 서버에 SSH 접속 후 실행:

```bash
# 1. 현재 디스크 사용량 확인
df -h /

# 2. Docker가 사용하는 공간 확인
docker system df

# 3. 모든 사용하지 않는 Docker 리소스 강제 삭제
docker system prune -a --volumes -f

# 4. 다시 확인
df -h /
docker system df
```

### 추가 정리 (여전히 부족하면):

```bash
# 사용하지 않는 모든 이미지 삭제
docker image prune -a -f

# 빌드 캐시 완전 삭제
docker builder prune -a -f

# 중지된 컨테이너 삭제
docker container prune -f

# 사용하지 않는 볼륨 삭제
docker volume prune -f

# Jenkins 워크스페이스 정리 (주의: 빌드 중이면 안 됨)
# sudo rm -rf /var/lib/jenkins/workspace/*
```

## 근본적 해결 (권장)

### EBS 볼륨 크기 증가:

1. **AWS Console** → EC2 → 인스턴스 → 스토리지 탭
2. 볼륨 ID 확인
3. EC2 → 볼륨 → 해당 볼륨 선택
4. 작업 → 볼륨 수정 → **30GB 또는 50GB로 증가**
5. EC2에서 파일 시스템 확장:

```bash
# 파일 시스템 확장
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /  # 또는 ext4인 경우: sudo resize2fs /dev/nvme0n1p1

# 확인
df -h /
```

## 왜 빌드 전 정리가 작동하지 않았나?

1. **디스크가 이미 100% 사용 중**
   - 정리할 공간이 없음
   - 임시 파일을 위한 공간도 부족

2. **빌드 중간에 공간 부족 발생**
   - npm install 중 node_modules 생성 시 공간 필요
   - 빌드 중간 레이어 저장 공간 필요

3. **10GB는 너무 작음**
   - Docker 이미지 + 캐시 + 빌드 파일 = 10GB 초과

## 권장 작업 순서

### 옵션 1: 빠른 해결 (임시)
```bash
# SSH로 Jenkins 서버 접속
docker system prune -a --volumes -f
# 빌드 재시도
```

### 옵션 2: 근본적 해결 (권장)
1. EBS 볼륨 크기 30GB 또는 50GB로 증가
2. 파일 시스템 확장
3. 그 다음 빌드

### 옵션 3: 둘 다
1. 먼저 Docker 정리 (즉시 해결)
2. EBS 볼륨 크기 증가 (근본적 해결)
3. 파일 시스템 확장

## 확인 명령어

```bash
# 디스크 사용량
df -h /

# Docker 사용량
docker system df

# 가장 큰 디렉토리
sudo du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10

# 사용 가능한 공간이 있어야 빌드 가능
# 최소 2-3GB는 필요
```

