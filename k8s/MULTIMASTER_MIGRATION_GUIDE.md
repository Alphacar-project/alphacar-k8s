# 멀티마스터 클러스터 이전 가이드

## 🎯 목표

로컬 환경에서 멀티마스터 Kubernetes 클러스터로 완전 이전

**멀티마스터 클러스터 정보**:
- a-master1: 192.168.0.170
- a-master2: 192.168.0.171
- a-master3: 192.168.0.172
- a-worker1: 192.168.0.173
- a-worker2: 192.168.0.174
- a-worker3: 192.168.0.175
- a-worker4: 192.168.0.176
- a-worker5: 192.168.0.177
- a-haproxy: 192.168.0.178

---

## 📋 사전 준비사항

### 1. 멀티마스터 클러스터 준비
- [ ] Kubernetes 클러스터 구축 완료
- [ ] kubectl 설정 완료 (멀티마스터 클러스터 연결)
- [ ] 네트워크 접근 확인 (외부 서비스 연결 가능)

### 2. 필요한 도구
- `git`: GitHub에서 코드 클론
- `kubectl`: Kubernetes CLI
- `bash`: 배포 스크립트 실행

### 3. 외부 서비스 접근 확인
다음 IP에 접근 가능한지 확인:
- MongoDB: `192.168.0.201:27017`
- Redis: `192.168.0.175:6379`
- MariaDB: `211.46.52.151:15432`
- Harbor Registry: `192.168.0.169`

---

## 🚀 이전 절차

### Step 1: GitHub에서 코드 클론

```bash
# 멀티마스터 클러스터의 마스터 노드에서 실행
cd ~
git clone https://github.com/qkdgur4/alphacar-final.git
cd alphacar-final
```

### Step 2: 시크릿 파일 생성

**중요**: `SECRETS_FOR_MULTIMASTER.md` 문서를 로컬에서 안전하게 전달받아야 합니다.

```bash
# 템플릿 파일 복사
cp k8s/configmap-secret/secret-aws-bedrock.yaml.template k8s/configmap-secret/secret-aws-bedrock.yaml
cp k8s/monitoring-analysis/secret.yaml.template k8s/monitoring-analysis/secret.yaml
cp k8s/configmap-secret/secret-db.yaml.template k8s/configmap-secret/secret-db.yaml

# SECRETS_FOR_MULTIMASTER.md 문서의 값으로 파일 수정
vi k8s/configmap-secret/secret-aws-bedrock.yaml
vi k8s/monitoring-analysis/secret.yaml
vi k8s/configmap-secret/secret-db.yaml
```

또는 자동 스크립트 사용:
```bash
# SECRETS_FOR_MULTIMASTER.md 문서를 먼저 받은 후
chmod +x k8s/scripts/create-secrets-multimaster.sh
./k8s/scripts/create-secrets-multimaster.sh
```

### Step 3: ConfigMap 환경별 설정 수정

멀티마스터 환경에 맞게 ConfigMap 수정:

```bash
vi k8s/configmap-secret/configmap-env.yaml
```

**수정 필요 사항**:
```yaml
# 변경 전 (로컬 환경)
NIP_DOMAIN: "192.168.0.160.nip.io"
OTEL_ENDPOINT: "http://192.168.0.160:4317"

# 변경 후 (멀티마스터 환경)
NIP_DOMAIN: "192.168.0.178.nip.io"  # HAProxy IP
OTEL_ENDPOINT: "http://192.168.0.178:4317"  # 또는 내부 서비스
```

### Step 4: 네임스페이스 생성

```bash
kubectl apply -f k8s/namespace/namespace.yaml
```

### Step 5: 시크릿 및 ConfigMap 배포

```bash
# ConfigMap 배포
kubectl apply -f k8s/configmap-secret/configmap-env.yaml

# 시크릿 배포 (Step 2에서 생성한 파일들)
kubectl apply -f k8s/configmap-secret/secret-aws-bedrock.yaml
kubectl apply -f k8s/configmap-secret/secret-db.yaml
kubectl apply -f k8s/monitoring-analysis/secret.yaml
```

### Step 6: Harbor Registry Secret 생성

