/**
 * Render.com Startup Script
 * - initial_data.db (56MB) ni prisma/dev.db, prisma/prod.db va root dev.db/prod.db ga ko'chiradi
 * - Prisma db push running status: barcha jadvallar yaratiladi va 70k xabarlar saqlanadi
 * - Next.js serverini boshlaydi
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR   = path.resolve(__dirname, '..');
const PRISMA_DIR = path.join(ROOT_DIR, 'prisma');

const INITIAL_DB = path.join(PRISMA_DIR, 'initial_data.db');
const BLANK_DB   = path.join(PRISMA_DIR, 'blank_template.db');
const sourceDb   = fs.existsSync(INITIAL_DB) ? INITIAL_DB : BLANK_DB;

const targets = [
  path.join(PRISMA_DIR, 'dev.db'),
  path.join(PRISMA_DIR, 'prod.db'),
  path.join(ROOT_DIR, 'dev.db'),
  path.join(ROOT_DIR, 'prod.db'),
];

if (fs.existsSync(sourceDb)) {
  const sizeMb = (fs.statSync(sourceDb).size / (1024 * 1024)).toFixed(1);
  console.log(`📋 Baza (${path.basename(sourceDb)}, ${sizeMb}MB) barcha joylashuvlarga ko'chirilmoqda...`);

  targets.forEach((targetPath) => {
    try {
      const exists = fs.existsSync(targetPath);
      const targetSize = exists ? fs.statSync(targetPath).size : 0;
      if (!exists || targetSize < 100000) {
        fs.copyFileSync(sourceDb, targetPath);
        console.log(`  ✅ Nusxalandi: ${targetPath}`);
      } else {
        console.log(`  ℹ️  Mavjud (${(targetSize / (1024*1024)).toFixed(1)}MB): ${targetPath}`);
      }
    } catch (err) {
      console.error(`  ⚠️ Nusxalash xatosi (${targetPath}):`, err.message);
    }
  });
} else {
  console.log('⚠️ Baza manbasi topilmadi.');
}

// 2. Prisma DB push (jadvallar yo'q bo'lsa avtomatik yaratadi, ma'lumotlarni saqlaydi)
try {
  console.log('🔄 Prisma db push (schema sync)...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: `file:${path.join(PRISMA_DIR, 'dev.db')}`,
    },
  });
  console.log('✅ Prisma db push muvaffaqiyatli yakunlandi.');
} catch (e) {
  console.error('⚠️ Prisma db push ogohlantirishi:', e.message);
}

// 3. Absolute path set for process
process.env.DATABASE_URL = `file:${path.join(PRISMA_DIR, 'dev.db')}`;

// 4. Next.js server
console.log('🚀 Next.js server ishga tushmoqda...');
const next = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', process.env.PORT || '3000'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: `file:${path.join(PRISMA_DIR, 'dev.db')}`,
  },
});

next.on('error', (err) => {
  console.error('❌ Next.js xatosi:', err);
  process.exit(1);
});

next.on('exit', (code) => {
  process.exit(code || 0);
});
