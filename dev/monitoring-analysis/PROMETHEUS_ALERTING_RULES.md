# Prometheus Alerting Rules 설정 가이드

## 개요

Prometheus Alertmanager에서 알림이 발생하려면, **Prometheus에 Alerting Rules를 설정**해야 합니다. Alertmanager는 단순히 알림을 전달하는 역할만 하며, 실제 알림 생성은 Prometheus가 담당합니다.

## 알림 발생 프로세스

```
1. Prometheus → Alerting Rules 평가 (주기적으로)
2. 조건 만족 시 → Alert 생성 (firing 상태)
3. Alertmanager → 알림 수신 및 라우팅
4. Lambda Function → 워크플로우 시작
```

## Prometheus Alerting Rules 설정

### 1. Alerting Rules 파일 생성

`prometheus-alerts.yaml` 파일을 생성합니다:

```yaml
groups:
  - name: kubernetes-pod-alerts
    interval: 30s
    rules:
      # Pod CrashLoopBackOff 알림
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has restarted {{ $value }} times in the last 15 minutes."
      
      # Pod가 Pending 상태로 오래 머무름
      - alert: PodStuckPending
        expr: |
          kube_pod_status_phase{phase="Pending"} > 0
        for: 10m
        labels:
          severity: warning
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is stuck in Pending state"
          description: "Pod {{ $labels.pod }} has been in Pending state for more than 10 minutes."
      
      # Pod가 ImagePullBackOff 상태
      - alert: PodImagePullBackOff
        expr: |
          kube_pod_container_status_waiting_reason{reason="ImagePullBackOff"} > 0
        for: 5m
        labels:
          severity: critical
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} cannot pull image"
          description: "Pod {{ $labels.pod }} is in ImagePullBackOff state. Check image name, tag, or registry access."
      
      # Pod가 ErrImagePull 상태
      - alert: PodErrImagePull
        expr: |
          kube_pod_container_status_waiting_reason{reason="ErrImagePull"} > 0
        for: 5m
        labels:
          severity: critical
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} image pull error"
          description: "Pod {{ $labels.pod }} failed to pull image. Check image registry or authentication."
      
      # Pod가 ContainerCreating 상태로 오래 머무름
      - alert: PodStuckContainerCreating
        expr: |
          kube_pod_container_status_waiting_reason{reason="ContainerCreating"} > 0
        for: 10m
        labels:
          severity: warning
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is stuck creating container"
          description: "Pod {{ $labels.pod }} has been creating container for more than 10 minutes."
      
      # Pod가 OOMKilled 상태
      - alert: PodOOMKilled
        expr: |
          kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} > 0
        for: 1m
        labels:
          severity: critical
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} was killed due to OOM"
          description: "Pod {{ $labels.pod }} was terminated due to Out of Memory. Consider increasing memory limits."
  
  - name: kubernetes-resource-alerts
    interval: 30s
    rules:
      # 높은 CPU 사용률
      - alert: HighCPUUsage
        expr: |
          sum(rate(container_cpu_usage_seconds_total{container!="POD",container!=""}[5m])) by (pod, namespace) 
          / 
          sum(container_spec_cpu_quota{container!="POD",container!=""}/container_spec_cpu_period{container!="POD",container!=""}) by (pod, namespace) 
          * 100 > 85
        for: 5m
        labels:
          severity: warning
          component: resource
        annotations:
          summary: "High CPU usage on pod {{ $labels.namespace }}/{{ $labels.pod }}"
          description: "Pod {{ $labels.pod }} CPU usage is {{ $value }}% (threshold: 85%)"
      
      # 높은 메모리 사용률
      - alert: HighMemoryUsage
        expr: |
          (sum(container_memory_working_set_bytes{container!="POD",container!=""}) by (pod, namespace) 
          / 
          sum(container_spec_memory_limit_bytes{container!="POD",container!=""} > 0) by (pod, namespace)) 
          * 100 > 90
        for: 5m
        labels:
          severity: warning
          component: resource
        annotations:
          summary: "High memory usage on pod {{ $labels.namespace }}/{{ $labels.pod }}"
          description: "Pod {{ $labels.pod }} memory usage is {{ $value }}% (threshold: 90%)"
      
      # 노드 CPU 사용률 높음
      - alert: NodeHighCPUUsage
        expr: |
          (1 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])))) * 100 > 80
        for: 10m
        labels:
          severity: warning
          component: node
        annotations:
          summary: "High CPU usage on node {{ $labels.instance }}"
          description: "Node CPU usage is {{ $value }}% (threshold: 80%)"
      
      # 노드 메모리 사용률 높음
      - alert: NodeHighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
          component: node
        annotations:
          summary: "High memory usage on node {{ $labels.instance }}"
          description: "Node memory usage is {{ $value }}% (threshold: 85%)"
      
      # 디스크 사용률 높음
      - alert: NodeHighDiskUsage
        expr: |
          (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100 > 85
        for: 10m
        labels:
          severity: warning
          component: node
        annotations:
          summary: "High disk usage on node {{ $labels.instance }}"
          description: "Node disk usage is {{ $value }}% (threshold: 85%)"
  
  - name: kubernetes-availability-alerts
    interval: 30s
    rules:
      # Pod가 Ready 상태가 아님
      - alert: PodNotReady
        expr: |
          sum by (pod, namespace) (kube_pod_status_ready{condition="false"}) > 0
        for: 5m
        labels:
          severity: warning
          component: pod
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is not ready"
          description: "Pod {{ $labels.pod }} has been not ready for more than 5 minutes."
      
      # 노드가 NotReady 상태
      - alert: NodeNotReady
        expr: |
          kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 5m
        labels:
          severity: critical
          component: node
        annotations:
          summary: "Node {{ $labels.node }} is not ready"
          description: "Node {{ $labels.node }} has been in NotReady state for more than 5 minutes."
```

