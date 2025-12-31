"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleSchema = exports.Vehicle = exports.StandardImage = exports.ColorImage = exports.VehicleReview = exports.RatingBreakdown = exports.VehicleTrim = exports.VehicleOption = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let VehicleOption = class VehicleOption {
    option_name;
    option_description;
    option_price;
    option_price_formatted;
};
exports.VehicleOption = VehicleOption;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], VehicleOption.prototype, "option_name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], VehicleOption.prototype, "option_description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], VehicleOption.prototype, "option_price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], VehicleOption.prototype, "option_price_formatted", void 0);
exports.VehicleOption = VehicleOption = __decorate([
    (0, mongoose_1.Schema)()
], VehicleOption);
const VehicleOptionSchema = mongoose_1.SchemaFactory.createForClass(VehicleOption);
let VehicleTrim = class VehicleTrim {
    trim_name;
    price;
    price_formatted;
    specifications;
    options;
};
exports.VehicleTrim = VehicleTrim;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VehicleTrim.prototype, "trim_name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VehicleTrim.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VehicleTrim.prototype, "price_formatted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], VehicleTrim.prototype, "specifications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [VehicleOptionSchema], default: [] }),
    __metadata("design:type", Array)
], VehicleTrim.prototype, "options", void 0);
exports.VehicleTrim = VehicleTrim = __decorate([
    (0, mongoose_1.Schema)()
], VehicleTrim);
const VehicleTrimSchema = mongoose_1.SchemaFactory.createForClass(VehicleTrim);
let RatingBreakdown = class RatingBreakdown {
    comfort;
    design;
    driving_performance;
    fuel_efficiency;
    price;
    quality;
};
exports.RatingBreakdown = RatingBreakdown;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "comfort", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "design", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "driving_performance", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "fuel_efficiency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], RatingBreakdown.prototype, "quality", void 0);
exports.RatingBreakdown = RatingBreakdown = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RatingBreakdown);
const RatingBreakdownSchema = mongoose_1.SchemaFactory.createForClass(RatingBreakdown);
let VehicleReview = class VehicleReview {
    review_id;
    content;
    published_date;
    like_count;
    overall_rating;
    rating_breakdown;
};
exports.VehicleReview = VehicleReview;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VehicleReview.prototype, "review_id", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VehicleReview.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VehicleReview.prototype, "published_date", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VehicleReview.prototype, "like_count", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VehicleReview.prototype, "overall_rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: RatingBreakdownSchema }),
    __metadata("design:type", RatingBreakdown)
], VehicleReview.prototype, "rating_breakdown", void 0);
exports.VehicleReview = VehicleReview = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], VehicleReview);
const VehicleReviewSchema = mongoose_1.SchemaFactory.createForClass(VehicleReview);
let ColorImage = class ColorImage {
    color_name;
    image_url;
    order;
};
exports.ColorImage = ColorImage;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], ColorImage.prototype, "color_name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], ColorImage.prototype, "image_url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], ColorImage.prototype, "order", void 0);
exports.ColorImage = ColorImage = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ColorImage);
const ColorImageSchema = mongoose_1.SchemaFactory.createForClass(ColorImage);
let StandardImage = class StandardImage {
    url;
    order;
};
exports.StandardImage = StandardImage;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], StandardImage.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], StandardImage.prototype, "order", void 0);
exports.StandardImage = StandardImage = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], StandardImage);
const StandardImageSchema = mongoose_1.SchemaFactory.createForClass(StandardImage);
let Vehicle = class Vehicle {
    _id;
    model_id;
    lineup_id;
    vehicle_name;
    vehicle_name_full;
    brand_name;
    vehicle_type;
    base_trim_name;
    model_year;
    release_date;
    fuel_type;
    logo_url;
    main_image;
    is_active;
    last_updated;
    trims;
    review;
    color_images;
    exterior_images;
    interior_images;
    source_urls;
};
exports.Vehicle = Vehicle;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Vehicle.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "model_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "lineup_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "vehicle_name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "vehicle_name_full", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "brand_name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "vehicle_type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "base_trim_name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "model_year", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "release_date", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "fuel_type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "logo_url", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Vehicle.prototype, "main_image", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Boolean)
], Vehicle.prototype, "is_active", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Vehicle.prototype, "last_updated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [VehicleTrimSchema], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "trims", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [VehicleReviewSchema], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "review", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ColorImageSchema], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "color_images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [StandardImageSchema], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "exterior_images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [StandardImageSchema], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "interior_images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Vehicle.prototype, "source_urls", void 0);
exports.Vehicle = Vehicle = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'danawa_vehicle_data',
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    })
], Vehicle);
exports.VehicleSchema = mongoose_1.SchemaFactory.createForClass(Vehicle);
//# sourceMappingURL=vehicle.schema.js.map