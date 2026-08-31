'use client';

import React, { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

export function TelegramWebAppInit() {
  const [tgUser, setTgUser] = useState<{
    id: number;
    first_name: string;
    username?: string;
  } | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loginUser = useCallback((u: any) => {
    fetch('/api/auth/telegram-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        username: u.username,
      }),
    })
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));
  }, []);

  // Ping health endpoint every 25 seconds to keep connection alive & active
  useEffect(() => {
    const pingHealth = () => {
      fetch('/api/health')
        .then((res) => {
          if (res.ok) setIsOnline(true);
          else setIsOnline(false);
        })
        .catch(() => setIsOnline(false));
    };

    const interval = setInterval(pingHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      try {
        tg.expand();
        tg.setHeaderColor('#090d16');
        tg.setBackgroundColor('#090d16');
      } catch (e) {
        // Ignore if unsupported in older client
      }

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setIsTelegram(true);
        setTgUser(u);
        loginUser(u);

        // Visibility change listener to handle app wake up
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            loginUser(u);
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
      }
    }
  }, [loginUser]);

  if (!isTelegram || !tgUser) return null;

  return (
    <div className="bg-slate-950/90 border-b border-cyan-500/20 px-3 py-1 text-xs flex items-center justify-between text-cyan-300 backdrop-blur-md z-40">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
          )}
        </span>
        <span className="font-medium truncate max-w-[220px]">
          Telegram Mini App • <strong>{tgUser.first_name}</strong> {tgUser.username ? `(@${tgUser.username})` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
          {isOnline ? '⚡ 24/7 ONLINE' : '⚠️ RECONNECTING'}
        </span>
      </div>
    </div>
  );
}

