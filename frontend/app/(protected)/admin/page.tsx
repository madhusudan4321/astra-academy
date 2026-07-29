'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, courseAPI } from '@/lib/api';
import {
  LayoutDashboard, BookOpen, Users, Crown, TrendingUp,
  DollarSign, Plus, Edit3, ChevronDown, ChevronRight,
  Upload, Trash2, Eye, EyeOff, X, Loader2,
  Search, UserPlus, FolderPlus, Video, FileText,
  CheckCircle, AlertCircle, GripVertical, Tag
} from 'lucide-react';

/* ───────────── Types ───────────── */
interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalPurchases: number;
  totalRevenue: number;
}

interface RecentStudent {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  avatar?: string;
}

interface AdminCourse {
  id: string;
  title: string;
  shortDescription: string;
  price: number;
  published: boolean;
  totalLessons: number;
  totalDuration: number;
  thumbnailUrl: string;
  createdAt: string;
  chaptersCount: number;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  purchasedCourses: number;
  joinedAt: string;
}

// Full course detail for managing chapters/lessons
interface LessonDetail {
  _id: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  hasNotes?: boolean;
  notesBlobName?: string;
}

interface ChapterDetail {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: LessonDetail[];
}

interface CourseDetail {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  published: boolean;
  tags: string[];
  chapters: ChapterDetail[];
  thumbnailUrl?: string;
}

type Tab = 'dashboard' | 'courses' | 'students';

/* ═══════════════════════════════════════════════════ */
export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Guard
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--astra-fire)' }} />
          <h2 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
            Access Forbidden
          </h2>
          <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
            Only administrators may enter this chamber.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'courses', label: 'Courses', icon: BookOpen },
    { key: 'students', label: 'Students', icon: Users },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5" style={{ color: 'var(--astra-gold)' }} />
          <h1 className="font-fantasy text-3xl md:text-4xl font-bold text-gold-gradient">
            Admin Chamber
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
          Command the Academy from within.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'var(--astra-stone)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive ? 'rgba(201,162,39,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(201,162,39,0.3)' : '1px solid transparent',
                color: isActive ? 'var(--astra-gold)' : 'var(--astra-text-muted)',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <DashboardTab key="dashboard" />}
        {activeTab === 'courses' && <CoursesTab key="courses" />}
        {activeTab === 'students' && <StudentsTab key="students" />}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════ TAB 1: DASHBOARD ═══════════ */
