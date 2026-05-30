import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

/** Where uploaded avatars live (mounted as the `uploads` docker volume). */
export const UPLOADS_DIR = '/app/uploads';

/** Public URL prefix — served by the backend, proxied through nginx `/api/`. */
export const AVATAR_URL_PREFIX = '/api/uploads/avatars';

const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Multer options for a single avatar image upload. */
export const avatarMulterOptions = {
  storage: diskStorage({
    destination: `${UPLOADS_DIR}/avatars`,
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (
    _req: unknown,
    file: { originalname: string },
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return cb(new BadRequestException('Unsupported image type'), false);
    }
    cb(null, true);
  },
};
