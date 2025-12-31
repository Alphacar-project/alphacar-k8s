import os
import sys
import pymongo
import requests
import boto3
from urllib.parse import urlparse
from pathlib import Path
import hashlib

# 설정
MONGODB_URI = os.environ.get('MONGODB_URI')
MONGODB_DB = os.environ.get('MONGODB_DB', 'triple_db')
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_PREFIX = os.environ.get('S3_PREFIX', 'images')
AWS_REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

print(f"연결 중: {MONGODB_URI.split('@')[1] if '@' in MONGODB_URI else MONGODB_URI}")

# MongoDB 연결
try:
    client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGODB_DB]
    # 연결 테스트
    client.admin.command('ping')
    print("✅ MongoDB 연결 성공")
except Exception as e:
    print(f"❌ MongoDB 연결 실패: {e}")
    sys.exit(1)

# S3 클라이언트
s3_client = boto3.client('s3', region_name=AWS_REGION)

# danawa_vehicle_data 컬렉션만 처리
collection_name = 'danawa_vehicle_data'

if collection_name not in db.list_collection_names():
    print(f"❌ 컬렉션을 찾을 수 없습니다: {collection_name}")
    sys.exit(1)

print(f"\n처리 대상 컬렉션: {collection_name}")

# 이미지 필드 정의 (danawa_vehicle_data 실제 구조)
image_field_mapping = {
    'basic': ['main_image', 'image_url', 'imageUrl', 'image', 'img_url', 'photo_url', 'photoUrl', 'car_image', 'vehicle_image', 'thumbnail'],
    'exterior': ['exterior_images'],  # 배열 필드
    'interior': ['interior_images'],   # 배열 필드
    'color': ['color_images']         # 배열 필드
}

def is_s3_url(url):
    """이미 S3 URL인지 확인"""
    if not isinstance(url, str):
        return False
    # S3 URL 패턴 확인: s3.amazonaws.com 또는 이미 업로드된 S3 URL
    return ('s3.amazonaws.com' in url or 's3.' in url) and S3_BUCKET in url

def sanitize_filename(name):
    """파일명으로 사용 가능하도록 문자열 정리"""
    import re
    if not name:
        return "unknown"
    # 한글, 영문, 숫자, 공백만 허용하고 나머지는 언더스코어로
    name = re.sub(r'[^\w\s가-힣]', '_', str(name))
    # 공백을 언더스코어로
    name = re.sub(r'\s+', '_', name)
    # 연속된 언더스코어를 하나로
    name = re.sub(r'_+', '_', name)
    # 길이 제한 (50자)
    return name[:50].strip('_')

def download_and_upload_image(image_url, collection_name, doc_id, image_type='basic', vehicle_name=None, color_name=None):
    """이미지를 다운로드하여 S3에 업로드하고 URL 반환"""
    try:
        # 이미지 파일명 생성
        parsed_url = urlparse(image_url)
        file_ext = Path(parsed_url.path).suffix or '.jpg'
        if not file_ext.startswith('.'):
            file_ext = '.jpg'
        file_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
        
        # S3 경로 구성: images/{collection}/{doc_id}/{vehicle_name}/{type}/{color_name}/{hash}.{ext}
        path_parts = [S3_PREFIX, collection_name, str(doc_id)]
        
        # 차량명 추가 (있는 경우)
        if vehicle_name:
            path_parts.append(sanitize_filename(vehicle_name))
        
        # 타입 추가
        path_parts.append(image_type)
        
        # 색상명 추가 (색상 이미지인 경우)
        if image_type.startswith('color') and color_name:
            path_parts.append(sanitize_filename(color_name))
        
        # 해시와 확장자 추가
        path_parts.append(f"{file_hash}{file_ext}")
        
        s3_key = "/".join(path_parts)
        
        # 이미지 다운로드
        response = requests.get(image_url, timeout=30, stream=True)
        response.raise_for_status()
        
        # S3에 업로드
        s3_client.upload_fileobj(
            response.raw,
            S3_BUCKET,
            s3_key,
            ExtraArgs={'ContentType': response.headers.get('Content-Type', 'image/jpeg')}
        )
        
        # S3 URL 생성
        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return s3_url
    except Exception as e:
        print(f"    ⚠️  이미지 업로드 실패 ({image_url[:50]}...): {str(e)[:50]}")
        return None

collection = db[collection_name]
total = collection.count_documents({})

if total == 0:
    print(f"❌ 컬렉션에 문서가 없습니다: {collection_name}")
    sys.exit(0)

print(f"\n컬렉션: {collection_name} (총 {total}개 문서)")

