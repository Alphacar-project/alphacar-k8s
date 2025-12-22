#!/bin/bash
# MongoDB 데이터 복원 스크립트
# 외부 MongoDB(192.168.0.201)에서 mongodb-0로 데이터 복원

set -e

SOURCE_HOST="${SOURCE_HOST:-192.168.0.201}"
SOURCE_PORT="${SOURCE_PORT:-27017}"
SOURCE_USER="${SOURCE_USER:-triple_user}"
SOURCE_PASS="${SOURCE_PASS:-YOUR_SOURCE_PASSWORD}"
SOURCE_DB="${SOURCE_DB:-triple_db}"

TARGET_HOST="${TARGET_HOST:-mongodb-0.mongodb-headless.alphacar.svc.cluster.local}"
TARGET_PORT="${TARGET_PORT:-27017}"
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
echo "대상: ${TARGET_USER}@${TARGET_HOST}:${TARGET_PORT}/${TARGET_DB}"
echo ""

# mongodb 파드에서 mongorestore 사용
echo "📦 데이터 복원 중..."

# 방법 1: mongorestore를 사용하여 직접 복원
kubectl exec -n ${NAMESPACE} mongodb-0 -- mongorestore \
  --host=${SOURCE_HOST} \
  --port=${SOURCE_PORT} \
  --username=${SOURCE_USER} \
  --password=${SOURCE_PASS} \
  --authenticationDatabase=admin \
  --db=${SOURCE_DB} \
  --archive \
  --gzip 2>/dev/null | \
kubectl exec -i -n ${NAMESPACE} mongodb-0 -- mongorestore \
  --host=localhost \
  --port=27017 \
  --username=${TARGET_USER} \
  --password=${TARGET_PASS} \
  --authenticationDatabase=admin \
  --db=${TARGET_DB} \
  --archive \
  --drop || {
  
  echo "⚠️ mongorestore 직접 연결 실패, 대안 방법 시도..."
  
  # 방법 2: mongodump로 덤프 후 복원
  echo "📥 데이터 덤프 중..."
  kubectl exec -n ${NAMESPACE} mongodb-0 -- mongodump \
    --host=${SOURCE_HOST} \
    --port=${SOURCE_PORT} \
    --username=${SOURCE_USER} \
    --password=${SOURCE_PASS} \
    --authenticationDatabase=admin \
    --db=${SOURCE_DB} \
    --out=/tmp/mongodb_dump || {
    
    echo "❌ mongodump 실패. mongosh를 사용한 복원 시도..."
    
    # 방법 3: mongosh를 사용하여 컬렉션별로 복사
    echo "📋 컬렉션 목록 확인 중..."
    COLLECTIONS=$(kubectl exec -n ${NAMESPACE} mongodb-0 -- mongosh \
      --quiet \
      --host=${SOURCE_HOST} \
      --port=${SOURCE_PORT} \
      --username=${SOURCE_USER} \
      --password=${SOURCE_PASS} \
      --authenticationDatabase=admin \
      --eval "db.getSiblingDB('${SOURCE_DB}').getCollectionNames()" 2>/dev/null | \
      grep -oE '"[^"]+"' | tr -d '"' || echo "")
    
    if [ -z "$COLLECTIONS" ]; then
      echo "❌ 소스 데이터베이스에 접근할 수 없습니다."
      echo "💡 수동 복원 방법:"
      echo "   1. 외부에서 mongodump 실행:"
      echo "      mongodump --host=${SOURCE_HOST} --port=${SOURCE_PORT} --username=${SOURCE_USER} --password=${SOURCE_PASS} --authenticationDatabase=admin --db=${SOURCE_DB}"
      echo "   2. 덤프 파일을 mongodb-0 파드로 복사"
      echo "   3. mongorestore 실행"
      exit 1
    fi
    
    echo "✅ 발견된 컬렉션: $COLLECTIONS"
    echo "📥 데이터 복사 중..."
    
    for COLLECTION in $COLLECTIONS; do
      echo "  - ${COLLECTION} 복사 중..."
      kubectl exec -n ${NAMESPACE} mongodb-0 -- mongosh \
        --quiet \
        --host=${SOURCE_HOST} \
        --port=${SOURCE_PORT} \
        --username=${SOURCE_USER} \
        --password=${SOURCE_PASS} \
        --authenticationDatabase=admin \
        --eval "
          var sourceDB = db.getSiblingDB('${SOURCE_DB}');
          var targetDB = db.getSiblingDB('${TARGET_DB}');
          var docs = sourceDB.getCollection('${COLLECTION}').find().toArray();
          if (docs.length > 0) {
            targetDB.getCollection('${COLLECTION}').insertMany(docs);
            print('✅ ${COLLECTION}: ' + docs.length + ' documents 복사됨');
          } else {
            print('⚠️ ${COLLECTION}: 데이터 없음');
          }
        " \
        --host=localhost \
        --port=27017 \
        --username=${TARGET_USER} \
        --password=${TARGET_PASS} \
        --authenticationDatabase=admin 2>/dev/null || echo "  ⚠️ ${COLLECTION} 복사 실패"
    done
  }
}

echo ""
echo "✅ 데이터 복원 완료!"
echo ""
echo "📊 복원된 데이터 확인:"
kubectl exec -n ${NAMESPACE} mongodb-0 -- mongosh \
  --quiet \
  --username=${TARGET_USER} \
  --password=${TARGET_PASS} \
  --authenticationDatabase=admin \
  --eval "db.getSiblingDB('${TARGET_DB}').getCollectionNames().forEach(function(c) { print(c + ': ' + db.getSiblingDB('${TARGET_DB}').getCollection(c).countDocuments() + ' documents'); })" 2>/dev/null



