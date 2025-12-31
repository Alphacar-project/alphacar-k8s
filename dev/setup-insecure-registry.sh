#!/bin/bash

# containerd insecure registry 설정 스크립트
REGISTRY="192.168.0.170:30000"

echo "=== containerd insecure registry 설정 시작 ==="

# 1. containerd 설정 파일 확인/생성
if [ ! -f /etc/containerd/config.toml ]; then
    echo "containerd 설정 파일이 없습니다. 기본 설정을 생성합니다..."
    sudo mkdir -p /etc/containerd
    sudo containerd config default | sudo tee /etc/containerd/config.toml > /dev/null
fi

# 2. 기존 설정 확인
if sudo grep -q "$REGISTRY" /etc/containerd/config.toml; then
    echo "이미 $REGISTRY 설정이 존재합니다."
    sudo grep -A 3 "$REGISTRY" /etc/containerd/config.toml
    exit 0
fi

# 3. 설정 추가
echo "설정을 추가합니다..."

# mirrors 섹션 찾기
if ! sudo grep -q "\[plugins.\"io.containerd.grpc.v1.cri\".registry.mirrors\]" /etc/containerd/config.toml; then
    # mirrors 섹션이 없으면 추가
    sudo sed -i '/\[plugins."io.containerd.grpc.v1.cri".registry\]/a\[plugins."io.containerd.grpc.v1.cri".registry.mirrors]' /etc/containerd/config.toml
fi

# registry mirror 추가
sudo sed -i "/\[plugins.\"io.containerd.grpc.v1.cri\".registry.mirrors\]/a\        [plugins.\"io.containerd.grpc.v1.cri\".registry.mirrors.\"$REGISTRY\"]\n          endpoint = [\"http://$REGISTRY\"]" /etc/containerd/config.toml

# configs 섹션 찾기
if ! sudo grep -q "\[plugins.\"io.containerd.grpc.v1.cri\".registry.configs\]" /etc/containerd/config.toml; then
    # configs 섹션이 없으면 추가
    sudo sed -i '/\[plugins."io.containerd.grpc.v1.cri".registry.mirrors\]/a\[plugins."io.containerd.grpc.v1.cri".registry.configs]' /etc/containerd/config.toml
fi

# TLS 설정 추가
sudo sed -i "/\[plugins.\"io.containerd.grpc.v1.cri\".registry.configs\]/a\        [plugins.\"io.containerd.grpc.v1.cri\".registry.configs.\"$REGISTRY\".tls]\n          insecure_skip_verify = true" /etc/containerd/config.toml

# 4. containerd 재시작
echo "containerd를 재시작합니다..."
sudo systemctl daemon-reload
sudo systemctl restart containerd

# 5. 설정 확인
echo "=== 설정 확인 ==="
sudo grep -A 3 "$REGISTRY" /etc/containerd/config.toml

echo "=== 설정 완료 ==="

