# 대시보드 Promote 버튼 찾기

## 📊 현재 상태

이미지에서 확인:
- **Revision 2**: 크리스마스 버전 (Preview) ✅
- **Revision 1**: 이전 버전 (Stable/Active) ✅

---

## 🎯 Promote 버튼 찾기

### 방법 1: 메인 화면으로 돌아가기

1. **상단의 "Rollouts" 또는 뒤로가기 버튼 클릭**
2. 메인 화면에서 `frontend` Rollout 카드 확인
3. 카드 하단에 **"Promote" 버튼**이 있어야 함

### 방법 2: 상단 액션 버튼

1. 상세 페이지 상단 확인
2. **"Promote" 버튼**이 상단 액션 영역에 있을 수 있음

### 방법 3: 터미널 사용 (가장 확실)

대시보드에서 버튼을 찾기 어렵다면 터미널 사용:

```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## 📋 영상 촬영 순서 (수정)

### Step 4: Promote 실행

**옵션 1: 대시보드에서**
1. 메인 화면으로 돌아가기 (상단 "Rollouts" 클릭)
2. `frontend` Rollout 카드에서 **"Promote" 버튼** 클릭

**옵션 2: 터미널에서 (권장)**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**확인**:
- 브라우저: https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" 나타남 확인

---

## ✅ 정리

- Preview는 정상적으로 보임 ✅
- Promote 버튼은 메인 화면에 있거나
- 터미널 명령어 사용 권장

