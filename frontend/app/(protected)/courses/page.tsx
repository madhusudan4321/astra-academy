'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { courseAPI, purchaseAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Search, Clock, Layers, Tag, ArrowRight, CheckCircle, Loader2, ShoppingCart, Sparkles, Library } from 'lucide-react';

/* global Razorpay type for TypeScript */
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CourseItem {
  id: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  totalLessons: number;
  totalDuration: number;
  tags: string[];
  hasPurchased: boolean;
  createdAt: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buyingCourseId, setBuyingCourseId] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data.courses || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const handleBuy = async (course: CourseItem) => {
    if (buyingCourseId) return; // Prevent double-clicks
    setBuyingCourseId(course.id);

    try {
      const res = await purchaseAPI.createOrder(course.id);
      const data = res.data;

      // Handle free courses — no Razorpay needed
      if (data.free) {
        toast.success('Course unlocked! 🎉');
        await fetchCourses();
        setBuyingCourseId(null);
        return;
      }

      // Ensure Razorpay SDK is loaded
      if (!window.Razorpay) {
        toast.error('Payment system is loading. Please try again.');
        setBuyingCourseId(null);
        return;
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Astra Academy',
        description: course.title,
        order_id: data.order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#c9a227',
          backdrop_color: 'rgba(5,3,8,0.85)',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await purchaseAPI.verify(response);
            toast.success('Payment successful! Course unlocked 🎉');
            await fetchCourses();
          } catch {
            toast.error('Payment verification failed. Contact support if amount was deducted.');
          } finally {
            setBuyingCourseId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setBuyingCourseId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        setBuyingCourseId(null);
      });
      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const detail = err?.response?.data?.error;
      if (msg === 'Already purchased') {
        toast.success('You already own this course!');
        await fetchCourses();
      } else {
        toast.error(detail || msg || 'Failed to initiate payment');
      }
      setBuyingCourseId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-10 md:p-14"
        style={{
          background: 'linear-gradient(135deg, rgba(201,162,39,0.10) 0%, rgba(74,29,110,0.12) 50%, rgba(201,162,39,0.06) 100%)',
          border: '1px solid rgba(201,162,39,0.15)',
        }}
      >
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(201,162,39,0.5) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Library className="w-5 h-5" style={{ color: 'var(--astra-gold)' }} />
              <span className="text-xs font-fantasy tracking-[0.2em] uppercase" style={{ color: 'var(--astra-gold-dim)' }}>
                Knowledge Awaits
              </span>
            </div>
            <h1 className="font-fantasy text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
              The Grand Library
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
              Discover ancient tomes of knowledge. Each course is a gateway to mastery.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--astra-text-dim)' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--astra-gold-dim)' }} />
            <span>{courses.length} {courses.length === 1 ? 'course' : 'courses'} available</span>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--astra-gold-dim)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or tag..."
            className="input-fantasy w-full rounded-2xl text-base"
            style={{ padding: '16px 20px 16px 52px' }}
          />
        </div>
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <div className="skeleton h-56 w-full" />
              <div className="p-8 space-y-4">
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-12 w-full rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
            <BookOpen className="w-10 h-10" style={{ color: 'var(--astra-gold-dim)' }} />
          </div>
          <h3 className="font-fantasy text-2xl font-bold mb-3" style={{ color: 'var(--astra-text)' }}>
            {search ? 'No Tomes Found' : 'Library is Empty'}
          </h3>
          <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
            {search ? 'Try a different search term to find what you seek.' : 'No courses have been published yet. Check back soon.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.5 }}
              className="glass-card rounded-2xl overflow-hidden group hover:border-yellow-600/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,162,39,0.08)]"
            >
              {/* Thumbnail */}
              <div className="relative h-56 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1523, #0a0610)' }}>
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16" style={{ color: 'var(--astra-gold-dim)' }} />
                  </div>
                )}

                {/* Price badge */}
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm"
                  style={{
                    background: course.hasPurchased ? 'rgba(34,197,94,0.9)' : 'rgba(201,162,39,0.95)',
                    color: '#050308',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                  {course.hasPurchased ? '✓ Enrolled' : course.price === 0 ? 'Free' : `₹${course.price}`}
                </div>
              </div>

              {/* Info */}
              <div className="p-8">
                <h3 className="font-fantasy text-xl font-bold mb-3 line-clamp-1" style={{ color: 'var(--astra-text)' }}>
                  {course.title}
                </h3>
                <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: 'var(--astra-text-muted)' }}>
                  {course.shortDescription}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-5 mb-5 text-sm" style={{ color: 'var(--astra-text-dim)' }}>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> {course.totalLessons} lessons
                  </span>
                  {course.totalDuration > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {formatDuration(course.totalDuration)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'rgba(201,162,39,0.08)',
                          border: '1px solid rgba(201,162,39,0.18)',
                          color: 'var(--astra-gold-dim)',
                        }}>
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action */}
                {course.hasPurchased ? (
                  <Link href={`/courses/${course.id}`}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="btn-primary w-full rounded-xl text-sm py-3.5 font-semibold">
                      <span className="flex items-center justify-center gap-2.5">
                        <CheckCircle className="w-4 h-4" /> Enter Course <ArrowRight className="w-4 h-4" />
                      </span>
                    </motion.button>
                  </Link>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleBuy(course)}
                    disabled={buyingCourseId === course.id}
                    className="w-full rounded-xl text-sm py-3.5 font-semibold transition-all cursor-pointer"
                    style={{
                      background: buyingCourseId === course.id
                        ? 'rgba(201,162,39,0.15)'
                        : 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))',
                      border: '1px solid rgba(201,162,39,0.35)',
                      color: 'var(--astra-gold)',
                    }}
                  >
                    <span className="flex items-center justify-center gap-2.5">
                      {buyingCourseId === course.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </>
                      ) : course.price === 0 ? (
                        <>
                          <Sparkles className="w-4 h-4" /> Enroll Free
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" /> Buy Course — ₹{course.price}
                        </>
                      )}
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
