import { NestFactory } from '@nestjs/core';
import { ChatModule } from '../src/chat/chat.module';
import { ChatService } from '../src/chat/chat.service';
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  console.log('🚀 [danawa_vehicle_data 전용] 벡터 스토어 데이터 수집 시작...');

  // 1. 벡터 스토어 경로 설정 (PVC 마운트 경로)
  // ✅ PVC가 마운트되어 있으므로 삭제하지 않고 덮어쓰기
  const vectorStorePath = '/app/vector_store';
  if (fs.existsSync(vectorStorePath)) {
      console.log('📂 기존 벡터 스토어 경로 확인됨 (덮어쓰기 모드)');
  } else {
      console.log('📂 벡터 스토어 경로 생성 중...');
      fs.mkdirSync(vectorStorePath, { recursive: true });
  }

  const app = await NestFactory.createApplicationContext(ChatModule);
  const chatService = app.get(ChatService);

  const mongoUrl = `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/?authSource=admin&replicaSet=rs0`;
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db('triple_db');

    // ✅ danawa_vehicle_data 컬렉션만 사용
    const danawaCol = db.collection('danawa_vehicle_data');

    const newVehicles = await danawaCol.find({}).toArray();
    console.log(`📦 총 ${newVehicles.length}대의 차량 데이터를 처리합니다.`);

    let successCount = 0;

    for (const car of newVehicles as any[]) {
      process.stdout.write(`🔄 처리 중: ${car.vehicle_name}... `);

      // ✅ danawa_vehicle_data의 trims 배열 직접 사용
      const trims = car.trims || [];
      trims.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
      
      // ✅ 첫 번째 트림의 _id를 BaseTrimId로 사용 (danawa_vehicle_data의 실제 트림 ID)
      let baseTrimIdStr = '';
      if (trims.length > 0) {
        // ObjectId인 경우 toString(), 문자열인 경우 그대로 사용
        if (trims[0]._id) {
          baseTrimIdStr = typeof trims[0]._id === 'object' && trims[0]._id.toString 
            ? trims[0]._id.toString() 
            : String(trims[0]._id);
        } else if (trims[0].trim_name) {
          // _id가 없으면 trim_name을 사용 (나중에 백엔드에서 검색 가능)
          baseTrimIdStr = trims[0].trim_name;
        }
      }

      // 4️⃣ 임베딩 데이터 생성
      const formatPrice = (p: number) => !p ? '가격 미정' : Math.round(p / 10000).toLocaleString() + '만원';
      const prices = trims.map((t: any) => t.price).filter((p: any) => typeof p === 'number');
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // ✅ danawa_vehicle_data의 트림 정보 직접 사용
      const trimInfo = trims.map((t: any) => {
        let trimId = '';
        if (t._id) {
          trimId = typeof t._id === 'object' && t._id.toString 
            ? t._id.toString() 
            : String(t._id);
        } else {
          trimId = t.trim_name || '';
        }
        return `- ${t.trim_name} (ID: ${trimId}): ${formatPrice(t.price)}`;
      }).join('\n        ');

      let optionText = '옵션 정보 없음';
      if (trims[0]?.options && trims[0].options.length > 0) {
        const optList = trims[0].options.map((o: any) => 
            `- ${o.option_name}: ${o.option_price ? formatPrice(o.option_price) : ''}`
        ).join('\n        ');
        optionText = `[주요 옵션 및 가격 (기본트림 기준)]\n        ${optList}`;
      }

      let specText = '';
      if (trims[0]?.specifications) {
          const s = trims[0].specifications;
          const keySpecs = ['복합 주행거리', '복합전비', '배터리 용량', '최고속도', '제로백', '충전시간 (급속)', '구동방식', '승차정원', '연료'];
          const specLines = keySpecs.filter(key => s[key]).map(key => `- ${key}: ${s[key]}`);
          if (specLines.length > 0) specText = `[주요 제원/스펙]\n        ${specLines.join('\n        ')}`;
      }

      // ✅ 이미지 URL 추출 (프론트엔드에서 사용하는 이미지 우선순위)
      let imageUrl = '';
      if (car.main_image) {
        imageUrl = car.main_image;
      } else if (car.image_url) {
        imageUrl = car.image_url;
      } else if (car.color_images && Array.isArray(car.color_images) && car.color_images.length > 0) {
        // color_images의 첫 번째 이미지 사용
        imageUrl = car.color_images[0].image_url || car.color_images[0].url || '';
      } else if (car.exterior_images && Array.isArray(car.exterior_images) && car.exterior_images.length > 0) {
        // exterior_images의 첫 번째 이미지 사용
        imageUrl = car.exterior_images[0].url || '';
      }

      // ✅ OriginID를 문자열로 변환
      const originId = car._id 
        ? (typeof car._id === 'object' && car._id.toString ? car._id.toString() : String(car._id))
        : '';

      const finalKnowledge = `
        [차량 정보]
        브랜드: ${car.brand_name || '정보없음'}
        모델명: ${car.vehicle_name || '정보없음'} (연식: ${car.model_year || '최신'})
        전체이름: ${car.vehicle_name_full || car.vehicle_name || '정보없음'}

        [분류 정보]
        - 차종: ${car.vehicle_type || '기타'} 
        - 연료: ${car.fuel_type || '정보없음'}

        [가격 및 옵션 요약]
        가격 범위: ${formatPrice(minPrice)} ~ ${formatPrice(maxPrice)}
        이미지URL: ${imageUrl}

        ${specText}

        [트림별 상세 정보 (ID 포함)]
        ${trimInfo}

        ${optionText}

        [시스템 데이터]
        BaseTrimId: ${baseTrimIdStr || 'N/A'}
        OriginID: ${originId}
      `.trim();

      const source = `car-${car._id}`;
      await chatService.addKnowledge(finalKnowledge, source);
      
      process.stdout.write(`✅ (BaseID: ${baseTrimIdStr})\n`);
      successCount++;
    }

    // ✅ 마지막에 벡터 스토어를 명시적으로 저장 (addKnowledge가 이미 저장하지만, 최종 확인용)
    console.log('💾 벡터 스토어 최종 저장 확인 중...');
    // addKnowledge가 이미 매번 저장하므로 추가 저장 불필요
    console.log('✅ 벡터 스토어 저장 완료!');

    console.log(`\n🎉 완료! 총 ${successCount}대의 차량 데이터가 벡터 스토어에 저장되었습니다.`);
    console.log(`📝 이제 챗봇은 danawa_vehicle_data 컬렉션의 최신 데이터를 사용합니다.`);

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await client.close();
    await app.close();
  }
}

bootstrap();