```bash
kubectl create secret docker-registry harbor-registry-secret \
  --docker-server=192.168.0.169 \
  --docker-username=<your-username> \
  --docker-password=<your-password> \
  --namespace=alphacar
```

### Step 7: 서비스 배포

```bash
# Backend 서비스 배포
kubectl apply -f k8s/backend/

# Frontend 배포
kubectl apply -f k8s/frontend/

# Monitoring Analysis 배포
kubectl apply -f k8s/monitoring-analysis/

# Monitoring Stack 배포 (선택)
kubectl apply -f k8s/monitoring/

# Traefik 배포 (선택)
kubectl apply -f k8s/traefik/
```

### Step 8: 배포 확인

```bash
# Pod 상태 확인
kubectl get pods -n alphacar

# Service 확인
kubectl get svc -n alphacar

# Ingress 확인
kubectl get ingress -n alphacar
```

---

## 🔧 환경별 설정 변경 사항

### IP 주소 변경

| 항목 | 로컬 환경 | 멀티마스터 환경 |
|------|----------|----------------|
| Ingress Host | 192.168.0.160.nip.io | 192.168.0.178.nip.io (HAProxy) |
| OTEL Endpoint | 192.168.0.160:4317 | 192.168.0.178:4317 또는 내부 서비스 |
| NodePort 접근 | 192.168.56.200:30099 | HAProxy를 통한 접근 |

### 내부 서비스 (변경 불필요)

다음은 Kubernetes 내부 서비스이므로 변경 불필요:
- MongoDB: `mongodb-0.mongodb-headless.alphacar.svc.cluster.local`
- Prometheus: `prometheus.alphacar-obsv-ns.svc.cluster.local:9090`
- 기타 내부 서비스들

---

## 📝 체크리스트

### 이전 전 확인사항
- [ ] 멀티마스터 클러스터 구축 완료
- [ ] kubectl 연결 확인
- [ ] 외부 서비스 접근 가능 확인
- [ ] SECRETS_FOR_MULTIMASTER.md 문서 전달받음

### 이전 중 작업
- [ ] GitHub에서 코드 클론 완료
- [ ] 시크릿 파일 생성 완료
- [ ] ConfigMap 환경별 설정 수정 완료
- [ ] 네임스페이스 생성 완료
- [ ] 시크릿 및 ConfigMap 배포 완료
- [ ] Harbor Registry Secret 생성 완료
- [ ] 서비스 배포 완료

### 이전 후 확인
- [ ] 모든 Pod가 Running 상태
- [ ] Service 정상 작동
- [ ] Ingress 접근 가능
- [ ] 외부 서비스 연결 확인
- [ ] 모니터링 대시보드 접근 가능

---

## ⚠️ 주의사항

1. **시크릿 보안**: `SECRETS_FOR_MULTIMASTER.md` 문서는 절대 GitHub에 커밋하지 마세요!
2. **환경 분리**: 로컬 환경과 멀티마스터 환경의 설정을 명확히 구분하세요.
3. **네트워크**: 멀티마스터 클러스터에서 외부 서비스 접근이 가능한지 확인하세요.
4. **리소스**: 멀티마스터 클러스터의 리소스가 충분한지 확인하세요.

---

## 🔄 롤백 방법

문제 발생 시 롤백:

```bash
# 특정 서비스 롤백
kubectl rollout undo deployment/<deployment-name> -n alphacar

# 전체 삭제
kubectl delete -f k8s/backend/
kubectl delete -f k8s/frontend/
kubectl delete -f k8s/monitoring-analysis/
```

---

## 📞 트러블슈팅

### Pod가 시작되지 않는 경우
```bash
kubectl describe pod <pod-name> -n alphacar
kubectl logs <pod-name> -n alphacar
```

### 시크릿 관련 오류
```bash
kubectl get secrets -n alphacar
kubectl describe secret <secret-name> -n alphacar
```

### 외부 서비스 연결 실패
```bash
# 클러스터 내부에서 테스트
kubectl run test-pod --image=curlimages/curl -it --rm -- sh
curl -v 192.168.0.201:27017  # MongoDB 테스트
```