### 2. Prometheus ConfigMap에 Rules 추가

기존 Prometheus ConfigMap을 수정합니다:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: apc-obsv-ns
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'alphacar'
        replica: '0'
    
    # Alerting Rules 파일 경로
    rule_files:
      - "/etc/prometheus/rules/*.yaml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - 'alertmanager.apc-obsv-ns.svc.cluster.local:9093'
    
    scrape_configs:
      # ... 기존 scrape_configs ...
  
  # Alerting Rules 파일
  prometheus-alerts.yaml: |
    # 위의 prometheus-alerts.yaml 내용을 여기에 붙여넣기
```

### 3. Prometheus Deployment에 Rules 마운트 추가

Prometheus Deployment에 ConfigMap을 마운트합니다:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: apc-obsv-ns
spec:
  template:
    spec:
      containers:
      - name: prometheus
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-rules
          mountPath: /etc/prometheus/rules
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-rules
        configMap:
          name: prometheus-alerts-config
```

### 4. Rules ConfigMap 생성

```bash
# Alerting Rules ConfigMap 생성
kubectl create configmap prometheus-alerts-config \
  --from-file=prometheus-alerts.yaml=prometheus-alerts.yaml \
  -n apc-obsv-ns

# Prometheus ConfigMap 업데이트
kubectl apply -f prometheus-configmap.yaml -n apc-obsv-ns

# Prometheus 재시작
kubectl rollout restart deployment/prometheus -n apc-obsv-ns
```

## 알림 확인 방법

### 1. Prometheus UI에서 확인

```bash
# Prometheus 포트 포워딩
kubectl port-forward -n apc-obsv-ns svc/prometheus 9090:9090

# 브라우저에서 접속
# http://localhost:9090/alerts
```

### 2. Alertmanager UI에서 확인

```bash
# Alertmanager 포트 포워딩
kubectl port-forward -n apc-obsv-ns svc/alertmanager 9093:9093

# 브라우저에서 접속
# http://localhost:9093
```

### 3. 테스트 알림 생성

```bash
# 테스트 알림 수동 생성
kubectl run test-alert --image=busybox --rm -it --restart=Never -- \
  sh -c "curl -X POST http://alertmanager.apc-obsv-ns.svc.cluster.local:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    \"labels\": {
      \"alertname\": \"TestAlert\",
      \"namespace\": \"default\",
      \"pod\": \"test-pod\",
      \"severity\": \"critical\"
    },
    \"annotations\": {
      \"summary\": \"Test alert for AIOps workflow\",
      \"description\": \"This is a test alert to verify the workflow system\"
    },
    \"status\": \"firing\"
  }]'"
```

## 주요 알림 규칙 설명

### Pod 상태 관련
- **PodCrashLooping**: Pod가 15분 내 재시작 발생
- **PodStuckPending**: Pod가 10분 이상 Pending 상태
- **PodImagePullBackOff**: 이미지 다운로드 실패
- **PodOOMKilled**: 메모리 부족으로 종료

### 리소스 사용률 관련
- **HighCPUUsage**: Pod CPU 사용률 85% 초과 (5분 지속)
- **HighMemoryUsage**: Pod 메모리 사용률 90% 초과 (5분 지속)
- **NodeHighCPUUsage**: 노드 CPU 사용률 80% 초과
- **NodeHighDiskUsage**: 노드 디스크 사용률 85% 초과

### 가용성 관련
- **PodNotReady**: Pod가 5분 이상 Ready 상태 아님
- **NodeNotReady**: 노드가 5분 이상 NotReady 상태

## 커스터마이징

알림 규칙은 환경에 맞게 조정할 수 있습니다:

- **임계값 조정**: CPU/메모리 사용률 임계값 변경
- **지속 시간 조정**: `for` 필드 값 변경 (예: 5m → 10m)
- **심각도 조정**: `severity` 레이블 변경 (critical, warning, info)
- **새로운 규칙 추가**: `groups` 배열에 새 규칙 추가

## 문제 해결

### 알림이 발생하지 않는 경우

1. **Prometheus Rules 로드 확인**:
   ```bash
   kubectl logs -n apc-obsv-ns deployment/prometheus | grep -i rule
   ```

2. **Rules 파일 형식 확인**:
   ```bash
   # Prometheus Pod에 접속하여 Rules 파일 확인
   kubectl exec -n apc-obsv-ns deployment/prometheus -- cat /etc/prometheus/rules/prometheus-alerts.yaml
   ```

3. **Alertmanager 연결 확인**:
   ```bash
   # Prometheus 설정에서 alertmanager 주소 확인
   kubectl get configmap prometheus-config -n apc-obsv-ns -o yaml | grep alertmanager
   ```

### Lambda 함수가 호출되지 않는 경우

1. **Lambda Function URL 확인**:
   ```bash
   aws lambda get-function-url-config --function-name alertmanager-webhook-handler --region ap-northeast-2
   ```

2. **Alertmanager Webhook 설정 확인**:
   ```bash
   kubectl get configmap alertmanager-config -n apc-obsv-ns -o yaml | grep webhook
   ```

3. **Lambda 로그 확인**:
   ```bash
   aws logs tail /aws/lambda/alertmanager-webhook-handler --follow --region ap-northeast-2
   ```
