# 파일 시스템 확장 가이드

## 현재 상태

✅ EBS 볼륨 크기: 50GB로 증가 완료
✅ 파티션 확장: `growpart /dev/nvme0n1 1` 완료
⏳ 파일 시스템 확장: 아직 안 됨 (현재 8.7GB로 표시)

## 다음 단계: 파일 시스템 확장

### 1. 파일 시스템 타입 확인

```bash
df -T / | tail -1 | awk '{print $2}'
```

### 2. 파일 시스템 확장

#### XFS 파일 시스템인 경우:
```bash
sudo xfs_growfs /
```

#### ext4 파일 시스템인 경우:
```bash
sudo resize2fs /dev/nvme0n1p1
```

### 3. 확인

```bash
df -h /
# 50GB로 표시되어야 함
```

## 자동 감지 스크립트

```bash
# 파일 시스템 타입 확인
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
echo "파일 시스템: $FS_TYPE"

# 확장
if [ "$FS_TYPE" = "xfs" ]; then
    sudo xfs_growfs /
elif [ "$FS_TYPE" = "ext4" ]; then
    sudo resize2fs /dev/nvme0n1p1
fi

# 확인
df -h /
```

