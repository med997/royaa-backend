import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PageQueryDto } from '../../common/pagination.js';
import { NotificationsService } from './notifications.service.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { MarkReadModel, ReadAllModel, NotificationModel, UnreadCountModel } from '../../common/swagger/response-models.js';

@ApiTags('الإشعارات')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الإشعارات', description: 'مرتبة من الأحدث. الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(NotificationModel, 'الإشعارات', { isArray: true })
  findAll(@CurrentUser() user: { userId: string }, @Query() q: PageQueryDto) {
    return this.service.findAll(user.userId, q);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'عدد الإشعارات غير المقروءة' })
  @ApiOk(UnreadCountModel, 'العدد')
  async unreadCount(@CurrentUser() user: { userId: string }) {
    return { count: await this.service.unreadCount(user.userId) };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'تعليم كل الإشعارات كمقروءة' })
  @ApiOk(ReadAllModel, 'عدد الإشعارات التي عُلّمت', { status: 201 })
  readAll(@CurrentUser() user: { userId: string }) {
    return this.service.markAllRead(user.userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
  @ApiParam({ name: 'id', description: 'معرّف الإشعار' })
  @ApiOk(MarkReadModel, 'تم التعليم', { status: 201 })
  @ApiErrors([404, 'الإشعار غير موجود'])
  markRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.markRead(user.userId, id);
  }
}
