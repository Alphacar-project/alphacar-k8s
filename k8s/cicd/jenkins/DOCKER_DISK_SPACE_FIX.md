# Docker 디스크 공간 부족 해결 방법

## 오류 메시지
```
write /app/node_modules/@langchain/openai/node_modules/openai/resources/containers/files/content.mjs.map: no space left on device
```

## 원인
- EC2 인스턴스의 디스크 공간 부족
- Docker 이미지/컨테이너가 디스크 공간을 많이 사용

## 해결 방법

### 1. 디스크 사용량 확인

```bash
# 전체 디스크 사용량 확인
df -h

# Docker 디스크 사용량 확인
docker system df
```

### 2. Docker 정리 (Jenkins 서버에서 실행)

```bash
# 사용하지 않는 컨테이너, 이미지, 네트워크, 빌드 캐시 삭제
docker system prune -a --volumes -f

# 또는 단계별 정리
# 중지된 컨테이너 삭제
docker container prune -f

# 사용하지 않는 이미지 삭제 (태그 없는 이미지)
docker image prune -a -f

# 빌드 캐시 삭제
docker builder prune -a -f
```

### 3. Jenkins 워크스페이스 정리 (필요시)

```bash
# Jenkins 워크스페이스 확인
du -sh /var/lib/jenkins/workspace/*

# 오래된 빌드 삭제 (Jenkins UI에서)
# Jenkins 관리 → 디스크 사용량 관리 → 오래된 빌드 삭제
```

### 4. 로그 파일 정리

```bash
# Docker 로그 확인
sudo journalctl --disk-usage

# 오래된 로그 삭제
sudo journalctl --vacuum-time=7d
```

### 5. 임시 파일 정리

```bash
# /tmp 디렉토리 정리
sudo rm -rf /tmp/*

# apt 캐시 정리
sudo apt clean
sudo apt autoclean
```

## Jenkinsfile에 자동 정리 추가

Jenkinsfile의 post 섹션에 다음을 추가:

```groovy
post {
    always {
        sh "docker image prune -f"
        sh "docker system prune -f"
        cleanWs()
    }
}
```

## 영구 해결책

### EC2 인스크 크기 증가 (권장)

1. AWS Console → EC2 → 인스턴스 선택
2. 볼륨 확인
3. 볼륨 크기 증가
4. 파일 시스템 확장

### Docker 데이터 디렉토리 변경

큰 볼륨으로 Docker 데이터 디렉토리 이동:

```bash
# /etc/docker/daemon.json
{
  "data-root": "/mnt/docker-data"
}
```

