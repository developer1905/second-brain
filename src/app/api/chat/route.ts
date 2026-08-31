import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/chat?sessionId=xxx  — fetch messages for a session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    // Return list of unique sessions (most recent message per session)
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sessionsMap = new Map<string, typeof messages[0]>();
    messages.forEach((m) => {
      if (!sessionsMap.has(m.sessionId)) sessionsMap.set(m.sessionId, m);
    });
    return NextResponse.json(Array.from(sessionsMap.values()));
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(messages);
}

// POST /api/chat  — send a message + get AI reply (streaming simulation)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content } = body as { sessionId: string; content: string };

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'sessionId and content required' }, { status: 400 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: content.trim() },
    });

    // Build context: fetch recent notes, projects, areas for grounding
    const [notes, projects, areas] = await Promise.all([
      prisma.note.findMany({ take: 20, orderBy: { updatedAt: 'desc' }, select: { title: true, content: true, tags: true } }),
      prisma.project.findMany({ take: 10, where: { isArchived: false }, select: { name: true, description: true, status: true } }),
      prisma.area.findMany({ take: 10, select: { name: true, description: true } }),
    ]);

    const contextText = [
      notes.length ? `📝 So'nggi eslatmalar:\n${notes.map(n => `• ${n.title}: ${n.content.slice(0, 120)}...`).join('\n')}` : '',
      projects.length ? `📁 Loyihalar:\n${projects.map(p => `• ${p.name} (${p.status}): ${p.description.slice(0, 80)}`).join('\n')}` : '',
      areas.length ? `🗂️ Sohalar:\n${areas.map(a => `• ${a.name}: ${a.description.slice(0, 80)}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    const systemPrompt = `Sen "Second Brain AI" — o'zbek tilida javob beradigan shaxsiy bilimlar bazasi yordamchisi.
Foydalanuvchining bilimlar bazasida quyidagi ma'lumotlar mavjud:

${contextText || 'Hozircha ma\'lumot yo\'q.'}

Savolga qisqa, aniq va foydali javob ber. O'zbek tilida yoz.`;

    let aiReply = '';

    // Try Gemini API if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Tushunarli, yordam beraman.' }] },
                { role: 'user', parts: [{ text: content }] },
              ],
            }),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch {
        // fall through to smart fallback
      }
    }

    // Smart fallback if no API key or request failed
    if (!aiReply) {
      const q = content.toLowerCase();
      if (q.includes('loyih') || q.includes('project')) {
        aiReply = projects.length
          ? `Sizda ${projects.length} ta loyiha mavjud:\n${projects.map(p => `• **${p.name}** — ${p.status}`).join('\n')}`
          : "Hozircha loyihalar yo'q. Loyiha qo'shish uchun /projects sahifasiga o'ting.";
      } else if (q.includes('eslatm') || q.includes('note')) {
        aiReply = notes.length
          ? `Bilimlar bazangizda ${notes.length} ta eslatma bor. So'nggisi: **${notes[0]?.title}**`
          : "Hozircha eslatmalar yo'q.";
      } else if (q.includes('soha') || q.includes('area')) {
        aiReply = areas.length
          ? `${areas.length} ta soha mavjud: ${areas.map(a => a.name).join(', ')}`
          : "Hozircha sohalar yo'q.";
      } else {
        aiReply = `Bilimlar bazangizda **${notes.length}** eslatma, **${projects.length}** loyiha, **${areas.length}** soha mavjud.\n\nGemini API kaliti sozlanmagan. .env fayliga GEMINI_API_KEY qo'shing — to'liq AI imkoniyatlari uchun.`;
      }
    }

    // Save assistant reply
    const assistantMsg = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    return NextResponse.json({ message: assistantMsg });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat xatosi' }, { status: 500 });
  }
}

// DELETE /api/chat?sessionId=xxx — delete entire session
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  return NextResponse.json({ ok: true });
}
