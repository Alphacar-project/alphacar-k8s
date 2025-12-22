#!/bin/bash
# MongoDB 데이터 복원 스크립트 (간단 버전)
# 외부 MongoDB(192.168.0.201)에서 mongodb-0로 데이터 복사

set -e

SOURCE_HOST="${SOURCE_HOST:-192.168.0.201}"
SOURCE_PORT="${SOURCE_PORT:-27017}"
SOURCE_USER="${SOURCE_USER:-triple_user}"
SOURCE_PASS="${SOURCE_PASS:-YOUR_SOURCE_PASSWORD}"
SOURCE_DB="${SOURCE_DB:-triple_db}"

TARGET_USER="${TARGET_USER:-proj}"
TARGET_PASS="${TARGET_PASS:-YOUR_TARGET_PASSWORD}"
TARGET_DB="${TARGET_DB:-triple_db}"
NAMESPACE="${NAMESPACE:-alphacar}"

# 비밀번호가 기본값이면 경고
if [ "$SOURCE_PASS" = "YOUR_SOURCE_PASSWORD" ] || [ "$TARGET_PASS" = "YOUR_TARGET_PASSWORD" ]; then
  echo "⚠️  경고: 비밀번호가 설정되지 않았습니다. 환경 변수를 설정하세요:"
  echo "   export SOURCE_PASS='your_source_password'"
  echo "   export TARGET_PASS='your_target_password'"
  exit 1
fi

echo "🔄 MongoDB 데이터 복원 시작..."
echo "소스: ${SOURCE_USER}@${SOURCE_HOST}:${SOURCE_PORT}/${SOURCE_DB}"
echo "대상: ${TARGET_USER}@mongodb-0/${TARGET_DB}"
echo ""

# mongosh를 사용하여 컬렉션별로 복사
echo "📋 소스 데이터베이스의 컬렉션 목록 확인 중..."

# 소스에서 컬렉션 목록 가져오기
COLLECTIONS=$(kubectl run -n ${NAMESPACE} --rm -i --restart=Never mongodb-restore-helper --image=mongo:8.0 -- \
  mongosh --quiet \
  --host=${SOURCE_HOST} \
  --port=${SOURCE_PORT} \
  --username=${SOURCE_USER} \
  --password=${SOURCE_PASS} \
  --authenticationDatabase=admin \
  --eval "db.getSiblingDB('${SOURCE_DB}').getCollectionNames().join(',')" 2>/dev/null || echo "")

if [ -z "$COLLECTIONS" ]; then
  echo "❌ 소스 MongoDB에 연결할 수 없습니다."
  echo "💡 직접 연결하여 확인:"
  echo "   mongosh --host=${SOURCE_HOST} --port=${SOURCE_PORT} --username=${SOURCE_USER} --password=${SOURCE_PASS} --authenticationDatabase=admin"
  exit 1
fi

echo "✅ 발견된 컬렉션: ${COLLECTIONS}"
echo ""

# 각 컬렉션을 복사
IFS=',' read -ra COLLECTION_ARRAY <<< "$COLLECTIONS"
for COLLECTION in "${COLLECTION_ARRAY[@]}"; do
  COLLECTION=$(echo "$COLLECTION" | xargs) # trim whitespace
  if [ -z "$COLLECTION" ]; then
    continue
  fi
  
  echo "📥 ${COLLECTION} 복사 중..."
  
  # mongosh를 사용하여 데이터 복사
  kubectl run -n ${NAMESPACE} --rm -i --restart=Never mongodb-restore-${COLLECTION} --image=mongo:8.0 -- \
    mongosh --quiet \
    --host=${SOURCE_HOST} \
    --port=${SOURCE_PORT} \
    --username=${SOURCE_USER} \
    --password=${SOURCE_PASS} \
    --authenticationDatabase=admin \
    --eval "
      var sourceDB = db.getSiblingDB('${SOURCE_DB}');
      var docs = sourceDB.getCollection('${COLLECTION}').find().toArray();
      print('소스에서 ' + docs.length + '개 문서 읽음');
      
      // mongodb-0에 연결하여 데이터 삽입
      var targetConn = new Mongo('mongodb://${TARGET_USER}:${TARGET_PASS}@mongodb-0.mongodb-headless.alphacar.svc.cluster.local:27017/?authSource=admin&replicaSet=rs0');
      var targetDB = targetConn.getDB('${TARGET_DB}');
      
      if (docs.length > 0) {
        // 기존 데이터 삭제 (선택사항)
        targetDB.getCollection('${COLLECTION}').deleteMany({});
        // 새 데이터 삽입
        targetDB.getCollection('${COLLECTION}').insertMany(docs);
        print('✅ ${COLLECTION}: ' + docs.length + ' documents 복사 완료');
      } else {
        print('⚠️ ${COLLECTION}: 데이터 없음');
      }
    " 2>&1 || echo "  ⚠️ ${COLLECTION} 복사 실패"
done

echo ""
echo "✅ 데이터 복원 완료!"
echo ""
echo "📊 복원된 데이터 확인:"
kubectl exec -n ${NAMESPACE} mongodb-0 -- mongosh \
  --quiet \
  --username=${TARGET_USER} \
  --password=${TARGET_PASS} \
  --authenticationDatabase=admin \
  --eval "db.getSiblingDB('${TARGET_DB}').getCollectionNames().forEach(function(c) { var count = db.getSiblingDB('${TARGET_DB}').getCollection(c).countDocuments(); print(c + ': ' + count + ' documents'); })" 2>/dev/null