function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await adminAPI.getDashboard();
        setStats(res.data.stats);
        setRecentStudents(res.data.recentStudents || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) return <TabLoading />;

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: '#c9a227' },
    { label: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: '#e8c547' },
    { label: 'Total Enrollments', value: stats?.totalPurchases || 0, icon: TrendingUp, color: '#a07820' },
    { label: 'Total Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: DollarSign, color: '#22c55e' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="font-fantasy text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--astra-text-muted)' }}>{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Students */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-fantasy text-sm font-bold mb-4" style={{ color: 'var(--astra-text)' }}>
          Recent Scholars
        </h3>
        {recentStudents.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--astra-text-muted)' }}>
            No students have registered yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentStudents.map((s) => (
              <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(201,162,39,0.03)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c9a227, #7a6018)', color: '#050308' }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--astra-text)' }}>{s.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--astra-text-dim)' }}>{s.email}</p>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: 'var(--astra-text-dim)' }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════ TAB 2: COURSES ═══════════ */
function CoursesTab() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingCourseId, setManagingCourseId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await adminAPI.getCourses();
      setCourses(res.data.courses || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const togglePublish = async (courseId: string, current: boolean) => {
    const formData = new FormData();
    formData.append('published', String(!current));
    try {
      await adminAPI.updateCourse(courseId, formData);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, published: !current } : c))
      );
      toast.success(!current ? 'Course published!' : 'Course unpublished');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <TabLoading />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-fantasy text-sm font-bold" style={{ color: 'var(--astra-text)' }}>
          All Courses ({courses.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="btn-primary rounded-xl px-4 py-2 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Course
          </span>
        </motion.button>
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--astra-gold-dim)' }} />
          <h3 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
            No Courses Yet
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--astra-text-muted)' }}>
            Create your first course to begin building the academy.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary rounded-xl px-6 py-2.5 text-xs"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Course
            </span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className="glass-card rounded-xl p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0"
                style={{ background: 'var(--astra-stone)' }}>
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--astra-gold-dim)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate" style={{ color: 'var(--astra-text)' }}>
                  {course.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--astra-text-dim)' }}>
                  <span>₹{course.price}</span>
                  <span>{course.totalLessons} lessons</span>
                  <span>{course.chaptersCount} chapters</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Published toggle */}
                <button
                  onClick={() => togglePublish(course.id, course.published)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: course.published ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,53,0.1)',
                    border: `1px solid ${course.published ? 'rgba(34,197,94,0.3)' : 'rgba(255,107,53,0.3)'}`,
                    color: course.published ? '#22c55e' : 'var(--astra-fire)',
                  }}
                >
                  {course.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {course.published ? 'Published' : 'Draft'}
                </button>

                {/* Manage */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setManagingCourseId(course.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium"
                  style={{
                    background: 'rgba(201,162,39,0.1)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    color: 'var(--astra-gold)',
                  }}
                >
                  Manage
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchCourses(); }}
          />
        )}
      </AnimatePresence>

      {/* Manage Course Modal */}
      <AnimatePresence>
        {managingCourseId && (
          <ManageCourseModal
            courseId={managingCourseId}
            onClose={() => { setManagingCourseId(null); fetchCourses(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Create Course Modal ─── */
function CreateCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortDescription || !description || !thumbnail) {
      toast.error('Please fill all required fields and add a thumbnail');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('shortDescription', shortDescription);
      formData.append('description', description);
      formData.append('price', price);
      if (tags.trim()) {
        formData.append('tags', JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)));
      }
      formData.append('thumbnail', thumbnail);

      await adminAPI.createCourse(formData);
      toast.success('Course created!');
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto"
        style={{ background: 'var(--astra-stone)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--astra-border)' }}>
          <h3 className="font-fantasy text-sm font-bold text-gold-gradient">Create New Course</h3>
          <button onClick={onClose} style={{ color: 'var(--astra-text-dim)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField label="Title *">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title" className="input-fantasy w-full rounded-xl text-sm" style={{ padding: '10px 14px' }} />
          </FormField>

          <FormField label="Short Description *">
            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary (max 200 chars)" maxLength={200}
              className="input-fantasy w-full rounded-xl text-sm" style={{ padding: '10px 14px' }} />
          </FormField>

          <FormField label="Full Description *">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed course description" rows={4}
              className="input-fantasy w-full rounded-xl text-sm resize-none" style={{ padding: '10px 14px' }} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (₹)">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                min="0" className="input-fantasy w-full rounded-xl text-sm" style={{ padding: '10px 14px' }} />
            </FormField>
            <FormField label="Tags">
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2" className="input-fantasy w-full rounded-xl text-sm" style={{ padding: '10px 14px' }} />
            </FormField>
          </div>

          <FormField label="Thumbnail Image *">
            <label className="block cursor-pointer">
              <div className="input-fantasy rounded-xl text-sm flex items-center gap-2 transition-colors"
                style={{ padding: '10px 14px', color: thumbnail ? 'var(--astra-text)' : 'var(--astra-text-dim)' }}>
                <Upload className="w-4 h-4 shrink-0" style={{ color: 'var(--astra-gold-dim)' }} />
                {thumbnail ? thumbnail.name : 'Choose image...'}
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
            </label>
          </FormField>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="submit" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 rounded-xl py-2.5 text-xs disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {saving ? 'Creating...' : 'Create Course'}
              </span>
            </motion.button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs"
              style={{ border: '1px solid var(--astra-border)', color: 'var(--astra-text-muted)' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ─── Manage Course Modal (Chapters, Lessons, Notes) ─── */
function ManageCourseModal({
  courseId,
  onClose,
}: {
  courseId: string;
  onClose: () => void;
}) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Add chapter
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);

  // Upload lesson
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [uploadingLesson, setUploadingLesson] = useState(false);

  // Upload notes
  const [notesTarget, setNotesTarget] = useState<{ chapterId: string; lessonId: string } | null>(null);
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [uploadingNotes, setUploadingNotes] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await courseAPI.getById(courseId);
      const data = res.data.course;
      setCourse({
        _id: data.id,
        title: data.title,
        description: data.description,
        shortDescription: '',
        price: 0,
        published: false,
        tags: data.tags || [],
        chapters: data.chapters.map((ch: any) => ({
          _id: ch.id,
          title: ch.title,
          description: ch.description,
          order: ch.order,
          lessons: ch.lessons.map((l: any) => ({
            _id: l.id,
            title: l.title,
            description: l.description,
            order: l.order,
            duration: l.duration,
            hasNotes: l.hasNotes,
          })),
        })),
      });
      setExpandedChapters(new Set(data.chapters.map((ch: any) => ch.id)));
    } catch {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    setAddingChapter(true);
    try {
      await adminAPI.addChapter(courseId, { title: newChapterTitle.trim() });
      setNewChapterTitle('');
      toast.success('Chapter added!');
      await fetchCourse();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add chapter');
    } finally {
      setAddingChapter(false);
    }
  };

  const handleUploadLesson = async () => {
    if (!uploadingChapterId || !lessonTitle.trim() || !lessonVideo) {
      toast.error('Title and video file are required');
      return;
    }
    setUploadingLesson(true);
    try {
      const formData = new FormData();
      formData.append('title', lessonTitle.trim());
      if (lessonDescription) formData.append('description', lessonDescription.trim());
      formData.append('video', lessonVideo);

      await adminAPI.uploadLesson(courseId, uploadingChapterId, formData);
      setUploadingChapterId(null);
      setLessonTitle('');
      setLessonDescription('');
      setLessonVideo(null);
      toast.success('Lesson uploaded!');
      await fetchCourse();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload lesson');
    } finally {
      setUploadingLesson(false);
    }
  };

  const handleUploadNotes = async () => {
    if (!notesTarget || !notesFile) return;
    setUploadingNotes(true);
    try {
      const formData = new FormData();
      formData.append('notes', notesFile);
      await adminAPI.uploadNotes(courseId, notesTarget.chapterId, notesTarget.lessonId, formData);
      setNotesTarget(null);
      setNotesFile(null);
      toast.success('Notes uploaded!');
      await fetchCourse();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload notes');
    } finally {
      setUploadingNotes(false);
    }
  };

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto"
        style={{ background: 'var(--astra-stone)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--astra-border)', background: 'var(--astra-stone)' }}>
          <div>
            <h3 className="font-fantasy text-sm font-bold text-gold-gradient">Manage Course</h3>
            {course && <p className="text-xs mt-0.5" style={{ color: 'var(--astra-text-muted)' }}>{course.title}</p>}
          </div>
          <button onClick={onClose} style={{ color: 'var(--astra-text-dim)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--astra-gold)' }} />
            </div>
          ) : course ? (
            <>
              {/* Add Chapter */}
              <div className="mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="New chapter title..."
                    className="input-fantasy flex-1 rounded-xl text-sm"
                    style={{ padding: '9px 14px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddChapter}
                    disabled={addingChapter || !newChapterTitle.trim()}
                    className="btn-primary rounded-xl px-4 py-2 text-xs disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      {addingChapter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                      Add Chapter
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Chapter list */}
              {course.chapters.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--astra-text-muted)' }}>
                  No chapters yet. Add one above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {course.chapters
                    .sort((a, b) => a.order - b.order)
                    .map((chapter) => {
                      const isExpanded = expandedChapters.has(chapter._id);
                      return (
                        <div key={chapter._id} className="rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--astra-border)' }}>
                          {/* Chapter header */}
                          <button
                            onClick={() => toggleChapter(chapter._id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                            style={{ background: 'rgba(201,162,39,0.03)' }}
                          >
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-gold)' }} />
                              : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-text-dim)' }} />}
                            <span className="text-xs font-bold flex-1 truncate" style={{ color: 'var(--astra-text)' }}>
                              Ch {chapter.order}: {chapter.title}
                            </span>
                            <span className="text-[10px] shrink-0" style={{ color: 'var(--astra-text-dim)' }}>
                              {chapter.lessons.length} lessons
                            </span>
                          </button>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {/* Lessons */}
                                {chapter.lessons
                                  .sort((a, b) => a.order - b.order)
                                  .map((lesson) => (
                                    <div key={lesson._id}
                                      className="flex items-center gap-2 px-6 py-2.5"
                                      style={{ borderTop: '1px solid rgba(201,162,39,0.06)' }}>
                                      <Video className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-gold-dim)' }} />
                                      <span className="text-xs flex-1 truncate" style={{ color: 'var(--astra-text-muted)' }}>
                                        {lesson.title}
                                      </span>
                                      {lesson.hasNotes ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                                          Notes ✓
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => setNotesTarget({ chapterId: chapter._id, lessonId: lesson._id })}
                                          className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors hover:bg-yellow-500/10"
                                          style={{ color: 'var(--astra-gold-dim)' }}>
                                          + Notes
                                        </button>
                                      )}
                                    </div>
                                  ))}

                                {/* Add lesson button */}
                                <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(201,162,39,0.06)' }}>
                                  {uploadingChapterId === chapter._id ? (
                                    <div className="space-y-3">
                                      <input
                                        type="text"
                                        value={lessonTitle}
                                        onChange={(e) => setLessonTitle(e.target.value)}
                                        placeholder="Lesson title..."
                                        className="input-fantasy w-full rounded-lg text-xs"
                                        style={{ padding: '8px 12px' }}
                                      />
                                      <input
                                        type="text"
                                        value={lessonDescription}
                                        onChange={(e) => setLessonDescription(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="input-fantasy w-full rounded-lg text-xs"
                                        style={{ padding: '8px 12px' }}
                                      />
                                      <label className="block cursor-pointer">
                                        <div className="input-fantasy rounded-lg text-xs flex items-center gap-2"
                                          style={{ padding: '8px 12px', color: lessonVideo ? 'var(--astra-text)' : 'var(--astra-text-dim)' }}>
                                          <Video className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-gold-dim)' }} />
                                          {lessonVideo ? lessonVideo.name : 'Choose video file...'}
                                        </div>
                                        <input type="file" accept="video/*" className="hidden"
                                          onChange={(e) => setLessonVideo(e.target.files?.[0] || null)} />
                                      </label>
                                      <div className="flex gap-2">
                                        <motion.button
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={handleUploadLesson}
                                          disabled={uploadingLesson || !lessonTitle || !lessonVideo}
                                          className="btn-primary rounded-lg px-3 py-1.5 text-[10px] disabled:opacity-40"
                                        >
                                          <span className="flex items-center gap-1.5">
                                            {uploadingLesson
                                              ? <Loader2 className="w-3 h-3 animate-spin" />
                                              : <Upload className="w-3 h-3" />}
                                            {uploadingLesson ? 'Uploading...' : 'Upload Lesson'}
                                          </span>
                                        </motion.button>
                                        <button
                                          onClick={() => { setUploadingChapterId(null); setLessonTitle(''); setLessonVideo(null); }}
                                          className="px-3 py-1.5 rounded-lg text-[10px]"
                                          style={{ color: 'var(--astra-text-dim)' }}>
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setUploadingChapterId(chapter._id)}
                                      className="flex items-center gap-1.5 text-[10px] font-medium transition-colors hover:text-yellow-400"
                                      style={{ color: 'var(--astra-gold-dim)' }}
                                    >
                                      <Plus className="w-3 h-3" /> Add Lesson
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Upload Notes Sub-Modal */}
      <AnimatePresence>
        {notesTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setNotesTarget(null)}>
            <div className="glass-card rounded-2xl p-5 w-full max-w-sm mx-4"
              style={{ background: 'var(--astra-stone)' }}
              onClick={(e) => e.stopPropagation()}>
              <h4 className="font-fantasy text-sm font-bold mb-4 text-gold-gradient">Upload Notes (PDF)</h4>
              <label className="block cursor-pointer mb-4">
                <div className="input-fantasy rounded-xl text-sm flex items-center gap-2"
                  style={{ padding: '10px 14px', color: notesFile ? 'var(--astra-text)' : 'var(--astra-text-dim)' }}>
                  <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--astra-gold-dim)' }} />
                  {notesFile ? notesFile.name : 'Choose PDF file...'}
                </div>
                <input type="file" accept=".pdf" className="hidden"
                  onChange={(e) => setNotesFile(e.target.files?.[0] || null)} />
              </label>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleUploadNotes}
                  disabled={uploadingNotes || !notesFile}
                  className="btn-primary flex-1 rounded-xl py-2.5 text-xs disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {uploadingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadingNotes ? 'Uploading...' : 'Upload'}
                  </span>
                </motion.button>
                <button onClick={() => { setNotesTarget(null); setNotesFile(null); }}
                  className="px-4 rounded-xl text-xs"
                  style={{ border: '1px solid var(--astra-border)', color: 'var(--astra-text-muted)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ModalOverlay>
  );
}

/* ═══════════ TAB 3: STUDENTS ═══════════ */
function StudentsTab() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grantModal, setGrantModal] = useState<StudentItem | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await adminAPI.getStudents();
        setStudents(res.data.students || []);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <TabLoading />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--astra-gold-dim)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="input-fantasy w-full rounded-xl text-sm"
          style={{ padding: '11px 16px 11px 44px' }}
        />
      </div>

      {/* Students list */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--astra-gold-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
            {search ? 'No students match your search.' : 'No students registered yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className="glass-card rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #c9a227, #7a6018)', color: '#050308' }}>
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--astra-text)' }}>{student.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--astra-text-dim)' }}>{student.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium" style={{ color: 'var(--astra-gold)' }}>
                    {student.purchasedCourses} courses
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--astra-text-dim)' }}>
                    Joined {new Date(student.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGrantModal(student)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium"
                  style={{
                    background: 'rgba(201,162,39,0.1)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    color: 'var(--astra-gold)',
                  }}
                >
                  <span className="flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Grant
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Grant Access Modal */}
      <AnimatePresence>
        {grantModal && (
          <GrantAccessModal
            student={grantModal}
            onClose={() => setGrantModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Grant Access Modal ─── */
function GrantAccessModal({
  student,
  onClose,
}: {
  student: StudentItem;
  onClose: () => void;
}) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await adminAPI.getCourses();
        setCourses((res.data.courses || []).map((c: any) => ({ id: c.id, title: c.title })));
      } catch {
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handleGrant = async () => {
    if (!selectedCourseId) {
      toast.error('Select a course');
      return;
    }
    setGranting(true);
    try {
      await adminAPI.grantAccess(student.id, selectedCourseId);
      toast.success(`Access granted to ${student.name}!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card rounded-2xl p-5 w-full max-w-sm mx-4" style={{ background: 'var(--astra-stone)' }}>
        <h4 className="font-fantasy text-sm font-bold mb-1 text-gold-gradient">Grant Course Access</h4>
        <p className="text-xs mb-4" style={{ color: 'var(--astra-text-muted)' }}>
          For: <strong style={{ color: 'var(--astra-text)' }}>{student.name}</strong>
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--astra-gold)' }} />
          </div>
        ) : (
          <>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="input-fantasy w-full rounded-xl text-sm mb-4"
              style={{ padding: '10px 14px' }}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleGrant}
                disabled={granting || !selectedCourseId}
                className="btn-primary flex-1 rounded-xl py-2.5 text-xs disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {granting ? 'Granting...' : 'Grant Access'}
                </span>
              </motion.button>
              <button onClick={onClose}
                className="px-4 rounded-xl text-xs"
                style={{ border: '1px solid var(--astra-border)', color: 'var(--astra-text-muted)' }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}

/* ═══════════ Shared Components ═══════════ */
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-xs font-fantasy tracking-widest" style={{ color: 'var(--astra-text-dim)' }}>
          LOADING...
        </p>
      </div>
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--astra-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
