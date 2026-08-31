import { NextResponse } from 'next/server';
import { getGeminiApiKey } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

// POST /api/admin/broadcast — Send Telegram broadcast message to admin/users
export async function POST(request: Request) {
  try {
    const { text, targetChatId } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Xabar matni kiritilmadi' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = targetChatId || process.env.TELEGRAM_ADMIN_ID;

    if (!botToken || !adminId) {
      return NextResponse.json({ error: 'Telegram Bot Token yoki Admin ID sozlanmagan' }, { status: 400 });
    }

    const payload = {
      chat_id: adminId,
      text: `📢 <b>ADMIN XABARNOMASI:</b>\n\n${text}`,
      parse_mode: 'HTML',
    };

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Telegram xabari yuborilmadi' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Xabar Telegramga muvaffaqiyatli yuborildi!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
