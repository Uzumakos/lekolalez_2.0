import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Course, Module, Lesson, SiteContent, Language } from '../types';
import { generateCourseContent, getCourseProgress, normalizeModule, getModuleLessons } from '../utils/courseUtils';
import { ArrowLeft, Clock, Users, BookOpen, Star, CheckCircle, PlayCircle, Globe, ChevronDown, ChevronUp, Lock, Unlock, X, FileText, CheckSquare, Trophy, AlertCircle, Play, Award, Sparkles, UserPlus, ExternalLink, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrollmentModal } from './EnrollmentModal';
import { VideoPlayer } from './VideoPlayer';
import { CertificateModal } from './CertificateModal';
import { QuizPlayer } from './QuizPlayer';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { videoAccessAPI, coursesAPI } from '../services/api';

interface CourseDetailsPageProps {
  courses: Course[];
  enrolledCourseIds: string[];
  completedLessons: Record<string, string[]>;
  onEnroll: (courseId: string) => void;
  onToggleLesson: (courseId: string, lessonId: string) => void;
  currentUser?: any;
  siteContent?: SiteContent;
  onOpenAuth?: () => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  courses,
  enrolledCourseIds,
  completedLessons,
  onEnroll,
  onToggleLesson,
  currentUser,
  siteContent,
  onOpenAuth
}) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { t, language } = useLanguage();

  const renderLevel = (level?: string) => {
    if (!level) return '—';
    const normalized = level.trim().toLowerCase();
    if (normalized === 'beginner' || normalized === 'débutant' || normalized === 'debutant' || normalized === 'debitan') {
      return t('level.beginner');
    }
    if (normalized === 'intermediate' || normalized === 'intermédiaire' || normalized === 'intermediaire' || normalized === 'entèmedyè' || normalized === 'entemedye') {
      return t('level.intermediate');
    }
    if (normalized === 'advanced' || normalized === 'avancé' || normalized === 'avance' || normalized === 'avanse') {
      return t('level.advanced');
    }
    if (normalized === 'all levels' || normalized === 'tous niveaux' || normalized === 'tout nivo') {
      return t('level.allLevels');
    }
    return level;
  };
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({'0': true}); 
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [fetchedCourse, setFetchedCourse] = useState<Course | null>(null);
  const [isLoadingDirectCourse, setIsLoadingDirectCourse] = useState(false);

  const course = useMemo(() => {
    return courses.find(c => c.id === courseId) || fetchedCourse;
  }, [courses, courseId, fetchedCourse]);

  useEffect(() => {
    if (!courses.find(c => c.id === courseId) && courseId) {
      setIsLoadingDirectCourse(true);
      coursesAPI.getById(courseId).then(res => {
        if (res.course) {
          const c = res.course;
          setFetchedCourse({
            id: c.id || c._id,
            title: c.title,
            description: c.description,
            instructor: c.instructor?.fullName || (typeof c.instructor === 'string' ? c.instructor : 'Lekòl Alèz'),
            thumbnail: c.thumbnail || 'https://picsum.photos/400/250?random=' + (c.id || c._id),
            duration: c.totalDuration || '0h',
            students: c.enrollmentCount || 0,
            rating: c.rating?.average || 0,
            modules: Array.isArray(c.modules) ? c.modules.length : (typeof c.modules === 'number' ? c.modules : 0),
            category: c.category || 'Général',
            price: c.price || 0,
            level: c.level || 'Beginner',
            tags: c.tags || [],
            prerequisites: c.prerequisites || [],
            objectives: c.objectives || [],
            moduleList: (Array.isArray(c.modules) ? c.modules : []).map((m: any, idx: number) => normalizeModule(m, idx))
          });
        }
      }).catch(err => {
        console.warn('Could not fetch course by id:', err);
      }).finally(() => {
        setIsLoadingDirectCourse(false);
      });
    }
  }, [courses, courseId]);
  const isEnrolled = courseId ? enrolledCourseIds.includes(courseId) : false;
  const courseCompletedLessons = courseId ? (completedLessons[courseId] || []) : [];

  // Helper to get instructor info (handles both string and object)
  const getInstructorInfo = () => {
    if (!course) return { name: 'Unknown', title: 'Instructor', avatar: '' };
    const inst = course.instructor;
    if (typeof inst === 'object' && inst !== null) {
      const instObj = inst as any;
      return {
        name: instObj.fullName || `${instObj.firstName || ''} ${instObj.lastName || ''}`.trim() || 'Unknown',
        title: instObj.title || 'Instructor',
        avatar: instObj.avatar || `https://ui-avatars.com/api/?name=${instObj.firstName || 'I'}&background=0ea5e9&color=fff`
      };
    }
    return {
      name: String(inst),
      title: 'Instructor',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(String(inst))}&background=0ea5e9&color=fff`
    };
  };

  const instructorInfo = getInstructorInfo();

  const [paywallModalData, setPaywallModalData] = useState<{
    isOpen: boolean;
    trimesterTitle?: string;
  }>({ isOpen: false });

  const [quotaExceededModal, setQuotaExceededModal] = useState<{
    isOpen: boolean;
    subject: string;
    limit: number;
  }>({ isOpen: false, subject: '', limit: 1 });

  const [authRequiredModal, setAuthRequiredModal] = useState<{
    isOpen: boolean;
    lessonTitle?: string;
  }>({ isOpen: false });

  const authModalContent = useMemo(() => {
    switch (language) {
      case Language.CREOLE:
        return {
          badge: 'Kont obligatwa pou gade',
          title: 'Kreye yon kont gratis pou gade videyo a',
          desc: 'Ou ka konsilte tout pwogram ak plan kou a libeman. Men pou w ka kòmanse gade videyo yo epi swiv leson yo, ou dwe kreye yon kont gratis Lekòl Alèz.',
          benefit1: 'Aksè a videyo gratis chak jou nan chak matyè',
          benefit2: 'Suivi pwogrè w ak egzèsis entèraktif',
          benefit3: 'Enskripsyon rapid nan 30 segonn sèlman',
          signUpBtn: 'Kreye kont gratis mwen',
          signInBtn: 'Mwen gen yon kont deja — Konekte',
        };
      case Language.ENGLISH:
        return {
          badge: 'Free account required',
          title: 'Create a free account to watch this lesson',
          desc: 'You can freely explore the complete syllabus and curriculum outline. To watch video lessons and take quizzes, please create your free Lekòl Alèz account.',
          benefit1: 'Free daily video access across all subjects',
          benefit2: 'Track your learning progress and take quizzes',
          benefit3: 'Quick signup in under 30 seconds',
          signUpBtn: 'Create my free account',
          signInBtn: 'Already have an account? Sign in',
        };
      case Language.FRENCH:
      default:
        return {
          badge: 'Compte requis pour visionner',
          title: 'Créez un compte gratuit pour regarder cette vidéo',
          desc: 'Vous pouvez consulter l’intégralité du cursus et des modules gratuitement. Pour visionner les vidéos et suivre les leçons, créez simplement votre compte gratuit Lekòl Alèz.',
          benefit1: 'Accès aux vidéos gratuites quotidiennes par matière',
          benefit2: 'Suivi de progression et quiz d’entraînement',
          benefit3: 'Inscription gratuite en 30 secondes chrono',
          signUpBtn: 'Créer mon compte gratuit',
          signInBtn: 'J’ai déjà un compte — Se connecter',
        };
    }
  }, [language]);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  const modules = useMemo(() => {
    if (!course) return [];
    if (course.moduleList && course.moduleList.length > 0) {
      return course.moduleList.map((mod: any, modIdx: number) => {
        const normalized = normalizeModule(mod, modIdx);
        const trimesters = (normalized.trimesters || []).map((trim: any, trimIdx: number) => ({
          id: trim.id || `trim-${modIdx}-${trimIdx}`,
          title: trim.title || `Trimester ${trimIdx + 1}`,
          description: trim.description || '',
          isFree: Boolean(trim.isFree),
          order: trim.order ?? trimIdx,
          lessons: (trim.lessons || []).map((lesson: any, lessonIdx: number) => ({
            id: lesson.id || `lesson-${modIdx}-${trimIdx}-${lessonIdx}`,
            title: lesson.title || `Lesson ${lessonIdx + 1}`,
            type: lesson.type || 'video',
            duration: lesson.duration || '10:00',
            description: lesson.description || lesson.content || t('details.noDescription'),
            videoUrl: lesson.videoUrl || '',
            content: lesson.content || '',
            quizData: lesson.quizData || null,
            isFree: trim.isFree || Boolean(lesson.isFree),
            moduleTitle: normalized.title || `Module ${modIdx + 1}`,
            moduleId: normalized.id || `module-${modIdx}`,
          }))
        }));

        return {
          id: normalized.id || `module-${modIdx}`,
          title: normalized.title || `Module ${modIdx + 1}`,
          trimesters,
          lessons: trimesters.flatMap((t: any) => t.lessons),
        };
      });
    }
    // Fall back to generated content for courses without real modules
    return generateCourseContent(course.id, course.modules);
  }, [course]);

  const { percentage: progressPercentage, total: totalLessons } = useMemo(() => {
     if (!course) return { percentage: 0, total: 0 };
     // Calculate progress based on actual modules
     const total = modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
     if (total === 0) return { percentage: 0, total: 0 };
     const completed = courseCompletedLessons.length;
     const percentage = Math.round((completed / total) * 100);
     return { percentage: Math.min(percentage, 100), total };
  }, [course, modules, courseCompletedLessons]);

  // Flatten lessons to find active lesson object
  const allLessons = useMemo(() => modules.flatMap(m => m.lessons || []), [modules]);
  const activeLesson = useMemo(() => allLessons.find(l => l.id === activeLessonId), [allLessons, activeLessonId]);
  const isCourseComplete = progressPercentage === 100;

  if (isLoadingDirectCourse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center py-20">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement du cours...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 py-20">
        <BookOpen size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cours introuvable</h2>
        <p className="text-gray-500 mb-6">Ce cours n'est pas disponible ou a été déplacé.</p>
        <button onClick={() => navigate('/public-courses')} className="px-6 py-2.5 bg-brand-blue text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors">
          Voir le catalogue
        </button>
      </div>
    );
  }

  const toggleModule = (index: number) => {
    setOpenModules(prev => ({...prev, [index]: !prev[index]}));
  };

  const cleanSubjectName = (str: string): string => {
    return (str || '').replace(/^\d+[\.\-\s:]+/, '').trim();
  };

  const getLessonSubjectName = (lesson: any, moduleTitle?: string): string => {
    // 1. Module title has primary precedence (e.g. "1. Français" -> "Français")
    const rawMod = moduleTitle || lesson?.moduleTitle;
    if (rawMod) {
      const cleanMod = cleanSubjectName(rawMod);
      if (cleanMod) return cleanMod;
    }
    // 2. Course category if not a generic cycle/grade level (e.g. "Fondamentale")
    const cat = (course?.category || '').trim();
    const isGenericCycle = ['fondamentale', 'fondamental', 'general', 'général', 'other', 'autre'].includes(cat.toLowerCase());
    if (cat && !isGenericCycle) {
      return cat;
    }
    // 3. Fallback
    return course?.title ? cleanSubjectName(course.title) : (cat || 'Général');
  };

  const handleLessonSelect = async (
    lesson: Lesson, 
    isLocked: boolean = false, 
    trimesterTitle?: string,
    moduleTitle?: string
  ) => {
      // Unauthenticated visitors cannot view videos; must create account first
      if (!currentUser) {
          setAuthRequiredModal({
              isOpen: true,
              lessonTitle: lesson.title
          });
          return;
      }

      if (isLocked) {
          setPaywallModalData({
              isOpen: true,
              trimesterTitle
          });
          return;
      }

      // Auto-enroll student if logged in and not yet enrolled in this course
      if (currentUser && courseId && !enrolledCourseIds.includes(courseId)) {
        onEnroll(courseId);
      }

      // Check daily subject quota for video lessons for free students (server-backed)
      if (lesson.type === 'video' && !isStaff) {
        const subjectName = getLessonSubjectName(lesson, moduleTitle);
        const dailyLimit = siteContent?.freeAccess?.videosPerSubjectPerDay || 1;
        const accessCheck = await videoAccessAPI.checkAccessAsync(currentUser, subjectName, dailyLimit, courseId);

        if (!accessCheck.allowed) {
          setQuotaExceededModal({
            isOpen: true,
            subject: subjectName,
            limit: dailyLimit
          });
          return;
        }

        // Record view for this subject scoped to this course (server-backed + localStorage)
        if (currentUser?.id) {
          await videoAccessAPI.recordViewAsync(currentUser.id, subjectName, courseId);
        }

        // Mark lesson completed upon viewing so account stats reflect progress
        if (courseId && !courseCompletedLessons.includes(lesson.id)) {
          onToggleLesson(courseId, lesson.id);
        }
      }

      setActiveLessonId(lesson.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnrollSuccess = () => {
    if (courseId) {
      onEnroll(courseId);
      addNotification({
        title: "Enrollment Successful! 🎉",
        message: `You have successfully enrolled in ${course.title}. Happy learning!`,
        type: 'success',
        link: `/courses/${courseId}`
      });
    }
  };

  const price = Number(course.price);

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pb-20"
    >
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-blue transition-colors group"
        >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('details.back')}</span>
        </button>
        {isEnrolled && (
             <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{courseCompletedLessons.length}</span> / <span className="font-medium text-gray-900">{totalLessons}</span> {t('details.lessons')} {t('details.completed')}
             </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Lesson Player OR Course Hero */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
             {activeLesson ? (
                 <div className="animate-in fade-in duration-500">
                     <div className="p-1">
                        {activeLesson.type === 'quiz' && activeLesson.quizData ? (
                          <QuizPlayer
                            quizData={activeLesson.quizData}
                            onComplete={() => {
                              if (courseId && !courseCompletedLessons.includes(activeLesson.id)) {
                                onToggleLesson(courseId, activeLesson.id);
                              }
                            }}
                          />
                        ) : activeLesson.type === 'reading' ? (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-[300px]">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="bg-blue-100 p-3 rounded-xl">
                                <FileText size={24} className="text-brand-blue" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{t('details.readingMaterial')}</h3>
                                <p className="text-sm text-gray-500">{activeLesson.duration} read</p>
                              </div>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-700 bg-white rounded-xl p-6 shadow-sm">
                              {activeLesson.content || activeLesson.description || t('details.noReadingContent')}
                            </div>
                          </div>
                        ) : (
                          <VideoPlayer
                              poster={course.thumbnail}
                              title={activeLesson.title}
                              videoUrl={activeLesson.videoUrl}
                              autoPlay={true}
                              onComplete={() => {
                                  if (courseId && !courseCompletedLessons.includes(activeLesson.id)) {
                                      onToggleLesson(courseId, activeLesson.id);
                                  }
                              }}
                          />
                        )}
                     </div>
                     <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={16} /> {activeLesson.duration}</span>
                                    <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded text-xs font-semibold uppercase">{activeLesson.type}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => courseId && onToggleLesson(courseId, activeLesson.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    courseCompletedLessons.includes(activeLesson.id) 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {courseCompletedLessons.includes(activeLesson.id) ? (
                                    <>
                                        <CheckCircle size={18} />
                                        <span>{t('details.isCompleted')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare size={18} />
                                        <span>{t('details.markComplete')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="prose prose-sm text-gray-600 max-w-none">
                            <h4 className="text-gray-900 font-semibold mb-2">{t('details.description')}</h4>
                            <p>{activeLesson.description || t('details.noDescription') || 'Aucune description disponible.'}</p>
                            
                            {activeLesson.resources && activeLesson.resources.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-gray-900 font-semibold mb-2">{t('details.resources')}</h4>
                                    <div className="flex flex-wrap gap-3 not-prose">
                                        {activeLesson.resources.map((res) => (
                                            <a
                                                key={res.id}
                                                href={res.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-blue-50/60 hover:border-brand-blue/50 text-gray-700 hover:text-brand-blue transition-all group shadow-2xs bg-white"
                                            >
                                                <FileText size={18} className="text-brand-orange group-hover:scale-110 transition-transform shrink-0" />
                                                <span className="text-sm font-semibold truncate max-w-xs">{res.title || res.url}</span>
                                                <ExternalLink size={14} className="text-gray-400 group-hover:text-brand-blue transition-colors shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                 </div>
             ) : (
                 // Default Course Info (Hero)
                 <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {course.category}
                        </span>
                        {course.showLevel && course.level && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                              {renderLevel(course.level)}
                          </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">{course.title}</h1>
                    <p className="text-lg text-gray-600 leading-relaxed mb-6">{course.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="flex text-amber-500">
                                <Star size={18} fill="#f59e0b" />
                                <span className="font-bold text-gray-900 ml-1">{course.rating}</span>
                            </div>
                            <span>(128 {t('course.reviews')})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={18} />
                            <span>English, Kreyòl</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} />
                            <span>{t('details.lastUpdated')}</span>
                        </div>
                    </div>
                 </div>
             )}
          </div>

          {/* Instructor & Stats */}
          {!activeLesson && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to={`/instructor/${encodeURIComponent(instructorInfo.name)}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm block hover:border-brand-blue/30 transition-colors group">
                    <h3 className="font-bold text-gray-800 mb-4 group-hover:text-brand-blue transition-colors">{t('details.instructor')}</h3>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-gray-200 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                            <img 
                                src={instructorInfo.avatar} 
                                alt={instructorInfo.name} 
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorInfo.name || 'Admin')}&background=0ea5e9&color=fff`;
                                }}
                            />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{instructorInfo.name}</h4>
                            <p className="text-brand-blue text-sm">{instructorInfo.title}</p>
                        </div>
                    </div>
                </Link>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">{t('details.whatLearn')}</h3>
                    <ul className="space-y-2.5">
                        {(course.objectives && course.objectives.length > 0
                          ? course.objectives
                          : ['Comprehensive understanding of core concepts', 'Practical skills you can apply immediately', 'Industry best practices and techniques']
                        ).map((objective, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                <span>{objective}</span>
                            </li>
                        ))}
                    </ul>
                </div>
             </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            
            {/* Enrollment/Progress Card */}
            {isEnrolled ? (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-xl ${isCourseComplete ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                            {isCourseComplete ? <Award size={24} /> : <Trophy size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{isCourseComplete ? t('details.courseCompleted') : t('details.progress')}</h3>
                            <p className="text-xs text-gray-500">{isCourseComplete ? t('details.youDidIt') : t('details.keepLearning')}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-gray-600">{courseCompletedLessons.length}/{totalLessons} {t('details.lessons')}</span>
                            <span className="text-lg font-bold text-brand-blue">{progressPercentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-brand-blue rounded-full"
                            />
                        </div>
                    </div>
                    
                    {isCourseComplete ? (
                        <button 
                            onClick={() => setIsCertificateModalOpen(true)}
                            className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                        >
                            <Award size={20} />
                            {t('details.certificate')}
                        </button>
                    ) : (
                        !activeLesson && (
                            <button 
                                onClick={() => {
                                    // Find first incomplete lesson
                                    const firstIncomplete = allLessons.find(l => !courseCompletedLessons.includes(l.id));
                                    if (firstIncomplete) handleLessonSelect(firstIncomplete, false, undefined, (firstIncomplete as any).moduleTitle);
                                    else if (allLessons.length > 0) handleLessonSelect(allLessons[0], false, undefined, (allLessons[0] as any).moduleTitle);
                                }}
                                className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-blue-500/30"
                            >
                                {t('details.continue')}
                            </button>
                        )
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="h-48 overflow-hidden relative group hidden lg:block">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div 
                          onClick={() => {
                            if (!currentUser) {
                              setAuthRequiredModal({
                                isOpen: true,
                                lessonTitle: allLessons[0]?.title || course.title
                              });
                            } else if (allLessons.length > 0) {
                              handleLessonSelect(allLessons[0], false, undefined, (allLessons[0] as any).moduleTitle);
                            }
                          }}
                          className="bg-white/90 backdrop-blur rounded-full p-4 cursor-pointer hover:scale-110 transition-transform"
                        >
                        <PlayCircle size={32} className="text-brand-blue" fill="currentColor" fillOpacity={0.2} />
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                            {price === 0 ? t('course.free') : `$${price.toFixed(2)}`}
                        </span>
                        {price > 0 && (
                            <span className="text-gray-400 line-through ml-3 text-sm">$99.99</span>
                        )}
                    </div>

                    <button 
                        onClick={() => {
                          if (!currentUser) {
                            if (onOpenAuth) onOpenAuth();
                            else navigate('/signup');
                          } else {
                            setIsEnrollModalOpen(true);
                          }
                        }}
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-blue-500/30 mb-4"
                    >
                        {t('details.enroll')}
                    </button>
                    <p className="text-center text-xs text-gray-500 mb-6">{t('details.moneyBack')}</p>
                </div>
                </div>
            )}

            {/* Course Details Panel */}
            {!activeLesson && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 text-base">{t('details.courseDetails')}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {/* Duration */}
                  <li className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-gray-500">
                      <Clock size={16} className="text-gray-400" />
                      {t('details.duration')}
                    </span>
                    <span className="font-bold text-gray-900">{course.totalDuration || course.duration || '—'}</span>
                  </li>
                  {/* Lectures */}
                  <li className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-gray-500">
                      <BookOpen size={16} className="text-gray-400" />
                      {t('details.lectures')}
                    </span>
                    <span className="font-bold text-gray-900">
                      {course.totalLessons ||
                        modules.reduce((acc, m) => acc + m.lessons.filter(l => l.type !== 'quiz').length, 0) || '—'}
                    </span>
                  </li>
                  {/* Video */}
                  <li className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-gray-500">
                      <PlayCircle size={16} className="text-gray-400" />
                      {t('details.video')}
                    </span>
                    <span className="font-bold text-gray-900">{course.totalDuration || course.duration || '—'}</span>
                  </li>
                  {/* Quizzes */}
                  <li className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-gray-500">
                      <CheckSquare size={16} className="text-gray-400" />
                      {t('details.quizzes')}
                    </span>
                    <span className="font-bold text-gray-900">
                      {modules.reduce((acc, m) => acc + m.lessons.filter(l => l.type === 'quiz').length, 0) || '0'}
                    </span>
                  </li>
                  {/* Level */}
                  <li className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-gray-500">
                      <Trophy size={16} className="text-gray-400" />
                      {t('details.level')}
                    </span>
                    <span className="font-bold text-gray-900">{renderLevel(course.level)}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Course Content List (Syllabus) */}

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 px-1">{t('details.content')}</h3>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {modules.map((module, idx) => (
                    <div key={module.id} className="border-b border-gray-100 last:border-0">
                        <button 
                            onClick={() => toggleModule(idx)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50/50"
                        >
                            <h4 className="font-bold text-sm text-gray-800 text-left line-clamp-1">
                                <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                {module.title}
                            </h4>
                            {openModules[idx] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                        
                        <AnimatePresence>
                            {openModules[idx] && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                {module.trimesters && module.trimesters.length > 0 ? (
                                    <div className="p-3 space-y-3 bg-slate-50/60">
                                        {module.trimesters.map((trimester: any, tIdx: number) => (
                                            <div key={trimester.id || tIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                                {/* Trimester Header */}
                                                <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3">
                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                        {trimester.title}
                                                    </span>
                                                    <div>
                                                        {trimester.isFree ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                                                <Unlock size={12} className="text-emerald-600" />
                                                                {t('details.freePreview')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                                                <Lock size={12} className="text-amber-600" />
                                                                {t('details.paidRequired')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lessons in this trimester */}
                                                <div className="divide-y divide-slate-100">
                                                    {(trimester.lessons || []).map((lesson: any) => {
                                                        const isCompleted = courseCompletedLessons.includes(lesson.id);
                                                        const isActive = activeLessonId === lesson.id;
                                                        const isAccessible = isEnrolled || isStaff || trimester.isFree || Boolean(lesson.isFree);
                                                        const Icon = lesson.type === 'video' ? PlayCircle : lesson.type === 'quiz' ? AlertCircle : FileText;

                                                        return (
                                                            <div 
                                                                key={lesson.id} 
                                                                onClick={() => handleLessonSelect(lesson, !isAccessible, trimester.title, module.title)}
                                                                className={`p-3 pl-4 flex items-start gap-3 cursor-pointer transition-all ${
                                                                    isActive ? 'bg-blue-50 border-l-4 border-brand-blue' : 'hover:bg-slate-50 border-l-4 border-transparent'
                                                                }`}
                                                            >
                                                                <div className={`mt-0.5 ${isActive ? 'text-brand-blue' : isCompleted ? 'text-green-500' : 'text-slate-400'}`}>
                                                                    {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-brand-blue' : 'text-slate-700'}`}>
                                                                        {lesson.title}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                                        <span>{lesson.duration}</span>
                                                                        {isCompleted && <span>• {t('details.isCompleted')}</span>}
                                                                        {trimester.isFree && (
                                                                            <span className="text-emerald-600 font-semibold">• {t('details.freePreview')}</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {!isAccessible && (
                                                                    <div className="flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 shrink-0">
                                                                        <Lock size={12} className="text-amber-600" />
                                                                        <span>{t('details.locked')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                    {module.lessons.map((lesson: any) => {
                                        const isCompleted = courseCompletedLessons.includes(lesson.id);
                                        const isActive = activeLessonId === lesson.id;
                                        const isAccessible = isEnrolled || isStaff || Boolean(lesson.isFree);
                                        const Icon = lesson.type === 'video' ? PlayCircle : lesson.type === 'quiz' ? AlertCircle : FileText;
                                        
                                        return (
                                        <div 
                                            key={lesson.id} 
                                            onClick={() => handleLessonSelect(lesson, !isAccessible, undefined, module.title)}
                                            className={`p-3 pl-6 flex items-start gap-3 cursor-pointer transition-all ${
                                                isActive ? 'bg-blue-50 border-l-4 border-brand-blue' : 'hover:bg-gray-50 border-l-4 border-transparent'
                                            }`}
                                        >
                                            <div className={`mt-0.5 ${isActive ? 'text-brand-blue' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                                                {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-brand-blue' : 'text-gray-700'}`}>
                                                    {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                    <span>{lesson.duration}</span>
                                                    {isCompleted && <span>• {t('details.isCompleted')}</span>}
                                                </div>
                                            </div>

                                            {!isAccessible && <Lock size={14} className="text-gray-300 mt-1" />}
                                        </div>
                                        );
                                    })}
                                    </div>
                                )}
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
    
    <EnrollmentModal 
      isOpen={isEnrollModalOpen} 
      onClose={() => {
        setIsEnrollModalOpen(false);
      }}
      // @ts-ignore
      onConfirm={handleEnrollSuccess} 
      course={course} 
    />
    
    <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        studentName={currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Student'}
        courseTitle={course.title}
        instructorName={instructorInfo.name}
        completionDate={new Date().toLocaleDateString()}
    />

    {/* Paywall / Premium Trimester Access Modal */}
    <AnimatePresence>
      {paywallModalData.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaywallModalData({ isOpen: false })}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 pointer-events-auto relative text-center"
            >
              <button
                onClick={() => setPaywallModalData({ isOpen: false })}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 border border-amber-500/20">
                <Lock size={32} />
              </div>

              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Premium Curriculum
              </span>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Subscription Required
              </h3>

              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Lessons in <strong>{paywallModalData.trimesterTitle || 'this trimester'}</strong> are part of the paid curriculum. Enroll in this course or subscribe to a paid plan to unlock full access.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPaywallModalData({ isOpen: false });
                    setIsEnrollModalOpen(true);
                  }}
                  className="w-full py-3 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Enroll in Course ({price === 0 ? 'Free' : `$${price.toFixed(2)}`})
                </button>

                <button
                  onClick={() => {
                    setPaywallModalData({ isOpen: false });
                    navigate('/pricing');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                >
                  View Subscription Plans
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Quota Exceeded Modal */}
    <AnimatePresence>
      {quotaExceededModal.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuotaExceededModal({ isOpen: false, subject: '', limit: 1 })}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 pointer-events-auto relative text-center"
            >
              <button
                onClick={() => setQuotaExceededModal({ isOpen: false, subject: '', limit: 1 })}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center mb-4 border border-orange-500/20">
                <Sparkles size={32} />
              </div>

              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Limit Jounalye Atenn
              </span>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {quotaExceededModal.limit} videyo gratis pou jodi a
              </h3>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Ou deja gade <strong>{quotaExceededModal.limit} videyo</strong> nan matyè <strong>{quotaExceededModal.subject}</strong> jodi a sou plan gratis la. Kota ou a ap renouvle chak jou a minwi!
                <br /><br />
                Pase sou <strong>Premium Alèz ($1.99/mwa)</strong> pou w gade videyo san limit, telechaje kou yo epi jwenn sètifika.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setQuotaExceededModal({ isOpen: false, subject: '', limit: 1 });
                    navigate('/pricing');
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles size={16} />
                  <span>Pase sou Premium ($1.99/mwa)</span>
                </button>

                <button
                  onClick={() => setQuotaExceededModal({ isOpen: false, subject: '', limit: 1 })}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                >
                  M ap tann demen
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Auth Required Modal for Visitors */}
    <AnimatePresence>
      {authRequiredModal.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthRequiredModal({ isOpen: false })}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 pointer-events-auto relative text-center"
            >
              <button
                onClick={() => setAuthRequiredModal({ isOpen: false })}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>

              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4 border border-brand-blue/20 shadow-xs">
                <PlayCircle size={32} />
              </div>

              <span className="inline-block px-3 py-1 bg-sky-100 text-brand-blue text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {authModalContent.badge}
              </span>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {authModalContent.title}
              </h3>

              {authRequiredModal.lessonTitle && (
                <p className="text-xs font-semibold text-brand-blue bg-blue-50 py-1 px-3 rounded-lg inline-block mb-3 max-w-full truncate">
                  {authRequiredModal.lessonTitle}
                </p>
              )}

              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                {authModalContent.desc}
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2.5 border border-slate-100">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>{authModalContent.benefit1}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>{authModalContent.benefit2}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>{authModalContent.benefit3}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAuthRequiredModal({ isOpen: false });
                    if (onOpenAuth) {
                      onOpenAuth();
                    } else {
                      navigate('/signup');
                    }
                  }}
                  className="w-full py-3.5 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <UserPlus size={16} />
                  <span>{authModalContent.signUpBtn}</span>
                </button>

                <button
                  onClick={() => {
                    setAuthRequiredModal({ isOpen: false });
                    navigate('/login');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
                >
                  {authModalContent.signInBtn}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};