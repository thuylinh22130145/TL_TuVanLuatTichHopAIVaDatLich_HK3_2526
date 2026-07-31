import multer from 'multer';

import { ApiError } from '../utils/ApiError.js';

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname);
    callback(isPdf ? null : new ApiError(400, 'Chỉ chấp nhận file PDF hợp lệ.'), isPdf);
  },
});

export function receivePdf(req, res, next) {
  uploader.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, 'File PDF vượt quá giới hạn 25 MB.'));
    }
    return next(error instanceof ApiError ? error : new ApiError(400, error.message));
  });
}
