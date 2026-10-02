import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PageQueryDto } from '../../common/pagination.js';
import { OrdersService } from './orders.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { OrderModel, OrderSummaryModel } from '../../common/swagger/response-models.js';

@ApiTags('الطلبات')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'إتمام الشراء', description: 'ينشئ طلباً من السلة الحالية بنسخة ثابتة من الأسماء والأسعار والعنوان، ثم يفرغ السلة ويُنشئ إشعاراً.' })
  @ApiOk(OrderModel, 'تم إنشاء الطلب', { status: 201 })
  @ApiErrors([400, 'السلة فارغة أو بيانات غير صالحة'], [404, 'العنوان غير موجود'])
  checkout(@CurrentUser() user: { userId: string }, @Body() dto: CheckoutDto) {
    return this.service.checkout(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'سجل الطلبات', description: 'مرتبة من الأحدث. الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(OrderSummaryModel, 'ملخص الطلبات', { isArray: true })
  findAll(@CurrentUser() user: { userId: string }, @Query() q: PageQueryDto) {
    return this.service.findAll(user.userId, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل طلب وتتبعه', description: 'يتضمن مراحل التتبع الفعلية بأوقاتها: confirmed ثم preparing ثم shipped ثم delivered (أو cancelled).' })
  @ApiParam({ name: 'id', description: 'معرّف الطلب' })
  @ApiOk(OrderModel, 'تفاصيل الطلب')
  @ApiErrors([404, 'الطلب غير موجود'])
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.findOne(user.userId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'إلغاء طلب', description: 'مسموح فقط بحالة confirmed أو preparing. يُعاد المخزون وتُعلَّم المدفوعات المسبقة refunded.' })
  @ApiParam({ name: 'id', description: 'معرّف الطلب' })
  @ApiOk(OrderModel, 'الطلب بعد الإلغاء', { status: 201 })
  @ApiErrors([400, 'لا يمكن إلغاء الطلب في حالته الحالية'], [404, 'الطلب غير موجود'])
  cancel(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.cancel(user.userId, id);
  }
}
