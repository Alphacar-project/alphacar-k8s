#!/bin/bash

# Jenkins 설치 방식 확인 스크립트

echo "=========================================="
echo "Jenkins 설치 방식 확인"
echo "=========================================="
echo ""

echo "1. systemd 서비스 확인:"
echo "----------------------------------------"
systemctl status jenkins 2>&1 | head -20
echo ""

echo "2. 실행 중인 Jenkins 프로세스 확인:"
echo "----------------------------------------"
ps aux | grep -i jenkins | grep -v grep
echo ""

echo "3. 포트 8080 사용 확인:"
echo "----------------------------------------"
sudo netstat -tlnp | grep 8080
# 또는
sudo ss -tlnp | grep 8080
echo ""

echo "4. Jenkins 관련 디렉토리 확인:"
echo "----------------------------------------"
ls -la /var/lib/jenkins 2>/dev/null || echo "/var/lib/jenkins 없음"
ls -la /usr/share/jenkins 2>/dev/null || echo "/usr/share/jenkins 없음"
ls -la ~/jenkins 2>/dev/null || echo "~/jenkins 없음"
echo ""

echo "5. Jenkins 실행 파일 확인:"
echo "----------------------------------------"
which jenkins
jenkins --version 2>/dev/null || echo "jenkins 명령어 없음"
echo ""

