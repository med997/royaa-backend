import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags, PartialType } from '@nestjs/swagger';
import { ApiErrors, ApiNoData, ApiOk } from '../../common/swagger/api-response.js';
import { PrescriptionModel } from '../../common/swagger/response-models.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PrescriptionsService } from './prescriptions.service.js';
import { CreatePrescriptionDto } from './dto/prescription.dto.js';

class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {}

@ApiTags('الوصفات الطبية')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة وصفاتي الطبية', description: 'مرتبة من الأحدث.' })
  @ApiOk(PrescriptionModel, 'الوصفات', { isArray: true })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.service.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'إضافة وصفة طبية', description: 'يمكن ربطها لاحقاً بعنصر في السلة عبر `prescriptionId`.' })
  @ApiOk(PrescriptionModel, 'تمت الإضافة', { status: 201 })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تعديل وصفة', description: 'كل الحقول اختيارية. لا يؤثر على الطلبات السابقة لأنها تحتفظ بنسخة.' })
  @ApiParam({ name: 'id', description: 'معرّف الوصفة' })
  @ApiOk(PrescriptionModel, 'بعد التعديل')
  @ApiErrors([404, 'الوصفة غير موجودة'])
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف وصفة' })
  @ApiParam({ name: 'id', description: 'معرّف الوصفة' })
  @ApiNoData('تم الحذف')
  @ApiErrors([404, 'الوصفة غير موجودة'])
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
