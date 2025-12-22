#!/bin/bash
# MongoDB ReplicaSet 초기화 스크립트
# Primary 1개, Secondary 2개 구성

NAMESPACE="apc-db-ns"
SERVICE="mongodb-headless"
REPLICA_SET="rs0"

echo "MongoDB ReplicaSet 초기화 시작..."

# MongoDB Pod들이 모두 Ready 상태가 될 때까지 대기
echo "MongoDB Pod들이 준비될 때까지 대기 중..."
for i in {0..2}; do
  while ! kubectl get pod mongodb-$i -n $NAMESPACE -o jsonpath='{.status.containerStatuses[0].ready}' | grep -q "true"; do
    echo "mongodb-$i Pod 대기 중..."
    sleep 5
  done
  echo "mongodb-$i Pod 준비 완료"
done

echo "모든 MongoDB Pod 준비 완료"

# mongodb-0에 접속하여 ReplicaSet 초기화
echo "ReplicaSet 초기화 중..."
kubectl exec -n $NAMESPACE mongodb-0 -- mongosh admin -u admin -p 123 --eval "
  try {
    var status = rs.status();
    print('ReplicaSet이 이미 초기화되어 있습니다.');
    print('현재 상태:');
    printjson(status);
  } catch (e) {
    print('ReplicaSet 초기화 시작...');
    rs.initiate({
      _id: '$REPLICA_SET',
      members: [
        { _id: 0, host: 'mongodb-0.$SERVICE.$NAMESPACE.svc.cluster.local:27017', priority: 2 },
        { _id: 1, host: 'mongodb-1.$SERVICE.$NAMESPACE.svc.cluster.local:27017', priority: 1 },
        { _id: 2, host: 'mongodb-2.$SERVICE.$NAMESPACE.svc.cluster.local:27017', priority: 1 }
      ]
    });
    print('ReplicaSet 초기화 완료');
  }
"

# ReplicaSet 상태 확인
echo "ReplicaSet 상태 확인 중..."
sleep 10
kubectl exec -n $NAMESPACE mongodb-0 -- mongosh admin -u admin -p 123 --eval "
  var status = rs.status();
  print('=== ReplicaSet 상태 ===');
  status.members.forEach(function(member) {
    print('Member ' + member._id + ': ' + member.name + ' - ' + member.stateStr);
  });
  print('Primary: ' + rs.isMaster().primary);
"

# Secondary를 Read-Only로 설정
echo "Secondary를 Read-Only로 설정 중..."
kubectl exec -n $NAMESPACE mongodb-1 -- mongosh admin -u admin -p 123 --eval "
  try {
    cfg = rs.conf();
    cfg.members[1].priority = 1;
    cfg.members[1].tags = { role: 'secondary', readOnly: 'true' };
    cfg.members[2].priority = 1;
    cfg.members[2].tags = { role: 'secondary', readOnly: 'true' };
    rs.reconfig(cfg, { force: false });
    print('Secondary Read-Only 설정 완료');
  } catch (e) {
    print('설정 중 오류: ' + e);
  }
" 2>/dev/null || echo "Secondary 설정은 Primary에서만 가능합니다."

# 최종 상태 확인
echo ""
echo "=== 최종 ReplicaSet 구성 ==="
kubectl exec -n $NAMESPACE mongodb-0 -- mongosh admin -u admin -p 123 --eval "
  var status = rs.status();
  print('ReplicaSet: ' + status.set);
  print('Members:');
  status.members.forEach(function(member) {
    var role = member.stateStr === 'PRIMARY' ? 'PRIMARY (Read/Write)' : 'SECONDARY (Read-Only)';
    print('  - ' + member.name + ': ' + role);
  });
"

echo ""
echo "MongoDB ReplicaSet 초기화 완료!"
echo "Primary (Read/Write): mongodb-0"
echo "Secondary (Read-Only): mongodb-1, mongodb-2"

