import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { presignDownload } from '../lib/s3';
import { renderViewerHTML } from '../lib/viewer-template';
import type { ViewerPayload, ColorOption, SizeChart, VariantMapping } from '@visutek/shared';

const router = Router();

/** Public endpoint — no auth required. Renders the viewer iframe HTML. */
router.get('/', async (req: Request, res: Response) => {
  const configId = req.query.config as string;
  if (!configId) { res.status(400).send('Missing config parameter'); return; }

  const config = await db.viewerConfig.findUnique({
    where: { id: configId },
    include: {
      models: { where: { uploadStatus: 'ready' } },
      colorOptions: { orderBy: { sortOrder: 'asc' } },
      sizeCharts: true,
      variantMappings: true,
    },
  });

  if (!config || !config.active) { res.status(404).send('Viewer not found'); return; }

  const modelsWithUrls = await Promise.all(
    config.models.map(async (m) => ({
      id: m.id,
      label: m.label,
      presignedUrl: await presignDownload(m.s3Key),
    }))
  );

  const payload: ViewerPayload = {
    configId: config.id,
    backgroundColor: config.backgroundColor,
    showBranding: config.showBranding,
    models: modelsWithUrls,
    colorOptions: config.colorOptions as ColorOption[],
    sizeCharts: config.sizeCharts as unknown as SizeChart[],
    variantMappings: config.variantMappings as unknown as VariantMapping[],
  };

  const html = renderViewerHTML(payload);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.send(html);
});

/** Public endpoint — returns viewer config as JSON (for viewer.js bootstrap) */
router.get('/config', async (req: Request, res: Response) => {
  const configId = req.query.config as string;
  if (!configId) { res.status(400).json({ error: 'Missing config' }); return; }

  const config = await db.viewerConfig.findUnique({
    where: { id: configId },
    include: {
      models: { where: { uploadStatus: 'ready' } },
      colorOptions: { orderBy: { sortOrder: 'asc' } },
      sizeCharts: true,
      variantMappings: true,
    },
  });

  if (!config || !config.active) { res.status(404).json({ error: 'Not found' }); return; }

  const modelsWithUrls = await Promise.all(
    config.models.map(async (m) => ({
      id: m.id,
      label: m.label,
      presignedUrl: await presignDownload(m.s3Key),
    }))
  );

  res.json({
    configId: config.id,
    backgroundColor: config.backgroundColor,
    showBranding: config.showBranding,
    models: modelsWithUrls,
    colorOptions: config.colorOptions,
    sizeCharts: config.sizeCharts,
    variantMappings: config.variantMappings,
  });
});

export default router;
