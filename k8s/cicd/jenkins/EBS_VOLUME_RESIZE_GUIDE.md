# EBS 볼륨 크기 증가 가이드

## 방법 1: AWS Console에서 증가 (권장)

### 1단계: EC2 인스턴스 확인

1. **AWS Console** → **EC2** → **인스턴스**
2. Jenkins 서버 인스턴스 선택
3. **스토리지(Storage)** 탭 클릭
4. **볼륨 ID** 확인 (예: `vol-xxxxxxxxx`)

### 2단계: 볼륨 크기 수정

1. **EC2** → **볼륨(Volumes)** 메뉴
2. 해당 볼륨 선택 (인스턴스에서 확인한 볼륨 ID)
3. **작업(Actions)** → **볼륨 수정(Modify Volume)** 클릭
4. **크기(Size)** 변경:
   - 현재: `10 GiB`
   - 변경: `30 GiB` (또는 `50 GiB` 권장)
5. **수정(Modify)** 클릭
6. 확인 메시지에서 **수정(Modify)** 클릭

### 3단계: 파일 시스템 확장 (EC2 인스턴스에서)

SSH로 Jenkins 서버 접속 후:

#### 방법 A: xfs 파일 시스템인 경우 (일반적)

```bash
# 파일 시스템 타입 확인
df -T / | tail -1 | awk '{print $2}'

# 확장 (xfs인 경우)
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
```

#### 방법 B: ext4 파일 시스템인 경우

```bash
# 파일 시스템 타입 확인
df -T / | tail -1 | awk '{print $2}'

# 확장 (ext4인 경우)
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
```

#### 방법 C: 파일 시스템 자동 감지

```bash
# 파티션 확장
sudo growpart /dev/nvme0n1 1

# 파일 시스템 타입 확인 후 확장
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
if [ "$FS_TYPE" = "xfs" ]; then
    sudo xfs_growfs /
elif [ "$FS_TYPE" = "ext4" ]; then
    sudo resize2fs /dev/nvme0n1p1
fi

# 확인
df -h /
```

### 4단계: 확인

```bash
# 디스크 크기 확인
df -h /

# 결과 예시:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/root        30G   10G   20G  34% /    ← 30GB로 증가!
```

## 방법 2: AWS CLI로 증가

### 1단계: 볼륨 ID 확인

```bash
# 인스턴스 ID 확인
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)

# 볼륨 ID 확인
aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId' \
    --output text
```

### 2단계: 볼륨 크기 수정

```bash
# 볼륨 ID를 변수에 저장
VOLUME_ID="vol-xxxxxxxxx"

# 볼륨 크기 30GB로 수정
aws ec2 modify-volume --volume-id $VOLUME_ID --size 30

# 수정 상태 확인 (대기)
aws ec2 describe-volumes-modifications --volume-ids $VOLUME_ID
```

### 3단계: 파일 시스템 확장 (위의 방법과 동일)

## 주의사항

### ⚠️ 인스턴스가 실행 중이어도 가능
- EBS 볼륨은 **인스턴스가 실행 중**에도 크기 증가 가능
- **다운타임 없음** (Zero downtime)

### ⚠️ 볼륨 크기만 증가 가능
- **볼륨 크기 축소는 불가능**
- 증가만 가능하므로 신중하게 결정

### ⚠️ 파티션 번호 확인
- `/dev/nvme0n1p1` (p1 = 파티션 1)
- 만약 다른 파티션을 사용한다면 경로 수정 필요

### ⚠️ 파일 시스템 확장 필요
- AWS Console에서 볼륨 크기만 증가
- **EC2 인스턴스에서 파일 시스템 확장 필수!**
- 확장하지 않으면 디스크가 여전히 10GB로 인식됨

## 빠른 확인 스크립트

```bash
#!/bin/bash
# 파일 시스템 확장 스크립트

echo "📊 현재 디스크 사용량:"
df -h /

echo ""
echo "🔍 파일 시스템 타입 확인:"
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
echo "파일 시스템: $FS_TYPE"

echo ""
echo "📈 파티션 확장 중..."
sudo growpart /dev/nvme0n1 1

echo ""
echo "📈 파일 시스템 확장 중..."
if [ "$FS_TYPE" = "xfs" ]; then
    sudo xfs_growfs /
elif [ "$FS_TYPE" = "ext4" ]; then
    sudo resize2fs /dev/nvme0n1p1
else
    echo "⚠️ 알 수 없는 파일 시스템 타입: $FS_TYPE"
    exit 1
fi

echo ""
echo "✅ 확장 완료!"
df -h /
```

## 비용 정보

### EBS gp3 가격 (ap-northeast-2 기준)
- **10GB**: 약 $1/월
- **30GB**: 약 $3/월 (+$2/월)
- **50GB**: 약 $5/월 (+$4/월)

### 비용 대비 효과
- 빌드 실패 방지
- 개발 시간 절약
- 스트레스 감소
- **매우 합리적인 비용!**

## 트러블슈팅

### 파티션 확장 오류
```bash
# growpart 패키지 설치
sudo apt-get update
sudo apt-get install -y cloud-guest-utils
```

### 파일 시스템이 확장되지 않음
```bash
# 인스턴스 재부팅 후 다시 시도
sudo reboot
```

### 디스크 경로가 다른 경우
```bash
# 실제 디스크 경로 확인
lsblk
df -h
# 위 결과를 보고 실제 경로 사용 (예: /dev/xvda1)
```

