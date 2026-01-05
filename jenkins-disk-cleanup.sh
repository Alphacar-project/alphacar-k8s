#!/bin/bash
# Jenkins 디스크 공간 강력 정리 스크립트
# Jenkins 서버에서 실행하세요

echo "📊 현재 디스크 사용량:"
df -h /

echo ""
echo "🧹 1. 모든 워크스페이스 삭제..."
if [ -d /var/lib/jenkins/workspace ]; then
    cd /var/lib/jenkins/workspace
    for dir in */; do
        if [ -d "$dir" ] && [[ ! "$dir" =~ @ ]]; then
            echo "Deleting workspace: $dir"
            rm -rf "$dir" 2>/dev/null || true
        fi
    done
fi

echo ""
echo "🧹 2. 빌드 히스토리 정리 (최근 2개만 유지)..."
if [ -d /var/lib/jenkins/jobs ]; then
    find /var/lib/jenkins/jobs -name "builds" -type d | while read builds_dir; do
        cd "$builds_dir" 2>/dev/null || continue
        ls -d [0-9]* 2>/dev/null | sort -rn | tail -n +3 | xargs rm -rf 2>/dev/null || true
    done
fi

echo ""
echo "🧹 3. 빌드 아티팩트 삭제..."
if [ -d /var/lib/jenkins/jobs ]; then
    find /var/lib/jenkins/jobs -name "archive" -type d -exec rm -rf {} + 2>/dev/null || true
fi

echo ""
echo "🧹 4. Docker 리소스 완전 정리..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm -f $(docker ps -aq) 2>/dev/null || true
docker rmi -f $(docker images -q) 2>/dev/null || true
docker system prune -a -f --volumes 2>/dev/null || true
docker builder prune -a -f 2>/dev/null || true

echo ""
echo "🧹 5. 임시 파일 정리..."
find /tmp -type f -mtime +0 -delete 2>/dev/null || true
find /var/tmp -type f -mtime +0 -delete 2>/dev/null || true
find /tmp -mindepth 1 -maxdepth 1 -type d -mtime +0 -exec rm -rf {} + 2>/dev/null || true
find /var/tmp -mindepth 1 -maxdepth 1 -type d -mtime +0 -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "🧹 6. 큰 로그 파일 삭제 (10MB 이상)..."
find /var/log -type f -size +10M -delete 2>/dev/null || true
find /var/lib/jenkins/logs -type f -size +10M -delete 2>/dev/null || true

echo ""
echo "🧹 7. Jenkins 로그 파일 정리..."
find /var/lib/jenkins -name "*.log" -type f -size +1M -delete 2>/dev/null || true

echo ""
echo "✅ 정리 완료. 최종 디스크 사용량:"
df -h /

echo ""
echo "📊 Jenkins 디렉토리별 사용량 (상위 10개):"
du -sh /var/lib/jenkins/* 2>/dev/null | sort -hr | head -10

