import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import * as os from 'os';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

/** Where uploaded avatars live (mounted as the `uploads` docker volume). */
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads');
const FALLBACK_UPLOADS_DIR = path.join(os.tmpdir(), 'ft_transcendence_uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

/** Public URL prefix — served by the backend, proxied through nginx `/api/`. */
export const AVATAR_URL_PREFIX = '/api/uploads/avatars';

const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;

/** Multer options for a single avatar image upload. */
export const avatarMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      try {
        mkdirSync(AVATARS_DIR, { recursive: true });
        cb(null, AVATARS_DIR);
      } catch {
        try {
          const fallback = path.join(FALLBACK_UPLOADS_DIR, 'avatars');
          mkdirSync(fallback, { recursive: true });
          cb(null, fallback);
        } catch (fallbackError) {
          cb(fallbackError as Error, '');
        }
      }
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (
    _req: unknown,
    file: { originalname: string },
    cb: any,
  ) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return cb(new BadRequestException('Unsupported image type'), false);
    }
    cb(null, true);
  },
};
