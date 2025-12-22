// backend/quote/src/app.module.ts (전체 코드)
import { Module, Global, forwardRef } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Manufacturer, ManufacturerSchema } from './schemas/manufacturer.schema';
import { Vehicle, VehicleSchema } from '@schemas/vehicle.schema';

import { EstimateModule } from './estimate/estimate.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        // ✅ [수정] DB 연결: MONGO_URI 또는 MONGODB_URI를 우선 사용, 없으면 개별 변수 조합
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                // MONGO_URI 또는 MONGODB_URI가 있으면 우선 사용, 없으면 개별 변수로 조합
                uri: config.get<string>('MONGO_URI') || 
                     config.get<string>('MONGODB_URI') ||
                     `mongodb://${config.get('DATABASE_USER')}:${config.get('DATABASE_PASSWORD')}@${config.get('DATABASE_HOST')}:${config.get('DATABASE_PORT')}/${config.get('DATABASE_NAME')}?authSource=admin`,
            }),
            inject: [ConfigService],
        }),

        // 2. 견적서 저장용 원격 DB 연결 (환경 변수 사용)
        MongooseModule.forRootAsync({
	    connectionName: 'estimate_conn',
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('ESTIMATE_DB_URI') ||
                     `mongodb://${config.get<string>('ESTIMATE_DB_USER')}:${config.get<string>('ESTIMATE_DB_PASSWORD')}@${config.get<string>('ESTIMATE_DB_HOST')}:${config.get<string>('ESTIMATE_DB_PORT')}/${config.get<string>('ESTIMATE_DB_NAME')}?authSource=admin`,
            }),
            inject: [ConfigService],
        }),

        // 3. 컬렉션 등록
        MongooseModule.forFeature([
            { name: Manufacturer.name, schema: ManufacturerSchema },
            { name: Vehicle.name, schema: VehicleSchema },
        ]),

        // 4. 모듈 등록
	AuthModule,
        EstimateModule,
        VehiclesModule,
        forwardRef(() => VehiclesModule),
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: [AppService],
})
export class AppModule {}
