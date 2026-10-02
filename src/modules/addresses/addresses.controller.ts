import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/address.dto.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { AddressModel } from '../../common/swagger/response-models.js';

@ApiTags('العناوين')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly service: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة العناوين', description: 'العنوان الافتراضي أولاً.' })
  @ApiOk(AddressModel, 'العناوين', { isArray: true })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.service.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'إضافة عنوان' })
  @ApiOk(AddressModel, 'تم إنشاء العنوان', { status: 201 })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAddressDto) {
    return this.service.create(user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف عنوان', description: 'لا يؤثر على الطلبات السابقة لأنها تحتفظ بنسخة من العنوان.' })
  @ApiParam({ name: 'id', description: 'معرّف العنوان' })
  @ApiResponse({ status: 200, description: 'تم الحذف (data = null)' })
  @ApiErrors([404, 'العنوان غير موجود'])
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
