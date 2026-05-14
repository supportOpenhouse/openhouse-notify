import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { requireSession } from '@middlewares/auth.middleware';
import { createCampaign, listCampaigns, getCampaign, cancelCampaign } from '../controllers';
import { AppError } from '@shared/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'text/plain' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.txt')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV / TXT files are accepted for token upload'));
    }
  },
});

/** Wraps multer so MulterErrors become proper AppErrors instead of raw 500s. */
function uploadSingle(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof MulterError) {
        return next(new AppError(err.message, 400, true, `MULTER_${err.code}`));
      }
      return next(new AppError((err as Error).message ?? 'File upload error', 400, true, 'UPLOAD_ERROR'));
    });
  };
}

export const campaignsRouter = Router();

campaignsRouter.use(requireSession);

campaignsRouter.get('/', listCampaigns);

campaignsRouter.post(
  '/',
  uploadSingle('csvFile'),
  createCampaign,
);

campaignsRouter.get('/:id', getCampaign);

campaignsRouter.patch('/:id/cancel', cancelCampaign);
