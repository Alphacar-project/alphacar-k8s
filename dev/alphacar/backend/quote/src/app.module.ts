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
            useFactory: async (config: ConfigService) => {
                // MONGO_URI 또는 MONGODB_URI가 있으면 우선 사용
                const mongoUri = config.get<string>('MONGO_URI') || config.get<string>('MONGODB_URI');
                if (mongoUri) {
                    console.log('[Quote] Using MONGODB_URI from environment');
                    return { uri: mongoUri };
                }
                
                // 개별 변수로 조합 (MONGO_* 또는 DATABASE_* 모두 지원)
                const user = config.get<string>('MONGO_USER') || config.get<string>('DATABASE_USER') || process.env.MONGO_USER || process.env.DATABASE_USER;
                const password = config.get<string>('MONGO_PASS') || config.get<string>('DATABASE_PASSWORD') || process.env.MONGO_PASS || process.env.DATABASE_PASSWORD;
                const host = config.get<string>('MONGO_HOST') || config.get<string>('DATABASE_HOST') || process.env.MONGO_HOST || process.env.DATABASE_HOST;
                const port = config.get<string>('MONGO_PORT') || config.get<string>('DATABASE_PORT') || process.env.MONGO_PORT || process.env.DATABASE_PORT;
                const dbName = config.get<string>('MONGO_DB_NAME') || config.get<string>('DATABASE_NAME') || process.env.MONGO_DB_NAME || process.env.DATABASE_NAME;
                
                console.log(`[Quote] MongoDB connection params: user=${user ? '***' : 'undefined'}, host=${host}, port=${port}, dbName=${dbName}`);
                
                if (!user || !password || !host || !port || !dbName) {
                    throw new Error(`MongoDB connection parameters missing: user=${user ? '***' : 'undefined'}, host=${host || 'undefined'}, port=${port || 'undefined'}, dbName=${dbName || 'undefined'}`);
                }
                
                const uri = `mongodb://${user}:${password}@${host}:${port}/${dbName}?authSource=admin`;
                console.log(`[Quote] MongoDB URI constructed: mongodb://${user}:***@${host}:${port}/${dbName}?authSource=admin`);
                return { uri };
            },
            inject: [ConfigService],
        }),

        // 2. 견적서 저장용 원격 DB 연결 (환경 변수 사용)
        MongooseModule.forRootAsync({
	    connectionName: 'estimate_conn',
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => {
                // ESTIMATE_DB_URI가 있으면 우선 사용
                const estimateUri = config.get<string>('ESTIMATE_DB_URI') || process.env.ESTIMATE_DB_URI;
                if (estimateUri) {
                    console.log('[Quote] Using ESTIMATE_DB_URI from environment');
                    return { uri: estimateUri };
                }
                
                // 개별 변수로 조합 (없으면 메인 DB와 동일하게 사용)
                const user = config.get<string>('ESTIMATE_DB_USER') || config.get<string>('MONGO_USER') || process.env.ESTIMATE_DB_USER || process.env.MONGO_USER;
                const password = config.get<string>('ESTIMATE_DB_PASSWORD') || config.get<string>('MONGO_PASS') || process.env.ESTIMATE_DB_PASSWORD || process.env.MONGO_PASS;
                const host = config.get<string>('ESTIMATE_DB_HOST') || config.get<string>('MONGO_HOST') || process.env.ESTIMATE_DB_HOST || process.env.MONGO_HOST;
                const port = config.get<string>('ESTIMATE_DB_PORT') || config.get<string>('MONGO_PORT') || process.env.ESTIMATE_DB_PORT || process.env.MONGO_PORT;
                const dbName = config.get<string>('ESTIMATE_DB_NAME') || config.get<string>('MONGO_DB_NAME') || process.env.ESTIMATE_DB_NAME || process.env.MONGO_DB_NAME;
                
                if (!user || !password || !host || !port || !dbName) {
                    // 견적 DB가 없으면 메인 DB와 동일하게 사용
                    const mongoUri = config.get<string>('MONGODB_URI') || process.env.MONGODB_URI;
                    if (mongoUri) {
                        console.log('[Quote] Using MONGODB_URI for estimate_conn (fallback)');
                        return { uri: mongoUri };
                    }
                    throw new Error(`Estimate DB connection parameters missing`);
                }
                
                const uri = `mongodb://${user}:${password}@${host}:${port}/${dbName}?authSource=admin`;
                console.log(`[Quote] Estimate DB URI constructed: mongodb://${user}:***@${host}:${port}/${dbName}?authSource=admin`);
                return { uri };
            },
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
