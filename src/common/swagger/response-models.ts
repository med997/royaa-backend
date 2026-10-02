import { ApiProperty } from '@nestjs/swagger';

const uuid = '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c';

export class HealthModel {
  @ApiProperty({ description: 'حالة الخدمة', example: 'ok' })
  status: string;
}

export class CurrencyModel {
  @ApiProperty({ description: 'رمز العملة', example: 'YER' })
  code: string;

  @ApiProperty({ description: 'رمز العرض', example: 'ر.ي' })
  symbol: string;

  @ApiProperty({ description: 'سعر الصرف مقابل العملة الأساسية (USD)', example: 250 })
  rateToBase: number;

  @ApiProperty({ description: 'هل هي العملة الافتراضية', example: true })
  isDefault: boolean;
}

export class AppConfigModel {
  @ApiProperty({ description: 'اللغات المدعومة', type: [String], example: ['ar', 'en'] })
  languages: string[];

  @ApiProperty({ description: 'اللغة الافتراضية', example: 'ar' })
  defaultLanguage: string;

  @ApiProperty({ description: 'العملات المفعّلة', type: [CurrencyModel] })
  currencies: CurrencyModel[];

  @ApiProperty({ description: 'العملة الافتراضية', example: 'YER' })
  defaultCurrency: string;
}

export class UserModel {
  @ApiProperty({ description: 'معرّف المستخدم', example: uuid })
  id: string;

  @ApiProperty({ description: 'اسم المستخدم', example: 'أحمد علي' })
  userName: string;

  @ApiProperty({ description: 'رقم الجوال', example: '777123456' })
  mobileNo: string;

  @ApiProperty({ description: 'البريد الإلكتروني', type: String, nullable: true, example: 'ahmed@example.com' })
  email: string | null;

  @ApiProperty({ description: 'هل تم التحقق من الجوال', example: true })
  isVerified: boolean;

  @ApiProperty({ description: 'الأدوار', type: [String], example: ['customer'] })
  roles: string[];

  @ApiProperty({ description: 'هل الحساب مفعّل', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'رابط الصورة الشخصية', type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'اللغة المفضلة', type: String, nullable: true, example: 'ar' })
  language: string | null;

  @ApiProperty({ description: 'العملة المفضلة', type: String, nullable: true, example: 'YER' })
  currency: string | null;

  @ApiProperty({ description: 'تاريخ إنشاء الحساب', type: String, format: 'date-time' })
  createdAt: Date;
}

export class MobileModel {
  @ApiProperty({ description: 'رقم الجوال الذي أُرسل إليه رمز التحقق', example: '777123456' })
  mobileNo: string;
}

export class AuthResultModel {
  @ApiProperty({ description: 'رمز JWT للمصادقة', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ description: 'رمز التجديد (30 يوماً) لاستبدال الجلسة عبر /auth/refresh' })
  refreshToken: string;

  @ApiProperty({ description: 'بيانات المستخدم', type: UserModel })
  user: UserModel;
}

export class CategoryModel {
  @ApiProperty({ description: 'معرّف التصنيف', example: uuid })
  id: string;

  @ApiProperty({ description: 'الاسم بالعربية', example: 'كلاسيكي' })
  nameAr: string;

  @ApiProperty({ description: 'الاسم بالإنجليزية', example: 'Classic' })
  nameEn: string;

  @ApiProperty({ description: 'رابط صورة التصنيف', type: String, nullable: true, example: 'https://picsum.photos/seed/cat-classic/400/400' })
  imageUrl: string | null;
}

export class BrandModel {
  @ApiProperty({ description: 'معرّف الماركة', example: uuid })
  id: string;

  @ApiProperty({ description: 'اسم الماركة', example: 'Ray-Ban' })
  name: string;

  @ApiProperty({ description: 'اسم الماركة بالعربية', type: String, nullable: true })
  nameAr: string | null;

  @ApiProperty({ description: 'رابط شعار الماركة', type: String, nullable: true, example: 'https://picsum.photos/seed/brand-ray-ban/300/300' })
  logoUrl: string | null;
}

export class ProductImageModel {
  @ApiProperty({ description: 'معرّف الصورة', example: uuid })
  id: string;

  @ApiProperty({ description: 'رابط الصورة', example: 'https://picsum.photos/seed/arc-one/600/400' })
  url: string;
}

