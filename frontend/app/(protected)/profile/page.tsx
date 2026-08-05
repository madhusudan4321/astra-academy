'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import {
  User, Mail, Calendar, BookOpen, Shield, Edit3,
  Save, Lock, Eye, EyeOff, Crown, Loader2, CheckCircle
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
  purchasedCourses: number;
  joinedAt: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await userAPI.getProfile();
        setProfile(res.data.user);
        setNameValue(res.data.user.name);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    try {
      await userAPI.updateProfile({ name: nameValue.trim() });
      setProfile((prev) => prev ? { ...prev, name: nameValue.trim() } : prev);
      setEditingName(false);
      await refreshUser();
      toast.success('Name updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-fantasy text-sm tracking-widest" style={{ color: 'var(--astra-text-dim)' }}>
            LOADING PROFILE...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-fantasy text-3xl md:text-4xl font-bold text-gold-gradient mb-2">
          Your Profile
        </h1>
        <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
          Manage your identity within the Academy.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Profile Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="glass-card rounded-2xl p-7 text-center">
            {/* Avatar */}
            <div className="mx-auto mb-5">
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold relative"
                style={{
                  background: 'linear-gradient(135deg, #c9a227, #7a6018)',
                  color: '#050308',
                  boxShadow: '0 0 30px rgba(201,162,39,0.3)',
                }}
              >
                {profile.name.charAt(0).toUpperCase()}
                {/* Role badge */}
                {profile.role === 'admin' && (
                  <div
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #4a1d6e, #6b2d9e)',
                      border: '2px solid var(--astra-deep)',
                    }}
                  >
                    <Crown className="w-4 h-4" style={{ color: '#e8c547' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <h2 className="font-fantasy text-lg font-bold mb-1" style={{ color: 'var(--astra-text)' }}>
              {profile.name}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--astra-text-muted)' }}>
              {profile.email}
            </p>

            {/* Role */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-5"
              style={{
                background: profile.role === 'admin' ? 'rgba(74,29,110,0.2)' : 'rgba(201,162,39,0.1)',
                border: `1px solid ${profile.role === 'admin' ? 'rgba(74,29,110,0.4)' : 'rgba(201,162,39,0.2)'}`,
                color: profile.role === 'admin' ? '#a78bfa' : 'var(--astra-gold)',
              }}
            >
              <Shield className="w-3 h-3" />
              {profile.role}
            </div>

            {/* Divider */}
            <div className="divider-gold mb-5" />

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.15)' }}>
                  <BookOpen className="w-4 h-4" style={{ color: 'var(--astra-gold-dim)' }} />
                </div>
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'var(--astra-text-dim)' }}>Courses Enrolled</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--astra-text)' }}>{profile.purchasedCourses}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.15)' }}>
                  <Calendar className="w-4 h-4" style={{ color: 'var(--astra-gold-dim)' }} />
                </div>
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'var(--astra-text-dim)' }}>Member Since</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--astra-text)' }}>{formatDate(profile.joinedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Right: Settings Forms ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Edit Name */}
          <div className="glass-card rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4" style={{ color: 'var(--astra-gold)' }} />
              <h3 className="font-fantasy text-sm font-bold" style={{ color: 'var(--astra-text)' }}>
                Personal Information
              </h3>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
                  Display Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    disabled={!editingName}
                    className="input-fantasy flex-1 rounded-xl text-sm disabled:opacity-50"
                    style={{ padding: '10px 14px' }}
                  />
                  {editingName ? (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="btn-primary rounded-xl px-4 py-2 text-xs disabled:opacity-60"
                      >
                        <span className="flex items-center gap-1.5">
                          {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save
                        </span>
                      </motion.button>
                      <button
                        onClick={() => { setEditingName(false); setNameValue(profile.name); }}
                        className="px-3 py-2 rounded-xl text-xs transition-colors"
                        style={{ color: 'var(--astra-text-muted)', border: '1px solid var(--astra-border)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingName(true)}
                      className="px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                      style={{
                        background: 'rgba(201,162,39,0.08)',
                        border: '1px solid rgba(201,162,39,0.2)',
                        color: 'var(--astra-gold)',
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="input-fantasy flex-1 rounded-xl text-sm opacity-50 cursor-not-allowed"
                    style={{ padding: '10px 14px' }}
                  >
                    {profile.email}
                  </div>
                  <div className="px-3 py-2 rounded-xl text-[10px] font-medium"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                    Verified
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="glass-card rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-4 h-4" style={{ color: 'var(--astra-gold)' }} />
              <h3 className="font-fantasy text-sm font-bold" style={{ color: 'var(--astra-text)' }}>
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '10px 44px 10px 14px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-yellow-500"
                    style={{ color: 'var(--astra-text-dim)' }}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input-fantasy w-full rounded-xl text-sm"
                    style={{ padding: '10px 44px 10px 14px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-yellow-500"
                    style={{ color: 'var(--astra-text-dim)' }}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input-fantasy w-full rounded-xl text-sm"
                  style={{ padding: '10px 14px' }}
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: 'var(--astra-fire)' }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary rounded-xl px-6 py-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {savingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
