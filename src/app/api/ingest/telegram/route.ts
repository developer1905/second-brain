import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let messagesCount = 0;
    const importedNotes = [];

    // Check if body is full Telegram export JSON or raw text payload
    if (body.chats || body.messages || body.name) {
      const messagesList = body.messages || (body.chats?.list ? body.chats.list.flatMap((c: any) => c.messages) : []);
      const chatName = body.name || "Telegram Ingest";

      for (const msg of (messagesList || []).slice(0, 50)) { // Process up to 50 items for speed
        if (!msg.text) continue;
        
        let textContent = typeof msg.text === 'string' 
          ? msg.text 
          : Array.isArray(msg.text) 
            ? msg.text.map((t: any) => typeof t === 'string' ? t : t.text).join('') 
            : '';

        if (!textContent.trim()) continue;

        const telegramMsg = await prisma.telegramMessage.create({
          data: {
            telegramId: msg.id ? BigInt(msg.id) : null,
            chatName: msg.from || chatName,
            text: textContent,
            date: msg.date || new Date().toISOString(),
            mediaType: msg.media_type || (textContent.includes('http') ? 'link' : 'text'),
            paraCategory: textContent.includes('#loyiha') || textContent.includes('[[') ? 'PROJECT' : 'RESOURCE',
          },
        });

        // Also convert into a Note for the Neural Graph
        const note = await prisma.note.create({
          data: {
            title: `Telegram: ${chatName} (${msg.date ? new Date(msg.date).toLocaleDateString() : 'Bugun'})`,
            content: textContent,
            paraCategory: 'RESOURCE',
            sourceType: 'TELEGRAM',
            tags: `Telegram,${chatName.replace(/\s+/g, '')}`,
            externalUrl: textContent.match(/https?:\/\/[^\s]+/)?.[0] || null,
          },
        });

        importedNotes.push(note);
        messagesCount++;
      }
    } else if (body.chatName && body.text) {
      // Direct chat message sent via Telegram Chat UI
      const message = await prisma.telegramMessage.create({
        data: {
          chatName: body.chatName,
          fromName: body.fromName || 'Siz',
          isOutgoing: body.isOutgoing !== undefined ? body.isOutgoing : true,
          text: body.text,
          date: body.date || new Date().toISOString(),
          mediaType: body.mediaType || (body.text.includes('http') ? 'link' : 'text'),
          paraCategory: 'RESOURCE',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Xabar muvaffaqiyatli yuborildi!',
        data: message,
      });
    } else if (body.rawText) {
      // Direct raw text import
      const note = await prisma.note.create({
        data: {
          title: `Telegram Qayd (${new Date().toLocaleDateString('uz-UZ')})`,
          content: body.rawText,
          paraCategory: 'RESOURCE',
          sourceType: 'TELEGRAM',
          tags: 'Telegram,TezkorImport',
        },
      });

      await prisma.telegramMessage.create({
        data: {
          chatName: 'Manual Import',
          fromName: 'Siz',
          isOutgoing: true,
          text: body.rawText,
          date: new Date().toISOString(),
          paraCategory: 'RESOURCE',
        },
      });

      importedNotes.push(note);
      messagesCount = 1;
    }

    return NextResponse.json({
      success: true,
      message: `${messagesCount} ta Telegram xabari va resurslari neyron tarmoqqa muvaffaqiyatli qo'shildi!`,
      count: messagesCount,
    });
  } catch (error: any) {
    console.error('Telegram Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const chatName = searchParams.get('chatName');
    const search = searchParams.get('search');
    const mediaType = searchParams.get('mediaType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (mode === 'chats') {
      const chatType = searchParams.get('chatType');
      const where: any = {};
      if (chatType && chatType !== 'ALL') {
        where.chatType = chatType;
      }

      const chatsList = await prisma.telegramMessage.groupBy({
        by: ['chatName', 'chatType'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });
      return NextResponse.json(
        chatsList.map((c) => ({
          chatName: c.chatName,
          chatType: c.chatType,
          count: c._count.id,
        }))
      );
    }

    const where: any = {};
    if (chatName && chatName !== 'ALL') {
      where.chatName = chatName;
    }
    if (mediaType && mediaType !== 'ALL') {
      where.mediaType = mediaType;
    }
    if (search && search.trim()) {
      where.text = { contains: search.trim() };
    }

    const sort = searchParams.get('sort') || 'asc';

    // Fetch most recent messages first
    const [totalMessages, rawMessages, chatsSummary] = await Promise.all([
      prisma.telegramMessage.count({ where }),
      prisma.telegramMessage.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { date: 'desc' },
      }),
      prisma.telegramMessage.groupBy({
        by: ['chatName'],
        _count: { id: true },
      }),
    ]);

    // Reverse array if chronological asc is requested (default chat view)
    const messages = sort === 'asc' ? rawMessages.reverse() : rawMessages;

    return NextResponse.json({
      success: true,
      totalMessages,
      totalChats: chatsSummary.length,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
    await prisma.telegramMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

