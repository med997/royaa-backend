import { BadRequestException, Controller, Injectable, Post, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Request } from 'express';
import sharp from 'sharp';
import { UPLOADS_DIR } from '../../common/paths.js';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { UploadModel, UploadsModel } from './dto/responses.js';

const MB = 1024 * 1024;
const IMAGE_MAX = 5 * MB;
const MODEL_MAX = 30 * MB;
const MODELS = ['.glb', '.usdz'];
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', ...MODELS];

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  async save(file: Express.Multer.File, req: Request) {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) throw new BadRequestException(`Allowed types: ${ALLOWED.join(', ')}`);
    const max = MODELS.includes(ext) ? MODEL_MAX : IMAGE_MAX;
    if (file.size > max) throw new BadRequestException(`${file.originalname} exceeds ${max / MB} MB`);

    const data = await this.optimise(file.buffer, ext);
    await mkdir(UPLOADS_DIR, { recursive: true });
    const name = `${createHash('sha256').update(data).digest('hex').slice(0, 24)}${ext}`;
    const path = join(UPLOADS_DIR, name);
    if (await access(path).then(() => false, () => true)) await writeFile(path, data);
    const base = this.config.get<string>('PUBLIC_BASE_URL') ?? `${req.protocol}://${req.get('host')}`;
    return { url: `${base}/uploads/${name}` };
  }

  // Content-hash names: same bytes → same URL (cacheable), changed bytes → new URL (cache busts itself)
  private optimise(input: Buffer, ext: string): Promise<Buffer> | Buffer {
    const img = () => sharp(input).rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true });
    if (ext === '.jpg' || ext === '.jpeg') return img().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    if (ext === '.png') return img().png({ compressionLevel: 9 }).toBuffer();
    if (ext === '.webp') return img().webp({ quality: 82 }).toBuffer();
    return input;
  }
}

@ApiTags('الإدارة - الرفع')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: رمز الإدارة مفقود أو غير صالح'], [403, 'ليس لديك صلاحية الإدارة'])
@UseGuards(AdminGuard)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MODEL_MAX } }))
  @ApiOperation({
    summary: 'رفع صورة أو نموذج ثلاثي الأبعاد',
    description:
      'الصور: jpg وpng وwebp وgif حتى 5 ميجا. النماذج: glb وusdz حتى 30 ميجا (للنماذج الأفضل استخدام `/admin/models` فهو يضغط ويحوّل تلقائياً). الصور تُضغط وتُصغَّر (حتى 2048px) وتُسمّى بحسب محتواها، فرفع الملف نفسه مرتين يُرجع الرابط نفسه وتغييره يُنتج رابطاً جديداً فلا يبقى كاش قديم. تُحفظ في `public/uploads` في جذر المشروع (خارج `dist`) وتُخدم على `/uploads/<الاسم>`. يُرجع الرابط لاستخدامه في الحقول الأخرى.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary', description: 'الملف' } } } })
  @ApiOk(UploadModel, 'تم الرفع', { status: 201 })
  @ApiErrors([400, 'نوع الملف غير مسموح أو أكبر من الحد أو مفقود'])
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file) throw new BadRequestException('file is required');
    return this.service.save(file, req);
  }

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 72, { limits: { fileSize: MODEL_MAX } }))
  @ApiOperation({
    summary: 'رفع عدة ملفات دفعة واحدة',
    description: 'مناسب لإطارات عرض 360° (حتى 72 ملفاً). يُرجع الروابط بنفس ترتيب الملفات المرسلة، فرتّب الأسماء (01.jpg، 02.jpg ...) قبل الرفع.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['files'], properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @ApiOk(UploadsModel, 'تم الرفع', { status: 201 })
  @ApiErrors([400, 'نوع ملف غير مسموح أو أكبر من الحد أو لا ملفات'])
  async uploadBatch(@UploadedFiles() files: Express.Multer.File[] | undefined, @Req() req: Request) {
    if (!files?.length) throw new BadRequestException('files are required');
    const urls: string[] = [];
    for (const f of files) urls.push((await this.service.save(f, req)).url);
    return { urls };
  }
}
