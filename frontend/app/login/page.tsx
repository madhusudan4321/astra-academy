'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ParticleField from '@/components/ParticleField';
import TorchFlame from '@/components/TorchFlame';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    setMounted(true);
    if (user) {
      router.replace(redirect);
    }
  }, [user, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, Scholar!');
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'The gates remain sealed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'radial-gradient(ellipse at center, #0f0a1e 0%, #050308 100%)' }}
    >
      <ParticleField />

      {/* Grid texture overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg, transparent, transparent 40px,
            rgba(201,162,39,0.02) 40px, rgba(201,162,39,0.02) 41px
          ), repeating-linear-gradient(
            90deg, transparent, transparent 40px,
            rgba(201,162,39,0.02) 40px, rgba(201,162,39,0.02) 41px
          )`,
        }}
      />

      {/* Castle silhouette */}
      <div className="fixed inset-0 z-0 flex items-end justify-center overflow-hidden pointer-events-none" style={{ opacity: 0.06 }}>
        <svg viewBox="0 0 1200 600" className="w-full" fill="rgba(201,162,39,0.8)">
          <rect x="0" y="200" width="80" height="400" />
          <rect x="80" y="280" width="40" height="320" />
          <rect x="120" y="200" width="80" height="400" />
          <rect x="200" y="350" width="200" height="250" />
          <rect x="350" y="100" width="100" height="500" />
          <rect x="340" y="80" width="20" height="40" />
          <rect x="370" y="80" width="20" height="40" />
          <rect x="400" y="80" width="20" height="40" />
          <rect x="430" y="80" width="20" height="40" />
          <rect x="450" y="200" width="300" height="400" />
          <path d="M 450 200 Q 600 80 750 200 Z" />
          <ellipse cx="600" cy="320" rx="80" ry="120" fill="#050308" />
          <rect x="750" y="100" width="100" height="500" />
          <rect x="750" y="80" width="20" height="40" />
          <rect x="780" y="80" width="20" height="40" />
          <rect x="810" y="80" width="20" height="40" />
          <rect x="840" y="80" width="20" height="40" />
          <rect x="850" y="350" width="200" height="250" />
          <rect x="1000" y="200" width="80" height="400" />
          <rect x="1080" y="280" width="40" height="320" />
          <rect x="1120" y="200" width="80" height="400" />
          <ellipse cx="400" cy="200" rx="15" ry="25" fill="#050308" />
          <ellipse cx="800" cy="200" rx="15" ry="25" fill="#050308" />
        </svg>
      </div>

      {/* Torches */}
      <div className="fixed left-8 top-1/3 z-10 hidden lg:block">
        <TorchFlame />
      </div>
      <div className="fixed right-8 top-1/3 z-10 hidden lg:block">
        <TorchFlame />
      </div>

      {/* Ground mist */}
      <div
        className="fixed bottom-0 inset-x-0 h-40 z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(74,29,110,0.12) 0%, transparent 100%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card border glow */}
        <div
          className="absolute -inset-0.5 rounded-2xl animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(201,162,39,0.3), rgba(74,29,110,0.3), rgba(201,162,39,0.3))',
          }}
        />

        <div className="relative rounded-2xl overflow-hidden glass-card">
          {/* Top decorative strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

          <div className="px-8 pt-8 pb-7 md:px-10 md:pt-10 md:pb-9">
            {/* Emblem */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-5"
            >
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(201,162,39,0.15) 0%, rgba(74,29,110,0.2) 100%)',
                    border: '2px solid rgba(201,162,39,0.4)',
                    boxShadow: '0 0 30px rgba(201,162,39,0.2), inset 0 0 20px rgba(201,162,39,0.05)',
                  }}
                >
                  <svg width="40" height="46" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 2L3 9V22C3 32.5 10.5 42.2 20 44C29.5 42.2 37 32.5 37 22V9L20 2Z"
                      fill="none"
                      stroke="#c9a227"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 8L8 13V22C8 29 13 36.5 20 38.5C27 36.5 32 29 32 22V13L20 8Z"
                      fill="rgba(201,162,39,0.1)"
                      stroke="#c9a227"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                    <text x="14" y="26" fontSize="12" fill="#c9a227" fontFamily="serif" fontWeight="bold">A</text>
                  </svg>
                </div>
                {/* Orbit ring */}
                <div
                  className="absolute inset-0 rounded-full border border-yellow-600/20 animate-spin"
                  style={{ animationDuration: '8s' }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-7"
            >
              <h1 className="font-fantasy text-3xl md:text-4xl font-bold text-gold-gradient mb-2">
                ASTRA ACADEMY
              </h1>
              <div className="divider-gold my-3" />
              <p className="font-serif-italic text-base italic" style={{ color: 'var(--astra-text-muted)' }}>
                Speak the truth and the gates shall open
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--astra-text-muted)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--astra-gold-dim)', minWidth: '16px' }}
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 16px 11px 40px' }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--astra-text-muted)' }}>
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--astra-gold-dim)', minWidth: '16px' }}
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 44px 11px 40px' }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-yellow-500"
                    style={{ color: 'var(--astra-text-dim)' }}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" x2="23" y1="1" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: 'var(--astra-gold-dim)' }}
                >
                  Forgot the incantation?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full rounded-xl text-sm relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ padding: '13px 16px' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Opening Gates...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Enter the Academy
                    </>
                  )}
                </span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="divider-gold flex-1" />
                <span className="text-xs" style={{ color: 'var(--astra-text-dim)' }}>OR</span>
                <div className="divider-gold flex-1" />
              </div>

              {/* Register link */}
              <p className="text-center text-sm" style={{ color: 'var(--astra-text-muted)' }}>
                New to the Academy?{' '}
                <Link
                  href="/register"
                  className="font-medium transition-colors hover:underline"
                  style={{ color: 'var(--astra-gold)' }}
                >
                  Request Entry
                </Link>
              </p>
            </motion.form>
          </div>

          {/* Bottom decorative strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
        </div>

        {/* Seal text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-5 text-xs font-fantasy tracking-widest"
          style={{ color: 'var(--astra-text-dim)' }}
        >
          ✦ SEALED BY THE ANCIENT PACT ✦
        </motion.p>
      </motion.div>
    </div>
  );
}
