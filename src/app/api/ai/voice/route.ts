import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

// POST /api/ai/voice — Voice Transcriber & Audio Note Processor
export async function POST(request: Request) {
  try {
    const { transcript, audioName = 'Ovozli Qayd', userId } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Ovozli matn kiritilmadi' }, { status: 400 });
    }

    let processedNote = '';
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
                  "Siz Voice Transcriber & Audio Note AI yordamchisiz. Ovozli xabardan asosiy fikrlarni, vazifalarni va punktlarni o'zbek tilida tartiblab bering.",
              },
              { role: 'user', content: `Ovozli matn: ${transcript}` },
            ],
            temperature: 0.5,
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          processedNote = gData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {}
    }

    if (!processedNote) {
      processedNote = `🎤 **Ovozli Qayd:** ${transcript}`;
    }

    // Save as Voice Note in Database
    const note = await prisma.note.create({
      data: {
        title: `🎤 ${audioName.slice(0, 60)}`,
        content: `🎤 **Original Ovoz Matni:**\n"${transcript}"\n\n---\n🧠 **AI Tahlili va Asosiy Nuqtalar:**\n${processedNote}`,
        paraCategory: 'RESOURCE',
        sourceType: 'VOICE',
        tags: 'VoiceNote,Ovozli,AI',
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      note,
      processedNote,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
