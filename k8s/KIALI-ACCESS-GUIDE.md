# Kiali 접근 가이드 - Istio AuthorizationPolicy 시각화

## 📋 Kiali 개요

**Kiali**는 Istio Service Mesh의 관찰 가능성(Observability) 도구로, 다음을 시각적으로 볼 수 있습니다:

- ✅ **Service Mesh 토폴로지**: 서비스 간 연결 관계 그래프
- ✅ **AuthorizationPolicy**: 보안 정책 시각화 및 관리
- ✅ **VirtualService/Route**: 라우팅 규칙 시각화
- ✅ **DestinationRule**: 트래픽 정책 시각화
- ✅ **메트릭**: 트래픽, 에러율, 레이턴시 등
- ✅ **분산 추적**: Jaeger 연동 (설정된 경우)

## 🔍 현재 설치 상태

```bash
# Kiali Pod 확인
kubectl get pods -n istio-system -l app.kubernetes.io/name=kiali

# Kiali Service 확인
kubectl get svc kiali -n istio-system
```

**현재 상태:**
- ✅ Kiali 설치됨 (`istio-system` 네임스페이스)
- ✅ Service Type: ClusterIP
- ✅ 포트: 20001 (HTTP), 9090 (Metrics)

## 🚀 접근 방법

### 방법 1: Port-Forward (가장 간단)

```bash
# Kiali 포트 포워딩
kubectl port-forward -n istio-system svc/kiali 20001:20001

# 또는 Pod 직접 연결
kubectl port-forward -n istio-system deployment/kiali 20001:20001
```

**접속 URL:**
- http://localhost:20001

**기본 로그인 정보:**
- Username: `admin`
- Password: (Kiali Secret에서 확인 필요)

### 방법 2: NodePort로 노출 (외부 접근 가능)

```bash
# Service를 NodePort로 변경
kubectl patch svc kiali -n istio-system -p '{"spec":{"type":"NodePort","ports":[{"port":20001,"targetPort":20001,"nodePort":30001}]}}'
```

**접속 URL:**
- http://<NodeIP>:30001

### 방법 3: Istio Gateway를 통한 접근 (프로덕션 권장)

Gateway와 VirtualService를 생성하여 외부에서 접근:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: kiali-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - kiali.192.168.0.170.nip.io  # 또는 실제 도메인
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: kiali-vs
  namespace: istio-system
spec:
  hosts:
  - kiali.192.168.0.170.nip.io
  gateways:
  - kiali-gateway
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: kiali.istio-system.svc.cluster.local
        port:
          number: 20001
```

## 🔑 인증 정보 확인

```bash
# Kiali Secret에서 비밀번호 확인
kubectl get secret kiali -n istio-system -o jsonpath='{.data.passphrase}' | base64 -d && echo ""
```

또는:

```bash
# 전체 인증 정보 확인
kubectl get secret kiali -n istio-system -o yaml
```

## 📊 AuthorizationPolicy 시각화 방법

### 1. Kiali UI에서 확인

**접속 후:**
1. **Overview** 탭: 전체 서비스 메시 개요
2. **Graph** 탭: 서비스 간 연결 그래프
3. **Security** 탭: **AuthorizationPolicy** 목록 및 상세 정보
4. **Istio Config** 탭: 모든 Istio 리소스 관리

**AuthorizationPolicy 확인 절차:**
```
1. Kiali 접속 → Security 탭 클릭
2. AuthorizationPolicies 목록 확인
3. 각 정책 클릭하여 상세 정보 확인
   - 적용된 워크로드
   - 규칙 (Rules)
   - 액션 (ALLOW/DENY)
   - 소스/대상 네임스페이스
