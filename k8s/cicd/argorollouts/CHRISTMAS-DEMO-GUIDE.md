# Hello 크리스마스 Blue-Green 배포 시나리오

## 🎯 목표

프론트엔드에 "Hello 크리스마스" 텍스트를 추가하고, Blue-Green 배포와 롤백을 시연합니다.

---

## 📝 Step 1: 코드 수정

### 파일: `dev/alphacar/frontend/app/page.tsx`

**322번째 줄 수정:**

```tsx
// 기존
<h2 style={{ fontSize: "30px", fontWeight: "700", color: "#2563eb", marginBottom: "10px" }}>
  고객님, 어떤 차를 찾으시나요? 
</h2>

// 변경 후
<h2 style={{ fontSize: "30px", fontWeight: "700", color: "#2563eb", marginBottom: "10px" }}>
  고객님, 어떤 차를 찾으시나요? <span style={{ color: "#dc2626", fontSize: "28px" }}>Hello 크리스마스 🎄</span>
</h2>
```

---

## 🚀 Step 2: 이미지 빌드 및 배포

### 방법 1: Jenkins를 통한 자동 배포

1. **코드 수정 후 GitHub Push**
   ```bash
   git add dev/alphacar/frontend/app/page.tsx
   git commit -m "Add Hello 크리스마스 text for Blue-Green demo"
   git push origin main
   ```

2. **Jenkins 자동 빌드**
   - GitHub webhook으로 자동 트리거
   - 이미지 빌드 및 Harbor Push
   - Manifest 업데이트

3. **ArgoCD 자동 배포**
   - ArgoCD가 변경사항 감지
   - Rollout 자동 업데이트

### 방법 2: 수동 배포 (빠른 데모용)

```bash
# 1. 이미지 빌드
cd /home/alphacar/alphacar-final/dev/alphacar/frontend
docker build -f Dockerfile -t 192.168.0.170:30000/alphacar/frontend:1.0.054-christmas .

# 2. Harbor에 Push
docker login 192.168.0.170:30000
docker push 192.168.0.170:30000/alphacar/frontend:1.0.054-christmas

# 3. Rollout 이미지 업데이트
kubectl argo rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

---

## 🎬 Step 3: Blue-Green 배포 시연

### 3-1. 초기 상태 확인

```bash
# Rollout 상태 확인
kubectl argo rollouts get rollout frontend -n apc-fe-ns

# Pod 상태 확인
kubectl get pods -n apc-fe-ns -l app=frontend --show-labels

# 브라우저에서 확인
# https://alphacar.cloud
# → "고객님, 어떤 차를 찾으시나요?" 만 보임 (Hello 크리스마스 없음)
```

### 3-2. 새 버전 배포 시작

```bash
# 이미지 업데이트
kubectl argo rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

**Argo Rollouts 대시보드에서 확인:**
- Preview 버전이 생성되는 과정
- Blue (Stable)와 Green (Preview) 두 버전이 동시에 실행
- 트래픽은 아직 Blue(Stable)로만 라우팅

**브라우저 확인:**
- 여전히 "Hello 크리스마스" 없음 (Stable 버전)

### 3-3. Preview 버전 테스트

```bash
# Preview 서비스로 직접 접근 테스트
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8001:8000

# 다른 터미널에서
curl http://localhost:8001
# 또는 브라우저에서 http://localhost:8001 접근
# → "Hello 크리스마스 🎄" 텍스트 확인!
```

### 3-4. 프로덕션 전환 (Promote)

```bash
# 승인 (Promote)
kubectl argo rollouts promote frontend -n apc-fe-ns
```

**Argo Rollouts 대시보드에서 확인:**
- 트래픽이 Green(Preview)로 전환되는 과정
- Blue(Stable)가 자동으로 스케일 다운

**브라우저 확인:**
- https://alphacar.cloud 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

---

## 🔄 Step 4: 롤백 시연

### 4-1. 롤백 실행

```bash
# 이전 버전으로 롤백
kubectl argo rollouts undo frontend -n apc-fe-ns
```

**Argo Rollouts 대시보드에서 확인:**
- 트래픽이 다시 Blue(Stable)로 전환되는 과정
- Green(Preview)가 스케일 다운

