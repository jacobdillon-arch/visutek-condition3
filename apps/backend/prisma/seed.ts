import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Demo store ──────────────────────────────────────────────────────────
  const store = await db.store.upsert({
    where: { shopifyDomain: 'demo.myshopify.com' },
    update: {},
    create: {
      shopifyDomain: 'demo.myshopify.com',
      plan: 'pro',
    },
  });

  // ── Demo admin user ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password', 12);
  const user = await db.user.upsert({
    where: { email: 'admin@visutek.io' },
    update: {},
    create: {
      email: 'admin@visutek.io',
      passwordHash,
      name: 'Demo Admin',
      storeId: store.id,
    },
  });

  // ── Demo viewer config ──────────────────────────────────────────────────
  const existing = await db.viewerConfig.findFirst({ where: { storeId: store.id } });
  if (existing) {
    console.log('Demo viewer config already exists, skipping.');
    return;
  }

  const config = await db.viewerConfig.create({
    data: {
      storeId: store.id,
      name: 'Powderverse Pant Viewer',
      shopifyProductId: '7823648293',
      backgroundColor: '#f0efec',
      showBranding: false,
      active: true,
    },
  });

  // ── Colors ──────────────────────────────────────────────────────────────
  const colors = [
    { name: 'Lapis',        hexValue: '#2d4a7a', isDefault: true  },
    { name: 'Forest',       hexValue: '#2d4a3a', isDefault: false },
    { name: 'Obsidian',     hexValue: '#1a1a2e', isDefault: false },
    { name: 'Storm Grey',   hexValue: '#5a6472', isDefault: false },
    { name: 'Black',        hexValue: '#050505', isDefault: false },
    { name: 'Dried Mango',  hexValue: '#c8622a', isDefault: false },
  ];

  for (let i = 0; i < colors.length; i++) {
    await db.colorOption.create({
      data: { ...colors[i], configId: config.id, sortOrder: i },
    });
  }

  // ── Men's size chart (official OR Powderverse data) ─────────────────────
  await db.sizeChart.create({
    data: {
      configId: config.id,
      label: "Men's US",
      gender: 'mens',
      unit: 'in',
      chartData: {
        XS:   { waist: [26.5, 29],   hip: [32.5, 35],   inseam: { short: 29.5, reg: 31.5, tall: 33.5 } },
        S:    { waist: [29,   31.5], hip: [35,   37.5], inseam: { short: 29.5, reg: 31.5, tall: 33.5 } },
        M:    { waist: [31.5, 34.5], hip: [37.5, 40.5], inseam: { short: 30,   reg: 32,   tall: 34   } },
        L:    { waist: [34.5, 37.5], hip: [40.5, 43.5], inseam: { short: 30,   reg: 32.5, tall: 34.5 } },
        XL:   { waist: [37.5, 41.5], hip: [43.5, 46],   inseam: { short: 30,   reg: 33,   tall: 35   } },
        XXL:  { waist: [41.5, 45.5], hip: [46,   49.5], inseam: { short: 30,   reg: 33,   tall: 35   } },
        XXXL: { waist: [45.5, 50],   hip: [49.5, 53],   inseam: { short: 30,   reg: 33,   tall: 35   } },
      },
      easeData: { waist: 1.0, hip: 1.5 },
    },
  });

  // ── Women's size chart ──────────────────────────────────────────────────
  await db.sizeChart.create({
    data: {
      configId: config.id,
      label: "Women's US",
      gender: 'womens',
      unit: 'in',
      chartData: {
        XS:   { waist: [24,   26.5], hip: [33.5, 36],   inseam: { short: 28,   reg: 30,   tall: 32   } },
        S:    { waist: [26.5, 29],   hip: [36,   38.5], inseam: { short: 28.5, reg: 30,   tall: 32   } },
        M:    { waist: [29,   32],   hip: [38.5, 41.5], inseam: { short: 29,   reg: 30.5, tall: 32.5 } },
        L:    { waist: [32,   35],   hip: [41.5, 44.5], inseam: { short: 29,   reg: 31,   tall: 33   } },
        XL:   { waist: [35,   38.5], hip: [44.5, 47.5], inseam: { short: 29,   reg: 31.5, tall: 33.5 } },
        XXL:  { waist: [38.5, 42.5], hip: [47.5, 51],   inseam: { short: 29,   reg: 31.5, tall: 33.5 } },
        XXXL: { waist: [42.5, 46.5], hip: [51,   55],   inseam: { short: 29,   reg: 31.5, tall: 33.5 } },
      },
      easeData: { waist: 1.0, hip: 1.5 },
    },
  });

  console.log(`
✓ Database seeded successfully

  Login credentials:
    Email:    admin@visutek.io
    Password: password

  Admin dashboard: http://localhost:3000
  Backend API:     http://localhost:3001
  MinIO console:   http://localhost:9001  (minioadmin / minioadmin123)

  Next steps:
    1. Log in to the admin dashboard
    2. Go to Viewers → Powderverse Pant Viewer → 3D Models
    3. Upload a .glb file to see the full viewer in action
  `);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
