import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';
import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  // 1. 기본 루트 (Health Check용) - 단순 헬스 체크
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 2. 메인 페이지 데이터 (GET /main)
  // ★ [수정] 프론트엔드가 /api/main을 호출하면 이 함수가 실행됩니다.
  // 기존 @Get()에 있던 '배너 + 최근 본 차량 + 차량 목록' 로직을 여기로 합쳤습니다.
  @Get('main')
  async getMainData(
    @Query('userId') userId: string = 'guest_id',
    @Query('brand') brand?: string
  ) {
    // (1) 서비스에서 차량 목록 가져오기 (브랜드 필터링 지원)
    const carList = await this.appService.getCarList(brand);

    // (2) Redis에서 최근 본 차량 ID 목록 가져오기
    const recentViewIds = await this.redisService.getRecentViews(userId);

    // (3) 종합 데이터 반환 (프론트엔드 MainData 타입과 일치)
    return {
      welcomeMessage: 'Welcome to AlphaCar Home',
      searchBar: {
        isShow: true,
        placeholder: '찾는 차량을 검색해 주세요'
      },
      banners: [
        { id: 1, text: '11월의 핫딜: 아반떼 즉시 출고', color: '#ff5555' },
        { id: 2, text: '겨울철 타이어 교체 가이드', color: '#5555ff' }
      ],
      shortcuts: ['견적내기', '시승신청', '이벤트'],
      
      // 차량 목록
      cars: carList,

      // 최근 본 차량 ID 목록
      recentViews: recentViewIds
    };
  }

  // 3. 차량 목록만 별도로 조회 (GET /cars) - 브랜드 필터링 지원
  @Get('cars')
  async getCarList(@Query('brand') brand?: string) {
    return await this.appService.getCarList(brand);
  }

  // 4. 최근 본 차량 기록 (POST /log-view/:id)
  @Post('log-view/:id')
  async logView(
    @Param('id') vehicleId: string,
    @Body('userId') userId: string
  ) {
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }

    // Redis에 기록
    await this.redisService.addRecentView(userId, vehicleId);
    return { success: true, message: 'Recent view logged successfully' };
  }

  // 5. 제조사 목록 조회 (GET /makers)
  @Get('makers')
  async getMakers() {
    return this.appService.findAllMakers();
  }

  // 6. 브랜드 목록 조회 (GET /brands) - logo_url 포함
  @Get('brands')
  async getBrands() {
    try {
      console.log('[GET /brands] 브랜드 목록 요청 받음');
      const brands = await this.appService.getBrandsWithLogo();
      console.log(`[GET /brands] 브랜드 ${brands.length}개 반환`);
      return brands;
    } catch (error) {
      console.error('[GET /brands] 에러:', error);
      return [];
    }
  }

  // 7. 브랜드 목록 조회 (GET /makers-with-logo) - logo_url 포함 (프론트엔드 호환성)
  @Get('makers-with-logo')
  async getMakersWithLogo() {
    return this.appService.getBrandsWithLogo();
  }

  @Get('models')
  async getModels(@Query('makerId') makerId: string) {
    return this.appService.getModelsByMaker(makerId);
  }

  @Get('trims')
  async getTrims(@Query('modelId') modelId: string) {
    return this.appService.getTrims(modelId);
  }

  @Get('base-trims')
  async getBaseTrimsEndpoint(@Query('modelId') modelId: string) {
    return this.getBaseTrims(modelId);
  }

  // 8. 리뷰 분석 데이터 조회 (GET /review-analysis)
  @Get('review-analysis')
  async getReviewAnalysis(@Query('vehicleName') vehicleName: string) {
    return this.appService.getReviewAnalysis(vehicleName);
  }

  // 9. [견적 페이지용] /vehicles/* 및 /api/vehicles/* 엔드포인트들 (두 경로 모두 지원)
  @Get('api/vehicles/makers')
  async getApiVehiclesMakers() {
    console.log('🔍 [GET /api/vehicles/makers] 호출됨');
    try {
      const result = await this.appService.findAllMakers();
      console.log(`✅ [GET /api/vehicles/makers] 성공: ${Array.isArray(result) ? result.length : 0}개`);
      return result;
    } catch (error) {
      console.error(`❌ [GET /api/vehicles/makers] 에러:`, error);
      throw error;
    }
  }

  @Get('vehicles/makers')
  async getVehiclesMakers() {
    return this.appService.findAllMakers();
  }

  @Get('api/vehicles/models')
  async getApiVehiclesModels(@Query('makerId') makerId: string) {
    return this.appService.getModelsByMaker(makerId);
  }

  @Get('vehicles/models')
  async getVehiclesModels(@Query('makerId') makerId: string) {
    return this.appService.getModelsByMaker(makerId);
  }

  async getBaseTrims(modelId: string) {
    try {
      // modelId는 vehicle_name (차종명)
      const query: any = { vehicle_name: modelId };
      const vehicles = await this.vehicleModel.find(query).exec();
      
      const baseTrimMap = new Map<string, any>();
      
      vehicles.forEach((vehicle: any) => {
        const baseTrimName = vehicle.base_trim_name;
        if (baseTrimName && !baseTrimMap.has(baseTrimName)) {
          // base_trim_name을 ID로 사용 (기본트림 선택 식별용)
          baseTrimMap.set(baseTrimName, {
            _id: baseTrimName, // base_trim_name을 ID로 사용
            id: baseTrimName, // 호환성을 위해 추가
            name: baseTrimName,
            base_trim_name: baseTrimName,
          });
        }
      });
      
      return Array.from(baseTrimMap.values());
    } catch (error) {
      throw error;
    }
  }

  @Get('api/vehicles/base-trims')
  async getApiVehiclesBaseTrims(@Query('modelId') modelId: string) {
    return this.getBaseTrims(modelId);
  }

  @Get('vehicles/base-trims')
  async getVehiclesBaseTrims(@Query('modelId') modelId: string) {
    return this.getBaseTrims(modelId);
  }

  @Get('api/vehicles/trims')
  async getApiVehiclesTrims(@Query('modelId') modelId: string) {
    return this.appService.getTrims(modelId);
  }

  @Get('vehicles/trims')
  async getVehiclesTrims(@Query('modelId') modelId: string) {
    return this.appService.getTrims(modelId);
  }

}
