'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { courseAPI, videoAPI, progressAPI } from '@/lib/api';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, CheckCircle, Circle, ChevronDown, ChevronRight,
  FileText, BookOpen, Loader2, RotateCcw
} from 'lucide-react';

/* ---------- types ---------- */
interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  order: number;
  hasNotes: boolean;
  isCompleted: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  totalLessons: number;
  totalDuration: number;
  tags: string[];
  chapters: Chapter[];
  progress: {
    completedLessons: number;
    completionPercentage: number;
    lastWatchedLessonId?: string;
    lastWatchedChapterId?: string;
  };
}

/* ========== Custom Video Player ========== */
function VideoPlayer({
  videoUrl,
  onEnded,
  onTimeUpdate,
}: {
  videoUrl: string;
  onEnded: () => void;
  onTimeUpdate?: (current: number, duration: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
      onTimeUpdate?.(v.currentTime, v.duration);
    };
    const onDur = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDur);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [onEnded, onTimeUpdate]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.code === 'Space') { e.preventDefault(); playing ? v.pause() : v.play(); }
      if (e.code === 'ArrowRight') { v.currentTime = Math.min(v.duration, v.currentTime + 10); }
      if (e.code === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 10); }
      if (e.code === 'KeyM') { setMuted((m) => { v.muted = !m; return !m; }); }
      if (e.code === 'KeyF') { toggleFullscreen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val === 0) { v.muted = true; setMuted(true); }
    else { v.muted = false; setMuted(false); }
  };

  const seek = (e: React.MouseEvent) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  };

  const skip10 = () => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden group"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {/* Center play overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(201,162,39,0.9)',
                boxShadow: '0 0 40px rgba(201,162,39,0.4)',
              }}>
              <Play className="w-8 h-8 ml-1" style={{ color: '#050308' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        {/* Progress bar */}
        <div ref={progressRef} className="h-1.5 rounded-full mb-3 cursor-pointer group/bar relative"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onClick={seek}>
          {/* Buffered */}
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${duration ? (buffered / duration) * 100 : 0}%`, background: 'rgba(255,255,255,0.2)' }} />
          {/* Played */}
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #c9a227, #e8c547)',
            }} />
          {/* Thumb */}
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{
              left: `${duration ? (currentTime / duration) * 100 : 0}%`,
              transform: 'translate(-50%, -50%)',
              background: '#e8c547',
              boxShadow: '0 0 8px rgba(201,162,39,0.6)',
            }} />
        </div>

        <div className="flex items-center gap-3">
          {/* Play/pause */}
          <button onClick={togglePlay} className="text-white hover:text-yellow-400 transition-colors">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Skip 10s */}
          <button onClick={skip10} className="text-white/70 hover:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 appearance-none rounded-full opacity-0 group-hover/vol:opacity-100 transition-opacity cursor-pointer"
              style={{ background: `linear-gradient(to right, #c9a227 ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 0%)` }}
            />
          </div>

          {/* Time */}
          <span className="text-xs text-white/60 ml-1 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
            {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ========== Course Viewer Page ========== */
export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Current lesson state
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Fetch course data
  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await courseAPI.getById(courseId);
        const data = res.data.course as CourseData;
        setCourse(data);

        // Expand all chapters by default
        setExpandedChapters(new Set(data.chapters.map((c) => c.id)));

        // Auto-select last watched or first lesson
        const lastWatched = data.progress.lastWatchedLessonId;
        if (lastWatched) {
          setCurrentLessonId(lastWatched);
        } else if (data.chapters.length > 0 && data.chapters[0].lessons.length > 0) {
          setCurrentLessonId(data.chapters[0].lessons[0].id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  // Load video when lesson changes
  useEffect(() => {
    if (!currentLessonId || !courseId) return;
    let cancelled = false;

    async function loadVideo() {
      setVideoLoading(true);
      setVideoUrl(null);
      try {
        const res = await videoAPI.getStream(courseId, currentLessonId!);
        if (!cancelled) setVideoUrl(res.data.videoUrl);
      } catch {
        if (!cancelled) toast.error('Failed to load video');
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    }
    loadVideo();

    // Refresh SAS URL every 8 minutes (expires in 10)
    const interval = setInterval(async () => {
      try {
        const res = await videoAPI.getStream(courseId, currentLessonId!);
        if (!cancelled) setVideoUrl(res.data.videoUrl);
      } catch { /* ignore */ }
    }, 8 * 60 * 1000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [currentLessonId, courseId]);

  // Get current lesson info
  const getCurrentLesson = (): Lesson | null => {
    if (!course || !currentLessonId) return null;
    for (const ch of course.chapters) {
      const l = ch.lessons.find((l) => l.id === currentLessonId);
      if (l) return l;
    }
    return null;
  };

  // Get next lesson
  const getNextLesson = (): Lesson | null => {
    if (!course || !currentLessonId) return null;
    const allLessons = course.chapters.flatMap((ch) => ch.lessons);
    const idx = allLessons.findIndex((l) => l.id === currentLessonId);
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  };

  const handleMarkComplete = async () => {
    if (!currentLessonId || !courseId) return;
    try {
      const res = await progressAPI.markComplete(courseId, currentLessonId);
      // Update local state
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: {
            ...prev.progress,
            completedLessons: res.data.progress.completedLessons,
            completionPercentage: res.data.progress.completionPercentage,
          },
          chapters: prev.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons.map((l) =>
              l.id === currentLessonId ? { ...l, isCompleted: true } : l
            ),
          })),
        };
      });
      toast.success('Lesson completed!');
    } catch {
      toast.error('Failed to mark complete');
    }
  };

  const handleVideoEnded = () => {
    handleMarkComplete();
    const next = getNextLesson();
    if (next) {
      setTimeout(() => setCurrentLessonId(next.id), 1500);
    }
  };

  const handleDownloadNotes = async () => {
    if (!currentLessonId || !courseId) return;
    try {
      const res = await videoAPI.getNotes(courseId, currentLessonId);
      window.open(res.data.notesUrl, '_blank');
    } catch {
      toast.error('Notes not available');
    }
  };

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });
  };

  const currentLesson = getCurrentLesson();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="font-fantasy text-sm tracking-widest" style={{ color: 'var(--astra-text-dim)' }}>
            LOADING TOME...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 text-center max-w-md">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--astra-fire)' }} />
          <h2 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
            Access Denied
          </h2>
          <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
            {error || 'You need to purchase this course first.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main content - video + info */}
      <div className="flex-1 min-w-0 p-4 md:p-6 overflow-auto">
        {/* Course progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--astra-text-muted)' }}>
              Course Progress
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--astra-gold)' }}>
              {course.progress.completionPercentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--astra-stone)' }}>
            <div className="progress-bar h-full" style={{ width: `${course.progress.completionPercentage}%` }} />
          </div>
        </div>

        {/* Video Player */}
        {videoLoading ? (
          <div className="w-full rounded-xl flex items-center justify-center"
            style={{ aspectRatio: '16/9', background: 'var(--astra-stone)' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--astra-gold)' }} />
          </div>
        ) : videoUrl ? (
          <VideoPlayer videoUrl={videoUrl} onEnded={handleVideoEnded} />
        ) : (
          <div className="w-full rounded-xl flex items-center justify-center"
            style={{ aspectRatio: '16/9', background: 'var(--astra-stone)' }}>
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--astra-gold-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--astra-text-muted)' }}>
                Select a lesson to begin
              </p>
            </div>
          </div>
        )}

        {/* Lesson info */}
        {currentLesson && (
          <motion.div
            key={currentLesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5"
          >
            <h2 className="font-fantasy text-xl font-bold mb-2" style={{ color: 'var(--astra-text)' }}>
              {currentLesson.title}
            </h2>
            {currentLesson.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--astra-text-muted)' }}>
                {currentLesson.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {/* Mark Complete */}
              {!currentLesson.isCompleted ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkComplete}
                  className="btn-primary rounded-xl text-xs py-2.5 px-5"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Mark as Complete
                  </span>
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                  <CheckCircle className="w-4 h-4" /> Completed
                </div>
              )}

              {/* Download notes */}
              {currentLesson.hasNotes && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadNotes}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs transition-colors"
                  style={{
                    background: 'rgba(201,162,39,0.08)',
                    border: '1px solid rgba(201,162,39,0.2)',
                    color: 'var(--astra-gold)',
                  }}
                >
                  <FileText className="w-4 h-4" /> Download Notes
                </motion.button>
              )}

              {/* Replay */}
              {videoUrl && (
                <button
                  onClick={() => { setVideoUrl(null); setTimeout(() => setVideoUrl(videoUrl), 50); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-colors"
                  style={{ color: 'var(--astra-text-dim)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Replay
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Chapter sidebar */}
      <div
        className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l overflow-auto"
        style={{ borderColor: 'rgba(201,162,39,0.12)', background: 'rgba(8,5,18,0.5)', maxHeight: '100vh' }}
      >
        <div className="p-4">
          <h3 className="font-fantasy text-sm font-bold mb-1" style={{ color: 'var(--astra-text)' }}>
            {course.title}
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--astra-text-dim)' }}>
            {course.progress.completedLessons} / {course.totalLessons} lessons completed
          </p>
        </div>

        <div className="space-y-1 px-2 pb-4">
          {course.chapters
            .sort((a, b) => a.order - b.order)
            .map((chapter) => (
              <div key={chapter.id}>
                {/* Chapter header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-white/5"
                >
                  {expandedChapters.has(chapter.id)
                    ? <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-gold)' }} />
                    : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-text-dim)' }} />
                  }
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--astra-text)' }}>
                    {chapter.title}
                  </span>
                  <span className="ml-auto text-[10px] shrink-0" style={{ color: 'var(--astra-text-dim)' }}>
                    {chapter.lessons.filter((l) => l.isCompleted).length}/{chapter.lessons.length}
                  </span>
                </button>

                {/* Lessons */}
                <AnimatePresence>
                  {expandedChapters.has(chapter.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {chapter.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => {
                          const isCurrent = lesson.id === currentLessonId;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLessonId(lesson.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 ml-3 rounded-lg text-left transition-all"
                              style={{
                                background: isCurrent ? 'rgba(201,162,39,0.12)' : 'transparent',
                                borderLeft: isCurrent ? '2px solid #c9a227' : '2px solid transparent',
                              }}
                            >
                              {lesson.isCompleted ? (
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
                              ) : isCurrent ? (
                                <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-gold)' }} />
                              ) : (
                                <Circle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--astra-text-dim)' }} />
                              )}
                              <span className="text-xs truncate" style={{
                                color: isCurrent ? 'var(--astra-text)' : lesson.isCompleted ? 'var(--astra-text-muted)' : 'var(--astra-text-muted)',
                              }}>
                                {lesson.title}
                              </span>
                              {lesson.hasNotes && (
                                <FileText className="w-3 h-3 ml-auto shrink-0" style={{ color: 'var(--astra-gold-dim)' }} />
                              )}
                            </button>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
