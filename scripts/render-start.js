/**
 * Render.com Start Script
 * - DB ni blank_template dan ko'chiradi (agar mavjud bo'lmasa)
 * - Prisma migration run qiladi
 * - Next.js server ishga tushiradi
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROD_DB   = path.join(__dirname, '..', 'prisma', 'prod.db');
const BLANK_DB  = path.join(__dirname, '..', 'prisma', 'blank_template.db');

// 1. Agar prod.db mavjud bo'lmasa — blank template dan boshlash
if (!fs.existsSync(PROD_DB)) {
  if (fs.existsSync(BLANK_DB)) {
    console.log('📋 blank_template.db dan prod.db yaratilmoqda...');
    fs.copyFileSync(BLANK_DB, PROD_DB);
    console.log('✅ prod.db yaratildi.');
  } else {
    console.log('⚠️  blank_template.db topilmadi, yangi DB yaratiladi.');
  }
} else {
  console.log('✅ prod.db mavjud, davom etilmoqda.');
}

// 2. Prisma db push (schema migration)
try {
  console.log('🔄 Prisma db push...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: `file:./prisma/prod.db` },
  });
  console.log('✅ DB migrasiya tugadi.');
} catch (e) {
  console.error('⚠️  Prisma db push xatosi:', e.message);
}

// 3. Next.js ni ishga tushirish
console.log('🚀 Next.js ishga tushmoqda...');
const next = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', process.env.PORT || '3000'], {
  stdio: 'inherit',
  env: { ...process.env },
});

next.on('error', (err) => {
  console.error('❌ Next.js xatosi:', err);
  process.exit(1);
});

next.on('exit', (code) => {
  process.exit(code || 0);
});