export class ProductVariantModel {
  @ApiProperty({ description: 'معرّف اللون/النسخة', example: uuid })
  id: string;

  @ApiProperty({ description: 'اسم اللون بالعربية', example: 'أسود' })
  colorNameAr: string;

  @ApiProperty({ description: 'اسم اللون بالإنجليزية', example: 'Black' })
  colorNameEn: string;

  @ApiProperty({ description: 'كود اللون', example: '#1c1c1c' })
  colorHex: string;

  @ApiProperty({ description: 'رمز اللون SKU', type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ description: 'صورة خاصة باللون', type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'نموذج GLB خاص باللون (إن وُجد يتقدّم على نموذج المنتج)', type: String, nullable: true })
  model3dUrl: string | null;

  @ApiProperty({ description: 'نموذج USDZ خاص باللون', type: String, nullable: true })
  modelUsdzUrl: string | null;

  @ApiProperty({ description: 'الكمية المتوفرة في المخزون', example: 20 })
  stock: number;
}

export class ProductModel {
  @ApiProperty({ description: 'معرّف المنتج', example: uuid })
  id: string;

  @ApiProperty({ description: 'الاسم بالعربية', example: 'إطار Arc One' })
  nameAr: string;

  @ApiProperty({ description: 'الاسم بالإنجليزية', example: 'Arc One' })
  nameEn: string;

  @ApiProperty({ description: 'الوصف بالعربية', type: String, nullable: true })
  descriptionAr: string | null;

  @ApiProperty({ description: 'الوصف بالإنجليزية', type: String, nullable: true })
  descriptionEn: string | null;

  @ApiProperty({ description: 'السعر بالعملة المطلوبة', example: 12000 })
  price: number;

  @ApiProperty({ description: 'السعر قبل الخصم (إن وُجد)', type: Number, nullable: true, example: 15000 })
  compareAtPrice: number | null;

  @ApiProperty({ description: 'نسبة الخصم %', example: 20 })
  discountPercent: number;

  @ApiProperty({ description: 'رمز المنتج SKU', type: String, nullable: true, example: 'ARC-001' })
  sku: string | null;

  @ApiProperty({ description: 'عملة السعر', example: 'YER' })
  currency: string;

  @ApiProperty({ description: 'شكل الإطار', type: String, nullable: true, example: 'round' })
  shape: string | null;

  @ApiProperty({ description: 'خامة الإطار', type: String, nullable: true, example: 'acetate' })
  material: string | null;

  @ApiProperty({ description: 'الفئة', enum: ['men', 'women', 'unisex', 'kids'], nullable: true })
  gender: string | null;

  @ApiProperty({ description: 'نوع الإطار', type: String, nullable: true, example: 'full-rim' })
  frameType: string | null;

  @ApiProperty({ description: 'نموذج ثلاثي الأبعاد GLB (Android والويب وعرض 3D)', type: String, nullable: true })
  model3dUrl: string | null;

  @ApiProperty({ description: 'نموذج USDZ لـ AR على iOS (Quick Look)', type: String, nullable: true })
  modelUsdzUrl: string | null;

  @ApiProperty({ description: 'صورة معاينة تظهر قبل تحميل النموذج', type: String, nullable: true })
  modelPosterUrl: string | null;

  @ApiProperty({ description: 'صور عرض 360° مرتبة (إطار لكل زاوية)، فارغة إن لم يُعدّ', type: [String] })
  view360Images: string[];

  @ApiProperty({ description: 'منتج مميّز', example: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'وصل حديثاً', example: false })
  isNew: boolean;

  @ApiProperty({ description: 'الأكثر مبيعاً', example: false })
  isBestSeller: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'عرض الإطار (مم)', type: Number, nullable: true, example: 138 })
  widthMm: number | null;

  @ApiProperty({ description: 'عرض الجسر (مم)', type: Number, nullable: true, example: 18 })
  bridgeMm: number | null;

  @ApiProperty({ description: 'طول الذراع (مم)', type: Number, nullable: true, example: 145 })
  armMm: number | null;

  @ApiProperty({ description: 'متوسط التقييم (من 5)', example: 4.8 })
  rating: number;

  @ApiProperty({ description: 'عدد التقييمات', example: 126 })
  ratingCount: number;

  @ApiProperty({ description: 'التصنيف', type: CategoryModel, nullable: true })
  category: CategoryModel | null;

  @ApiProperty({ description: 'الماركة', type: BrandModel, nullable: true })
  brand: BrandModel | null;

  @ApiProperty({ description: 'الصور مرتبة', type: [ProductImageModel] })
  images: ProductImageModel[];

  @ApiProperty({ description: 'الألوان المتاحة', type: [ProductVariantModel] })
  variants: ProductVariantModel[];
}

