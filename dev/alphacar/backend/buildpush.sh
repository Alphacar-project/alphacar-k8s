#!/bin/bash
set -e
REPO_URL="382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar"
VERSION="1.0.1"

# 1. 실제 폴더 이름과 ECR 리포지토리 이름을 매칭합니다.
# (폴더명:ECR리포지토리명)
declare -A SVC_MAP=(
  ["main"]="alphacar-main"
  ["quote"]="alphacar-quote"
  ["aichat"]="alphacar-aichat"
  ["mypage"]="alphacar-mypage"
  ["search"]="alphacar-search"
  ["news"]="alphacar-news"
  ["community"]="alphacar-community"
)

for DIR in "${!SVC_MAP[@]}"
do
    ECR_NAME=${SVC_MAP[$DIR]}
    echo "🚀 Building $ECR_NAME (from folder $DIR)..."
    
    cd ~/alphacar/dev/alphacar/backend/$DIR
    
    # ✅ 리포지토리 이름을 alphacar-main 등으로 맞춰서 빌드
    docker build -t $REPO_URL/$ECR_NAME:$VERSION .
    docker push $REPO_URL/$ECR_NAME:$VERSION
    
    echo "✅ $ECR_NAME:$VERSION pushed!"
done
