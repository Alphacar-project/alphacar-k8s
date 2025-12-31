#!/bin/bash

# SonarQube 직접 설치 스크립트 (systemd 서비스)

set -e

echo "=========================================="
echo "SonarQube 직접 설치 (systemd 서비스)"
echo "=========================================="
echo ""

# 1. Java 확인
echo "1. Java 버전 확인..."
java -version
echo ""

# 2. SonarQube 다운로드
echo "2. SonarQube 다운로드..."
SONARQUBE_VERSION="10.6.1.77163"
cd /tmp
wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-${SONARQUBE_VERSION}.zip
echo ""

# 3. 압축 해제 및 설치
echo "3. SonarQube 설치..."
unzip -q sonarqube-${SONARQUBE_VERSION}.zip
sudo mv sonarqube-${SONARQUBE_VERSION} /opt/sonarqube
sudo chown -R $USER:$USER /opt/sonarqube
echo ""

# 4. SonarQube 사용자 생성 (선택사항, 보안을 위해 권장)
echo "4. SonarQube 사용자 생성..."
sudo useradd -r -s /bin/bash sonarqube
sudo chown -R sonarqube:sonarqube /opt/sonarqube
echo ""

# 5. systemd 서비스 파일 생성
echo "5. systemd 서비스 파일 생성..."
sudo tee /etc/systemd/system/sonarqube.service > /dev/null <<EOF
[Unit]
Description=SonarQube service
After=syslog.target network.target

[Service]
Type=simple
User=sonarqube
Group=sonarqube
PermissionsStartOnly=true
ExecStartPre=/bin/sleep 30
ExecStart=/opt/sonarqube/bin/linux-x86-64/sonar.sh start
ExecStop=/opt/sonarqube/bin/linux-x86-64/sonar.sh stop
LimitNOFILE=65536
LimitNPROC=4096
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 6. SonarQube 설정 (메모리 최적화)
echo "6. SonarQube 메모리 설정..."
sudo tee -a /opt/sonarqube/conf/sonar.properties > /dev/null <<EOF

# Memory settings for 8GB RAM system
sonar.web.javaOpts=-Xmx768m -Xms768m
sonar.ce.javaOpts=-Xmx512m -Xms512m
sonar.search.javaOpts=-Xmx512m -Xms512m

# Disable Elasticsearch bootstrap checks
sonar.es.bootstrap.checks.disable=true
EOF

# 7. 서비스 시작
echo "7. SonarQube 서비스 시작..."
sudo systemctl daemon-reload
sudo systemctl enable sonarqube
sudo systemctl start sonarqube
echo ""

# 8. 상태 확인
echo "8. 서비스 상태 확인..."
sleep 10
sudo systemctl status sonarqube --no-pager
echo ""

echo "=========================================="
echo "설치 완료!"
echo "=========================================="
echo ""
echo "SonarQube 접속: http://$(curl -s ifconfig.me):9000"
echo "기본 ID/PW: admin/admin (최초 로그인 시 비밀번호 변경 필요)"
echo ""
echo "서비스 관리:"
echo "  시작: sudo systemctl start sonarqube"
echo "  중지: sudo systemctl stop sonarqube"
echo "  상태: sudo systemctl status sonarqube"
echo "  로그: sudo journalctl -u sonarqube -f"
echo ""

