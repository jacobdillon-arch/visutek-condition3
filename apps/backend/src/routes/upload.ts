import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { presignUpload, modelS3Key, GLB_MAX_BYTES, GLB_WARN_BYTES } from '../lib/s3';
import { requireStoreAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const GLB_MAGIC = Buffer.from([0x67, 0x6c, 0x54, 0x46]); // 'glTF'

router.post('/model', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    configId: z.string().uuid(),
    label: z.string().min(1).max(50),
    fileSizeBytes: z.number().int().positive(),
    fileName: z.string().optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }
  const { configId, label, fileSizeBytes } = body.data;

  if (fileSizeBytes > GLB_MAX_BYTES) {
    res.status(413).json({ error: `File too large. Maximum size is ${GLB_MAX_BYTES / 1024 / 1024}MB.` });
    return;
  }

  const config = await db.viewerConfig.findFirst({ where: { id: configId, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Config not found' }); return; }

  // Check per-config model limit
  const { PLANS } = await import('@visutek/shared');
  const store = await db.store.findUnique({ where: { id: req.storeId! } });
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }
  const limits = PLANS[store.plan];
  const modelCount = await db.model.count({ where: { configId, uploadStatus: { in: ['pending', 'processing', 'ready'] } } });
  if (modelCount >= limits.maxModelsPerConfig) {
    res.status(403).json({ error: `Plan limit: max ${limits.maxModelsPerConfig} models per viewer.` });
    return;
  }

  const model = await db.model.create({
    data: { configId, label, s3Key: '', fileSizeBytes: BigInt(fileSizeBytes), uploadStatus: 'pending' },
  });

  const s3Key = modelS3Key(req.storeId!, model.id);
  await db.model.update({ where: { id: model.id }, data: { s3Key, uploadStatus: 'processing' } });

  const uploadUrl = await presignUpload(s3Key);

  res.status(201).json({
    uploadUrl,
    modelId: model.id,
    s3Key,
    warnings: fileSizeBytes > GLB_WARN_BYTES
      ? [`File is ${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB. Consider Draco compression to improve load times.`]
      : [],
  });
});

/** Called by the frontend after S3 upload completes to mark the model as ready */
router.post('/model/:modelId/complete', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const model = await db.model.findUnique({ where: { id: req.params.modelId }, include: { config: true } });
  if (!model || model.config.storeId !== req.storeId) { res.status(404).json({ error: 'Not found' }); return; }

  await db.model.update({ where: { id: model.id }, data: { uploadStatus: 'ready' } });
  res.json({ ok: true });
});

/** Mark a model upload as errored */
router.post('/model/:modelId/error', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const model = await db.model.findUnique({ where: { id: req.params.modelId }, include: { config: true } });
  if (!model || model.config.storeId !== req.storeId) { res.status(404).json({ error: 'Not found' }); return; }

  await db.model.update({ where: { id: model.id }, data: { uploadStatus: 'error' } });
  res.json({ ok: true });
});

router.delete('/model/:modelId', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const model = await db.model.findUnique({ where: { id: req.params.modelId }, include: { config: true } });
  if (!model || model.config.storeId !== req.storeId) { res.status(404).json({ error: 'Not found' }); return; }

  const { deleteObject } = await import('../lib/s3');
  if (model.s3Key) await deleteObject(model.s3Key);
  await db.model.delete({ where: { id: model.id } });
  res.sendStatus(204);
});

export { GLB_MAGIC };
export default router;
