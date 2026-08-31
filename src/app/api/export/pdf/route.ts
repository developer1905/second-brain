import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/export/pdf — Generates a printable HTML/PDF report
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full'; // full | notes | projects | finance

    const [notes, projects, transactions, habits] = await Promise.all([
      prisma.note.findMany({ take: 30, orderBy: { createdAt: 'desc' } }),
      prisma.project.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.transaction.findMany({ take: 30, orderBy: { createdAt: 'desc' } }),
      prisma.habit.findMany({ take: 20 }),
    ]);

    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    const htmlContent = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Second Brain AI • Rasmiy Hisobot</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; background: #ffffff; color: #1e293b; line-height: 1.6; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #475569; font-size: 18px; margin-top: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .badge { background: #0284c7; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-box { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: bold; color: #0f172a; }
  </style>
</head>
<body>
  <h1>🧠 Second Brain AI — Rasmiy Tizim Hisoboti</h1>
  <p>Sana: ${new Date().toLocaleDateString('uz-UZ')} | Xotira Tizimi: O'zbek Tili Neural Knowledge System</p>

  <div class="stats-grid">
    <div class="stat-box">
      <div>Jami Qaydlar</div>
      <div class="stat-val">${notes.length} ta</div>
    </div>
    <div class="stat-box">
      <div>Faol Loyihalar</div>
      <div class="stat-val">${projects.filter((p) => p.status !== 'DONE').length} ta</div>
    </div>
    <div class="stat-box">
      <div>Moliyaviy Balans</div>
      <div class="stat-val">${(totalIncome - totalExpense).toLocaleString()} so'm</div>
    </div>
  </div>

  <h2>📋 Loyihalar Holati</h2>
  ${projects
    .map(
      (p) => `
    <div class="card">
      <div style="display:flex; justify-content:space-between;">
        <strong>${p.name}</strong>
        <span class="badge">${p.status} (${p.progress}%)</span>
      </div>
      <p style="margin:5px 0 0 0; font-size:13px; color:#64748b;">${p.description || 'Tavsif berilmagan'}</p>
    </div>
  `
    )
    .join('')}

  <h2>📝 So'nggi Qaydlar va G'oyalar</h2>
  ${notes
    .slice(0, 10)
    .map(
      (n) => `
    <div class="card">
      <div style="display:flex; justify-content:space-between;">
        <strong>${n.title}</strong>
        <span class="badge" style="background:#8b5cf6;">${n.paraCategory}</span>
      </div>
      <p style="margin:5px 0 0 0; font-size:13px; color:#334155;">${n.content.slice(0, 200)}...</p>
    </div>
  `
    )
    .join('')}

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
`;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="SecondBrain_Report.html"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
