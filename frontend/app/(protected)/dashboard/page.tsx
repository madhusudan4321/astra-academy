'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { courseAPI } from '@/lib/api';
import { BookOpen, Trophy, TrendingUp, Sparkles, ArrowRight, GraduationCap, Flame } from 'lucide-react';

interface MyCourse {
  id: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  lastWatchedLessonId?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await courseAPI.getMy();
        setCourses(res.data.courses || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const completedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0);
  const avgProgress = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + c.completionPercentage, 0) / courses.length)
    : 0;

  const stats = [
    { label: 'Enrolled Tomes', value: courses.length, icon: BookOpen, color: '#c9a227', glow: 'rgba(201,162,39,0.15)' },
    { label: 'Lessons Mastered', value: completedLessons, icon: Trophy, color: '#e8c547', glow: 'rgba(232,197,71,0.15)' },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: TrendingUp, color: '#a07820', glow: 'rgba(160,120,32,0.15)' },
  ];

  return (
    <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-10 md:p-14"
        style={{
          background: 'linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(74,29,110,0.18) 50%, rgba(201,162,39,0.08) 100%)',
          border: '1px solid rgba(201,162,39,0.2)',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(201,162,39,0.6) 0%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--astra-gold)' }} />
            <span className="text-xs font-fantasy tracking-[0.2em] uppercase" style={{ color: 'var(--astra-gold-dim)' }}>
              Welcome Back
            </span>
          </div>
          <h1 className="font-fantasy text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
            {user?.name || 'Scholar'}
          </h1>
          <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
            {courses.length > 0
              ? 'Continue your journey through the halls of knowledge. Your tomes await.'
              : 'Your journey begins here. Explore the Grand Library to find your first tome.'}
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1), duration: 0.5 }}
              className="glass-card rounded-2xl p-7 relative overflow-hidden"
            >
              {/* Subtle glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-40"
                style={{ background: `radial-gradient(circle, ${stat.glow}, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                    <Icon className="w-5.5 h-5.5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--astra-text-muted)' }}>
                    {stat.label}
                  </span>
                </div>
                <p className="font-fantasy text-4xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enrolled Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <GraduationCap className="w-5 h-5" style={{ color: 'var(--astra-gold)' }} />
            </div>
            <h2 className="font-fantasy text-2xl font-bold" style={{ color: 'var(--astra-text)' }}>
              Your Tomes
            </h2>
          </div>
          <Link href="/courses"
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all hover:scale-105"
            style={{
              color: 'var(--astra-gold)',
              background: 'rgba(201,162,39,0.08)',
              border: '1px solid rgba(201,162,39,0.2)',
            }}>
            Browse Library <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <div className="skeleton h-52 w-full" />
                <div className="p-7 space-y-4">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-2 w-full rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-16 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
              <BookOpen className="w-10 h-10" style={{ color: 'var(--astra-gold-dim)' }} />
            </div>
            <h3 className="font-fantasy text-2xl font-bold mb-3" style={{ color: 'var(--astra-text)' }}>
              No Tomes Acquired Yet
            </h3>
            <p className="text-base mb-8 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
              Visit the Grand Library to discover courses and begin your journey toward mastery.
            </p>
            <Link href="/courses">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-primary rounded-xl px-10 py-4 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Explore the Library
                </span>
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.5 }}
              >
                <Link href={`/courses/${course.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden group hover:border-yellow-600/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(201,162,39,0.08)]">
                    {/* Thumbnail */}
                    <div className="relative h-52 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #1a1523, #0a0610)' }}>
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-14 h-14" style={{ color: 'var(--astra-gold-dim)' }} />
                        </div>
                      )}
                      {/* Progress badge */}
                      <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm"
                        style={{
                          background: course.completionPercentage === 100
                            ? 'rgba(34,197,94,0.9)' : 'rgba(201,162,39,0.9)',
                          color: '#050308',
                        }}>
                        {course.completionPercentage === 100 ? '✓ Complete' : `${course.completionPercentage}%`}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-7">
                      <h3 className="font-fantasy text-lg font-bold mb-2.5 line-clamp-1" style={{ color: 'var(--astra-text)' }}>
                        {course.title}
                      </h3>
                      <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
                        {course.shortDescription}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-2">
                          <span style={{ color: 'var(--astra-text-dim)' }}>
                            {course.completedLessons} / {course.totalLessons} lessons
                          </span>
                          <span style={{ color: 'var(--astra-gold-dim)' }}>
                            {course.completionPercentage}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: 'var(--astra-stone)' }}>
                          <div className="progress-bar h-full" style={{ width: `${course.completionPercentage}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
                        style={{ color: 'var(--astra-gold)' }}>
                        <Flame className="w-4 h-4" />
                        Continue Learning <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
