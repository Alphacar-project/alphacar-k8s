# 🚀 멀티마스터 클러스터 빠른 마이그레이션 가이드

## 3단계로 완료!

### Step 1: GitHub에서 코드 클론
```bash
cd ~
git clone https://github.com/qkdgur4/alphacar-final.git
cd alphacar-final
```

### Step 2: 시크릿 파일 생성
`SECRETS_FOR_MULTIMASTER.md` 문서를 받아서 시크릿 파일 생성:

```bash
# 템플릿 복사
cp k8s/configmap-secret/secret-aws-bedrock.yaml.template k8s/configmap-secret/secret-aws-bedrock.yaml
cp k8s/monitoring-analysis/secret.yaml.template k8s/monitoring-analysis/secret.yaml
cp k8s/configmap-secret/secret-db.yaml.template k8s/configmap-secret/secret-db.yaml

# SECRETS_FOR_MULTIMASTER.md 문서의 값으로 파일 수정
vi k8s/configmap-secret/secret-aws-bedrock.yaml
vi k8s/monitoring-analysis/secret.yaml
vi k8s/configmap-secret/secret-db.yaml
```

### Step 3: 자동 설정 스크립트 실행
```bash
chmod +x k8s/scripts/setup-multimaster.sh
./k8s/scripts/setup-multimaster.sh
```

**끝!** 🎉

---

## 스크립트가 자동으로 하는 일

1. ✅ 시크릿 파일 확인
2. ✅ 네임스페이스 생성
3. ✅ ConfigMap 설정 (멀티마스터 환경에 맞게 IP 자동 변경)
4. ✅ 시크릿 배포
5. ✅ Frontend/Backend 배포 (IP 주소 자동 변경)
6. ✅ Monitoring Analysis 배포
7. ✅ 배포 상태 확인

---

## 접속 정보

설정 완료 후:
- **Monitoring Dashboard**: http://monitoring.192.168.0.178.nip.io
- **Frontend**: http://192.168.0.178.nip.io (또는 Ingress 설정에 따라)

---

## 문제 발생 시

```bash
# Pod 상태 확인
kubectl get pods -n alphacar

# 로그 확인
kubectl logs -n alphacar -l app=monitoring-analysis-backend --tail=50

# 시크릿 확인
kubectl get secrets -n alphacar
```

자세한 내용은 `k8s/MULTIMASTER_MIGRATION_GUIDE.md` 참고

