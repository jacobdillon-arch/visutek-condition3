import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';

export interface AuthRequest extends Request {
  userId?: string;
  storeId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.visutek_session ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; storeId: string | null };
    req.userId = payload.userId;
    req.storeId = payload.storeId ?? undefined;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
}

export function requireStoreAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.storeId) {
      res.status(403).json({ error: 'No store connected' });
      return;
    }
    next();
  });
}

/** Middleware: checks the store is within plan limits before creating a new config */
export async function checkConfigLimit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.storeId) { res.status(403).json({ error: 'No store connected' }); return; }

  const { PLANS } = await import('@visutek/shared');
  const store = await db.store.findUnique({ where: { id: req.storeId } });
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }

  const limits = PLANS[store.plan];
  const count = await db.viewerConfig.count({ where: { storeId: req.storeId } });
  if (count >= limits.maxConfigs) {
    res.status(403).json({
      error: `Plan limit reached. Upgrade to create more viewers.`,
      limit: limits.maxConfigs,
      current: count,
    });
    return;
  }
  next();
}
