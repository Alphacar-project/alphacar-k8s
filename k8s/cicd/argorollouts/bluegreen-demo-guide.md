# Blue-Green 배포 + Argo Rollouts 대시보드 영상 촬영 가이드

## 🎬 영상 촬영을 위한 설정

### 1. Argo Rollouts UI 설치

```bash
# Argo Rollouts 설치 (아직 안 했다면)
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./install-argo-rollouts.sh

# Argo Rollouts UI 설치
kubectl apply -f argo-rollouts-ui.yaml
```

### 2. 대시보드 접근 방법

#### 방법 1: Port Forward (로컬 접근)
```bash
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
```
브라우저에서 `http://localhost:3100` 접근

#### 방법 2: Istio Gateway를 통한 접근
- Gateway에 `rollouts.alphacar.cloud` 도메인 추가 필요
- `http://rollouts.alphacar.cloud` 접근

### 3. Blue-Green 배포 적용

```bash
# Blue-Green 배포 적용
kubectl apply -f main-backend-rollout-bluegreen.yaml

# 상태 확인
kubectl get rollout main-backend -n apc-be-ns
kubectl argo rollouts get rollout main-backend -n apc-be-ns
```

## 🎥 영상 촬영 시나리오

### 시나리오 1: 기본 Blue-Green 배포

1. **초기 상태 확인**
   ```bash
   kubectl argo rollouts get rollout main-backend -n apc-be-ns
   ```
   - 대시보드에서 현재 버전 확인
   - Stable 버전이 실행 중인 상태

2. **새 버전 이미지 업데이트**
   ```bash
   kubectl argo rollouts set image main-backend \
     main-backend=192.168.0.170:30000/alphacar/alphacar-main:1.0.33-newversion \
     -n apc-be-ns
   ```

3. **대시보드에서 확인**
   - Preview 버전이 생성되는 과정
   - Blue (Stable)와 Green (Preview) 두 버전이 동시에 실행
   - 트래픽은 아직 Blue(Stable)로만 라우팅

4. **새 버전 승인 (Promote)**
   ```bash
   kubectl argo rollouts promote main-backend -n apc-be-ns
   ```
   - 대시보드에서 트래픽이 Green(Preview)로 전환되는 과정 확인
   - Blue(Stable)가 자동으로 스케일 다운

5. **롤백 (필요시)**
   ```bash
   kubectl argo rollouts undo main-backend -n apc-be-ns
   ```
   - 트래픽이 다시 Blue로 전환되는 과정 확인

### 시나리오 2: 단계별 상세 데모

#### Step 1: 초기 배포
```bash
# 현재 버전 확인
kubectl get pods -n apc-be-ns -l app=main-backend --show-labels
kubectl get svc -n apc-be-ns | grep main-backend
```

#### Step 2: 새 버전 배포 시작
```bash
# 이미지 업데이트
kubectl argo rollouts set image main-backend \
  main-backend=192.168.0.170:30000/alphacar/alphacar-main:1.0.34-demo \
  -n apc-be-ns

# 실시간 상태 확인
watch kubectl argo rollouts get rollout main-backend -n apc-be-ns
```

#### Step 3: Preview 버전 테스트
```bash
# Preview 서비스로 직접 접근 테스트
kubectl port-forward -n apc-be-ns svc/main-backend-preview 3001:3000

# 다른 터미널에서 테스트
curl http://localhost:3001/health
```

#### Step 4: 프로덕션 전환
```bash
# 승인 (Promote)
kubectl argo rollouts promote main-backend -n apc-be-ns

# 대시보드에서 전환 과정 확인
```

## 📊 대시보드에서 확인할 수 있는 정보

1. **Rollout 상태**
   - 현재 버전 (Stable)
   - 새 버전 (Preview)
   - 트래픽 분배 상태

2. **Pod 상태**
   - Blue Pods (Stable)
   - Green Pods (Preview)
   - 각 Pod의 상태 및 리소스 사용량

3. **트래픽 라우팅**
   - VirtualService 설정
   - DestinationRule 서브셋
   - 현재 트래픽이 어느 버전으로 가는지

4. **이벤트 히스토리**
   - 배포 이벤트
   - 승인/롤백 이벤트
   - 에러 발생 시 상세 정보

## 🎯 영상 촬영 팁

### 1. 화면 구성
- **왼쪽**: Argo Rollouts 대시보드
- **오른쪽**: 터미널 (명령어 실행)
- 또는 전체 화면으로 대시보드만 보여주기

### 2. 명령어 준비
```bash
# 빠른 참조용 명령어
cat << 'EOF'
# 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 새 버전 배포
kubectl argo rollouts set image main-backend \
  main-backend=192.168.0.170:30000/alphacar/alphacar-main:NEW_VERSION \
  -n apc-be-ns

# 승인
kubectl argo rollouts promote main-backend -n apc-be-ns

# 롤백
kubectl argo rollouts undo main-backend -n apc-be-ns

# 실시간 모니터링
watch kubectl argo rollouts get rollout main-backend -n apc-be-ns
EOF
```

### 3. 시각적 효과를 위한 설정
- 배포 전에 충분한 대기 시간 (Preview 생성 확인)
- 명확한 버전 차이 (이미지 태그를 명확하게)
- 색상 구분 (Blue/Green을 시각적으로 구분)

### 4. 설명 포인트
1. **Blue-Green 배포의 장점**
   - 빠른 전환
   - 즉시 롤백 가능
   - 제로 다운타임

2. **Istio 통합**
   - VirtualService를 통한 트래픽 제어
   - 서비스 메시의 이점

3. **Argo Rollouts의 역할**
   - 배포 자동화
   - 상태 관리
   - 롤백 지원

## 🔧 트러블슈팅

### 대시보드가 안 보이는 경우
```bash
# Pod 상태 확인
kubectl get pods -n argo-rollouts

# 로그 확인
kubectl logs -n argo-rollouts deployment/argo-rollouts-ui

# Service 확인
kubectl get svc -n argo-rollouts
```

### Port Forward가 안 되는 경우
```bash
# 다른 포트 사용
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 8080:3100
```

### Rollout이 진행되지 않는 경우
```bash
# 상세 정보 확인
kubectl describe rollout main-backend -n apc-be-ns

# 이벤트 확인
kubectl get events -n apc-be-ns --sort-by='.lastTimestamp'
```

## 📝 체크리스트

영상 촬영 전 확인사항:
- [ ] Argo Rollouts 설치 완료
- [ ] Argo Rollouts UI 설치 및 접근 가능
- [ ] Blue-Green Rollout 배포 완료
- [ ] 테스트용 새 이미지 준비
- [ ] 대시보드 화면 캡처 준비
- [ ] 명령어 스크립트 준비
- [ ] 설명 대본 준비

