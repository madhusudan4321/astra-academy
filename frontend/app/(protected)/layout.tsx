'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, BookOpen, User, LogOut, Menu, X, Crown, ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Sanctum', icon: LayoutDashboard },
  { href: '/courses', label: 'Grand Library', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--astra-deep)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-fantasy text-sm tracking-widest" style={{ color: 'var(--astra-text-dim)' }}>
            ENTERING SANCTUM...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo area */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)' }}>
            <svg width="18" height="21" viewBox="0 0 40 46" fill="none">
              <path d="M20 2L3 9V22C3 32.5 10.5 42.2 20 44C29.5 42.2 37 32.5 37 22V9L20 2Z"
                stroke="#c9a227" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(201,162,39,0.1)" />
              <text x="14" y="26" fontSize="14" fill="#c9a227" fontFamily="serif" fontWeight="bold">A</text>
            </svg>
          </div>
          <span className="font-fantasy text-sm font-bold text-gold-gradient">
            {isMobile ? 'ASTRA' : 'ASTRA ACADEMY'}
          </span>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-yellow-600/60 hover:text-yellow-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="mx-4 mb-6 p-3 rounded-xl"
        style={{ background: 'rgba(201,162,39,0.05)', border: '1px solid rgba(201,162,39,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #c9a227, #7a6018)', color: '#050308' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--astra-text)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--astra-text-dim)' }}>{user.email}</p>
          </div>
          {user.role === 'admin' && (
            <Crown className="w-4 h-4 shrink-0" style={{ color: 'var(--astra-gold)' }} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(201,162,39,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 shrink-0 transition-colors"
                  style={{ color: active ? 'var(--astra-gold)' : 'var(--astra-text-dim)' }} />
                <span className="text-sm font-medium transition-colors"
                  style={{ color: active ? 'var(--astra-text)' : 'var(--astra-text-muted)' }}>
                  {item.label}
                </span>
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto" style={{ color: 'var(--astra-gold)' }} />
                )}
              </motion.div>
            </Link>
          );
        })}

        {user.role === 'admin' && (
          <>
            <div className="divider-gold my-3" />
            <Link href="/admin" onClick={() => setSidebarOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive('/admin') ? 'rgba(201,162,39,0.12)' : 'transparent',
                  border: isActive('/admin') ? '1px solid rgba(201,162,39,0.2)' : '1px solid transparent',
                }}
              >
                <Crown className="w-4 h-4" style={{ color: isActive('/admin') ? 'var(--astra-gold)' : 'var(--astra-text-dim)' }} />
                <span className="text-sm font-medium" style={{ color: isActive('/admin') ? 'var(--astra-text)' : 'var(--astra-text-muted)' }}>
                  Admin Panel
                </span>
              </motion.div>
            </Link>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 mt-auto">
        <div className="divider-gold mb-4" />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-red-500/10 group"
        >
          <LogOut className="w-4 h-4 transition-colors group-hover:text-red-400" style={{ color: 'var(--astra-text-dim)' }} />
          <span className="text-sm transition-colors group-hover:text-red-400" style={{ color: 'var(--astra-text-muted)' }}>
            {loggingOut ? 'Departing...' : 'Leave Academy'}
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--astra-deep)' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 z-30 w-64 flex-shrink-0 flex flex-col lg:hidden"
        style={{
          background: 'linear-gradient(180deg, #0d0917 0%, #080512 100%)',
          borderRight: '1px solid rgba(201,162,39,0.12)',
        }}
      >
        <SidebarContent isMobile />
      </motion.aside>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #0d0917 0%, #080512 100%)',
          borderRight: '1px solid rgba(201,162,39,0.12)',
          minHeight: '100vh',
        }}
      >
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b"
          style={{ borderColor: 'rgba(201,162,39,0.12)', background: '#080512' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--astra-gold)' }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-fantasy text-sm font-bold text-gold-gradient">ASTRA ACADEMY</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="page-enter h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
