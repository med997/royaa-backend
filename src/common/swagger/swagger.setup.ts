import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../app.module.js';
import { AdminModule } from '../../modules/admin/admin.module.js';
import { AddressesModule } from '../../modules/addresses/addresses.module.js';
import { AppConfigModule } from '../../modules/app-config/app-config.module.js';
import { AuthModule } from '../../modules/auth/auth.module.js';
import { BannersModule } from '../../modules/banners/banners.js';
import { BrandsModule } from '../../modules/brands/brands.module.js';
import { CartModule } from '../../modules/cart/cart.module.js';
import { CategoriesModule } from '../../modules/categories/categories.module.js';
import { ContentModule } from '../../modules/content/content.js';
import { CouponsModule } from '../../modules/coupons/coupons.js';
import { FavoritesModule } from '../../modules/favorites/favorites.module.js';
import { MeasurementsModule } from '../../modules/measurements/measurements.js';
import { NotificationsModule } from '../../modules/notifications/notifications.module.js';
import { OrdersModule } from '../../modules/orders/orders.module.js';
import { PrescriptionsModule } from '../../modules/prescriptions/prescriptions.module.js';
import { ProductsModule } from '../../modules/products/products.module.js';
import { ReviewsModule } from '../../modules/reviews/reviews.module.js';
import { StoresModule } from '../../modules/stores/stores.js';
import { SupportModule } from '../../modules/support/support.js';

const COMMON = `### شكل الاستجابة
كل استجابة (نجاح أو خطأ) تُغلَّف بالشكل التالي:
\`\`\`json
{ "errorMessage": "", "errorNo": 0, "data": {} }
\`\`\`
- \`errorNo = 0\` عند النجاح، وعند الخطأ يساوي رمز حالة HTTP.
- \`data\` كائن للطلبات المفردة، ومصفوفة لطلبات القوائم، و\`null\` عند الخطأ.
- القوائم تدعم \`?page=&limit=\` (الافتراضي 1 و50، الأقصى 100) والإجمالي في ترويسة \`X-Total-Count\`.
- أجسام طلبات POST/PATCH/PUT مسطّحة في جذر JSON بدون غلاف.
- المعرّفات UUID.`;

const CUSTOMER_DESCRIPTION = `واجهة برمجة تطبيق **رؤيا** لبيع النظارات — **قناة العملاء** (تطبيق الموبايل).

التوثيق الخاص بلوحة الإدارة في \`/admin-docs\`.

${COMMON}

### المصادقة
- \`/auth/login\` و\`/auth/otp/verify\` تُرجعان \`token\` (رمز الوصول) و\`refreshToken\`.
- المسارات المحمية تتطلب \`Authorization: Bearer <token>\`.
- الرمز مخصّص لقناة العملاء فقط: حتى لو كان الحساب مديراً، لا يعمل رمز الإدارة هنا، ولا يعمل رمز العملاء على مسارات \`/admin\`.
- عند انتهاء الرمز استخدم \`/auth/refresh\`.

### العملات
الأسعار تُحوَّل وقت القراءة إلى العملة المطلوبة عبر \`?currency=\` (SAR أو USD أو YER)، والافتراضية YER، وكل سعر يُرجَع معه رمز عملته. الطلب يثبّت عملته وأسعاره وعنوانه وقت الشراء.

### رمز التحقق OTP
حالياً الرمز ثابت \`1234\` إلى حين ربط مزوّد رسائل حقيقي.`;

const ADMIN_DESCRIPTION = `واجهة برمجة **رؤيا** — **قناة الإدارة** (لوحة الويب).

التوثيق الخاص بتطبيق العملاء في \`/docs\`.

${COMMON}

### المصادقة
- الدخول عبر \`/admin/auth/login\` بحساب يحمل الدور \`admin\`. الحساب نفسه قد يكون عميلاً ومديراً في آن واحد، والقناة تحدد الصلاحية: الدخول من هنا يعني قناة الإدارة.
- رمز الإدارة يعمل على مسارات \`/admin\` فقط، ويُتحقق من دور المدير في كل طلب، فسحب الدور أو حظر الحساب يوقف الوصول فوراً.
- أول مدير يُنشأ تلقائياً من متغيرات البيئة \`ADMIN_MOBILE\` و\`ADMIN_PASSWORD\`.

### الأسعار
تُدخل أسعار المنتجات بالدولار (العملة الأساسية) وتُحوَّل للعملاء حسب سعر صرف العملة.`;

const build = (title: string, description: string) =>
  new DocumentBuilder().setTitle(title).setDescription(description).setVersion('1.0').addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'رمز JWT' });

const CUSTOMER_MODULES = [
  AppModule, AppConfigModule, AuthModule, CategoriesModule, BrandsModule, ProductsModule, FavoritesModule, CartModule, AddressesModule,
  OrdersModule, NotificationsModule, ReviewsModule, PrescriptionsModule, MeasurementsModule, BannersModule, ContentModule, StoresModule,
  CouponsModule, SupportModule,
];

export function setupSwagger(app: INestApplication) {
  const customer = build('واجهة رؤيا — العملاء', CUSTOMER_DESCRIPTION);
  [
    ['النظام', 'فحص الحالة والإعدادات العامة'],
    ['المصادقة', 'التسجيل والدخول وOTP وكلمة المرور والملف الشخصي'],
    ['الكتالوج', 'التصنيفات والماركات والمنتجات'],
    ['المفضلة', 'قائمة المنتجات المفضلة'],
    ['السلة', 'سلة المشتريات'],
    ['العناوين', 'عناوين التوصيل مع الموقع على الخريطة'],
    ['الطلبات', 'إتمام الشراء وسجل الطلبات وتتبعها وإلغاؤها'],
    ['الكوبونات', 'التحقق من أكواد الخصم'],
    ['الوصفات الطبية', 'وصفات النظر المحفوظة'],
    ['القياسات', 'قياسات الوجه'],
    ['الإشعارات', 'إشعارات المستخدم'],
    ['التقييمات', 'تقييمات المنتجات'],
    ['الدعم', 'محادثة الدعم'],
    ['المحتوى', 'البنرات والأسئلة الشائعة والصفحات الثابتة والفروع'],
  ].forEach(([name, desc]) => customer.addTag(name, desc));

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, customer.build(), { include: CUSTOMER_MODULES }), {
    customSiteTitle: 'توثيق واجهة رؤيا — العملاء',
    customCss: 'body{direction:rtl}.swagger-ui{direction:ltr}.swagger-ui .info{direction:rtl;text-align:right}',
    swaggerOptions: { persistAuthorization: true },
  });

  SwaggerModule.setup('admin-docs', app, SwaggerModule.createDocument(app, build('واجهة رؤيا — الإدارة', ADMIN_DESCRIPTION).build(), { include: [AdminModule] }), {
    customSiteTitle: 'توثيق واجهة رؤيا — الإدارة',
    customCss: 'body{direction:rtl}.swagger-ui{direction:ltr}.swagger-ui .info{direction:rtl;text-align:right}',
    swaggerOptions: { persistAuthorization: true },
  });
}
