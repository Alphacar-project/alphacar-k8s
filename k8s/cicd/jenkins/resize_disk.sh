#!/bin/bash
# EBS 볼륨 확장 후 파일 시스템 확장 스크립트

set -e

echo "========================================="
echo "📊 현재 디스크 사용량:"
echo "========================================="
df -h /

echo ""
echo "========================================="
echo "🔍 파일 시스템 타입 확인:"
echo "========================================="
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
DEVICE=$(df -T / | tail -1 | awk '{print $1}')
echo "파일 시스템: $FS_TYPE"
echo "디바이스: $DEVICE"

# 디바이스에서 파티션 번호 추출
if [[ $DEVICE == *"nvme"* ]]; then
    BASE_DEVICE=$(echo $DEVICE | sed 's/p[0-9]*$//')
    PARTITION_NUM=$(echo $DEVICE | grep -oP 'p\K[0-9]+')
elif [[ $DEVICE == *"xvda"* ]]; then
    BASE_DEVICE=$(echo $DEVICE | sed 's/[0-9]*$//')
    PARTITION_NUM=$(echo $DEVICE | grep -oP '\K[0-9]+$')
else
    echo "⚠️ 알 수 없는 디바이스 타입: $DEVICE"
    exit 1
fi

echo "베이스 디바이스: $BASE_DEVICE"
echo "파티션 번호: $PARTITION_NUM"

echo ""
echo "========================================="
echo "📈 파티션 확장 중..."
echo "========================================="
# growpart 설치 확인
if ! command -v growpart &> /dev/null; then
    echo "growpart 설치 중..."
    sudo apt-get update
    sudo apt-get install -y cloud-guest-utils
fi

if [[ $BASE_DEVICE == *"nvme"* ]]; then
    sudo growpart $BASE_DEVICE $PARTITION_NUM
else
    sudo growpart $BASE_DEVICE $PARTITION_NUM
fi

echo ""
echo "========================================="
echo "📈 파일 시스템 확장 중..."
echo "========================================="
if [ "$FS_TYPE" = "xfs" ]; then
    echo "XFS 파일 시스템 확장..."
    sudo xfs_growfs /
elif [ "$FS_TYPE" = "ext4" ]; then
    echo "EXT4 파일 시스템 확장..."
    sudo resize2fs $DEVICE
else
    echo "⚠️ 알 수 없는 파일 시스템 타입: $FS_TYPE"
    echo "수동으로 확장해야 합니다."
    exit 1
fi

echo ""
echo "========================================="
echo "✅ 확장 완료!"
echo "========================================="
df -h /

echo ""
echo "✅ 디스크 확장이 완료되었습니다!"
