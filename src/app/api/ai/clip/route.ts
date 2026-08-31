import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGroqApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

// POST /api/ai/clip — Web Clipper: Scrapes URL content & extracts AI summaries
export async function POST(request: Request) {
  try {
    const { url, rawText, userId } = await request.json();

    if (!url && !rawText) {
      return NextResponse.json({ error: 'URL yoki matn kiritilmadi' }, { status: 400 });
    }

    let pageTitle = url ? new URL(url).hostname : 'Web Clip';
    let fetchedText = rawText || '';

    // Fetch URL HTML content if URL is provided
    if (url && !rawText) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        if (res.ok) {
          const html = await res.text();
          // Extract title tag
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) pageTitle = titleMatch[1].trim();

          // Strip HTML tags
          fetchedText = html
            .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
            .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000);
        }
      } catch (e) {
        fetchedText = `Web clip: ${url}`;
      }
    }

    // Process with Groq AI (Llama 3.3 70B)
    let aiSummary = '';
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
                  "Siz AI Web Clipper yordamchisiz. Berilgan maqoladan eng muhim 3 ta g'oyani, qisqacha xulosani va mos teglarni o'zbek tilida tayyorlab bering.",
              },
              { role: 'user', content: `Sarlavha: ${pageTitle}\nMatn: ${fetchedText.slice(0, 2000)}` },
            ],
            temperature: 0.5,
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          aiSummary = gData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {}
    }

    if (!aiSummary) {
      aiSummary = `🌐 **Web Clipper:** ${pageTitle}\n${fetchedText.slice(0, 300)}`;
    }

    // Save as Resource Note in Database
    const note = await prisma.note.create({
      data: {
        title: pageTitle.slice(0, 80),
        content: `🔗 **Manba:** ${url || 'Web Clip'}\n\n${aiSummary}\n\n---\nMatn ko'rinishi:\n${fetchedText.slice(0, 500)}`,
        paraCategory: 'RESOURCE',
        sourceType: 'WEB',
        tags: `WebClipper,Resource,AI`,
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      note,
      summary: aiSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
