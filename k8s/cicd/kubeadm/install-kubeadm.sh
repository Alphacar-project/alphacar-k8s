#!/bin/bash

# kubeadm으로 Kubernetes 설치 (단일 노드)

set -e

echo "=========================================="
echo "kubeadm으로 Kubernetes 설치"
echo "=========================================="
echo ""

# 1. 필수 패키지 설치
echo "1. 필수 패키지 설치..."
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
echo ""

# 2. Kubernetes 저장소 추가
echo "2. Kubernetes 저장소 추가..."
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
echo ""

# 3. kubeadm, kubelet, kubectl 설치
echo "3. kubeadm, kubelet, kubectl 설치..."
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
echo ""

# 4. containerd 설치 및 설정
echo "4. containerd 설치..."
sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup \= false/SystemdCgroup \= true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl enable containerd
echo ""

# 5. 네트워크 설정
echo "5. 네트워크 설정..."
sudo modprobe overlay
sudo modprobe br_netfilter
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system
echo ""

# 6. swap 비활성화
echo "6. swap 비활성화..."
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
echo ""

# 7. kubeadm 초기화 (단일 노드)
echo "7. kubeadm 클러스터 초기화..."
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
echo ""

# 8. kubectl 설정
echo "8. kubectl 설정..."
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
echo ""

# 9. 단일 노드에서 Pod 스케줄링 허용
echo "9. 단일 노드 설정 (taint 제거)..."
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
echo ""

# 10. 네트워크 플러그인 설치 (Flannel)
echo "10. 네트워크 플러그인 설치 (Flannel)..."
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
echo ""

# 11. 설치 확인
echo "11. 설치 확인..."
sleep 30
kubectl get nodes
kubectl get pods --all-namespaces
echo ""

echo "=========================================="
echo "Kubernetes 설치 완료!"
echo "=========================================="
echo ""
echo "주의: kubeadm은 설정이 복잡하고 시간이 오래 걸립니다."
echo "빠른 설치를 원하면 k3s를 권장합니다."
echo ""

