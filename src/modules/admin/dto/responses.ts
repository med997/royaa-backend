import { ApiProperty } from '@nestjs/swagger';
import { OrderModel, ProductImageModel, ProductVariantModel, UserModel } from '../../../common/swagger/response-models.js';

const uuid = '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c';

export class AdminSessionModel {
  @ApiProperty({ description: 'رمز وصول قناة الإدارة' }) token: string;
  @ApiProperty({ description: 'رمز التجديد' }) refreshToken: string;
  @ApiProperty({ type: UserModel }) user: UserModel;
}

class CustomerRef {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty() userName: string;
  @ApiProperty() mobileNo: string;
}

export class AdminOrderModel extends OrderModel {
  @ApiProperty({ type: CustomerRef }) customer: CustomerRef;
}

class AdminImageModel extends ProductImageModel {
  @ApiProperty({ example: 0 }) sortOrder: number;
}

class RefModel {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty() nameEn: string;
}

export class AdminProductModel {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty({ type: String, nullable: true }) sku: string | null;
  @ApiProperty() nameAr: string;
  @ApiProperty() nameEn: string;
  @ApiProperty({ type: String, nullable: true }) descriptionAr: string | null;
  @ApiProperty({ type: String, nullable: true }) descriptionEn: string | null;
  @ApiProperty({ description: 'السعر بالدولار', example: 48 }) basePrice: number;
  @ApiProperty({ type: Number, nullable: true }) compareAtPrice: number | null;
  @ApiProperty({ type: Number, nullable: true }) widthMm: number | null;
  @ApiProperty({ type: Number, nullable: true }) bridgeMm: number | null;
  @ApiProperty({ type: Number, nullable: true }) armMm: number | null;
  @ApiProperty({ type: String, nullable: true }) shape: string | null;
  @ApiProperty({ type: String, nullable: true }) material: string | null;
  @ApiProperty({ type: String, nullable: true }) gender: string | null;
  @ApiProperty({ type: String, nullable: true }) frameType: string | null;
  @ApiProperty({ description: 'معرّف النموذج المرتبط (إن وُجد)', type: String, nullable: true }) modelAssetId: string | null;
  @ApiProperty({ type: String, nullable: true }) model3dUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) modelUsdzUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) modelPosterUrl: string | null;
  @ApiProperty({ type: [String] }) view360Images: string[];
  @ApiProperty() isFeatured: boolean;
  @ApiProperty() isNew: boolean;
  @ApiProperty() isBestSeller: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty() rating: number;
  @ApiProperty() ratingCount: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: RefModel, nullable: true }) category: RefModel | null;
  @ApiProperty({ type: RefModel, nullable: true }) brand: RefModel | null;
  @ApiProperty({ type: [AdminImageModel] }) images: AdminImageModel[];
  @ApiProperty({ type: [ProductVariantModel] }) variants: ProductVariantModel[];
}

export class StockModel {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty({ example: 15 }) stock: number;
}

export class AdminUserModel extends UserModel {
  @ApiProperty({ description: 'عدد الطلبات', example: 3 }) orderCount: number;
}

export class SentModel {
  @ApiProperty({ description: 'عدد الإشعارات المرسلة', example: 120 }) sent: number;
}

