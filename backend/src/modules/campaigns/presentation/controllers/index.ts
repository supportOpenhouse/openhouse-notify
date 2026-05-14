import { Request, Response, NextFunction } from 'express';
import { createCampaignSchema, listCampaignsSchema } from '../../dto';
import {
  createCampaignUseCase,
  listCampaignsUseCase,
  getCampaignByIdUseCase,
  cancelCampaignUseCase,
} from '../../application/use-cases';
import { sendSuccess, sendCreated } from '@utils/response.helper';

export async function createCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = createCampaignSchema.parse({
      ...req.body,
      // multer parses the body as strings; coerce boolean
      silent: req.body.silent,
    });

    const csvFile = req.file; // set by multer when audienceType = csv_tokens
    const result = await createCampaignUseCase(dto, csvFile?.buffer);

    sendCreated(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function listCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = listCampaignsSchema.parse(req.query);
    const data = await listCampaignsUseCase(dto);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const campaign = await getCampaignByIdUseCase(id);
    sendSuccess(res, campaign);
  } catch (err) {
    next(err);
  }
}

export async function cancelCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await cancelCampaignUseCase(id);
    sendSuccess(res, null, 'Campaign cancelled');
  } catch (err) {
    next(err);
  }
}
