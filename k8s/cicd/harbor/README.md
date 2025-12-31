# Harbor 2.14.1 설치 가이드

## 설치 정보
- **버전**: Harbor 2.14.1 (Helm Chart 1.18.1)
- **네임스페이스**: apc-cicd-ns
- **노출 방식**: NodePort
- **접근 URL**: http://192.168.0.170:30000

## 기본 로그인 정보
- **사용자명**: admin
- **비밀번호**: Harbor12345

## 설치 확인
```bash
# Pod 상태 확인
kubectl get pods -n apc-cicd-ns | grep harbor

# 서비스 확인
kubectl get svc -n apc-cicd-ns | grep harbor

# Harbor Core 로그 확인
kubectl logs -n apc-cicd-ns -l app=harbor,component=core --tail=50
```

## 접근 방법
1. 웹 브라우저에서 `http://<노드IP>:30000` 접근
2. 또는 `http://192.168.0.170:30000` 접근

## 업그레이드
```bash
helm upgrade harbor harbor/harbor --version 1.18.1 -n apc-cicd-ns -f /home/alphacar/alphacar-final/k8s/cicd/harbor/helm/harbor-custom-values.yaml
```

## 삭제
```bash
helm uninstall harbor -n apc-cicd-ns
```

## 설정 파일 위치
- Values 파일: `/home/alphacar/alphacar-final/k8s/cicd/harbor/helm/harbor-custom-values.yaml`