# 샘플 문서 구조 확인 (첫 번째 문서)
sample_doc = collection.find_one({})
if sample_doc:
    print(f"\n[디버깅] 샘플 문서 필드명:")
    for key in sorted(sample_doc.keys()):
        if key != '_id':
            value = sample_doc[key]
            if isinstance(value, str) and (value.startswith('http://') or value.startswith('https://')):
                is_s3 = is_s3_url(value)
                print(f"  - {key}: {value[:50]}... ({'S3 URL' if is_s3 else '외부 URL'})")
            elif isinstance(value, list) and len(value) > 0:
                print(f"  - {key}: [배열, {len(value)}개 항목]")
                # 배열의 첫 번째 항목 확인
                if len(value) > 0:
                    first_item = value[0]
                    if isinstance(first_item, str) and (first_item.startswith('http://') or first_item.startswith('https://')):
                        is_s3 = is_s3_url(first_item)
                        print(f"    첫 항목: {first_item[:50]}... ({'S3 URL' if is_s3 else '외부 URL'})")
                    elif isinstance(first_item, dict):
                        print(f"    첫 항목: {type(first_item).__name__} 객체")
                        if 'image' in first_item:
                            img_val = first_item['image']
                            if isinstance(img_val, str) and (img_val.startswith('http://') or img_val.startswith('https://')):
                                is_s3 = is_s3_url(img_val)
                                print(f"      image 필드: {img_val[:50]}... ({'S3 URL' if is_s3 else '외부 URL'})")
            else:
                print(f"  - {key}: {type(value).__name__}")

processed = 0
updated = 0
images_uploaded = 0

