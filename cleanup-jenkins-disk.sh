#!/bin/bash
# Jenkins 디스크 공간 정리 스크립트
# Jenkins 에이전트 서버에서 실행하세요

echo "📊 디스크 사용량 확인:"
df -h

echo ""
echo "🧹 Docker 리소스 정리 중..."
docker system prune -a -f --volumes 2>/dev/null || true
docker builder prune -a -f 2>/dev/null || true
docker image prune -a -f 2>/dev/null || true
docker container prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true

echo ""
echo "🧹 오래된 Jenkins 워크스페이스 정리 중..."
if [ -d /var/lib/jenkins/workspace ]; then
    find /var/lib/jenkins/workspace -mindepth 1 -maxdepth 1 -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
fi

echo ""
echo "🧹 Jenkins 빌드 히스토리 정리 중 (최근 5개만 유지)..."
if [ -d /var/lib/jenkins/jobs ]; then
    find /var/lib/jenkins/jobs -name "builds" -type d | while read builds_dir; do
        find "$builds_dir" -mindepth 1 -maxdepth 1 -type d -name "[0-9]*" | sort -rn | tail -n +6 | xargs rm -rf 2>/dev/null || true
    done
fi

echo ""
echo "🧹 Git 캐시 정리 중..."
find /var/lib/jenkins -name ".git" -type d -exec rm -rf {}/objects/*/pack-*.pack 2>/dev/null \; || true

echo ""
echo "🧹 임시 파일 정리 중..."
find /tmp -type f -mtime +1 -delete 2>/dev/null || true
find /var/tmp -type f -mtime +1 -delete 2>/dev/null || true

echo ""
echo "🧹 큰 로그 파일 정리 중 (50MB 이상)..."
find /var/log -type f -size +50M -delete 2>/dev/null || true

echo ""
echo "✅ 정리 완료. 디스크 사용량 재확인:"
df -h

