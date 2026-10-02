import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Bool, Enum, IsoDate, Num, Str } from '../../../common/swagger/fields.js';

export class AdminCategoryDto {
  @Str('الاسم بالعربية', { example: 'كلاسيكي' }) nameAr: string;
  @Str('الاسم بالإنجليزية', { example: 'Classic' }) nameEn: string;
  @Str('رابط الصورة (من /admin/uploads)', { optional: true }) imageUrl?: string;
  @Str('معرّف التصنيف الأب', { optional: true }) parentId?: string;
  @Num('ترتيب العرض', { optional: true, example: 0 }) sortOrder?: number;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
}

export class AdminBrandDto {
  @Str('الاسم بالإنجليزية', { example: 'Ray-Ban' }) name: string;
  @Str('الاسم بالعربية', { optional: true }) nameAr?: string;
  @Str('رابط الشعار', { optional: true }) logoUrl?: string;
  @Num('ترتيب العرض', { optional: true, example: 0 }) sortOrder?: number;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
}

export class AdminBannerDto {
  @Str('العنوان بالعربية') titleAr: string;
  @Str('العنوان بالإنجليزية') titleEn: string;
  @Str('عنوان فرعي بالعربية', { optional: true }) subtitleAr?: string;
  @Str('عنوان فرعي بالإنجليزية', { optional: true }) subtitleEn?: string;
  @Str('رابط الصورة') imageUrl: string;
  @Enum('نوع الوجهة', ['product', 'category', 'brand', 'url'], { optional: true }) linkType?: string;
  @Str('معرّف الوجهة أو الرابط', { optional: true }) linkValue?: string;
  @Num('ترتيب العرض', { optional: true, example: 0 }) sortOrder?: number;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
  @IsoDate('بداية العرض', { optional: true }) startsAt?: string;
  @IsoDate('نهاية العرض', { optional: true }) endsAt?: string;
}

export class AdminCouponDto {
  @Str('الكود (يُحفظ بأحرف كبيرة)', { example: 'WELCOME10' }) code: string;
  @Enum('نوع الخصم', ['percent', 'fixed']) discountType: 'percent' | 'fixed';
  @Num('القيمة: نسبة % أو مبلغ ثابت بالسنت من العملة الأساسية USD (400 = 4$)', { example: 10, min: 0 }) value: number;
  @Num('أدنى مجموع فرعي للطلب بسنتات USD', { optional: true, min: 0 }) minSubtotalBaseMinorUnits?: number;
  @Num('أقصى عدد استخدامات', { optional: true, min: 1 }) maxUses?: number;
  @IsoDate('تاريخ الانتهاء', { optional: true }) expiresAt?: string;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
}

export class AdminFaqDto {
  @Str('السؤال بالعربية') questionAr: string;
  @Str('السؤال بالإنجليزية') questionEn: string;
  @Str('الجواب بالعربية') answerAr: string;
  @Str('الجواب بالإنجليزية') answerEn: string;
  @Num('ترتيب العرض', { optional: true, example: 0 }) sortOrder?: number;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
}

export class AdminPageDto {
  @Str('مفتاح الصفحة (about, terms, privacy ...)', { example: 'about' }) key: string;
  @Str('العنوان بالعربية') titleAr: string;
  @Str('العنوان بالإنجليزية') titleEn: string;
  @Str('المحتوى بالعربية') bodyAr: string;
  @Str('المحتوى بالإنجليزية') bodyEn: string;
}

export class AdminStoreDto {
  @Str('الاسم بالعربية') nameAr: string;
  @Str('الاسم بالإنجليزية') nameEn: string;
  @Str('العنوان بالعربية') addressAr: string;
  @Str('العنوان بالإنجليزية') addressEn: string;
  @Str('المدينة', { example: 'صنعاء' }) city: string;
  @Num('خط العرض', { example: 15.3547 }) latitude: number;
  @Num('خط الطول', { example: 44.2067 }) longitude: number;
  @Str('الهاتف', { optional: true }) phone?: string;
  @Str('ساعات العمل', { optional: true, example: '9:00 - 22:00' }) workingHours?: string;
  @Str('رابط الصورة', { optional: true }) imageUrl?: string;
  @Bool('مفعّل', { optional: true, example: true }) isActive?: boolean;
}

export class AdminCurrencyDto {
  @Str('رمز العملة', { example: 'YER' }) code: string;
  @Str('رمز العرض', { example: 'ر.ي' }) symbol: string;
  @Num('سعر الصرف مقابل USD', { example: 250, min: 0 }) rateToBase: number;
  @Bool('عملة افتراضية', { optional: true }) isDefault?: boolean;
  @Bool('مفعّلة', { optional: true, example: true }) isActive?: boolean;
}

