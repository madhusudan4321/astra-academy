'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Feather } from 'lucide-react';
import { authAPI } from '@/lib/api';
import ParticleField from '@/components/ParticleField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset instructions sent!');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0f0a1e 0%, #050308 100%)' }}>

      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="absolute -inset-0.5 rounded-2xl animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, rgba(201,162,39,0.3), rgba(74,29,110,0.3), rgba(201,162,39,0.3))' }}
        />

        <div className="relative rounded-2xl overflow-hidden glass-card">
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

          <div className="p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(201,162,39,0.15) 0%, rgba(74,29,110,0.2) 100%)',
                  border: '2px solid rgba(201,162,39,0.4)',
                  boxShadow: '0 0 30px rgba(201,162,39,0.2)',
                }}
              >
                <Feather className="w-8 h-8" style={{ color: 'var(--astra-gold)' }} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="font-fantasy text-2xl font-bold text-gold-gradient mb-2">
                FORGOTTEN WORDS
              </h1>
              <div className="divider-gold my-3" />
              <p className="font-serif-italic italic text-sm" style={{ color: 'var(--astra-text-muted)' }}>
                {sent
                  ? 'The scroll has been dispatched to your address'
                  : 'We shall send the incantation to restore your passage'}
              </p>
            </div>

            {sent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,162,39,0.15)', border: '2px solid rgba(201,162,39,0.4)' }}>
                  <Mail className="w-8 h-8" style={{ color: 'var(--astra-gold)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
                  Check your email for reset instructions. The link expires in 15 minutes.
                </p>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="btn-primary w-full py-3.5 rounded-xl text-sm"
                  >
                    <span className="relative z-10">Return to Gate</span>
                  </motion.button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--astra-text-muted)' }}>
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--astra-gold-dim)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-fantasy w-full py-3 pl-10 pr-4 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending Scroll...
                      </>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </span>
                </motion.button>

                <Link href="/login"
                  className="flex items-center justify-center gap-2 text-sm transition-colors hover:underline"
                  style={{ color: 'var(--astra-text-muted)' }}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </form>
            )}
          </div>
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}
