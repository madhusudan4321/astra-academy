'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Scroll } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ParticleField from '@/components/ParticleField';
import TorchFlame from '@/components/TorchFlame';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Welcome to Astra Academy, Scholar!');
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'radial-gradient(ellipse at center, #0f0a1e 0%, #050308 100%)' }}
    >
      <ParticleField />

      {/* Grid texture */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(201,162,39,0.02) 40px, rgba(201,162,39,0.02) 41px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(201,162,39,0.02) 40px, rgba(201,162,39,0.02) 41px)`,
        }}
      />

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
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

          <div className="px-8 pt-8 pb-7 md:px-10 md:pt-9 md:pb-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-5"
            >
              <div
                className="w-18 h-18 rounded-full flex items-center justify-center"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'radial-gradient(circle, rgba(201,162,39,0.15) 0%, rgba(74,29,110,0.2) 100%)',
                  border: '2px solid rgba(201,162,39,0.4)',
                  boxShadow: '0 0 30px rgba(201,162,39,0.2), inset 0 0 20px rgba(201,162,39,0.05)',
                }}
              >
                <Scroll className="w-7 h-7" style={{ color: 'var(--astra-gold)' }} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <h1 className="font-fantasy text-3xl font-bold text-gold-gradient mb-2">
                REQUEST ENTRY
              </h1>
              <div className="divider-gold my-3" />
              <p className="font-serif-italic text-base italic" style={{ color: 'var(--astra-text-muted)' }}>
                Sign the arcane register to begin your journey
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--astra-text-muted)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--astra-gold-dim)', minWidth: '16px' }}
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 16px 11px 40px' }}
                    required
                  />
                </div>
              </div>

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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 16px 11px 40px' }}
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 44px 11px 40px' }}
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--astra-text-muted)' }}>
                  Confirm Password
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '11px 44px 11px 40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-yellow-500"
                    style={{ color: 'var(--astra-text-dim)' }}
                  >
                    {showConfirmPassword ? (
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

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ padding: '13px 16px', marginTop: '8px' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Inscribing Name...
                    </>
                  ) : (
                    <>
                      <Scroll className="w-4 h-4" />
                      Join the Academy
                    </>
                  )}
                </span>
              </motion.button>

              <p className="text-center text-sm" style={{ color: 'var(--astra-text-muted)' }}>
                Already a Scholar?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--astra-gold)' }}>
                  Enter the Gate
                </Link>
              </p>
            </motion.form>
          </div>

          <div className="h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-5 text-xs font-fantasy tracking-widest"
          style={{ color: 'var(--astra-text-dim)' }}
        >
          ✦ YOUR KNOWLEDGE AWAITS ✦
        </motion.p>
      </motion.div>
    </div>
  );
}
