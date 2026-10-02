import { Banner } from '../banners/banner.entity.js';
import { Brand } from '../brands/brand.entity.js';
import { Category } from '../categories/category.entity.js';
import { ContentPage, FaqItem } from '../content/content.entity.js';
import { Coupon } from '../coupons/coupon.entity.js';
import { Currency } from '../currency/currency.entity.js';
import { Store } from '../stores/store.entity.js';
import { createCrudController } from './crud.js';
import { AdminBannerDto, AdminBrandDto, AdminCategoryDto, AdminCouponDto, AdminCurrencyDto, AdminFaqDto, AdminPageDto, AdminStoreDto } from './dto/catalog.dto.js';

export const AdminCategoriesController = createCrudController({
  path: 'categories', tag: 'الإدارة - التصنيفات', noun: 'التصنيفات', entity: Category, dto: AdminCategoryDto, searchColumns: ['nameAr', 'nameEn'], order: { sortOrder: 'ASC', nameEn: 'ASC' },
});
export const AdminBrandsController = createCrudController({
  path: 'brands', tag: 'الإدارة - الماركات', noun: 'الماركات', entity: Brand, dto: AdminBrandDto, searchColumns: ['name', 'nameAr'], order: { sortOrder: 'ASC', name: 'ASC' },
});
export const AdminBannersController = createCrudController({
  path: 'banners', tag: 'الإدارة - البنرات', noun: 'البنرات', entity: Banner, dto: AdminBannerDto, searchColumns: ['titleAr', 'titleEn'], order: { sortOrder: 'ASC' },
});
export const AdminCouponsController = createCrudController({
  path: 'coupons', tag: 'الإدارة - الكوبونات', noun: 'الكوبونات', entity: Coupon, dto: AdminCouponDto, searchColumns: ['code'], order: { createdAt: 'DESC' },
});
export const AdminFaqsController = createCrudController({
  path: 'faqs', tag: 'الإدارة - المحتوى', noun: 'الأسئلة الشائعة', entity: FaqItem, dto: AdminFaqDto, searchColumns: ['questionAr', 'questionEn'], order: { sortOrder: 'ASC' },
});
export const AdminPagesController = createCrudController({
  path: 'pages', tag: 'الإدارة - المحتوى', noun: 'الصفحات الثابتة', entity: ContentPage, dto: AdminPageDto, searchColumns: ['key', 'titleAr', 'titleEn'], order: { key: 'ASC' },
});
export const AdminStoresController = createCrudController({
  path: 'stores', tag: 'الإدارة - الفروع', noun: 'الفروع', entity: Store, dto: AdminStoreDto, searchColumns: ['nameAr', 'nameEn', 'city'], order: { city: 'ASC' },
});
export const AdminCurrenciesController = createCrudController({
  path: 'currencies', tag: 'الإدارة - العملات', noun: 'العملات', entity: Currency, dto: AdminCurrencyDto, searchColumns: ['code'], order: { code: 'ASC' },
});