export class FavoriteResultModel {
  @ApiProperty({ description: 'معرّف المنتج', example: uuid })
  productId: string;

  @ApiProperty({ description: 'هل المنتج في المفضلة بعد العملية', example: true })
  favorited: boolean;
}

export class CartProductModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'الاسم بالعربية', example: 'إطار Arc One' })
  nameAr: string;

  @ApiProperty({ description: 'الاسم بالإنجليزية', example: 'Arc One' })
  nameEn: string;

  @ApiProperty({ description: 'رابط الصورة الأولى', type: String, nullable: true })
  image: string | null;

  @ApiProperty({ description: 'سعر الوحدة بعملة السلة', example: 12000 })
  price: number;
}

export class CartVariantModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'أسود' })
  colorNameAr: string;

  @ApiProperty({ example: 'Black' })
  colorNameEn: string;

  @ApiProperty({ example: '#1c1c1c' })
  colorHex: string;
}

export class CartPrescriptionModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'وصفتي الحالية' })
  label: string;
}

export class CartItemModel {
  @ApiProperty({ description: 'معرّف عنصر السلة', example: uuid })
  id: string;

  @ApiProperty({ description: 'الكمية', example: 2 })
  quantity: number;

  @ApiProperty({ type: CartProductModel })
  product: CartProductModel;

  @ApiProperty({ description: 'اللون المختار (إن وُجد)', type: CartVariantModel, nullable: true })
  variant: CartVariantModel | null;

  @ApiProperty({ description: 'نوع العدسة', type: String, nullable: true, example: 'single_vision' })
  lensType: string | null;

  @ApiProperty({ description: 'الوصفة المرتبطة', type: CartPrescriptionModel, nullable: true })
  prescription: CartPrescriptionModel | null;

  @ApiProperty({ description: 'هل الكمية متوفرة حالياً في المخزون', example: true })
  inStock: boolean;

  @ApiProperty({ description: 'إجمالي السطر (السعر × الكمية)', example: 24000 })
  lineTotal: number;
}

export class CartModel {
  @ApiProperty({ type: [CartItemModel] })
  items: CartItemModel[];

  @ApiProperty({ description: 'المجموع الفرعي', example: 24000 })
  subtotal: number;

  @ApiProperty({ description: 'عملة السلة', example: 'YER' })
  currency: string;
}

export class AddressModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'اسم العنوان', example: 'المنزل' })
  label: string;

  @ApiProperty({ description: 'تفاصيل العنوان', example: 'شارع الزبيري، بجانب المسجد' })
  line1: string;

  @ApiProperty({ description: 'المدينة', example: 'صنعاء' })
  city: string;

  @ApiProperty({ description: 'اسم المستلم', type: String, nullable: true, example: 'أحمد علي' })
  recipientName: string | null;

  @ApiProperty({ description: 'جوال المستلم', type: String, nullable: true, example: '777123456' })
  recipientPhone: string | null;

  @ApiProperty({ description: 'الحي / المنطقة', type: String, nullable: true })
  district: string | null;

  @ApiProperty({ description: 'ملاحظات للمندوب', type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'خط العرض', type: Number, nullable: true, example: 15.3694 })
  latitude: number | null;

  @ApiProperty({ description: 'خط الطول', type: Number, nullable: true, example: 44.191 })
  longitude: number | null;

  @ApiProperty({ description: 'هل هو العنوان الافتراضي', example: true })
  isDefault: boolean;
}

export class OrderTimelineStageModel {
  @ApiProperty({ description: 'المرحلة', enum: ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], example: 'preparing' })
  stage: string;

  @ApiProperty({ description: 'وصف المرحلة (بالإنجليزية)', example: 'Preparing your order' })
  label: string;

  @ApiProperty({ description: 'وصف المرحلة (بالعربية)', example: 'جارٍ تجهيز طلبك' })
  labelAr: string;

  @ApiProperty({ description: 'وقت بلوغ المرحلة (null إن لم تبلغها بعد)', type: String, format: 'date-time', nullable: true })
  at: Date | null;

  @ApiProperty({ description: 'هل تم بلوغ المرحلة', example: true })
  done: boolean;
}

