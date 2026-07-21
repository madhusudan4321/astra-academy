'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0f0a1e 0%, #050308 100%)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        <p className="font-fantasy text-sm tracking-widest" style={{ color: 'var(--astra-text-dim)' }}>
          AWAKENING...
        </p>
      </div>
    </div>
  );
}
