import { Controller, Get, Injectable, Module, NotFoundException, OnModuleInit, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { ContentPageModel, FaqModel } from '../../common/swagger/response-models.js';
import { ContentPage, FaqItem } from './content.entity.js';

@Injectable()
export class ContentService implements OnModuleInit {
  constructor(
    @InjectRepository(FaqItem) private readonly faqs: Repository<FaqItem>,
    @InjectRepository(ContentPage) private readonly pages: Repository<ContentPage>,
  ) {}

  async onModuleInit() {
    if ((await this.pages.count()) === 0) {
      await this.pages.save(
        this.pages.create([
          { key: 'about', titleAr: 'عن رؤيا', titleEn: 'About Royaa', bodyAr: 'رؤيا متجر متخصص في النظارات الطبية والشمسية.', bodyEn: 'Royaa is an eyewear store for prescription and sun glasses.' },
          { key: 'terms', titleAr: 'الشروط والأحكام', titleEn: 'Terms & Conditions', bodyAr: 'شروط الاستخدام.', bodyEn: 'Terms of use.' },
          { key: 'privacy', titleAr: 'سياسة الخصوصية', titleEn: 'Privacy Policy', bodyAr: 'سياسة الخصوصية.', bodyEn: 'Privacy policy.' },
        ]),
      );
    }
    if ((await this.faqs.count()) === 0) {
      await this.faqs.save(
        this.faqs.create([
          { questionAr: 'كم تستغرق مدة التوصيل؟', questionEn: 'How long does delivery take?', answerAr: 'القياسي حتى 3 أيام والسريع خلال 24 ساعة.', answerEn: 'Standard up to 3 days, express within 24 hours.', sortOrder: 0 },
          { questionAr: 'هل يمكن إرجاع المنتج؟', questionEn: 'Can I return an item?', answerAr: 'نعم خلال 14 يوماً من الاستلام.', answerEn: 'Yes, within 14 days of delivery.', sortOrder: 1 },
        ]),
      );
    }
  }

  findFaqs() {
    return this.faqs.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findPage(key: string) {
    const page = await this.pages.findOne({ where: { key } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }
}

@ApiTags('المحتوى')
@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('faqs')
  @ApiOperation({ summary: 'الأسئلة الشائعة', description: 'المفعّلة فقط، مرتبة.' })
  @ApiOk(FaqModel, 'الأسئلة', { isArray: true })
  faqs() {
    return this.service.findFaqs();
  }

  @Get('pages/:key')
  @ApiOperation({ summary: 'صفحة ثابتة', description: 'المفاتيح المتاحة افتراضياً: about و terms و privacy.' })
  @ApiParam({ name: 'key', description: 'مفتاح الصفحة', example: 'about' })
  @ApiOk(ContentPageModel, 'الصفحة')
  @ApiErrors([404, 'الصفحة غير موجودة'])
  page(@Param('key') key: string) {
    return this.service.findPage(key);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([FaqItem, ContentPage])],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