```

### 2. Graph에서 정책 확인

**Graph 탭에서:**
- 서비스 간 연결선에 보안 정책 아이콘 표시
- 정책이 적용된 서비스에 표시
- 정책 위반 시 경고 표시

**표시 옵션:**
- Display → Security 활성화
- 보안 정책이 적용된 엣지(연결선) 표시

### 3. Istio Config에서 관리

**Istio Config 탭:**
- AuthorizationPolicy 목록
- 정책 생성/수정/삭제
- 정책 유효성 검사
- 정책 비교

## 🎯 현재 설정된 AuthorizationPolicy 확인

```bash
# 모든 AuthorizationPolicy 목록
kubectl get authorizationpolicy -A

# 특정 네임스페이스의 정책
kubectl get authorizationpolicy -n apc-be-ns
kubectl get authorizationpolicy -n apc-db-ns

# 정책 상세 정보
kubectl get authorizationpolicy <policy-name> -n <namespace> -o yaml
```

**현재 설정된 정책 (7개):**
- `apc-be-ns`: 5개 (백엔드 서비스별)
- `apc-db-ns`: 1개 (데이터베이스)
- 기타 네임스페이스: 1개

## 🔧 Kiali 설정 커스터마이징

### 외부 접근을 위한 Service 수정

```bash
# Service를 NodePort로 변경
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: kiali
  namespace: istio-system
spec:
  type: NodePort
  ports:
  - port: 20001
    targetPort: 20001
    protocol: TCP
    name: http
    nodePort: 30001
  selector:
    app.kubernetes.io/name: kiali
EOF
```

### Kiali ConfigMap 확인

```bash
# Kiali 설정 확인
kubectl get configmap kiali -n istio-system -o yaml

# 외부 접근 허용 설정 확인
kubectl get configmap kiali -n istio-system -o jsonpath='{.data.config}' | jq '.server.web_root'
```

## 📝 빠른 시작 명령어

```bash
# 1. Kiali 포트 포워딩 (백그라운드)
kubectl port-forward -n istio-system svc/kiali 20001:20001 &

# 2. 브라우저에서 접속
# http://localhost:20001

# 3. 로그인 정보 확인
kubectl get secret kiali -n istio-system -o jsonpath='{.data.username}' | base64 -d && echo ""
kubectl get secret kiali -n istio-system -o jsonpath='{.data.passphrase}' | base64 -d && echo ""

# 4. AuthorizationPolicy 확인
kubectl get authorizationpolicy -A
```

## 🌐 네임스페이스별 정책 확인

```bash
# 백엔드 네임스페이스 정책
kubectl get authorizationpolicy -n apc-be-ns -o wide

# 데이터베이스 네임스페이스 정책
kubectl get authorizationpolicy -n apc-db-ns -o wide

# 모든 정책 상세 정보
kubectl get authorizationpolicy -A -o yaml | grep -A 20 "name:"
```

## 📸 Kiali UI 스크린샷 위치

Kiali에서 AuthorizationPolicy를 확인하는 주요 화면:

1. **Security 탭**: 모든 AuthorizationPolicy 목록
2. **Graph 탭**: 서비스 간 보안 정책 적용 상태
3. **Istio Config → AuthorizationPolicies**: 정책 관리 및 편집

## 🔗 관련 문서

- [Istio AuthorizationPolicy 문서](https://istio.io/latest/docs/reference/config/security/authorization-policy/)
- [Kiali 공식 문서](https://kiali.io/documentation/)
- [프로젝트 AuthorizationPolicy 정리](./ISTIO-AND-NETWORK-POLICIES.md)

## ⚠️ 주의사항

1. **프로덕션 환경**: Gateway를 통한 접근 권장 (Port-Forward는 개발용)
2. **인증**: 기본 admin 계정 변경 권장
3. **네트워크 정책**: Kiali 접근을 위한 네트워크 정책 확인 필요
4. **리소스 사용량**: Kiali는 메모리를 상당히 사용하므로 리소스 모니터링 필요

---

**요약**: Kiali는 Istio AuthorizationPolicy를 시각적으로 확인하고 관리할 수 있는 가장 좋은 도구입니다. Port-Forward를 통해 간단하게 접근할 수 있으며, Security 탭과 Graph 탭에서 정책을 확인할 수 있습니다.