export class AdminVariantDto {
  @Str('معرّف اللون (للتعديل، يُحذف لإنشاء جديد)', { optional: true }) id?: string;
  @Str('اسم اللون بالعربية', { example: 'أسود' }) colorNameAr: string;
  @Str('اسم اللون بالإنجليزية', { example: 'Black' }) colorNameEn: string;
  @Str('كود اللون', { example: '#1c1c1c' }) colorHex: string;
  @Num('المخزون', { example: 20, min: 0 }) stock: number;
  @Str('SKU', { optional: true }) sku?: string;
  @Str('صورة اللون', { optional: true }) imageUrl?: string;
  @Str('معرّف نموذج مرفوع عبر /admin/models (يملأ GLB وUSDZ تلقائياً). null لفصله', { optional: true }) modelAssetId?: string;
  @Str('نموذج GLB يدوي خاص بهذا اللون (يُتجاهل إن حُدد modelAssetId)', { optional: true }) model3dUrl?: string;
  @Str('نموذج USDZ (iOS) خاص بهذا اللون', { optional: true }) modelUsdzUrl?: string;
}

export class AdminImageDto {
  @Str('معرّف الصورة (للتعديل)', { optional: true }) id?: string;
  @Str('رابط الصورة') url: string;
  @Num('الترتيب', { optional: true, example: 0 }) sortOrder?: number;
}

export class AdminProductDto {
  @Str('الاسم بالعربية', { example: 'إطار Arc One' }) nameAr: string;
  @Str('الاسم بالإنجليزية', { example: 'Arc One' }) nameEn: string;
  @Str('الوصف بالعربية', { optional: true }) descriptionAr?: string;
  @Str('الوصف بالإنجليزية', { optional: true }) descriptionEn?: string;
  @Num('السعر بالدولار USD (العملة الأساسية)', { example: 48, min: 0 }) basePrice: number;
  @Num('السعر قبل الخصم بالدولار', { optional: true, min: 0 }) compareAtPrice?: number;
  @Str('SKU فريد', { optional: true, example: 'ARC-001' }) sku?: string;
  @Str('معرّف التصنيف', { optional: true }) categoryId?: string;
  @Str('معرّف الماركة', { optional: true }) brandId?: string;
  @Num('عرض الإطار مم', { optional: true, example: 138 }) widthMm?: number;
  @Num('عرض الجسر مم', { optional: true, example: 18 }) bridgeMm?: number;
  @Num('طول الذراع مم', { optional: true, example: 145 }) armMm?: number;
  @Str('الشكل', { optional: true, example: 'round' }) shape?: string;
  @Str('الخامة', { optional: true, example: 'acetate' }) material?: string;
  @Enum('الفئة', ['men', 'women', 'unisex', 'kids'], { optional: true }) gender?: string;
  @Str('نوع الإطار', { optional: true, example: 'full-rim' }) frameType?: string;
  @Str('معرّف نموذج مرفوع عبر /admin/models: يضغط GLB ويولّد USDZ تلقائياً ويملأ الحقلين التاليين. null لفصله', { optional: true }) modelAssetId?: string;
  @Str('نموذج ثلاثي الأبعاد GLB يدوي (يُتجاهل إن حُدد modelAssetId)', { optional: true }) model3dUrl?: string;
  @Str('نموذج USDZ يدوي لـ AR على iOS (يُتجاهل إن حُدد modelAssetId)', { optional: true }) modelUsdzUrl?: string;
  @Str('صورة معاينة تظهر قبل تحميل النموذج', { optional: true }) modelPosterUrl?: string;

  @ApiProperty({ description: 'صور عرض 360° بالترتيب (إطار لكل زاوية). القائمة الكاملة', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  view360Images?: string[];
  @Bool('مميّز', { optional: true }) isFeatured?: boolean;
  @Bool('وصل حديثاً', { optional: true }) isNew?: boolean;
  @Bool('الأكثر مبيعاً', { optional: true }) isBestSeller?: boolean;
  @Bool('مفعّل (ظاهر للعملاء)', { optional: true, example: true }) isActive?: boolean;

  @ApiProperty({ description: 'الصور (القائمة الكاملة المطلوبة؛ ما لم يُذكر يُحذف)', type: [AdminImageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminImageDto)
  images?: AdminImageDto[];

  @ApiProperty({ description: 'الألوان (القائمة الكاملة المطلوبة؛ ما لم يُذكر يُحذف)', type: [AdminVariantDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminVariantDto)
  variants?: AdminVariantDto[];
}

export class UpdateAdminProductDto extends PartialType(AdminProductDto) {}
