import { join } from 'node:path';

export const PUBLIC_DIR = join(process.cwd(), 'public');
export const UPLOADS_DIR = join(PUBLIC_DIR, 'uploads');
