import { applyDecorators, BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ModelsService } from '../models/models.service.js';
import { Paged, PageQueryDto } from '../../common/pagination.js';
import { ApiErrors, ApiNoData, ApiOk } from '../../common/swagger/api-response.js';
import { AuthResultModel } from '../../common/swagger/response-models.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { RefreshDto } from '../auth/dto/profile.dto.js';
import { OrdersService } from '../orders/orders.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { SupportService } from '../support/support.js';
import { UsersService } from '../users/users.service.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminService } from './admin.service.js';
import { AdminProductDto, UpdateAdminProductDto } from './dto/catalog.dto.js';
import {
  AdminLoginDto, AdminNotificationDto, AdminOrdersQuery, AdminProductsListQuery, AdminReplyDto, AdminReviewsQuery, AdminUsersQuery,
  CleanupDto, CreateAdminUserDto, ModelsQuery, SetPaymentDto, SetStatusDto, SetStockDto, UpdateAdminUserDto,
} from './dto/admin.dto.js';
import { AdminOrderModel, AdminProductModel, CacheStatsModel, CleanupModel, ModelAssetModel, ModelUploadModel, AdminReviewModel, AdminUserModel, ConversationModel, DashboardModel, SentModel, StockModel } from './dto/responses.js';
import { SupportMessageModel } from '../support/support.js';

const Protected = (tag: string) =>
  applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(),
    ApiErrors([401, 'غير مصرّح: رمز الإدارة مفقود أو غير صالح'], [403, 'ليس لديك صلاحية الإدارة']),
    UseGuards(AdminGuard),
  );
const ID = (description: string) => ApiParam({ name: 'id', description });
type Actor = { userId: string };

@ApiTags('الإدارة - الدخول')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'دخول لوحة الإدارة', description: 'قناة الإدارة: يتطلب أن يحمل الحساب دور `admin`. الرمز الناتج يعمل على مسارات `/admin` فقط، ولا يعمل على قناة العملاء.' })
  @ApiOk(AuthResultModel, 'تم الدخول', { status: 201 })
  @ApiErrors([401, 'بيانات الدخول خاطئة'], [403, 'الحساب ليس مديراً أو معطّل'])
  login(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto.mobileNo, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'تجديد جلسة الإدارة' })
  @ApiOk(AuthResultModel, 'تم التجديد', { status: 201 })
  @ApiErrors([401, 'رمز التجديد غير صالح'])
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Protected('الإدارة - الدخول')
  @Get('me')
  @ApiOperation({ summary: 'بيانات المدير الحالي' })
  @ApiOk(AdminUserModel, 'بيانات المدير')
  me(@CurrentUser() user: Actor) {
    return this.auth.me(user.userId);
  }
}

@Protected('الإدارة - المنتجات')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المنتجات (المفعّلة والمعطّلة)', description: 'الإجمالي في ترويسة `X-Total-Count`. الأسعار بالدولار.' })
  @ApiOk(AdminProductModel, 'المنتجات', { isArray: true })
  list(@Query() q: AdminProductsListQuery) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل منتج' })
  @ID('معرّف المنتج')
  @ApiOk(AdminProductModel, 'المنتج')
  @ApiErrors([404, 'المنتج غير موجود'])
  one(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إضافة منتج', description: 'يمكن إرسال الصور والألوان مع المنتج في نفس الطلب.' })
  @ApiOk(AdminProductModel, 'تمت الإضافة', { status: 201 })
  @ApiErrors([400, 'بيانات غير صالحة أو تصنيف/ماركة غير موجود'], [409, 'SKU مكرر'])
  create(@Body() dto: AdminProductDto) {
    return this.service.save(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'تعديل منتج',
    description: 'كل الحقول اختيارية. إن أُرسلت `images` أو `variants` فهي القائمة الكاملة: العناصر بـ `id` تُعدَّل، وبدون `id` تُنشأ، وغير المذكورة تُحذف.',
  })
  @ID('معرّف المنتج')
  @ApiOk(AdminProductModel, 'بعد التعديل')
  @ApiErrors([404, 'المنتج غير موجود'])
  update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    return this.service.save(dto, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'تعطيل منتج', description: 'حذف منطقي: يختفي من المتجر وتبقى الطلبات السابقة. لإعادته أرسل `isActive: true` عبر PATCH.' })
  @ID('معرّف المنتج')
  @ApiNoData('تم التعطيل')
  @ApiErrors([404, 'المنتج غير موجود'])
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Patch('variants/:id/stock')
  @ApiOperation({ summary: 'تعديل مخزون لون' })
  @ID('معرّف اللون')
  @ApiOk(StockModel, 'المخزون الجديد')
  @ApiErrors([404, 'اللون غير موجود'])
  stock(@Param('id') id: string, @Body() dto: SetStockDto) {
    return this.service.setStock(id, dto.stock);
  }
}

