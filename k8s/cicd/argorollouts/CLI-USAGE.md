# kubectl-argo-rollouts CLI 사용법

## 🔧 문제 해결

**오류:** `error: unknown command "argo" for "kubectl"`

**원인:** kubectl 플러그인으로 등록되지 않음

**해결:** `kubectl-argo-rollouts`를 직접 사용하거나 플러그인으로 등록

---

## ✅ 해결 방법

### 방법 1: 직접 사용 (가장 간단)

**`kubectl argo rollouts` 대신 `kubectl-argo-rollouts` 사용:**

```bash
# 기존 명령어
kubectl argo rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo

# 변경된 명령어
kubectl-argo-rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo
```

---

### 방법 2: kubectl 플러그인으로 등록

**심볼릭 링크 생성:**

```bash
# kubectl이 플러그인을 찾는 경로 확인
kubectl plugin list

# 플러그인 디렉토리에 심볼릭 링크 생성
mkdir -p ~/.local/bin
ln -s /usr/local/bin/kubectl-argo-rollouts ~/.local/bin/kubectl-argo_rollouts

# PATH에 추가 (선택사항)
export PATH=$PATH:~/.local/bin
```

**또는:**

```bash
# KREW 사용 (권장)
kubectl krew install rollouts
```

---

## 📋 명령어 변환표

| kubectl 플러그인 형식 | 직접 사용 형식 |
|---------------------|--------------|
| `kubectl argo rollouts get rollout <name>` | `kubectl-argo-rollouts get rollout <name>` |
| `kubectl argo rollouts set image <name> <container>=<image>` | `kubectl-argo-rollouts set image <name> <container>=<image>` |
| `kubectl argo rollouts promote <name>` | `kubectl-argo-rollouts promote <name>` |
| `kubectl argo rollouts undo <name>` | `kubectl-argo-rollouts undo <name>` |
| `kubectl argo rollouts dashboard` | `kubectl-argo-rollouts dashboard` |

---

## 🚀 지금 바로 사용

### Green 버전 배포

```bash
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

### 상태 확인

```bash
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
```

### Promote

```bash
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo
```

### 롤백

```bash
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

### 대시보드 실행

```bash
kubectl-argo-rollouts dashboard
```

---

## 💡 편의를 위한 alias 설정

**~/.bashrc에 추가:**

```bash
alias krollouts='kubectl-argo-rollouts'
```

**사용:**
```bash
krollouts get rollout rollouts-demo -n rollouts-demo
krollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo
```

---

## ✅ 확인

**CLI가 설치되어 있는지 확인:**

```bash
kubectl-argo-rollouts version
```

**출력 예시:**
```
kubectl-argo-rollouts: v1.8.3+49fa151
```

---

## 🎯 결론

**`kubectl argo rollouts` 대신 `kubectl-argo-rollouts`를 직접 사용하세요!**

모든 명령어에서 `kubectl argo rollouts` → `kubectl-argo-rollouts`로 변경하면 됩니다.

