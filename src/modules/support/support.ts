import { Body, Controller, Get, Injectable, Module, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SupportMessage } from './support-message.entity.js';

export class SendMessageDto {
  @ApiProperty({ description: 'نص الرسالة', example: 'أحتاج مساعدة في طلبي' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}

export class SupportMessageModel {
  @ApiProperty({ example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  id: string;

  @ApiProperty({ description: 'المُرسل', enum: ['user', 'admin'] })
  sender: string;

  @ApiProperty({ example: 'أحتاج مساعدة في طلبي' })
  body: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportMessage) readonly repo: Repository<SupportMessage>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string, q: PageQueryDto) {
    const [items, total] = await this.repo.findAndCount({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    await this.repo.update({ user: { id: userId }, sender: 'admin', isRead: false }, { isRead: true });
    return new Paged(items.map(({ id, sender, body, createdAt }) => ({ id, sender, body, createdAt })), total);
  }

  async send(userId: string, body: string, sender: 'user' | 'admin' = 'user') {
    const { id, createdAt } = await this.repo.save(this.repo.create({ user: { id: userId }, sender, body, isRead: false }));
    return { id, sender, body, createdAt };
  }

  async adminConversations(q: PageQueryDto) {
    const rows: { user_id: string; user_name: string; mobile_no: string; body: string; sender: 'user' | 'admin'; created_at: Date; unread: string }[] =
      await this.repo.query(`
        SELECT DISTINCT ON (m.user_id) m.user_id, u.user_name, u.mobile_no, m.body, m.sender, m.created_at,
          (SELECT COUNT(*) FROM support_messages x WHERE x.user_id = m.user_id AND x.sender = 'user' AND x.is_read = false) AS unread
        FROM support_messages m JOIN users u ON u.id = m.user_id
        ORDER BY m.user_id, m.created_at DESC`);
    const sorted = rows
      .map((r) => ({ userId: r.user_id, userName: r.user_name, mobileNo: r.mobile_no, lastMessage: r.body, lastSender: r.sender, lastAt: r.created_at, unread: Number(r.unread) }))
      .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    const { skip, take } = pageOpts(q);
    return new Paged(sorted.slice(skip, skip + take), sorted.length);
  }

  async adminMessages(userId: string, q: PageQueryDto) {
    const [items, total] = await this.repo.findAndCount({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    await this.repo.update({ user: { id: userId }, sender: 'user', isRead: false }, { isRead: true });
    return new Paged(items.map(({ id, sender, body, createdAt }) => ({ id, sender, body, createdAt })), total);
  }

  async adminReply(userId: string, body: string) {
    const message = await this.send(userId, body, 'admin');
    await this.notifications.create(userId, 'support_reply', { title: 'New reply from support', body, titleAr: 'رد جديد من الدعم', bodyAr: body });
    return message;
  }
}

@ApiTags('الدعم')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('support/messages')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'محادثة الدعم', description: 'رسائلي وردود الدعم، من الأحدث. تُعلَّم ردود الدعم كمقروءة. الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(SupportMessageModel, 'الرسائل', { isArray: true })
  list(@CurrentUser() user: { userId: string }, @Query() q: PageQueryDto) {
    return this.service.list(user.userId, q);
  }

  @Post()
  @ApiOperation({ summary: 'إرسال رسالة للدعم' })
  @ApiOk(SupportMessageModel, 'تم الإرسال', { status: 201 })
  send(@CurrentUser() user: { userId: string }, @Body() dto: SendMessageDto) {
    return this.service.send(user.userId, dto.body);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([SupportMessage]), AuthModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
