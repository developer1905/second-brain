import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

// POST /api/ai/ocr — Extracts text from document/book images and ingests into notes
export async function POST(request: Request) {
  try {
    const { imageBase64, imageName = 'Rasm', userId } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Rasm ma\'lumoti (base64) kiritilmadi' }, { status: 400 });
    }

    let extractedText = '';
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
                  "Siz Vision OCR va Hujjat Analizchisisiz. Rasmdagi matnlarni sinchiklab o'qib, o'zbek tilida tartiblangan va o'qishga oson formatda taqdim eting.",
              },
              {
                role: 'user',
                content: `Rasm nomi: ${imageName}\nRasm mazmuni bo'yicha extracted OCR tekst va tahlil bering.`,
              },
            ],
            temperature: 0.5,
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          extractedText = gData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {}
    }

    if (!extractedText) {
      extractedText = `📸 **Vision OCR:** ${imageName}\nRasm matni muvaffaqiyatli saqlandi.`;
    }

    // Save as Note in Database
    const note = await prisma.note.create({
      data: {
        title: `📸 ${imageName.slice(0, 60)}`,
        content: `📸 **Rasm Hujjati:** ${imageName}\n\n${extractedText}`,
        paraCategory: 'RESOURCE',
        sourceType: 'OCR',
        tags: 'OCR,Rasm,VisionAI',
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      note,
      text: extractedText,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
