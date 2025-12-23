import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Vehicle, VehicleDocument } from '@schemas/vehicle.schema';
import { Manufacturer, ManufacturerDocument } from './schemas/manufacturer.schema';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);

    constructor(
        @InjectModel(Manufacturer.name) private manufacturerModel: Model<ManufacturerDocument>,
        @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
    ) {}

    // 1. 제조사 목록 (danawa_vehicle_data에서 실제 존재하는 브랜드만 반환)
    async getManufacturers() {
        // danawa_vehicle_data 컬렉션에서 실제 존재하는 브랜드 목록 가져오기
        const brands = await this.vehicleModel.aggregate([
            {
                $match: {
                    $and: [
                        { brand_name: { $exists: true } },
                        { brand_name: { $ne: null } },
                        { brand_name: { $ne: '' } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$brand_name',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    id: '$_id' // 브랜드 이름을 ID로 사용
                }
            }
        ]).exec();
        
        // _id 필드 추가 (프론트엔드 호환성)
        return brands.map(brand => ({
            _id: brand.id,
            name: brand.name
        }));
    }

    // 2. 모델(차종) 목록 (브랜드 이름으로 직접 조회)
    async getModelsByManufacturer(makerId: string) {
        if (!makerId) return [];
        
        // makerId가 브랜드 이름일 수 있으므로 직접 사용
        const brandName = makerId;
        
        const vehicles = await this.vehicleModel
            .find({ brand_name: brandName }, { vehicle_name: 1, _id: 1, main_image: 1, base_trim_name: 1 })
            .lean()
            .exec();
        
        // 중복 제거 (같은 vehicle_name을 가진 차량은 하나로)
        const uniqueModels = Array.from(
            new Map(vehicles.map(v => [v.vehicle_name, v])).values()
        );
        
        return uniqueModels.map(doc => ({
            _id: doc._id.toString(),
            model_name: doc.vehicle_name,
            image: doc.main_image,
            base_trim_name: doc.base_trim_name
        }));
    }

    // 3. 기본 트림 목록 (차종별로 그룹화된 기본 트림)
    // danawa_vehicle_data 컬렉션에서 해당 차량 모델의 모든 base_trim_name을 수집
    async getBaseTrimsByModel(vehicleId: string) {
        if (!vehicleId) return [];

        try {
            let vehicle: any = null;
            let vehicleName: string = '';
            let modelId: string = '';
            
            // ObjectId로 검색 시도
            if (Types.ObjectId.isValid(vehicleId)) {
                vehicle = await this.vehicleModel.findById(new Types.ObjectId(vehicleId)).lean().exec();
                if (vehicle) {
                    vehicleName = vehicle.vehicle_name || '';
                    modelId = vehicle.model_id || '';
                }
            }
            
            // ObjectId가 아니거나 못 찾은 경우, 다른 필드로 검색
            if (!vehicle) {
                // vehicle_name이나 model_id로 검색 시도
                vehicle = await this.vehicleModel.findOne({
                    $or: [
                        { model_id: vehicleId },
                        { vehicle_name: vehicleId },
                        { lineup_id: vehicleId }
                    ]
                }).lean().exec();
                
                if (vehicle) {
                    vehicleName = vehicle.vehicle_name || vehicleId;
                    modelId = vehicle.model_id || vehicleId;
                } else {
                    // vehicleId가 vehicle_name일 수도 있음
                    vehicleName = vehicleId;
                    modelId = vehicleId;
                }
            }

            // 해당 차량 모델의 모든 문서를 찾아서 base_trim_name 수집
            const query: any = {};
            
            if (vehicle && vehicle.vehicle_name) {
                // vehicle_name으로 검색 (같은 모델의 모든 변형 포함)
                query.vehicle_name = vehicle.vehicle_name;
            } else if (vehicle && vehicle.model_id) {
                // model_id로 검색
                query.model_id = vehicle.model_id;
            } else if (vehicleName) {
                // vehicleName으로 검색
                query.vehicle_name = vehicleName;
            } else {
                return [];
            }

            // 해당 차량 모델의 모든 문서 조회
            const vehicles = await this.vehicleModel.find(query).lean().exec();
            
            if (!vehicles || vehicles.length === 0) return [];

            // 모든 base_trim_name 수집 (중복 제거)
            const baseTrimMap = new Map<string, any>();
            
            vehicles.forEach((v: any) => {
                if (v.base_trim_name && v.base_trim_name.trim() !== '') {
                    const baseTrimName = v.base_trim_name.trim();
                    if (!baseTrimMap.has(baseTrimName)) {
                        baseTrimMap.set(baseTrimName, {
                            _id: baseTrimName,
                            id: baseTrimName,
                            name: baseTrimName,
                            base_trim_name: baseTrimName,
                            vehicle_id: v._id?.toString() || vehicleId,
                            vehicle_name: v.vehicle_name || vehicleName
                        });
                    }
                }
            });

            // Map에서 배열로 변환
            const baseTrims = Array.from(baseTrimMap.values());

            return baseTrims;
        } catch (e) {
            console.error('getBaseTrimsByModel 에러:', e);
            return [];
        }
    }

    // 4. 세부 트림 목록 (기본 트림 선택 후)
    async getTrimsByModel(vehicleIdOrBaseTrimName: string) {
        if (!vehicleIdOrBaseTrimName) return [];

        try {
            let vehicles: any[] = [];
            
            // 1. ObjectId로 검색 시도 (기존 로직)
            if (Types.ObjectId.isValid(vehicleIdOrBaseTrimName)) {
                const vehicle = await this.vehicleModel.collection.findOne({ _id: new Types.ObjectId(vehicleIdOrBaseTrimName) } as any);
                if (vehicle) {
                    vehicles = [vehicle];
                }
            }
            
            // 2. ObjectId가 아니거나 못 찾은 경우, base_trim_name으로 검색 (세부트림 조회용)
            if (vehicles.length === 0) {
                const vehiclesByBaseTrim = await this.vehicleModel.find({ 
                    base_trim_name: vehicleIdOrBaseTrimName 
                }).lean().exec();
                
                if (vehiclesByBaseTrim && vehiclesByBaseTrim.length > 0) {
                    vehicles = vehiclesByBaseTrim;
                } else {
                    // 3. vehicle_name이나 model_id로 검색 (하위 호환성)
                    const vehicle = await this.vehicleModel.collection.findOne({ 
                        $or: [
                            { _id: vehicleIdOrBaseTrimName },
                            { vehicle_name: vehicleIdOrBaseTrimName },
                            { model_id: vehicleIdOrBaseTrimName }
                        ]
                    } as any);
                    if (vehicle) {
                        vehicles = [vehicle];
                    }
                }
            }

            if (vehicles.length === 0) return [];

            // 모든 vehicle의 trims를 수집
            const allTrims: any[] = [];
            vehicles.forEach((vehicle: any) => {
                if (vehicle.trims && Array.isArray(vehicle.trims) && vehicle.trims.length > 0) {
                    vehicle.trims.forEach((trim: any) => {
                        allTrims.push({
                            _id: trim._id,
                            id: trim._id,
                            name: trim.trim_name || trim.name, 
                            trim_name: trim.trim_name,
                            base_price: trim.price,
                            price: trim.price,
                            price_formatted: trim.price_formatted,
                            options: trim.options || []
                        });
                    });
                }
            });

            return allTrims;

        } catch (e) {
            console.error('getTrimsByModel 에러:', e);
            return [];
        }
    }

    // 4. 트림 상세 정보
    async getTrimDetail(trimId: string, modelName?: string, baseTrimId?: string) {
        const decodedId = decodeURIComponent(trimId);
        
        if (!decodedId) throw new NotFoundException(`Trim ID가 비어있습니다.`);

        try {
            let vehicle: any = null;
            
            // baseTrimId가 있으면 먼저 base_trim_name으로 필터링하여 정확한 차량 찾기
            if (baseTrimId) {
                const baseTrimName = decodeURIComponent(baseTrimId);
                const query: any = { base_trim_name: baseTrimName };
                if (modelName) {
                    query.vehicle_name = modelName;
                }
                vehicle = await this.vehicleModel.collection.findOne(query as any);
                
                // base_trim_name으로 찾은 차량의 trims 배열에서만 검색
                if (vehicle && vehicle.trims && Array.isArray(vehicle.trims)) {
                    const foundTrim = vehicle.trims.find((t: any) => {
                        // _id로 매칭
                        if (t._id && (t._id.toString() === decodedId || t._id.toString() === trimId)) return true;
                        // trim_name으로 매칭
                        if (t.trim_name === decodedId || t.trim_name === trimId) return true;
                        // name으로 매칭
                        if (t.name === decodedId || t.name === trimId) return true;
                        // 숫자 ID 매칭
                        if (/^\d+$/.test(decodedId)) {
                            const numericId = parseInt(decodedId, 10);
                            if (t.lineup_id === numericId || t.trim_id === numericId) return true;
                            if (t._id && t._id.toString() === decodedId) return true;
                        }
                        return false;
                    });
                    if (foundTrim) {
                        // 정확한 차량과 트림을 찾았으므로 바로 반환
                        const trimData = foundTrim;
                        return {
                            ...trimData,
                            _id: trimData._id,
                            id: decodedId, 
                            name: trimData.trim_name || trimData.name,
                            base_price: trimData.price,
                            model_name: vehicle.vehicle_name,
                            manufacturer: vehicle.brand_name,
                            image_url: vehicle.main_image,
                            exterior_images: Array.isArray(vehicle.exterior_images) ? vehicle.exterior_images.slice(0, 4) : [],
                            interior_images: Array.isArray(vehicle.interior_images) ? vehicle.interior_images.slice(0, 4) : [],
                            all_exterior_images: vehicle.exterior_images || [],
                            all_interior_images: vehicle.interior_images || [],
                            ...(Array.isArray(vehicle.color_images) && vehicle.color_images.length > 0 ? {
                                color_images: vehicle.color_images.slice(0, 4),
                                all_color_images: vehicle.color_images
                            } : {}),
                            options: trimData.options || []
                        };
                    } else {
                        // baseTrimId로 찾은 차량에 해당 trimId가 없으면 null로 리셋하고 계속 검색
                        vehicle = null;
                    }
                }
            }

            // 1. ObjectId 검색 (가장 정확한 방법)
            if (Types.ObjectId.isValid(decodedId)) {
                vehicle = await this.vehicleModel.collection.findOne({ 'trims._id': new Types.ObjectId(decodedId) } as any);
            }
            
            // 2. 문자열 _id 검색
            if (!vehicle) {
                vehicle = await this.vehicleModel.collection.findOne({ 'trims._id': decodedId } as any);
            }

            // 3. 숫자 ID 검색 (lineup_id, trim_id 등)
            if (!vehicle && /^\d+$/.test(decodedId)) {
                const numericId = parseInt(decodedId, 10);
                const numericIdStr = decodedId; // 문자열로도 검색
                
                // vehicle의 lineup_id로 검색
                let query: any = { lineup_id: numericIdStr };
                if (modelName) {
                    query.vehicle_name = modelName;
                }
                vehicle = await this.vehicleModel.collection.findOne(query as any);
                
                // trims 배열 내부 검색
                if (!vehicle) {
                    query = {
                        $or: [
                            { 'trims.lineup_id': numericId },
                            { 'trims.trim_id': numericId },
                            { 'trims._id': numericIdStr }
                        ]
                    };
                    if (modelName) {
                        query.vehicle_name = modelName;
                    }
                    vehicle = await this.vehicleModel.collection.findOne(query as any);
                }
                
                // 모든 차량을 가져와서 trims 배열을 순회하며 찾기 (마지막 fallback)
                if (!vehicle) {
                    const allVehicles = await this.vehicleModel.find(modelName ? { vehicle_name: modelName } : {}).lean().exec();
                    for (const v of allVehicles) {
                        if (v.trims && Array.isArray(v.trims)) {
                            const foundTrim = v.trims.find((t: any) => {
                                // _id를 문자열로 변환해서 비교
                                if (t._id && t._id.toString() === numericIdStr) return true;
                                // 숫자 필드 비교
                                if (t.lineup_id === numericId || t.trim_id === numericId) return true;
                                return false;
                            });
                            if (foundTrim) {
                                vehicle = v;
                                break;
                            }
                        }
                    }
                }
            }

            // 4. 이름 검색 (Fallback) - modelName이 있으면 함께 필터링
            if (!vehicle) {
                const query: any = { 'trims.trim_name': decodedId };
                if (modelName) {
                    query.vehicle_name = modelName;
                }
                vehicle = await this.vehicleModel.collection.findOne(query as any);
            }
            if (!vehicle) {
                const query: any = { 'trims.name': decodedId };
                if (modelName) {
                    query.vehicle_name = modelName;
                }
                vehicle = await this.vehicleModel.collection.findOne(query as any);
            }

            if (!vehicle) {
                throw new NotFoundException(`데이터 없음: ${decodedId}`);
            }

            let trimData: any = null;
            if (vehicle.trims) {
                // 1. _id로 정확히 매칭
                trimData = vehicle.trims.find((t: any) => 
                    (t._id && t._id.toString() === decodedId.toString())
                );
                
                // 2. ObjectId로 매칭 시도
                if (!trimData && Types.ObjectId.isValid(decodedId)) {
                    trimData = vehicle.trims.find((t: any) => 
                        (t._id && t._id.toString() === new Types.ObjectId(decodedId).toString())
                    );
                }
                
                // 3. 숫자 ID로 매칭 (lineup_id, trim_id 등)
                if (!trimData && /^\d+$/.test(decodedId)) {
                    const numericId = parseInt(decodedId, 10);
                    const numericIdStr = decodedId;
                    trimData = vehicle.trims.find((t: any) => {
                        // _id를 문자열로 변환해서 비교
                        if (t._id && t._id.toString() === numericIdStr) return true;
                        // 숫자 필드 비교
                        if (t.lineup_id === numericId || t.trim_id === numericId) return true;
                        // _id를 숫자로 변환해서 비교 (ObjectId의 일부가 숫자일 수 있음)
                        if (t._id) {
                            try {
                                const idStr = t._id.toString();
                                // ObjectId의 마지막 부분이 숫자일 수 있음
                                if (idStr.includes(numericIdStr)) return true;
                            } catch (e) {}
                        }
                        return false;
                    });
                }
            }
            
            // 4. 이름으로 매칭 (Fallback)
            if (!trimData && vehicle.trims) {
                const decodedTrimName = decodedId.split(':')[0].trim(); // "트렌디 A/T:1" 형식 처리
                trimData = vehicle.trims.find((t: any) => 
                    t.trim_name === decodedTrimName || t.trim_name === decodedId || 
                    t.name === decodedTrimName || t.name === decodedId
                );
            }
            
            if (!trimData) {
                throw new NotFoundException(`트림 추출 실패: ${decodedId} (차량: ${vehicle.vehicle_name})`);
            }

            return {
                ...trimData,
                _id: trimData._id,
                id: decodedId, 
                name: trimData.trim_name || trimData.name,
                base_price: trimData.price,
                model_name: vehicle.vehicle_name,
                manufacturer: vehicle.brand_name,
                image_url: vehicle.main_image,
                exterior_images: Array.isArray(vehicle.exterior_images) ? vehicle.exterior_images.slice(0, 4) : [],
                interior_images: Array.isArray(vehicle.interior_images) ? vehicle.interior_images.slice(0, 4) : [],
                all_exterior_images: vehicle.exterior_images || [],
                all_interior_images: vehicle.interior_images || [],
                ...(Array.isArray(vehicle.color_images) && vehicle.color_images.length > 0 ? {
                    color_images: vehicle.color_images.slice(0, 4),
                    all_color_images: vehicle.color_images
                } : {}),
                options: trimData.options || []
            };
        } catch (e) {
            if (e instanceof NotFoundException) throw e;
            throw new InternalServerErrorException("서버 오류");
        }
    }

    // 5. 비교 데이터 조회
    async getCompareData(ids: string) {
        if (!ids) return [];
        const idList = ids.split(',').filter(id => id.trim() !== '');
        const promises = idList.map(async (trimId) => {
            try { return await this.getTrimDetail(trimId); } catch (e) { return null; }
        });
        const results = await Promise.all(promises);
        return results.filter(item => item !== null);
    }

    // 6. ⭐ 비교 견적 상세 (옵션 매칭 디버깅 추가!)
    async getCompareDetails(trimId: string, optionIds: string[]) {
        console.log(`\n🕵️ [DEBUG] 옵션 매칭 시작! 트림ID: ${trimId}, 요청옵션: ${JSON.stringify(optionIds)}`);
        
        const detail = await this.getTrimDetail(trimId);
        
        let selectedOptions: any[] = [];
        const availableOptions = detail.options || [];

        console.log(`   👉 DB 보유 옵션 개수: ${availableOptions.length}개`);

        if (optionIds && optionIds.length > 0 && availableOptions.length > 0) {
             selectedOptions = availableOptions.filter((opt: any, index: number) => {
                 const realId = opt._id ? opt._id.toString() : '없음';
                 const tempId = `opt-${index}`;
                 
                 // 디버깅용 로그: 매칭 시도
                 // console.log(`      검사중[${index}]: realId=${realId}, tempId=${tempId} ...`);

                 // 1. 진짜 ID(_id) 매칭
                 if (opt._id && optionIds.includes(realId)) {
                     console.log(`      ✅ ID 매칭 성공! (${realId})`);
                     return true;
                 }
                 
                 // 2. 인덱스 매칭 (opt-0 등)
                 if (optionIds.includes(tempId)) {
                     console.log(`      ✅ 인덱스 매칭 성공! (${tempId}) -> ${opt.option_name || opt.name}`);
                     return true;
                 }

                 return false;
             });
        } else {
            console.log(`   ⚠️ 옵션 선택 불가 조건: 요청옵션(${optionIds.length}) / DB옵션(${availableOptions.length})`);
        }

        console.log(`   🏁 최종 선택된 옵션: ${selectedOptions.length}개`);

        const basePrice = detail.base_price || 0;
        const totalOptionPrice = selectedOptions.reduce((sum, opt) => {
            const price = opt.option_price || opt.price || 0;
            return sum + price;
        }, 0);

        return {
            car: {
                manufacturer: detail.manufacturer,
                model: detail.model_name,
                trim_name: detail.name,
                base_price: basePrice,
                image_url: detail.image_url,
            },
            selectedOptions: selectedOptions.map(opt => ({
                id: opt._id,
                name: opt.option_name || opt.name,
                price: opt.option_price || opt.price || 0
            })),
            totalOptionPrice,
            finalPrice: basePrice + totalOptionPrice,
        };
    }
}
