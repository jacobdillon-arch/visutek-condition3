import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../lib/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  const body = RegisterSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.issues[0].message });
    return;
  }
  const { email, password, name } = body.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { email, passwordHash, name } });

  const token = jwt.sign({ userId: user.id, storeId: null }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('visutek_session', token, COOKIE_OPTIONS);
  res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

router.post('/login', async (req: Request, res: Response) => {
  const body = LoginSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.issues[0].message });
    return;
  }
  const { email, password } = body.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id, storeId: user.storeId }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('visutek_session', token, COOKIE_OPTIONS);
  res.json({ id: user.id, email: user.email, name: user.name, storeId: user.storeId });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('visutek_session');
  res.json({ ok: true });
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.visutek_session;
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ id: user.id, email: user.email, name: user.name, storeId: user.storeId });
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

export default router;
