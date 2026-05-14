import { Router, Request, Response } from 'express';
import { requireSession } from '@middlewares/auth.middleware';
import { asyncHandler } from '@utils/async-handler';
import { sendSuccess } from '@utils/response.helper';
import { prisma } from '@infrastructure/database';

export const meRouter = Router();

/**
 * GET /api/v1/me
 * Returns the authenticated user's profile from the shared DB.
 * Validates the NextAuth session cookie before responding.
 *
 * This is the canonical "am I logged in?" endpoint for the Express backend.
 */
meRouter.get(
  '/',
  requireSession,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user);
  }),
);
