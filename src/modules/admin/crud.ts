import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Query, Type, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags, IntersectionType, PartialType } from '@nestjs/swagger';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsOptional, IsString } from 'class-validator';
import { FindOptionsOrder, ILike, ObjectLiteral, Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { ApiErrors, ApiNoData, ApiOk } from '../../common/swagger/api-response.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';

export class AdminListQuery extends PageQueryDto {
  @ApiPropertyOptional({ description: 'بحث نصي في الحقول الرئيسية' })
  @IsOptional()
  @IsString()
  search?: string;
}

class IdModel {
  @ApiProperty({ example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  id: string;
}

const named = <T extends Type>(cls: T, name: string) => Object.defineProperty(cls, 'name', { value: name });

interface CrudOptions<T> {
  path: string;
  tag: string;
  noun: string;
  entity: Type<T>;
  dto: Type;
  searchColumns: string[];
  order: FindOptionsOrder<T>;
}

export function createCrudController<T extends ObjectLiteral>(o: CrudOptions<T>) {
  const Update = named(class extends PartialType(o.dto) {}, `Update${o.entity.name}Dto`);
  const Model = named(class extends IntersectionType(o.dto, IdModel) {}, `${o.entity.name}AdminModel`);
  const pipe = (type: Type) => new ValidationPipe({ whitelist: true, transform: true, expectedType: type });

  @ApiTags(o.tag)
  @ApiBearerAuth()
  @ApiErrors([401, 'غير مصرّح: رمز الإدارة مفقود أو غير صالح'], [403, 'ليس لديك صلاحية الإدارة'])
  @UseGuards(AdminGuard)
  @Controller(`admin/${o.path}`)
  class CrudController {
    constructor(@Inject(getRepositoryToken(o.entity)) readonly repo: Repository<T>) {}

    @Get()
    @ApiOperation({ summary: `قائمة ${o.noun}`, description: 'الإجمالي في ترويسة `X-Total-Count`.' })
    @ApiOk(Model, o.noun, { isArray: true })
    async list(@Query() q: AdminListQuery) {
      const where = q.search ? o.searchColumns.map((c) => ({ [c]: ILike(`%${q.search}%`) })) : undefined;
      const [items, total] = await this.repo.findAndCount({ where: where as never, order: o.order, ...pageOpts(q) });
      return new Paged(items, total);
    }

    @Get(':id')
    @ApiOperation({ summary: `تفاصيل ${o.noun}` })
    @ApiParam({ name: 'id', description: 'المعرّف' })
    @ApiOk(Model, o.noun)
    @ApiErrors([404, 'غير موجود'])
    async one(@Param('id') id: string) {
      return this.find(id);
    }

    @Post()
    @ApiOperation({ summary: `إضافة ${o.noun}` })
    @ApiOk(Model, 'تمت الإضافة', { status: 201 })
    @ApiErrors([400, 'بيانات غير صالحة'], [409, 'قيمة مكررة'])
    create(@Body(pipe(o.dto)) dto: object) {
      return this.repo.save(this.repo.create(dto as never));
    }

    @Patch(':id')
    @ApiOperation({ summary: `تعديل ${o.noun}`, description: 'كل الحقول اختيارية.' })
    @ApiParam({ name: 'id', description: 'المعرّف' })
    @ApiOk(Model, 'بعد التعديل')
    @ApiErrors([404, 'غير موجود'], [409, 'قيمة مكررة'])
    async update(@Param('id') id: string, @Body(pipe(Update)) dto: object) {
      return this.repo.save(Object.assign(await this.find(id), dto));
    }

    @Delete(':id')
    @ApiOperation({ summary: `حذف ${o.noun}` })
    @ApiParam({ name: 'id', description: 'المعرّف' })
    @ApiNoData('تم الحذف')
    @ApiErrors([404, 'غير موجود'], [409, 'مرتبط بسجلات أخرى (عطّله بدل حذفه)'])
    async remove(@Param('id') id: string) {
      await this.repo.remove(await this.find(id));
    }

    async find(id: string) {
      const item = await this.repo.findOne({ where: { id } as never });
      if (!item) throw new NotFoundException('Not found');
      return item;
    }
  }
  return CrudController;
}
