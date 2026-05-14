import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '@shared/types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): Response {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string,
): Response {
  return res.status(200).json({ success: true, data, meta, message });
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
