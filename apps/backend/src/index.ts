import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/auth';
import shopifyRoutes from './routes/shopify';
import configRoutes from './routes/configs';
import uploadRoutes from './routes/upload';
import viewerRoutes from './routes/viewer';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false, // viewer route sets its own CSP
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.ADMIN_URL ?? 'http://localhost:3000',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve built viewer.js as a static asset
app.use(express.static(path.join(__dirname, '../../viewer/dist'), {
  maxAge: '1d',
  immutable: true,
}));

// Routes
app.use('/auth', authRoutes);
app.use('/auth/shopify', shopifyRoutes);
app.use('/webhooks', shopifyRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/viewer', viewerRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`VisuTek backend running on http://localhost:${PORT}`);
});

export default app;
