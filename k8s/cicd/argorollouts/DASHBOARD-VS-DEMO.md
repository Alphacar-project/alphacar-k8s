# 대시보드 vs 데모 앱 구분

## 🎯 두 가지 다른 화면

### 1. Argo Rollouts Dashboard (실제 대시보드) ⭐
**URL**: http://localhost:9003/rollouts/

**용도**: 
- ✅ **실제 배포 관리**
- ✅ **Promote, Abort, Retry 버튼**
- ✅ **Rollout 상태 모니터링**
- ✅ **우리 서비스 (frontend) 관리**

**기능**:
- Rollout 목록 보기
- Rollout 상세 정보
- Promote 버튼 (Blue → Green 전환)
- Abort 버튼 (롤백)
- Retry 버튼
- 리비전 히스토리

**우리가 사용하는 것**: ✅ **이것입니다!**

---

### 2. Rollouts-demo 앱 (시연용 앱) 🎨
**URL**: 
- http://localhost:9001 (Blue/Active)
- http://localhost:9002 (Green/Preview)

**용도**:
- ✅ **시각적 데모** (색상 변화 확인)
- ✅ **Blue-Green 배포 시연**
- ❌ **실제 배포 관리 불가**

**기능**:
- 색상 그리드 표시
- ERROR/LATENCY 슬라이더
- 시각적 효과만 제공

**우리가 사용하는 것**: ❌ **시연용일 뿐**

---

## 📊 비교표

| 항목 | Argo Rollouts Dashboard | Rollouts-demo 앱 |
|------|------------------------|------------------|
| **URL** | http://localhost:9003/rollouts/ | http://localhost:9001, 9002 |
| **용도** | 실제 배포 관리 | 시각적 데모 |
| **Promote 버튼** | ✅ 있음 | ❌ 없음 |
| **Abort 버튼** | ✅ 있음 | ❌ 없음 |
| **우리 서비스 관리** | ✅ 가능 (frontend) | ❌ 불가능 |
| **색상 변화 확인** | ❌ 없음 | ✅ 있음 |

---

## 🎬 영상 촬영 시 사용법

### 실제 배포 관리
**Argo Rollouts Dashboard** (http://localhost:9003/rollouts/)에서:
1. `frontend` Rollout 선택
2. **Promote** 버튼 클릭
3. **Abort** 버튼 클릭 (롤백)

### 시각적 확인
**Rollouts-demo 앱** (http://localhost:9001, 9002)에서:
1. 색상 변화 확인 (파란색 → 초록색)
2. Blue-Green 배포 시각화

---

## ✅ 정리

### 우리가 실제로 사용하는 것:
- **Argo Rollouts Dashboard** (http://localhost:9003/rollouts/)
  - frontend 배포 관리
  - Promote, Abort 버튼 사용
  - 실제 배포 제어

### 시연용으로만 사용하는 것:
- **Rollouts-demo 앱** (http://localhost:9001, 9002)
  - 색상 변화 시각화
  - Blue-Green 개념 설명용
  - 실제 배포 제어 불가

---

## 🎯 올바른 사용법

### Step 1: Dashboard에서 배포 관리
```
http://localhost:9003/rollouts/
→ frontend 선택
→ Promote 버튼 클릭
```

### Step 2: 데모 앱에서 시각적 확인 (선택사항)
```
http://localhost:9001
→ 색상 변화 확인
```

---

## 💡 핵심 포인트

1. **Dashboard = 실제 배포 관리 도구** ✅
2. **Rollouts-demo = 시각적 데모 앱** (참고용)
3. **우리 서비스 (frontend)는 Dashboard에서 관리**
4. **Rollouts-demo는 Blue-Green 개념 설명용**

