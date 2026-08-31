import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

// GET /api/reminders — Get all active reminders
export async function GET() {
  try {
    const reminders = await prisma.schedule.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json({ success: true, reminders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/reminders — Parse natural language reminder and save to Schedule database
export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Eslatma matni kiritilmadi' }, { status: 400 });
    }

    let parsedTitle = prompt.trim();
    let parsedTime = 'Bugun';
    const groqKey = getGroqApiKey();

    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
            'User-Agent': 'SecondBrainAI/1.0',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  "Siz Smart Reminder Parsersiz. Berilgan eslatma matnidan 1-qatorda sarlavhani, 2-qatorda rejalashtirilgan vaqtni (masalan: Ertaga 15:00) ajratib bering.",
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const text = gData.choices?.[0]?.message?.content || '';
          const lines = text.split('\n').filter(Boolean);
          if (lines[0]) parsedTitle = lines[0].replace(/sarlavha:/i, '').trim();
          if (lines[1]) parsedTime = lines[1].replace(/vaqt:/i, '').trim();
        }
      } catch (e) {}
    }

    const schedule = await prisma.schedule.create({
      data: {
        title: parsedTitle.slice(0, 100),
        description: `⏰ Rejalashtirilgan: ${parsedTime}\n"${prompt}"`,
        oneTime: parsedTime,
        isActive: true,
        tags: 'AIReminder,Eslatma',
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: `⏰ Eslatma muvaffaqiyatli saqlandi! (${parsedTime})`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
