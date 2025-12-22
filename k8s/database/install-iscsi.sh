#!/bin/bash
# 모든 노드에 open-iscsi 설치 스크립트 (Ansible 없이)

NODES=(
  "192.168.0.170"  # a-master1
  "192.168.0.171"  # a-master2
  "192.168.0.172"  # a-master3
  "192.168.0.173"  # a-worker1
  "192.168.0.174"  # a-worker2
  "192.168.0.175"  # a-worker3
  "192.168.0.176"  # a-worker4
  "192.168.0.177"  # a-worker5
)

USER="alphacar"
PASSWORD="123"

for NODE in "${NODES[@]}"; do
  echo "========================================="
  echo "Installing open-iscsi on $NODE"
  echo "========================================="
  
  sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$NODE" << 'ENDSSH'
    sudo apt-get update
    sudo apt-get install -y open-iscsi
    sudo systemctl enable iscsid
    sudo systemctl start iscsid
    iscsiadm --version
ENDSSH
  
  if [ $? -eq 0 ]; then
    echo "✅ Successfully installed open-iscsi on $NODE"
  else
    echo "❌ Failed to install open-iscsi on $NODE"
  fi
  echo ""
done

echo "========================================="
echo "Installation complete!"
echo "========================================="