@Protected('الإدارة - الطلبات')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'كل الطلبات', description: 'مع فلاتر الحالة والدفع والتاريخ والبحث. الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(AdminOrderModel, 'الطلبات', { isArray: true })
  list(@Query() q: AdminOrdersQuery) {
    return this.orders.adminFindAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل طلب' })
  @ID('معرّف الطلب')
  @ApiOk(AdminOrderModel, 'الطلب')
  @ApiErrors([404, 'الطلب غير موجود'])
  one(@Param('id') id: string) {
    return this.orders.adminFindOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'تغيير حالة الطلب',
    description: 'تتحرك للأمام فقط (preparing ثم shipped ثم delivered) أو cancelled قبل التسليم. كل تغيير يُسجَّل بوقته ويُرسل إشعاراً للعميل، والإلغاء يُعيد المخزون، والتسليم لطلب الدفع عند الاستلام يجعله paid.',
  })
  @ID('معرّف الطلب')
  @ApiOk(AdminOrderModel, 'الطلب بعد التغيير')
  @ApiErrors([400, 'انتقال غير مسموح'], [404, 'الطلب غير موجود'])
  setStatus(@Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.orders.adminSetStatus(id, dto.status);
  }

  @Patch(':id/payment')
  @ApiOperation({ summary: 'تغيير حالة الدفع' })
  @ID('معرّف الطلب')
  @ApiOk(AdminOrderModel, 'الطلب بعد التغيير')
  @ApiErrors([404, 'الطلب غير موجود'])
  setPayment(@Param('id') id: string, @Body() dto: SetPaymentDto) {
    return this.orders.adminSetPayment(id, dto.paymentStatus);
  }
}

@Protected('الإدارة - المستخدمون')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المستخدمين', description: 'الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(AdminUserModel, 'المستخدمون', { isArray: true })
  list(@Query() q: AdminUsersQuery) {
    return this.service.listUsers(q);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء مستخدم أو مدير', description: 'الحساب يُنشأ موثَّقاً. أضف `admin` في `roles` لمنحه دخول الإدارة.' })
  @ApiOk(AdminUserModel, 'تم الإنشاء', { status: 201 })
  @ApiErrors([409, 'رقم الجوال مسجَّل مسبقاً'])
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تعديل مستخدم', description: 'حظر/تفعيل أو تغيير الأدوار. لا يمكنك تعطيل نفسك أو سحب دورك. الحظر يُنهي جلساته.' })
  @ID('معرّف المستخدم')
  @ApiOk(AdminUserModel, 'بعد التعديل')
  @ApiErrors([400, 'لا يمكنك تعطيل نفسك'], [404, 'المستخدم غير موجود'])
  update(@CurrentUser() actor: Actor, @Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.service.updateUser(actor.userId, id, dto);
  }
}

@Protected('الإدارة - التقييمات')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'كل التقييمات', description: 'الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(AdminReviewModel, 'التقييمات', { isArray: true })
  list(@Query() q: AdminReviewsQuery) {
    return this.reviews.adminList(q.productId, q);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف تقييم مسيء', description: 'يُعاد حساب متوسط المنتج.' })
  @ID('معرّف التقييم')
  @ApiNoData('تم الحذف')
  @ApiErrors([404, 'التقييم غير موجود'])
  remove(@Param('id') id: string) {
    return this.reviews.adminRemove(id);
  }
}

@Protected('الإدارة - الدعم')
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'محادثات الدعم', description: 'محادثة لكل عميل، الأحدث أولاً، مع عدد رسائله غير المقروءة.' })
  @ApiOk(ConversationModel, 'المحادثات', { isArray: true })
  conversations(@Query() q: PageQueryDto) {
    return this.support.adminConversations(q);
  }

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'رسائل محادثة', description: 'من الأحدث، وتُعلَّم رسائل العميل كمقروءة.' })
  @ApiParam({ name: 'userId', description: 'معرّف العميل' })
  @ApiOk(SupportMessageModel, 'الرسائل', { isArray: true })
  messages(@Param('userId') userId: string, @Query() q: PageQueryDto) {
    return this.support.adminMessages(userId, q);
  }

  @Post('conversations/:userId')
  @ApiOperation({ summary: 'الرد على عميل', description: 'يُرسل الرد ويُنشئ إشعاراً للعميل.' })
  @ApiParam({ name: 'userId', description: 'معرّف العميل' })
  @ApiOk(SupportMessageModel, 'تم الرد', { status: 201 })
  reply(@Param('userId') userId: string, @Body() dto: AdminReplyDto) {
    return this.support.adminReply(userId, dto.body);
  }
}

@Protected('الإدارة - الإشعارات')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'إرسال إشعار', description: 'لمستخدم محدد (`userId`) أو لكل المستخدمين المفعّلين.' })
  @ApiOk(SentModel, 'تم الإرسال', { status: 201 })
  send(@Body() dto: AdminNotificationDto) {
    return this.service.sendNotification(dto);
  }
}

