import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { requireStoreAuth, checkConfigLimit, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Viewer Configs ────────────────────────────────────────────────────────

router.get('/', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const configs = await db.viewerConfig.findMany({
    where: { storeId: req.storeId! },
    include: { models: true, colorOptions: true, sizeCharts: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(configs);
});

router.post('/', requireStoreAuth, checkConfigLimit, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().min(1).max(100),
    shopifyProductId: z.string().optional(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }

  const config = await db.viewerConfig.create({
    data: { ...body.data, storeId: req.storeId! },
  });
  res.status(201).json(config);
});

router.get('/:id', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({
    where: { id: req.params.id, storeId: req.storeId! },
    include: { models: true, colorOptions: { orderBy: { sortOrder: 'asc' } }, sizeCharts: true, variantMappings: true },
  });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(config);
});

router.patch('/:id', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().min(1).max(100).optional(),
    shopifyProductId: z.string().optional(),
    active: z.boolean().optional(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    showBranding: z.boolean().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }

  const existing = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  // Prevent removing branding on non-pro plans
  if (body.data.showBranding === false) {
    const { PLANS } = await import('@visutek/shared');
    const store = await db.store.findUnique({ where: { id: req.storeId! } });
    if (!store || !PLANS[store.plan].removeBranding) {
      res.status(403).json({ error: 'Upgrade to Pro to remove VisuTek branding' });
      return;
    }
  }

  const updated = await db.viewerConfig.update({ where: { id: req.params.id }, data: body.data });
  res.json(updated);
});

router.delete('/:id', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const existing = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await db.viewerConfig.delete({ where: { id: req.params.id } });
  res.sendStatus(204);
});

// ─── Color Options ─────────────────────────────────────────────────────────

router.get('/:id/colors', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  const colors = await db.colorOption.findMany({ where: { configId: req.params.id }, orderBy: { sortOrder: 'asc' } });
  res.json(colors);
});

router.post('/:id/colors', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }

  const body = z.object({
    name: z.string().min(1).max(50),
    hexValue: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    isDefault: z.boolean().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }

  const count = await db.colorOption.count({ where: { configId: req.params.id } });
  if (body.data.isDefault) {
    await db.colorOption.updateMany({ where: { configId: req.params.id }, data: { isDefault: false } });
  }
  const color = await db.colorOption.create({ data: { ...body.data, configId: req.params.id, sortOrder: count } });
  res.status(201).json(color);
});

router.put('/:id/colors', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }

  const body = z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(50),
    hexValue: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sortOrder: z.number().int().min(0),
    isDefault: z.boolean(),
  })).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: 'Invalid colors array' }); return; }

  await db.$transaction(body.data.map(c =>
    db.colorOption.update({ where: { id: c.id }, data: { name: c.name, hexValue: c.hexValue, sortOrder: c.sortOrder, isDefault: c.isDefault } })
  ));
  res.json({ ok: true });
});

router.delete('/:id/colors/:colorId', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  await db.colorOption.delete({ where: { id: req.params.colorId } });
  res.sendStatus(204);
});

// ─── Size Charts ───────────────────────────────────────────────────────────

router.get('/:id/size-charts', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  const charts = await db.sizeChart.findMany({ where: { configId: req.params.id } });
  res.json(charts);
});

router.post('/:id/size-charts', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }

  const body = z.object({
    label: z.string().min(1).max(100),
    gender: z.enum(['mens', 'womens', 'unisex']),
    unit: z.enum(['in', 'cm']),
    chartData: z.record(z.object({
      waist: z.tuple([z.number(), z.number()]),
      hip: z.tuple([z.number(), z.number()]),
      inseam: z.object({ short: z.number(), reg: z.number(), tall: z.number() }),
    })),
    easeData: z.object({ waist: z.number(), hip: z.number() }),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }

  const chart = await db.sizeChart.create({ data: { ...body.data, configId: req.params.id } });
  res.status(201).json(chart);
});

router.put('/:id/size-charts/:chartId', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }

  const body = z.object({
    label: z.string().min(1).max(100).optional(),
    chartData: z.record(z.any()).optional(),
    easeData: z.object({ waist: z.number(), hip: z.number() }).optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.issues[0].message }); return; }

  const chart = await db.sizeChart.update({ where: { id: req.params.chartId }, data: body.data });
  res.json(chart);
});

router.delete('/:id/size-charts/:chartId', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  await db.sizeChart.delete({ where: { id: req.params.chartId } });
  res.sendStatus(204);
});

// ─── Variant Mappings ──────────────────────────────────────────────────────

router.get('/:id/variants', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }
  const mappings = await db.variantMapping.findMany({ where: { configId: req.params.id } });
  res.json(mappings);
});

router.put('/:id/variants', requireStoreAuth, async (req: AuthRequest, res: Response) => {
  const config = await db.viewerConfig.findFirst({ where: { id: req.params.id, storeId: req.storeId! }, include: { variantMappings: true } });
  if (!config) { res.status(404).json({ error: 'Not found' }); return; }

  const body = z.array(z.object({
    shopifyVariantId: z.string(),
    size: z.string(),
    colorOptionId: z.string().nullable(),
    priceOverride: z.number().nullable(),
  })).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: 'Invalid mappings' }); return; }

  await db.variantMapping.deleteMany({ where: { configId: req.params.id } });
  await db.variantMapping.createMany({
    data: body.data.map(m => ({ ...m, configId: req.params.id })),
  });
  res.json({ ok: true });
});

export default router;