**브라우저 확인:**
- https://alphacar.cloud 접근
- "Hello 크리스마스 🎄" 텍스트 사라짐
- 원래 상태로 복구됨

### 4-2. 롤백 상태 확인

```bash
# Rollout 상태 확인
kubectl argo rollouts get rollout frontend -n apc-fe-ns

# 리비전 확인
kubectl argo rollouts history frontend -n apc-fe-ns
```

---

## 📊 시연 체크리스트

### 배포 전
- [ ] 코드 수정 완료 ("Hello 크리스마스" 추가)
- [ ] 이미지 빌드 및 Push 완료
- [ ] Rollout 배포 완료
- [ ] Argo Rollouts 대시보드 접근 가능

### 배포 시연
- [ ] 초기 상태 확인 (Hello 크리스마스 없음)
- [ ] 새 버전 배포 시작
- [ ] Preview 버전 테스트 (Hello 크리스마스 있음)
- [ ] Promote 실행
- [ ] 프로덕션에서 Hello 크리스마스 확인

### 롤백 시연
- [ ] 롤백 실행
- [ ] 프로덕션에서 Hello 크리스마스 사라짐 확인
- [ ] 원래 상태 복구 확인

---

## 🎥 영상 촬영 시나리오

### 시나리오 A: 전체 플로우 (5-7분)

1. **초기 상태** (30초)
   - 브라우저: "고객님, 어떤 차를 찾으시나요?" (Hello 크리스마스 없음)
   - Argo Rollouts 대시보드: Stable 버전 실행 중

2. **코드 수정** (30초)
   - 코드에 "Hello 크리스마스 🎄" 추가
   - Git commit & push

3. **자동 배포** (1분)
   - Jenkins 빌드 시작
   - Harbor에 이미지 Push
   - ArgoCD 자동 배포

4. **Preview 확인** (1분)
   - Argo Rollouts 대시보드: Preview 버전 생성 확인
   - Preview 서비스로 접근: Hello 크리스마스 확인

5. **Promote** (1분)
   - Argo Rollouts 대시보드에서 Promote 실행
   - 트래픽 전환 확인
   - 프로덕션에서 Hello 크리스마스 확인

6. **롤백** (1분)
   - 롤백 실행
   - 프로덕션에서 Hello 크리스마스 사라짐 확인

### 시나리오 B: 빠른 데모 (3-4분)

1. **초기 상태** (20초)
   - 브라우저: Hello 크리스마스 없음

2. **수동 배포** (1분)
   - `kubectl argo rollouts set image` 실행
   - Preview 버전 생성 확인

3. **Promote** (30초)
   - Promote 실행
   - 프로덕션에서 Hello 크리스마스 확인

4. **롤백** (30초)
   - 롤백 실행
   - 원래 상태 복구 확인

---

## 💡 팁

### 시각적 효과를 위한 추가 설정

1. **더 눈에 띄는 스타일**
   ```tsx
   <span style={{ 
     color: "#dc2626", 
     fontSize: "32px", 
     fontWeight: "bold",
     textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
     animation: "pulse 2s infinite"
   }}>
     Hello 크리스마스 🎄
   </span>
   ```

2. **애니메이션 추가** (선택사항)
   ```css
   @keyframes pulse {
     0%, 100% { opacity: 1; }
     50% { opacity: 0.7; }
   }
   ```

---

## 🔧 트러블슈팅

### Preview 버전이 생성되지 않는 경우

```bash
# Rollout 상태 확인
kubectl describe rollout frontend -n apc-fe-ns

# Pod 상태 확인
kubectl get pods -n apc-fe-ns -l app=frontend
```

### 트래픽이 전환되지 않는 경우

```bash
# VirtualService 확인
kubectl get virtualservice frontend-vs -n apc-fe-ns -o yaml

# DestinationRule 확인
kubectl get destinationrule frontend-dr -n apc-fe-ns -o yaml
```

---

## 📝 요약

1. **코드 수정**: "Hello 크리스마스 🎄" 추가
2. **이미지 빌드**: 새 버전 이미지 생성
3. **Rollout 배포**: `kubectl argo rollouts set image`
4. **Preview 확인**: 새 버전 테스트
5. **Promote**: 프로덕션 전환
6. **롤백**: 이전 버전으로 복구

**→ 완벽한 Blue-Green 배포 시연 완료!**