for doc in collection.find({}):
    processed += 1
    doc_id = doc.get('_id')
    update_fields = {}
    has_updates = False
    
    # 차량 정보 추출 (메타데이터용)
    vehicle_name = doc.get('vehicle_name') or doc.get('name') or doc.get('model_name') or doc.get('car_name') or None
    vehicle_brand = doc.get('brand') or doc.get('manufacturer') or None
    
    # 이미지 메타데이터 저장용
    images_metadata = []
    
    # 1. 기본 이미지 처리
    for field in image_field_mapping['basic']:
        if field in doc and doc[field]:
            value = doc[field]
            if isinstance(value, str) and (value.startswith('http://') or value.startswith('https://')):
                if is_s3_url(value):
                    # 이미 S3 URL이면 메타데이터만 추가 (원본 유지)
                    images_metadata.append({
                        'url': value,
                        'type': 'basic',
                        'field': field,
                        'vehicle_name': vehicle_name,
                        'vehicle_brand': vehicle_brand,
                        'original_url': value  # 원본 URL도 메타데이터에 저장
                    })
                    continue
                # 원본 URL 보존하면서 S3 URL 추가
                original_url = value
                s3_url = download_and_upload_image(original_url, collection_name, str(doc_id), 'basic', vehicle_name)
                if s3_url:
                    # 원본 필드는 그대로 두고, S3 URL은 별도 필드에 저장
                    s3_field = f's3_{field}'
                    update_fields[s3_field] = s3_url
                    images_metadata.append({
                        'url': s3_url,
                        'type': 'basic',
                        'field': field,
                        's3_field': s3_field,
                        'original_url': original_url,  # 원본 URL 보존
                        'vehicle_name': vehicle_name,
                        'vehicle_brand': vehicle_brand
                    })
                    has_updates = True
                    images_uploaded += 1
                break  # 기본 이미지는 하나만 처리
    
    # 2. 외관 이미지 처리 (배열)
    for field in image_field_mapping['exterior']:
        if field in doc and doc[field]:
            value = doc[field]
            if isinstance(value, list):
                s3_exterior = []  # S3 URL 배열 (원본과 별도로 저장)
                for idx, img_item in enumerate(value):
                    img_url = None
                    original_item = img_item  # 원본 항목 보존
                    # 배열 항목이 문자열인지 딕셔너리인지 확인
                    if isinstance(img_item, str) and (img_item.startswith('http://') or img_item.startswith('https://')):
                        img_url = img_item
                    elif isinstance(img_item, dict):
                        # 딕셔너리에서 image 필드 찾기
                        img_url = img_item.get('image') or img_item.get('url') or img_item.get('image_url')
                    
                    if img_url and isinstance(img_url, str) and (img_url.startswith('http://') or img_url.startswith('https://')):
                        if is_s3_url(img_url):
                            # 이미 S3 URL이면 메타데이터만 추가하고 원본 유지
                            s3_exterior.append(img_item)  # S3 URL이므로 그대로 추가
                            images_metadata.append({
                                'url': img_url,
                                'type': 'exterior',
                                'field': field,
                                'index': idx,
                                'original_url': img_url,
                                'vehicle_name': vehicle_name,
                                'vehicle_brand': vehicle_brand
                            })
                            continue
                        # 외부 URL이면 업로드
                        original_url = img_url
                        s3_url = download_and_upload_image(original_url, collection_name, str(doc_id), f'exterior_{idx}', vehicle_name)
                        if s3_url:
                            if isinstance(img_item, dict):
                                # 딕셔너리면 image 필드만 S3 URL로 업데이트한 새 객체 생성
                                new_item = img_item.copy()
                                new_item['image'] = s3_url
                                s3_exterior.append(new_item)
                            else:
                                # 문자열이면 S3 URL로 저장
                                s3_exterior.append(s3_url)
                            images_metadata.append({
                                'url': s3_url,
                                'type': 'exterior',
                                'field': field,
                                'index': idx,
                                'original_url': original_url,  # 원본 URL 보존
                                'vehicle_name': vehicle_name,
                                'vehicle_brand': vehicle_brand
                            })
                            has_updates = True
                            images_uploaded += 1
                        else:
                            # 업로드 실패 시 원본 항목 유지
                            s3_exterior.append(img_item)
                    else:
                        # URL이 아니면 원본 항목 유지
                        s3_exterior.append(img_item)
                
                # 원본 필드는 그대로 두고, S3 URL 배열은 별도 필드에 저장
                if len(s3_exterior) > 0:
                    s3_field = f's3_{field}'
                    update_fields[s3_field] = s3_exterior
                    has_updates = True
                break  # 첫 번째 매칭 필드만 처리
    
    # 3. 내관 이미지 처리 (배열)
    for field in image_field_mapping['interior']:
        if field in doc and doc[field]:
            value = doc[field]
            if isinstance(value, list):
                s3_interior = []  # S3 URL 배열 (원본과 별도로 저장)
                for idx, img_item in enumerate(value):
                    img_url = None
                    original_item = img_item  # 원본 항목 보존
                    # 배열 항목이 문자열인지 딕셔너리인지 확인
                    if isinstance(img_item, str) and (img_item.startswith('http://') or img_item.startswith('https://')):
                        img_url = img_item
                    elif isinstance(img_item, dict):
                        # 딕셔너리에서 image 필드 찾기
                        img_url = img_item.get('image') or img_item.get('url') or img_item.get('image_url')
                    
                    if img_url and isinstance(img_url, str) and (img_url.startswith('http://') or img_url.startswith('https://')):
                        if is_s3_url(img_url):
                            # 이미 S3 URL이면 메타데이터만 추가하고 원본 유지
                            s3_interior.append(img_item)  # S3 URL이므로 그대로 추가
                            images_metadata.append({
                                'url': img_url,
                                'type': 'interior',
                                'field': field,
                                'index': idx,
                                'original_url': img_url,
                                'vehicle_name': vehicle_name,
                                'vehicle_brand': vehicle_brand
                            })
                            continue
                        # 외부 URL이면 업로드
                        original_url = img_url
                        s3_url = download_and_upload_image(original_url, collection_name, str(doc_id), f'interior_{idx}', vehicle_name)
                        if s3_url:
                            if isinstance(img_item, dict):
                                # 딕셔너리면 image 필드만 S3 URL로 업데이트한 새 객체 생성
                                new_item = img_item.copy()
                                new_item['image'] = s3_url
                                s3_interior.append(new_item)
                            else:
                                # 문자열이면 S3 URL로 저장
                                s3_interior.append(s3_url)
                            images_metadata.append({
                                'url': s3_url,
                                'type': 'interior',
                                'field': field,
                                'index': idx,
                                'original_url': original_url,  # 원본 URL 보존
                                'vehicle_name': vehicle_name,
                                'vehicle_brand': vehicle_brand
                            })
                            has_updates = True
                            images_uploaded += 1
                        else:
                            # 업로드 실패 시 원본 항목 유지
                            s3_interior.append(img_item)
                    else:
                        # URL이 아니면 원본 항목 유지
                        s3_interior.append(img_item)
                
                # 원본 필드는 그대로 두고, S3 URL 배열은 별도 필드에 저장
                if len(s3_interior) > 0:
                    s3_field = f's3_{field}'
                    update_fields[s3_field] = s3_interior
                    has_updates = True
                break  # 첫 번째 매칭 필드만 처리
    
    # 4. 색상별 이미지 처리 (배열)
    for field in image_field_mapping['color']:
        if field in doc and doc[field]:
            value = doc[field]
            if isinstance(value, list):
                s3_colors = []  # S3 URL 배열 (원본과 별도로 저장)
                for idx, color_item in enumerate(value):
                    color_name = None
                    original_item = color_item  # 원본 항목 보존
                    if isinstance(color_item, dict):
                        # colors 배열 내 객체 (예: {name: "red", image: "url"})
                        color_name = color_item.get('name') or color_item.get('color_name') or color_item.get('color') or f'color_{idx}'
                        if 'image' in color_item and color_item['image']:
                            img_url = color_item['image']
                            if isinstance(img_url, str) and (img_url.startswith('http://') or img_url.startswith('https://')):
                                if is_s3_url(img_url):
                                    # 이미 S3 URL이면 그대로 추가
                                    s3_colors.append(color_item)
                                    images_metadata.append({
                                        'url': img_url,
                                        'type': 'color',
                                        'color_name': color_name,
                                        'color_index': idx,
                                        'original_url': img_url,
                                        'vehicle_name': vehicle_name,
                                        'vehicle_brand': vehicle_brand
                                    })
                                    continue
                                original_url = img_url
                                s3_url = download_and_upload_image(original_url, collection_name, str(doc_id), f'color_{idx}', vehicle_name, color_name)
                                if s3_url:
                                    new_color_item = color_item.copy()
                                    new_color_item['image'] = s3_url
                                    s3_colors.append(new_color_item)
                                    images_metadata.append({
                                        'url': s3_url,
                                        'type': 'color',
                                        'color_name': color_name,
                                        'color_index': idx,
                                        'original_url': original_url,  # 원본 URL 보존
                                        'vehicle_name': vehicle_name,
                                        'vehicle_brand': vehicle_brand
                                    })
                                    images_uploaded += 1
                                else:
                                    # 업로드 실패 시 원본 항목 유지
                                    s3_colors.append(color_item)
                            else:
                                # URL이 아니면 원본 항목 유지
                                s3_colors.append(color_item)
                        else:
                            # image 필드가 없으면 원본 항목 유지
                            s3_colors.append(color_item)
                    elif isinstance(color_item, str):
                        # 문자열 배열 (예: ["url1", "url2"])
                        color_name = f'color_{idx}'
                        if color_item.startswith('http://') or color_item.startswith('https://'):
                            if is_s3_url(color_item):
                                # 이미 S3 URL이면 그대로 추가
                                s3_colors.append(color_item)
                                images_metadata.append({
                                    'url': color_item,
                                    'type': 'color',
                                    'color_name': color_name,
                                    'color_index': idx,
                                    'original_url': color_item,
                                    'vehicle_name': vehicle_name,
                                    'vehicle_brand': vehicle_brand
                                })
                                continue
                            original_url = color_item
                            s3_url = download_and_upload_image(original_url, collection_name, str(doc_id), f'color_{idx}', vehicle_name, color_name)
                            if s3_url:
                                s3_colors.append(s3_url)
                                images_metadata.append({
                                    'url': s3_url,
                                    'type': 'color',
                                    'color_name': color_name,
                                    'color_index': idx,
                                    'original_url': original_url,  # 원본 URL 보존
                                    'vehicle_name': vehicle_name,
                                    'vehicle_brand': vehicle_brand
                                })
                                images_uploaded += 1
                            else:
                                # 업로드 실패 시 원본 항목 유지
                                s3_colors.append(color_item)
                        else:
                            # URL이 아니면 원본 항목 유지
                            s3_colors.append(color_item)
                    else:
                        # 기타 타입이면 원본 항목 유지
                        s3_colors.append(color_item)
                
                # 원본 필드는 그대로 두고, S3 URL 배열은 별도 필드에 저장
                if len(s3_colors) > 0:
                    s3_field = f's3_{field}'
                    update_fields[s3_field] = s3_colors
                    has_updates = True
    
    # MongoDB 업데이트
    if has_updates:
        # 이미지 메타데이터도 함께 저장
        update_fields['s3_images_metadata'] = images_metadata
        collection.update_one(
            {'_id': doc_id},
            {'$set': update_fields}
        )
        updated += 1
        print(f"  [{processed}/{total}] ✅ 업데이트: {doc_id} ({len(update_fields)-1}개 필드, {len(images_metadata)}개 이미지 메타데이터)")

print(f"\n완료: {processed}개 문서 처리, {updated}개 문서 업데이트, {images_uploaded}개 이미지 업로드")

print(f"\n=== 전체 완료 ===")
print(f"총 처리: {processed}개 문서")
print(f"총 업데이트: {updated}개 문서")
print(f"총 이미지 업로드: {images_uploaded}개")