export class OrderItemModel {
  @ApiProperty({ description: 'اسم المنتج بالعربية وقت الشراء', example: 'إطار Arc One' })
  nameAr: string;

  @ApiProperty({ example: 'Arc One' })
  nameEn: string;

  @ApiProperty({ type: String, nullable: true, example: 'أسود' })
  colorNameAr: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Black' })
  colorNameEn: string | null;

  @ApiProperty({ description: 'معرّف المنتج (لإعادة الطلب)', type: String, nullable: true })
  productId: string | null;

  @ApiProperty({ description: 'معرّف اللون (لإعادة الطلب)', type: String, nullable: true })
  variantId: string | null;

  @ApiProperty({ description: 'نوع العدسة', type: String, nullable: true })
  lensType: string | null;

  @ApiProperty({ description: 'نسخة من الوصفة الطبية وقت الشراء', type: 'object', additionalProperties: true, nullable: true })
  prescription: Record<string, unknown> | null;

  @ApiProperty({ description: 'سعر الوحدة وقت الشراء', example: 12000 })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 24000 })
  lineTotal: number;
}

export class OrderAddressModel {
  @ApiProperty({ example: 'المنزل' })
  label: string;

  @ApiProperty({ example: 'شارع الزبيري' })
  line1: string;

  @ApiProperty({ example: 'صنعاء' })
  city: string;

  @ApiProperty({ type: String, nullable: true, example: 'أحمد علي' })
  recipientName: string | null;

  @ApiProperty({ type: String, nullable: true, example: '777123456' })
  recipientPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  district: string | null;

  @ApiProperty({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'خط العرض وقت الشراء', type: Number, nullable: true, example: 15.3694 })
  latitude: number | null;

  @ApiProperty({ description: 'خط الطول وقت الشراء', type: Number, nullable: true, example: 44.191 })
  longitude: number | null;
}

export class OrderSummaryModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'رقم الطلب المقروء', example: 'RY-100123' })
  orderNumber: string;

  @ApiProperty({ description: 'حالة الطلب', enum: ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] })
  status: string;

  @ApiProperty({ description: 'حالة الدفع', enum: ['pending', 'paid', 'refunded'] })
  paymentStatus: string;

  @ApiProperty({ description: 'الإجمالي', example: 24000 })
  total: number;

  @ApiProperty({ example: 'YER' })
  currency: string;

  @ApiProperty({ description: 'عدد العناصر', example: 2 })
  itemCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class OrderModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'رقم الطلب المقروء', example: 'RY-100123' })
  orderNumber: string;

  @ApiProperty({ description: 'حالة الطلب', enum: ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] })
  status: string;

  @ApiProperty({ description: 'حالة الدفع', enum: ['pending', 'paid', 'refunded'] })
  paymentStatus: string;

  @ApiProperty({ description: 'مراحل تتبع الطلب', type: [OrderTimelineStageModel] })
  timeline: OrderTimelineStageModel[];

  @ApiProperty({ description: 'عملة الطلب (ثابتة وقت الشراء)', example: 'YER' })
  currency: string;

  @ApiProperty({ description: 'المجموع الفرعي', example: 24000 })
  subtotal: number;

  @ApiProperty({ description: 'مبلغ الخصم', example: 0 })
  discount: number;

  @ApiProperty({ description: 'كود الخصم المستخدم', type: String, nullable: true })
  couponCode: string | null;

  @ApiProperty({ description: 'ملاحظات الطلب', type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'رسوم التوصيل (القياسي مجاني، السريع $4 محوّلة)', example: 1000 })
  deliveryFee: number;

  @ApiProperty({ description: 'الإجمالي', example: 25000 })
  total: number;

  @ApiProperty({ description: 'نسخة من عنوان التوصيل وقت الشراء', type: OrderAddressModel })
  address: OrderAddressModel;

  @ApiProperty({ enum: ['standard', 'express'], example: 'express' })
  deliveryMethod: string;

  @ApiProperty({ enum: ['card', 'wallet', 'cod'], example: 'cod' })
  paymentMethod: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: [OrderItemModel] })
  items: OrderItemModel[];
}

