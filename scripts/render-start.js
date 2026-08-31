/**
 * Render.com Start Script
 * - prod.db bo'lmasa initial_data.db yoki blank_template.db dan nusxalaydi
 * - Next.js serverni ishga tushiradi
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROD_DB    = path.join(__dirname, '..', 'prisma', 'prod.db');
const INITIAL_DB = path.join(__dirname, '..', 'prisma', 'initial_data.db');
const BLANK_DB   = path.join(__dirname, '..', 'prisma', 'blank_template.db');

// 1. Har gal start bo'lganida agar prod.db kichik bo'lsa (yoki yo'q bo'lsa) initial_data.db dan nusxa olish
const initialSize = fs.existsSync(INITIAL_DB) ? fs.statSync(INITIAL_DB).size : 0;
const prodSize    = fs.existsSync(PROD_DB) ? fs.statSync(PROD_DB).size : 0;

if (!fs.existsSync(PROD_DB) || prodSize < 100000) {
  const sourceDb = fs.existsSync(INITIAL_DB) ? INITIAL_DB : BLANK_DB;
  if (fs.existsSync(sourceDb)) {
    console.log(`📋 ${path.basename(sourceDb)} (${(fs.statSync(sourceDb).size / (1024*1024)).toFixed(1)}MB) dan prod.db nusxalanmoqda...`);
    fs.copyFileSync(sourceDb, PROD_DB);
    console.log('✅ prod.db nusxalandi va muvaffaqiyatli tiklandi.');
  } else {
    console.log('⚠️ Baza nusxasi topilmadi.');
  }
} else {
  console.log(`✅ prod.db mavjud (${(prodSize / (1024*1024)).toFixed(1)}MB), davom etilmoqda.`);
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
