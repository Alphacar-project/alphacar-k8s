# 긴급: 디스크 공간 부족 해결

## 즉시 실행해야 할 명령어 (Jenkins 서버에서)

```bash
# SSH로 Jenkins 서버 접속 후:

# 1. 디스크 사용량 확인
df -h

# 2. Docker 리소스 전체 정리 (중요!)
docker system prune -a --volumes -f

# 3. 사용하지 않는 이미지 강제 삭제
docker image prune -a -f

# 4. 빌드 캐시 삭제
docker builder prune -a -f

# 5. Docker 디스크 사용량 확인
docker system df
```

## 예상 결과

정리 후 디스크 공간이 확보되면:
- 현재 빌드가 성공할 가능성이 높음
- 향후 빌드도 정상 작동

## 주의사항

- `docker system prune -a --volumes -f` 명령어는 모든 사용하지 않는 리소스를 삭제합니다
- 실행 중인 컨테이너는 삭제되지 않지만, 사용하지 않는 이미지와 캐시는 모두 삭제됩니다
- 필요하다면 먼저 중요한 이미지를 확인하세요: `docker images`

