import { Document, Types, Schema as MongooseSchema } from 'mongoose';
export declare class VehicleOption {
    option_name: any;
    option_description: any;
    option_price: any;
    option_price_formatted: any;
}
export declare class VehicleTrim {
    trim_name: string;
    price: number;
    price_formatted: string;
    specifications: Record<string, any>;
    options: VehicleOption[];
}
export declare class RatingBreakdown {
    comfort: number;
    design: number;
    driving_performance: number;
    fuel_efficiency: number;
    price: number;
    quality: number;
}
export declare class VehicleReview {
    review_id: string;
    content: string;
    published_date: string;
    like_count: number;
    overall_rating: number;
    rating_breakdown: RatingBreakdown;
}
export declare class ColorImage {
    color_name: any;
    image_url: any;
    order: any;
}
export declare class StandardImage {
    url: any;
    order: any;
}
export type VehicleDocument = Vehicle & Document;
export declare class Vehicle {
    _id: Types.ObjectId;
    model_id: string;
    lineup_id: string;
    vehicle_name: string;
    vehicle_name_full: string;
    brand_name: string;
    vehicle_type: string;
    base_trim_name: string;
    model_year: string;
    release_date: string;
    fuel_type: string;
    logo_url: string;
    main_image: string;
    is_active: boolean;
    last_updated: Date;
    trims: VehicleTrim[];
    review: VehicleReview[];
    color_images: ColorImage[];
    exterior_images: StandardImage[];
    interior_images: StandardImage[];
    source_urls: string[];
}
export declare const VehicleSchema: MongooseSchema<Vehicle, import("mongoose").Model<Vehicle, any, any, any, Document<unknown, any, Vehicle, any, {}> & Vehicle & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Vehicle, Document<unknown, {}, import("mongoose").FlatRecord<Vehicle>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Vehicle> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
