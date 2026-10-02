import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength, Min } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.js';
import { Bool, Enum, Str } from '../../../common/swagger/fields.js';

const bool = (v: unknown) => (v === 'true' ? true : v === 'false' ? false : v);

export class AdminProductsListQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'بحث بالاسم أو SKU' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'معرّف التصنيف' }) @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ description: 'معرّف الماركة' }) @IsOptional() @IsString() brandId?: string;
  @ApiPropertyOptional({ description: 'المفعّلة أو المعطّلة' }) @IsOptional() @Transform(({ value }) => bool(value)) @IsBoolean() isActive?: boolean;
}

export class AdminLoginDto {
  @Str('رقم الجوال', { example: '700000000' }) mobileNo: string;
  @Str('كلمة المرور') password: string;
}

export class SetStatusDto {
  @Enum('الحالة الجديدة (تتحرك للأمام فقط، أو cancelled)', ['preparing', 'shipped', 'delivered', 'cancelled']) status: string;
}

export class SetPaymentDto {
  @Enum('حالة الدفع', ['pending', 'paid', 'refunded']) paymentStatus: string;
}

export class AdminOrdersQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'تصفية بحالة الطلب', enum: ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] }) @IsOptional() @IsIn(['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']) status?: string;
  @ApiPropertyOptional({ description: 'تصفية بحالة الدفع', enum: ['pending', 'paid', 'refunded'] }) @IsOptional() @IsIn(['pending', 'paid', 'refunded']) paymentStatus?: string;
  @ApiPropertyOptional({ description: 'بحث برقم الطلب أو اسم/جوال العميل', example: 'RY-100123' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'من تاريخ (ISO)', example: '2026-10-01' }) @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional({ description: 'إلى تاريخ (ISO)', example: '2026-10-31' }) @IsOptional() @IsString() to?: string;
}

export class SetStockDto {
  @ApiProperty({ description: 'المخزون الجديد', minimum: 0, example: 15 }) @Type(() => Number) @IsInt() @Min(0) stock: number;
}

export class AdminUsersQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'بحث بالاسم أو الجوال' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'تصفية بالدور', enum: ['customer', 'admin'] }) @IsOptional() @IsIn(['customer', 'admin']) role?: string;
  @ApiPropertyOptional({ description: 'المفعّلون أو المحظورون' }) @IsOptional() @Transform(({ value }) => bool(value)) @IsBoolean() isActive?: boolean;
}

export class CreateAdminUserDto {
  @Str('الاسم') userName: string;
  @Str('رقم الجوال') mobileNo: string;
  @ApiProperty({ description: 'كلمة المرور (6 أحرف على الأقل)', minLength: 6 }) @IsString() @MinLength(6) password: string;
  @ApiPropertyOptional({ description: 'الأدوار (customer دائماً مضمَّن)', enum: ['customer', 'admin'], isArray: true, default: ['customer'] })
  @IsOptional() @IsArray() @IsIn(['customer', 'admin'], { each: true }) roles?: string[];
}

export class UpdateAdminUserDto {
  @Bool('تفعيل أو حظر الحساب', { optional: true }) isActive?: boolean;
  @ApiPropertyOptional({ description: 'الأدوار (customer دائماً مضمَّن)', enum: ['customer', 'admin'], isArray: true })
  @IsOptional() @IsArray() @IsIn(['customer', 'admin'], { each: true }) roles?: string[];
}

export class AdminNotificationDto {
  @Str('العنوان بالإنجليزية') title: string;
  @Str('النص بالإنجليزية') body: string;
  @Str('العنوان بالعربية', { optional: true }) titleAr?: string;
  @Str('النص بالعربية', { optional: true }) bodyAr?: string;
  @Str('معرّف مستخدم محدد؛ بدونه يُرسل لكل المستخدمين المفعّلين', { optional: true }) userId?: string;
}

export class AdminReviewsQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'معرّف المنتج' }) @IsOptional() @IsString() productId?: string;
}

export class ModelsQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'تصفية بالحالة', enum: ['processing', 'ready', 'failed'] }) @IsOptional() @IsIn(['processing', 'ready', 'failed']) status?: string;
  @ApiPropertyOptional({ description: 'غير المستخدمة فقط' }) @IsOptional() @Transform(({ value }) => bool(value)) @IsBoolean() unused?: boolean;
}

export class CleanupDto {
  @ApiPropertyOptional({ description: 'احذف النماذج غير المستخدمة منذ أكثر من هذا العدد من الساعات (الافتراضي 24؛ 0 = كلها)', minimum: 0, default: 24 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) olderThanHours?: number;
}

export class AdminReplyDto {
  @Str('نص الرد') body: string;
}