export class NotificationModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'نوع الإشعار', example: 'order_confirmed' })
  type: string;

  @ApiProperty({ example: 'Order confirmed' })
  title: string;

  @ApiProperty({ example: 'Your order RY-100123 totalling 25000 YER has been confirmed.' })
  body: string;

  @ApiProperty({ type: String, nullable: true, example: 'تم تأكيد الطلب' })
  titleAr: string | null;

  @ApiProperty({ type: String, nullable: true })
  bodyAr: string | null;

  @ApiProperty({ description: 'معرّف الطلب المرتبط للانتقال إليه', type: String, nullable: true })
  orderId: string | null;

  @ApiProperty({ description: 'هل قُرئ', example: false })
  isRead: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class UnreadCountModel {
  @ApiProperty({ description: 'عدد الإشعارات غير المقروءة', example: 3 })
  count: number;
}

export class MarkReadModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: true })
  isRead: boolean;
}

export class ReviewModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ description: 'اسم المقيِّم', example: 'أحمد علي' })
  userName: string;

  @ApiProperty({ description: 'التقييم من 1 إلى 5', example: 5 })
  rating: number;

  @ApiProperty({ type: String, nullable: true, example: 'جودة ممتازة' })
  comment: string | null;

  @ApiProperty({ description: 'مشتري موثّق', example: true })
  isVerifiedPurchase: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class ReadAllModel {
  @ApiProperty({ description: 'عدد الإشعارات التي عُلّمت كمقروءة', example: 3 })
  updated: number;
}

export class PrescriptionModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'وصفتي الحالية' })
  label: string;

  @ApiProperty({ type: Number, nullable: true, example: -2.5 })
  rightSph: number | null;

  @ApiProperty({ type: Number, nullable: true, example: -0.75 })
  rightCyl: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 90 })
  rightAxis: number | null;

  @ApiProperty({ type: Number, nullable: true, example: -2.25 })
  leftSph: number | null;

  @ApiProperty({ type: Number, nullable: true, example: -0.5 })
  leftCyl: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 85 })
  leftAxis: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 1.5 })
  addPower: number | null;

  @ApiProperty({ description: 'PD (مم)', type: Number, nullable: true, example: 63 })
  pd: number | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class BannerModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'تشكيلة جديدة' })
  titleAr: string;

  @ApiProperty({ example: 'New collection' })
  titleEn: string;

  @ApiProperty({ type: String, nullable: true })
  subtitleAr: string | null;

  @ApiProperty({ type: String, nullable: true })
  subtitleEn: string | null;

  @ApiProperty({ example: 'https://picsum.photos/seed/banner-1/800/400' })
  imageUrl: string;

  @ApiProperty({ description: 'نوع الوجهة', enum: ['product', 'category', 'brand', 'url'], nullable: true })
  linkType: string | null;

  @ApiProperty({ description: 'معرّف الوجهة أو الرابط', type: String, nullable: true })
  linkValue: string | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;
}

export class FaqModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'كم تستغرق مدة التوصيل؟' })
  questionAr: string;

  @ApiProperty({ example: 'How long does delivery take?' })
  questionEn: string;

  @ApiProperty()
  answerAr: string;

  @ApiProperty()
  answerEn: string;
}

export class ContentPageModel {
  @ApiProperty({ example: 'about' })
  key: string;

  @ApiProperty({ example: 'عن رؤيا' })
  titleAr: string;

  @ApiProperty({ example: 'About Royaa' })
  titleEn: string;

  @ApiProperty()
  bodyAr: string;

  @ApiProperty()
  bodyEn: string;
}

export class StoreModel {
  @ApiProperty({ example: uuid })
  id: string;

  @ApiProperty({ example: 'فرع صنعاء' })
  nameAr: string;

  @ApiProperty({ example: 'Sanaa Branch' })
  nameEn: string;

  @ApiProperty()
  addressAr: string;

  @ApiProperty()
  addressEn: string;

  @ApiProperty({ example: 'صنعاء' })
  city: string;

  @ApiProperty({ example: 15.3547 })
  latitude: number;

  @ApiProperty({ example: 44.2067 })
  longitude: number;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '9:00 - 22:00' })
  workingHours: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;
}
