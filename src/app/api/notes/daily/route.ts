import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const title = `Kunlik Qayd: ${todayStr}`;

    let dailyNote = await prisma.note.findFirst({
      where: { title: { contains: todayStr } },
    });

    if (!dailyNote) {
      const template = `### 📅 Kunlik Qayd (${todayStr})

#### 🎯 Bugungi Asosiy Maqsadlar
- [ ] 

#### 💡 Fikrlar va Eslatmalar
- 

#### 🔗 Bog'liq Qaydlar
- [[P.A.R.A Metodologiyasi Qoidalari]]
- [[Second Brain AI Tizimi]]
`;

      dailyNote = await prisma.note.create({
        data: {
          title,
          content: template,
          paraCategory: 'RESOURCE',
          sourceType: 'NOTE',
          tags: 'DailyNote,Journal,KunlikQayd',
        },
      });
    }

    return NextResponse.json({ dailyNote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
