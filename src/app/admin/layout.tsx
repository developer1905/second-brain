// Admin pages have their own full-screen layout (no main app Sidebar/Header)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