export class AdminReviewModel {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty() userName: string;
  @ApiProperty({ example: uuid }) productId: string;
  @ApiProperty() productName: string;
  @ApiProperty({ example: 5 }) rating: number;
  @ApiProperty({ type: String, nullable: true }) comment: string | null;
  @ApiProperty() isVerifiedPurchase: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export class ConversationModel {
  @ApiProperty({ example: uuid }) userId: string;
  @ApiProperty() userName: string;
  @ApiProperty() mobileNo: string;
  @ApiProperty({ description: 'آخر رسالة' }) lastMessage: string;
  @ApiProperty({ enum: ['user', 'admin'] }) lastSender: string;
  @ApiProperty({ type: String, format: 'date-time' }) lastAt: Date;
  @ApiProperty({ description: 'رسائل العميل غير المقروءة', example: 2 }) unread: number;
}

export class ModelAssetModel {
  @ApiProperty({ example: uuid }) id: string;
  @ApiProperty({ description: 'اسم الملف الأصلي', example: 'frame.glb' }) name: string;
  @ApiProperty({ description: 'حالة المعالجة', enum: ['processing', 'ready', 'failed'] }) status: string;
  @ApiProperty({ description: 'رقم النسخة (يزيد عند إعادة المعالجة وتتغير الروابط)', example: 1 }) version: number;
  @ApiProperty({ description: 'حجم الأصل بالبايت', example: 8400000 }) originalBytes: number;
  @ApiProperty({ description: 'حجم GLB بعد الضغط', type: Number, nullable: true }) glbBytes: number | null;
  @ApiProperty({ description: 'حجم USDZ المولَّد', type: Number, nullable: true }) usdzBytes: number | null;
  @ApiProperty({ description: 'نسبة التوفير في GLB %', type: Number, nullable: true, example: 72 }) savedPercent: number | null;
  @ApiProperty({ description: 'رابط GLB المضغوط', type: String, nullable: true }) glbUrl: string | null;
  @ApiProperty({ description: 'رابط USDZ', type: String, nullable: true }) usdzUrl: string | null;
  @ApiProperty({ description: 'سبب الفشل', type: String, nullable: true }) error: string | null;
  @ApiProperty({ description: 'عدد المنتجات/الألوان التي تستخدمه', example: 2 }) usedBy: number;
  @ApiProperty({ description: 'منذ متى لا يستخدمه أحد (يصبح مرشحاً للتنظيف)', type: String, format: 'date-time', nullable: true }) unusedSince: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export class ModelUploadModel {
  @ApiProperty({ description: 'true إن كان الملف نفسه مرفوعاً سابقاً فأُعيد استخدام نتيجته المخزّنة بلا معالجة' }) cached: boolean;
  @ApiProperty({ type: ModelAssetModel }) asset: ModelAssetModel;
}

export class CacheStatsModel {
  @ApiProperty({ example: 12 }) assets: number;
  @ApiProperty({ example: 10 }) ready: number;
  @ApiProperty({ example: 1 }) processing: number;
  @ApiProperty({ example: 1 }) failed: number;
  @ApiProperty({ description: 'غير مستخدمة', example: 2 }) unused: number;
  @ApiProperty({ description: 'مجموع حجم الأصول', example: 84000000 }) originalBytes: number;
  @ApiProperty({ description: 'مجموع GLB بعد الضغط', example: 22000000 }) glbBytes: number;
  @ApiProperty({ description: 'مجموع USDZ', example: 30000000 }) usdzBytes: number;
  @ApiProperty({ description: 'نسبة التوفير الإجمالية %', example: 74 }) savedPercent: number;
  @ApiProperty({ description: 'المساحة الفعلية على القرص (الأصول + المخرجات)', example: 136000000 }) diskBytes: number;
}

export class CleanupModel {
  @ApiProperty({ description: 'عدد النماذج المحذوفة', example: 2 }) deleted: number;
  @ApiProperty({ description: 'المساحة المحرَّرة بالبايت', example: 1200000 }) freedBytes: number;
}

export class UploadsModel {
  @ApiProperty({ description: 'الروابط بترتيب الملفات المرسلة', type: [String] }) urls: string[];
}

export class UploadModel {
  @ApiProperty({ description: 'رابط الملف المرفوع', example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' }) url: string;
}

class StatusCount {
  @ApiProperty({ example: 'confirmed' }) status: string;
  @ApiProperty({ example: 4 }) count: number;
}

class DayStat {
  @ApiProperty({ example: '2026-10-02' }) date: string;
  @ApiProperty({ example: 5 }) orders: number;
  @ApiProperty({ description: 'الإيراد بالدولار', example: 240.5 }) revenueUsd: number;
}

class LowStock {
  @ApiProperty({ example: uuid }) variantId: string;
  @ApiProperty({ example: 'Arc One' }) productName: string;
  @ApiProperty({ example: 'Black' }) color: string;
  @ApiProperty({ example: 2 }) stock: number;
}

class TopProduct {
  @ApiProperty({ example: 'Arc One' }) name: string;
  @ApiProperty({ description: 'الكمية المباعة', example: 18 }) quantity: number;
}

export class DashboardModel {
  @ApiProperty({ description: 'عدد العملاء', example: 250 }) customers: number;
  @ApiProperty({ description: 'عدد المنتجات المفعّلة', example: 40 }) products: number;
  @ApiProperty({ description: 'إجمالي الطلبات', example: 530 }) ordersTotal: number;
  @ApiProperty({ description: 'طلبات اليوم', example: 12 }) ordersToday: number;
  @ApiProperty({ description: 'طلبات بانتظار المعالجة (confirmed + preparing)', example: 9 }) ordersPending: number;
  @ApiProperty({ description: 'إيراد اليوم بالدولار (بدون الملغاة)', example: 540 }) revenueTodayUsd: number;
  @ApiProperty({ description: 'إيراد آخر 30 يوماً بالدولار', example: 9800 }) revenue30DaysUsd: number;
  @ApiProperty({ description: 'إجمالي الإيراد بالدولار', example: 51000 }) revenueTotalUsd: number;
  @ApiProperty({ description: 'رسائل دعم غير مقروءة', example: 3 }) unreadSupport: number;
  @ApiProperty({ type: [StatusCount] }) ordersByStatus: StatusCount[];
  @ApiProperty({ description: 'آخر 7 أيام', type: [DayStat] }) last7Days: DayStat[];
  @ApiProperty({ description: 'ألوان مخزونها 5 أو أقل', type: [LowStock] }) lowStock: LowStock[];
  @ApiProperty({ description: 'الأكثر مبيعاً', type: [TopProduct] }) topProducts: TopProduct[];
}
