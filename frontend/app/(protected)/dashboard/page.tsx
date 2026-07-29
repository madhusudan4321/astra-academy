'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { courseAPI } from '@/lib/api';
import { BookOpen, Trophy, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

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
    { label: 'Enrolled Tomes', value: courses.length, icon: BookOpen, color: '#c9a227' },
    { label: 'Lessons Mastered', value: completedLessons, icon: Trophy, color: '#e8c547' },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: TrendingUp, color: '#a07820' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(74,29,110,0.15) 50%, rgba(201,162,39,0.08) 100%)',
          border: '1px solid rgba(201,162,39,0.2)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(201,162,39,0.5) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--astra-gold)' }} />
            <span className="text-xs font-fantasy tracking-widest uppercase" style={{ color: 'var(--astra-gold-dim)' }}>
              Welcome Back
            </span>
          </div>
          <h1 className="font-fantasy text-3xl md:text-4xl font-bold text-gold-gradient mb-2">
            {user?.name || 'Scholar'}
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--astra-text-muted)' }}>
            {courses.length > 0
              ? 'Continue your journey through the halls of knowledge.'
              : 'Your journey begins here. Explore the Grand Library to find your first tome.'}
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--astra-text-muted)' }}>
                  {stat.label}
                </span>
              </div>
              <p className="font-fantasy text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Enrolled Courses */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-fantasy text-xl font-bold" style={{ color: 'var(--astra-text)' }}>
          Your Tomes
        </h2>
        <Link href="/courses" className="flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--astra-gold)' }}>
          Browse Library <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <div className="skeleton h-40 w-full" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
            <BookOpen className="w-9 h-9" style={{ color: 'var(--astra-gold-dim)' }} />
          </div>
          <h3 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
            No Tomes Acquired Yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--astra-text-muted)' }}>
            Visit the Grand Library to discover courses and begin your journey.
          </p>
          <Link href="/courses">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary rounded-xl px-8 py-3 text-sm">
              <span>Explore the Library</span>
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link href={`/courses/${course.id}`}>
                <div className="glass-card rounded-xl overflow-hidden group hover:border-yellow-600/30 transition-all cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1a1523, #0a0610)' }}>
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12" style={{ color: 'var(--astra-gold-dim)' }} />
                      </div>
                    )}
                    {/* Progress badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: course.completionPercentage === 100
                          ? 'rgba(34,197,94,0.9)' : 'rgba(201,162,39,0.9)',
                        color: '#050308',
                      }}>
                      {course.completionPercentage}%
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-fantasy text-sm font-bold mb-2 line-clamp-1" style={{ color: 'var(--astra-text)' }}>
                      {course.title}
                    </h3>
                    <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--astra-text-muted)' }}>
                      {course.shortDescription}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--astra-text-dim)' }}>
                          {course.completedLessons} / {course.totalLessons} lessons
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'var(--astra-stone)' }}>
                        <div className="progress-bar h-full" style={{ width: `${course.completionPercentage}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--astra-gold)' }}>
                      Continue <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