@Protected('الإدارة - لوحة المؤشرات')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'مؤشرات اللوحة', description: 'أعداد وإيرادات (بالدولار، الملغاة مستثناة) وآخر 7 أيام والمخزون المنخفض والأكثر مبيعاً.' })
  @ApiOk(DashboardModel, 'المؤشرات')
  stats() {
    return this.service.dashboard();
  }
}

@Protected('الإدارة - النماذج ثلاثية الأبعاد والكاش')
@Controller('admin/models')
export class AdminModelsController {
  constructor(private readonly models: ModelsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 60 * 1024 * 1024 } }))
  @ApiOperation({
    summary: 'رفع نموذج GLB (ضغط + توليد USDZ تلقائياً)',
    description:
      'ارفع ملف `.glb` واحداً (حتى 60 ميجا). يُحفظ الأصل، ثم تجري المعالجة في الخلفية: ضغط الشبكات (Draco) والتكرارات والتركيبات (حتى 2048px)، ثم توليد `USDZ` لـ AR على iOS. النتائج مخزَّنة بحسب بصمة الملف (SHA-256): رفع الملف نفسه مرة أخرى يُرجع `cached: true` فوراً بلا إعادة معالجة. تابع `status` عبر `GET /admin/models/{id}` حتى تصير `ready`، ثم اربطه بمنتج أو لون عبر `modelAssetId`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary', description: 'ملف GLB' } } } })
  @ApiOk(ModelUploadModel, 'تم الاستلام', { status: 201 })
  @ApiErrors([400, 'الملف ليس GLB صالحاً'])
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file) throw new BadRequestException('file is required');
    const { asset, cached } = await this.models.upload(file.buffer, file.originalname, `${req.protocol}://${req.get('host')}`);
    return { cached, asset: await this.models.view(asset) };
  }

  @Get()
  @ApiOperation({ summary: 'قائمة النماذج', description: 'مع الحالة والأحجام ونسبة التوفير وعدد المنتجات المستخدِمة. الإجمالي في `X-Total-Count`.' })
  @ApiOk(ModelAssetModel, 'النماذج', { isArray: true })
  list(@Query() q: ModelsQuery) {
    return this.models.list(q, q.status, q.unused);
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'إحصاءات كاش النماذج', description: 'العدد والأحجام قبل/بعد الضغط ونسبة التوفير والمساحة على القرص.' })
  @ApiOk(CacheStatsModel, 'الإحصاءات')
  stats() {
    return this.models.stats();
  }

  @Post('cache/cleanup')
  @ApiOperation({
    summary: 'تنظيف الكاش',
    description: 'يحذف النماذج غير المستخدمة (أصلها ومخرجاتها) إن مضى على عدم استخدامها المدة المحددة. النماذج المرتبطة بمنتجات لا تُمسّ أبداً. يجري تنظيف تلقائي عند بدء الخادم للنماذج المهملة أكثر من 7 أيام.',
  })
  @ApiOk(CleanupModel, 'نتيجة التنظيف', { status: 201 })
  cleanup(@Body() dto: CleanupDto) {
    return this.models.cleanup(dto.olderThanHours);
  }

  @Get(':id')
  @ApiOperation({ summary: 'حالة نموذج' })
  @ID('معرّف النموذج')
  @ApiOk(ModelAssetModel, 'النموذج')
  @ApiErrors([404, 'النموذج غير موجود'])
  async one(@Param('id') id: string) {
    return this.models.view(await this.models.get(id));
  }

  @Post(':id/reprocess')
  @ApiOperation({
    summary: 'إعادة المعالجة (تجديد الكاش)',
    description: 'يعيد الضغط والتوليد من الأصل المحفوظ (بعد تغيير إعدادات الجودة أو بعد فشل). تزيد `version` وتتغير الروابط، وتُحدَّث تلقائياً كل المنتجات والألوان المرتبطة فتتجاوز التطبيقات الكاش القديم. النسخ الأقدم من نسختين تُحذف.',
  })
  @ID('معرّف النموذج')
  @ApiOk(ModelAssetModel, 'بدأت المعالجة', { status: 201 })
  @ApiErrors([404, 'النموذج غير موجود'])
  async reprocess(@Param('id') id: string) {
    return this.models.view(await this.models.reprocess(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نموذج', description: 'يحذف الأصل والمخرجات. مرفوض إن كان مرتبطاً بمنتج أو لون.' })
  @ID('معرّف النموذج')
  @ApiNoData('تم الحذف')
  @ApiErrors([404, 'النموذج غير موجود'], [409, 'مرتبط بمنتجات، افصله أولاً'])
  remove(@Param('id') id: string) {
    return this.models.remove(id);
  }
}
