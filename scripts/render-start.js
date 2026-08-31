/**
 * Render.com Start Script
 * - prod.db bo'lmasa initial_data.db yoki blank_template.db dan nusxalaydi
 * - Next.js serverni ishga tushiradi
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROD_DB    = path.join(__dirname, '..', 'prisma', 'prod.db');
const DEV_DB     = path.join(__dirname, '..', 'prisma', 'dev.db');
const INITIAL_DB = path.join(__dirname, '..', 'prisma', 'initial_data.db');
const BLANK_DB   = path.join(__dirname, '..', 'prisma', 'blank_template.db');

// 1. initial_data.db mavjud bo'lsa prod.db va dev.db ga nusxalash
const sourceDb = fs.existsSync(INITIAL_DB) ? INITIAL_DB : BLANK_DB;

if (fs.existsSync(sourceDb)) {
  const sourceSize = fs.statSync(sourceDb).size;
  console.log(`📋 ${path.basename(sourceDb)} (${(sourceSize / (1024*1024)).toFixed(1)}MB) dan prod.db va dev.db nusxalanmoqda...`);
  
  const prodSize = fs.existsSync(PROD_DB) ? fs.statSync(PROD_DB).size : 0;
  if (!fs.existsSync(PROD_DB) || prodSize < 100000) {
    fs.copyFileSync(sourceDb, PROD_DB);
    console.log('✅ prod.db nusxalandi va tiklandi.');
  }

  const devSize = fs.existsSync(DEV_DB) ? fs.statSync(DEV_DB).size : 0;
  if (!fs.existsSync(DEV_DB) || devSize < 100000) {
    fs.copyFileSync(sourceDb, DEV_DB);
    console.log('✅ dev.db nusxalandi va tiklandi.');
  }
} else {
  console.log('⚠️ Baza nusxasi topilmadi.');
}

// 2. Next.js serverni ishga tushirish (prisma db push BAJARILMAYDI — baza o'chib ketishini oldini olish uchun)
console.log('🚀 Next.js server ishga tushmoqda...');
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
