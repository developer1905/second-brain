'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { QuickCaptureModal } from '@/components/QuickCaptureModal';
import { TelegramWebAppInit } from '@/components/TelegramWebAppInit';
import { MobileNav } from '@/components/MobileNav';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }

    // Global Ctrl+K shortcut for Quick Capture
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <>
      <TelegramWebAppInit />

      {/* Top Header — fixed height 64px */}
      <Header
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main App Body */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
        {/* Desktop Sidebar — hidden on mobile */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Page Content — scrollable */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden
                     p-2 sm:p-3 md:p-5 lg:p-6
                     pb-[72px] md:pb-5
                     transition-all duration-300"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar — only visible on mobile */}
      {mounted && (
        <MobileNav onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />
      )}

      {/* Quick Capture Modal — router.refresh() instead of window.location.reload() */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
