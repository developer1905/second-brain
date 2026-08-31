'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Filter,
  FileText,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FolderPlus,
  User,
  Paperclip,
  Smile,
  CheckCheck,
  Link2,
  Plus,
  MessageCircleCode,
  Image as ImageIcon,
  FileCode,
} from 'lucide-react';

interface ChatSummary {
  chatName: string;
  chatType?: string;
  count: number;
}

interface TelegramMsg {
  id: string;
  telegramId?: string | null;
  chatName: string;
  fromName?: string | null;
  isOutgoing?: boolean;
  text: string;
  date: string;
  mediaType?: string | null;
  paraCategory: string;
  createdAt: string;
}

const AVATAR_COLORS = [
  'from-sky-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-500',
];

export const TelegramChatBrowser: React.FC = () => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('ALL');
  const [messages, setMessages] = useState<TelegramMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState<string>('ALL');
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const [totalChatsCount, setTotalChatsCount] = useState(0);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);

  // New message input state
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');

  // Fetch list of chats
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/ingest/telegram?mode=chats');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setChats(data);
          if (data.length > 0 && selectedChat === 'ALL') {
            setSelectedChat(data[0].chatName);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = `/api/ingest/telegram?limit=100`;
      if (selectedChat !== 'ALL') {
        url += `&chatName=${encodeURIComponent(selectedChat)}`;
      }
      if (mediaFilter !== 'ALL') {
        url += `&mediaType=${encodeURIComponent(mediaFilter)}`;
      }
      if (msgSearch.trim()) {
        url += `&search=${encodeURIComponent(msgSearch.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTotalMessagesCount(data.totalMessages || 0);
        setTotalChatsCount(data.totalChats || 0);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [selectedChat, mediaFilter, msgSearch]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentChat = selectedChat === 'ALL' ? (chats[0]?.chatName || 'General') : selectedChat;
    setSending(true);

    try {
      const res = await fetch('/api/ingest/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatName: currentChat,
          fromName: 'Siz',
          isOutgoing: true,
          text: inputMessage.trim(),
        }),
      });

      if (res.ok) {
        setInputMessage('');
        fetchMessages();
        fetchChats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleSaveToBrain = async (msg: TelegramMsg) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Telegram [${msg.chatName}]: ${msg.text.slice(0, 35)}...`,
          content: msg.text,
          paraCategory: msg.text.includes('#loyiha') || msg.text.includes('[[') ? 'PROJECT' : 'RESOURCE',
          sourceType: 'TELEGRAM',
          tags: `Telegram,${msg.chatName.replace(/\s+/g, '')}`,
          externalUrl: msg.text.match(/https?:\/\/[^\s]+/)?.[0] || null,
        }),
      });
      if (res.ok) {
        setSavedMsgId(msg.id);
        setTimeout(() => setSavedMsgId(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredChats = chats.filter((c) => {
    if (selectedFolder !== 'ALL' && c.chatType !== selectedFolder) return false;
    if (chatSearch.trim() && !c.chatName.toLowerCase().includes(chatSearch.toLowerCase())) return false;
    return true;
  });

  const formatMessageDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('uz-UZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getAvatarInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  return (
    <div className="w-full bg-[#0e1621] text-slate-100 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Top Telegram Bar */}
      <div className="bg-[#17212b] px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-glowCyan">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide font-mono flex items-center gap-2">
              TELEGRAM WEB INTERFACE
              <span className="px-2 py-0.5 text-[9px] font-sans font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full">
                Authentic 2-Way View
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Kirim va chiqim xabarlarini Telegram uslubida ko'rish hamda muloqot qilish
            </p>
          </div>
        </div>

        {/* Global HUD Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1 rounded-lg bg-[#202b36] border border-white/10 text-sky-300">
            💬 <span className="font-bold">{totalMessagesCount.toLocaleString()}</span> xabar
          </div>
          <div className="px-3 py-1 rounded-lg bg-[#202b36] border border-white/10 text-purple-300">
            👥 <span className="font-bold">{totalChatsCount.toLocaleString()}</span> chat
          </div>
        </div>
      </div>

      {/* Main Telegram Workspace (2 Columns) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Column: Telegram Sidebar (Chat List) ────────────────── */}
        <div className="w-80 md:w-96 bg-[#17212b] border-r border-white/10 flex flex-col shrink-0">
          {/* Chat Search Box */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Chatlardan qidirish..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#0e1621] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/60"
              />
            </div>
          </div>

          {/* Chat Folder Tabs */}
          <div className="flex items-center px-2 py-2 border-b border-white/10 gap-1 overflow-x-auto text-[11px] font-mono text-slate-400">
            {[
              { id: 'ALL', label: `💬 Barchasi (${chats.length})` },
              { id: 'PERSONAL', label: `👤 Shaxsiy (${chats.filter((c) => c.chatType === 'PERSONAL').length})` },
              { id: 'CHANNEL', label: `📢 Kanallar (${chats.filter((c) => c.chatType === 'CHANNEL').length})` },
              { id: 'GROUP', label: `👥 Guruhlar (${chats.filter((c) => c.chatType === 'GROUP').length})` },
              { id: 'BOT', label: `🤖 Botlar (${chats.filter((c) => c.chatType === 'BOT').length})` },
              { id: 'SAVED', label: `🔖 Saqlanganlar (${chats.filter((c) => c.chatType === 'SAVED').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 whitespace-nowrap text-[10px] ${
                  selectedFolder === f.id ? 'bg-[#2b5278] text-white font-bold shadow-md' : 'hover:bg-[#202b36] text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Chat List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredChats.map((c, idx) => {
              const isSelected = selectedChat === c.chatName;
              const initials = getAvatarInitials(c.chatName);
              const avatarBg = getAvatarColor(c.chatName);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedChat(c.chatName)}
                  className={`w-full p-3 text-left transition flex items-center gap-3 ${
                    isSelected ? 'bg-[#2b5278] text-white' : 'hover:bg-[#202b36] text-slate-200'
                  }`}
                >
                  {/* Circle Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md`}
                  >
                    {initials}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs truncate max-w-[170px]">{c.chatName}</h4>
                      <span className="text-[10px] font-mono opacity-60">Telegram</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-70">
                      <span className="truncate">So'nggi xabarlar va resurslar</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-sky-500/30 text-sky-200 font-mono text-[9px] font-bold">
                        {c.count > 999 ? `${(c.count / 1000).toFixed(1)}k` : c.count}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Column: Telegram Main Active Chat Screen ───────────── */}
        <div className="flex-1 bg-[#0e1621] flex flex-col overflow-hidden relative">
          {/* Active Chat Top Header */}
          <div className="bg-[#17212b] px-4 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                  selectedChat === 'ALL' ? 'Telegram' : selectedChat
                )} text-white font-bold text-xs flex items-center justify-center shadow-md`}
              >
                {getAvatarInitials(selectedChat === 'ALL' ? 'Telegram' : selectedChat)}
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">
                  {selectedChat === 'ALL' ? 'Barcha Telegram Chatlar' : selectedChat}
                </h3>
                <p className="text-[10px] text-sky-400 font-mono">
                  {loading ? 'Yuklanmoqda...' : `${messages.length} ta xabar • Online`}
                </p>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Xabardan qidirish..."
                  className="w-40 h-7 pl-7 pr-2 text-[11px] bg-[#0e1621] border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/60"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0e1621] p-0.5 rounded-lg border border-white/10 text-[10px]">
                {[
                  { id: 'ALL', label: 'Barchasi' },
                  { id: 'link', label: '🔗 Havolalar' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMediaFilter(m.id)}
                    className={`px-2 py-0.5 rounded font-semibold transition ${
                      mediaFilter === m.id ? 'bg-[#2b5278] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Messages Stream Feed (Telegram Bubbles) ────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#182533_1px,transparent_1px)] [background-size:16px_16px]">
            {loading ? (
              <div className="p-12 text-center text-xs text-sky-400 font-mono">
                Telegram xabarlari yuklanmoqda...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                Ushbu mezon bo'yicha Telegram xabarlari topilmadi.
              </div>
            ) : (
              messages.map((m) => {
                const isOut = m.isOutgoing || m.fromName === 'Siz';
                const urls = m.text.match(/https?:\/\/[^\s]+/g);
                const isSaved = savedMsgId === m.id;
                const senderDisplay = m.fromName || (isOut ? 'Siz' : m.chatName);

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`max-w-xl p-3 space-y-2 relative group shadow-md transition ${
                        isOut
                          ? 'bg-[#2b5278] text-white rounded-[16px_16px_4px_16px] border border-sky-400/20'
                          : 'bg-[#182533] text-slate-100 rounded-[16px_16px_16px_4px] border border-white/10'
                      }`}
                    >
                      {/* Sender Name */}
                      <div className="flex items-center justify-between gap-4 text-[10px] font-bold font-mono">
                        <span className={isOut ? 'text-sky-300' : 'text-purple-400'}>
                          {isOut ? '🟢 Siz (Me)' : `👤 ${senderDisplay}`}
                        </span>
                        <span className="opacity-75 text-[9px] font-mono">
                          {formatMessageDate(m.date || m.createdAt)}
                        </span>
                      </div>

                      {/* Message Content Text */}
                      <p className="text-xs whitespace-pre-wrap leading-relaxed font-sans">
                        {m.text}
                      </p>

                      {/* Attached Links */}
                      {urls && urls.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {urls.map((u, i) => (
                            <a
                              key={i}
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 hover:bg-black/40 text-sky-200 text-[11px] font-mono transition border border-white/10"
                            >
                              <Link2 className="w-3 h-3 text-sky-300 shrink-0" />
                              <span className="truncate max-w-xs">{u}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Bottom Footer Action Inside Bubble */}
                      <div className="pt-1 flex items-center justify-between text-[9px] opacity-75 border-t border-white/10 mt-1">
                        <span className="font-mono uppercase px-1.5 py-0.2 rounded bg-black/20 text-slate-300">
                          {m.paraCategory}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveToBrain(m)}
                            className="hover:text-amber-300 transition flex items-center gap-1 font-bold"
                          >
                            {isSaved ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Saqlandi
                              </span>
                            ) : (
                              <span className="text-sky-300 hover:underline flex items-center gap-0.5">
                                <FolderPlus className="w-3 h-3" /> + Brain Note
                              </span>
                            )}
                          </button>

                          {isOut && <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Bottom Telegram Message Input Bar ──────────────────────── */}
          <form
            onSubmit={handleSendMessage}
            className="bg-[#17212b] p-3 border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#202b36] transition"
              title="Fayl biriktirish"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`${selectedChat === 'ALL' ? 'Telegram' : selectedChat} chatiga xabar yozish...`}
              className="flex-1 h-10 px-4 text-xs bg-[#0e1621] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/60 font-sans"
            />

            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-glowCyan transition active:scale-95 disabled:opacity-40"
              title="Xabarni yuborish"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
