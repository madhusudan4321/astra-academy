'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { courseAPI, purchaseAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Search, Clock, Layers, Tag, ArrowRight, CheckCircle, Loader2, ShoppingCart } from 'lucide-react';

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
      if (msg === 'Already purchased') {
        toast.success('You already own this course!');
        await fetchCourses();
      } else {
        toast.error(msg || 'Failed to initiate payment');
      }
      setBuyingCourseId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-fantasy text-3xl md:text-4xl font-bold text-gold-gradient mb-2">
          The Grand Library
        </h1>
        <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
          Discover ancient tomes of knowledge. Each course is a gateway to mastery.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--astra-gold-dim)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or tag..."
          className="input-fantasy w-full rounded-xl text-sm"
          style={{ padding: '12px 16px 12px 44px' }}
        />
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <div className="skeleton h-44 w-full" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-10 w-full rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--astra-gold-dim)' }} />
          <h3 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
            {search ? 'No Tomes Found' : 'Library is Empty'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
            {search ? 'Try a different search term.' : 'No courses have been published yet. Check back soon.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card rounded-xl overflow-hidden group hover:border-yellow-600/30 transition-all"
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1523, #0a0610)' }}>
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-14 h-14" style={{ color: 'var(--astra-gold-dim)' }} />
                  </div>
                )}

                {/* Price badge */}
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: course.hasPurchased ? 'rgba(34,197,94,0.9)' : 'rgba(201,162,39,0.95)',
                    color: '#050308',
                  }}>
                  {course.hasPurchased ? '✓ Enrolled' : course.price === 0 ? 'Free' : `₹${course.price}`}
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="font-fantasy text-base font-bold mb-2 line-clamp-1" style={{ color: 'var(--astra-text)' }}>
                  {course.title}
                </h3>
                <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--astra-text-muted)' }}>
                  {course.shortDescription}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--astra-text-dim)' }}>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {course.totalLessons} lessons
                  </span>
                  {course.totalDuration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDuration(course.totalDuration)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: 'rgba(201,162,39,0.08)',
                          border: '1px solid rgba(201,162,39,0.15)',
                          color: 'var(--astra-gold-dim)',
                        }}>
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action */}
                {course.hasPurchased ? (
                  <Link href={`/courses/${course.id}`}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full rounded-xl text-xs py-2.5">
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" /> Enter Course <ArrowRight className="w-3 h-3" />
                      </span>
                    </motion.button>
                  </Link>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBuy(course)}
                    disabled={buyingCourseId === course.id}
                    className="w-full rounded-xl text-xs py-2.5 font-semibold transition-all cursor-pointer"
                    style={{
                      background: buyingCourseId === course.id
                        ? 'rgba(201,162,39,0.15)'
                        : 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))',
                      border: '1px solid rgba(201,162,39,0.35)',
                      color: 'var(--astra-gold)',
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {buyingCourseId === course.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                        </>
                      ) : course.price === 0 ? (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" /> Enroll Free
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" /> Buy Course — ₹{course.price}
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
