import { Router, Request, Response } from 'express';
import { shopify, saveSession } from '../lib/shopify';
import { db } from '../lib/db';
import jwt from 'jsonwebtoken';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** Step 1: merchant clicks "Connect Shopify" in admin dashboard */
router.get('/install', requireAuth, async (req: AuthRequest, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop) { res.status(400).json({ error: 'Missing shop parameter' }); return; }

  await shopify.auth.begin({
    shop,
    callbackPath: '/auth/shopify/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
});

/** Step 2: Shopify redirects back with OAuth code */
router.get('/callback', async (req: Request, res: Response) => {
  const callback = await shopify.auth.callback({
    rawRequest: req,
    rawResponse: res,
  });

  await saveSession(callback.session);

  // Associate the store with the authenticated admin user (if cookie present)
  const adminToken = req.cookies?.visutek_session;
  if (adminToken) {
    try {
      const payload = jwt.verify(adminToken, JWT_SECRET) as { userId: string };
      const store = await db.store.findUnique({ where: { shopifyDomain: callback.session.shop } });
      if (store) {
        await db.user.update({ where: { id: payload.userId }, data: { storeId: store.id } });
        // Re-issue token with storeId
        const newToken = jwt.sign({ userId: payload.userId, storeId: store.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('visutek_session', newToken, COOKIE_OPTIONS);
      }
    } catch {
      // Token invalid — skip association, merchant can reconnect
    }
  }

  res.redirect('/dashboard');
});

/** Webhook: app/uninstalled */
router.post('/webhooks/app-uninstalled', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  if (shop) {
    await db.store.updateMany({
      where: { shopifyDomain: shop },
      data: { uninstalledAt: new Date(), accessToken: null },
    });
  }
  res.sendStatus(200);
});

/** Webhook: products/delete — clean up orphaned configs */
router.post('/webhooks/products-delete', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const productId = req.body?.id?.toString();
  if (shop && productId) {
    const store = await db.store.findUnique({ where: { shopifyDomain: shop } });
    if (store) {
      await db.viewerConfig.updateMany({
        where: { storeId: store.id, shopifyProductId: productId },
        data: { active: false },
      });
    }
  }
  res.sendStatus(200);
});

export default router;
