# Longhorn 컨테이너 구성 설명

## CSI 플러그인 Pod (3/3 컨테이너)

각 Pod는 **반드시 3개 컨테이너가 모두 필요**합니다:

1. **node-driver-registrar** (필수)
   - 역할: CSI 드라이버를 Kubernetes에 등록
   - 없으면: CSI 드라이버가 인식되지 않음
   - 제거 불가

2. **longhorn-liveness-probe** (필수)
   - 역할: CSI 플러그인의 헬스체크 수행
   - 없으면: Kubernetes가 Pod 상태를 확인할 수 없음
   - 제거 불가

3. **longhorn-csi-plugin** (필수)
   - 역할: 실제 CSI 플러그인 (볼륨 생성/삭제/마운트 등)
   - 없으면: Longhorn 스토리지 기능이 작동하지 않음
   - 제거 불가

**결론**: CSI 플러그인은 **반드시 3/3이어야 합니다**. 하나라도 없으면 작동하지 않습니다.

## Longhorn Manager Pod (2/2 컨테이너)

1. **longhorn-manager** (필수)
   - 역할: Longhorn의 핵심 매니저 (볼륨 관리, 복제 관리 등)
   - 없으면: Longhorn이 작동하지 않음
   - 제거 불가

2. **pre-pull-share-manager-image** (init 컨테이너, 선택적)
   - 역할: Share Manager 이미지를 미리 가져와서 시작 시간 단축
   - 없어도: 작동은 하지만 시작이 느려질 수 있음
   - 제거 가능하지만 권장하지 않음

**결론**: Longhorn Manager는 **최소 1/1 (longhorn-manager만)이면 작동**하지만, init 컨테이너가 있으면 성능이 더 좋습니다.

## Instance Manager Pod

- **역할**: 실제 볼륨 인스턴스를 관리하는 Pod
- **생성**: Longhorn Manager가 자동으로 생성
- **위치**: Longhorn Manager가 있는 노드에만 필요
- **최적화**: Longhorn Manager가 없는 노드(worker4, worker5)의 instance-manager는 불필요하므로 제거 가능

## 최적화 결과

- **CSI 플러그인**: 3/3 유지 (모두 필수)
- **Longhorn Manager**: 2/2 유지 (init 컨테이너는 성능 최적화용)
- **Instance Manager**: 5개 → 3개로 감소 (worker4, worker5 제거)

## 추가 최적화 가능 여부

### CSI 플러그인 (3/3)
- **제거 불가**: 모든 컨테이너가 필수
- **설명**: Kubernetes CSI 표준 구성

### Longhorn Manager (2/2)
- **init 컨테이너 제거 가능**: 하지만 권장하지 않음
- **성능 영향**: 이미지 미리 가져오기로 시작 시간 단축
- **권장**: 유지하는 것이 좋음

### Instance Manager
- **자동 관리**: Longhorn Manager가 필요에 따라 생성/삭제
- **최적화 완료**: 불필요한 노드의 instance-manager 제거 완료

