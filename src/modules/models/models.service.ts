import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { PUBLIC_DIR } from '../../common/paths.js';
import { ProductVariant } from '../products/product-variant.entity.js';
import { Product } from '../products/product.entity.js';
import { isGlb, processGlb } from './glb-pipeline.js';
import { ModelAsset } from './model-asset.entity.js';

const MODELS_DIR = join(PUBLIC_DIR, 'models');
const ORIGINALS_DIR = join(process.cwd(), 'storage', 'models');
const KEEP_VERSIONS = 2;
const ORPHAN_GRACE_HOURS = 24;

const dirSize = async (dir: string): Promise<number> => {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? await dirSize(p) : (await stat(p)).size;
  }
  return total;
};

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly log = new Logger('Models');
  private queue: Promise<void> = Promise.resolve();

  constructor(
    @InjectRepository(ModelAsset) private readonly repo: Repository<ModelAsset>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    for (const a of await this.repo.find({ where: { status: 'processing' } })) this.enqueue(a.id);
    void this.cleanup(24 * 7).catch((e) => this.log.warn(`cleanup failed: ${e.message}`));
  }

  private base(fallback: string) {
    return this.config.get<string>('PUBLIC_BASE_URL') ?? fallback;
  }

  async upload(buffer: Buffer, name: string, hostBase: string) {
    if (!isGlb(buffer)) throw new BadRequestException('Only binary .glb files are accepted');
    const sourceHash = createHash('sha256').update(buffer).digest('hex');

    const cached = await this.repo.findOne({ where: { sourceHash } });
    if (cached && cached.status !== 'failed') return { asset: cached, cached: true };
    if (cached) return { asset: await this.reprocess(cached.id), cached: false };

    await mkdir(ORIGINALS_DIR, { recursive: true });
    await writeFile(join(ORIGINALS_DIR, `${sourceHash}.glb`), buffer);
    const asset = await this.repo.save(
      this.repo.create({ sourceHash, name, publicBase: this.base(hostBase), originalBytes: buffer.length, unusedSince: new Date() }),
    );
    this.enqueue(asset.id);
    return { asset, cached: false };
  }

  private enqueue(id: string) {
    this.queue = this.queue.then(() => this.run(id)).catch(() => undefined);
  }

  private async run(id: string) {
    const asset = await this.repo.findOneBy({ id });
    if (!asset) return;
    const started = Date.now();
    try {
      const source = await readFile(join(ORIGINALS_DIR, `${asset.sourceHash}.glb`));
      const processed = await processGlb(source, this.config.get('MODEL_DRACO', 'true') !== 'false');
      const { usdz } = processed;
      const glb = processed.glb.length < source.length ? processed.glb : source;
      const version = asset.version + (asset.glbUrl ? 1 : 0);
      const dir = join(MODELS_DIR, asset.sourceHash.slice(0, 16), `v${version}`);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'model.glb'), glb);
      await writeFile(join(dir, 'model.usdz'), usdz);

      const prefix = `${asset.publicBase}/models/${asset.sourceHash.slice(0, 16)}/v${version}`;
      Object.assign(asset, { status: 'ready', error: null, version, glbBytes: glb.length, usdzBytes: usdz.length, glbUrl: `${prefix}/model.glb`, usdzUrl: `${prefix}/model.usdz` });
      await this.repo.save(asset);
      await this.propagate(asset);
      await this.pruneVersions(asset);
      this.log.log(`${asset.name}: ${asset.originalBytes} → glb ${glb.length}, usdz ${usdz.length} bytes in ${Date.now() - started} ms`);
    } catch (e) {
      this.log.error(`${asset.name} failed: ${(e as Error).message}`);
      await this.repo.update(id, { status: 'failed', error: (e as Error).message.slice(0, 500) });
    }
  }

  // Re-point products/variants when a re-processed asset gets new versioned URLs (busts client caches)
  private async propagate(asset: ModelAsset) {
    const urls = { model3dUrl: asset.glbUrl, modelUsdzUrl: asset.usdzUrl };
    await this.products.update({ modelAssetId: asset.id }, urls);
    await this.variants.update({ modelAssetId: asset.id }, urls);
  }

  private async pruneVersions(asset: ModelAsset) {
    const dir = join(MODELS_DIR, asset.sourceHash.slice(0, 16));
    for (const d of await readdir(dir).catch(() => [])) {
      const v = Number(d.slice(1));
      if (v <= asset.version - KEEP_VERSIONS) await rm(join(dir, d), { recursive: true, force: true });
    }
  }

  async reprocess(id: string) {
    const asset = await this.get(id);
    await this.repo.update(id, { status: 'processing', error: null });
    this.enqueue(id);
    return { ...asset, status: 'processing' as const };
  }

  async get(id: string) {
    const asset = await this.repo.findOneBy({ id });
    if (!asset) throw new NotFoundException('Model not found');
    return asset;
  }

  async usage(id: string) {
    const [products, variants] = await Promise.all([this.products.count({ where: { modelAssetId: id } }), this.variants.count({ where: { modelAssetId: id } })]);
    return { products, variants };
  }

  async view(asset: ModelAsset) {
    const u = await this.usage(asset.id);
    return { ...asset, usedBy: u.products + u.variants, savedPercent: asset.glbBytes ? Math.round((1 - asset.glbBytes / asset.originalBytes) * 100) : null };
  }

  async list(q: PageQueryDto, status?: string, unused?: boolean) {
    const [items, total] = await this.repo.findAndCount({
      where: { ...(status && { status: status as ModelAsset['status'] }), ...(unused && { unusedSince: Not(IsNull()) }) },
      order: { createdAt: 'DESC' },
      ...pageOpts(q),
    });
    return new Paged(await Promise.all(items.map((a) => this.view(a))), total);
  }

  // Resolve an asset for attaching to a product/variant
  async readyAsset(id: string) {
    const asset = await this.get(id);
    if (asset.status !== 'ready') throw new BadRequestException(`Model is ${asset.status}`);
    return asset;
  }

  async refreshUsage(...ids: (string | null | undefined)[]) {
    for (const id of new Set(ids.filter((x): x is string => !!x))) {
      const { products, variants } = await this.usage(id);
      const asset = await this.repo.findOneBy({ id });
      if (!asset) continue;
      const used = products + variants > 0;
      if (used && asset.unusedSince) await this.repo.update(id, { unusedSince: null });
      if (!used && !asset.unusedSince) await this.repo.update(id, { unusedSince: new Date() });
    }
  }

  private async removeFiles(asset: ModelAsset) {
    await rm(join(MODELS_DIR, asset.sourceHash.slice(0, 16)), { recursive: true, force: true });
    await rm(join(ORIGINALS_DIR, `${asset.sourceHash}.glb`), { force: true });
  }

  async remove(id: string) {
    const asset = await this.get(id);
    const { products, variants } = await this.usage(id);
    if (products + variants > 0) throw new ConflictException('Model is used by products; detach it first');
    await this.removeFiles(asset);
    await this.repo.remove(asset);
  }

  async cleanup(olderThanHours = ORPHAN_GRACE_HOURS) {
    const cutoff = new Date(Date.now() - olderThanHours * 3600_000);
    const stale = await this.repo.find({ where: { unusedSince: LessThan(cutoff) } });
    let freed = 0;
    let deleted = 0;
    for (const a of stale) {
      if ((await this.usage(a.id)).products + (await this.usage(a.id)).variants > 0) continue;
      freed += (a.glbBytes ?? 0) + (a.usdzBytes ?? 0) + a.originalBytes;
      await this.removeFiles(a);
      await this.repo.remove(a);
      deleted++;
    }
    return { deleted, freedBytes: freed };
  }

  async stats() {
    const all = await this.repo.find();
    const ready = all.filter((a) => a.status === 'ready');
    const original = ready.reduce((s, a) => s + a.originalBytes, 0);
    const optimized = ready.reduce((s, a) => s + (a.glbBytes ?? 0), 0);
    return {
      assets: all.length,
      ready: ready.length,
      processing: all.filter((a) => a.status === 'processing').length,
      failed: all.filter((a) => a.status === 'failed').length,
      unused: all.filter((a) => a.unusedSince).length,
      originalBytes: original,
      glbBytes: optimized,
      usdzBytes: ready.reduce((s, a) => s + (a.usdzBytes ?? 0), 0),
      savedPercent: original ? Math.round((1 - optimized / original) * 100) : 0,
      diskBytes: (await dirSize(MODELS_DIR)) + (await dirSize(ORIGINALS_DIR)),
    };
  }
}
