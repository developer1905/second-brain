'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MindAnalyzerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-mono text-sm">
      AI Chatbot-ga yo'naltirilmoqda...
    </div>
  );
}
