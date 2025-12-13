import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Course, Module, Lesson } from '../types';
import { generateCourseContent, getCourseProgress } from '../utils/courseUtils';
import { ArrowLeft, Clock, Users, BookOpen, Star, CheckCircle, PlayCircle, Globe, ChevronDown, ChevronUp, Lock, FileText, CheckSquare, Trophy, AlertCircle, Play, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrollmentModal } from './EnrollmentModal';
import { VideoPlayer } from './VideoPlayer';
import { CertificateModal } from './CertificateModal';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CourseDetailsPageProps {
  courses: Course[];
  enrolledCourseIds: string[];
  completedLessons: Record<string, string[]>;
  onEnroll: (courseId: string) => void;
  onToggleLesson: (courseId: string, lessonId: string) => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ 
  courses, 
  enrolledCourseIds, 
  completedLessons, 
  onEnroll, 
  onToggleLesson 
}) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { t } = useLanguage();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({'0': true}); 
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const course = courses.find(c => c.id === courseId);
  const isEnrolled = courseId ? enrolledCourseIds.includes(courseId) : false;
  const courseCompletedLessons = courseId ? (completedLessons[courseId] || []) : [];

  const modules = useMemo(() => {
    if (!course) return [];
    return generateCourseContent(course.id, course.modules);
  }, [course]);

  const { percentage: progressPercentage, total: totalLessons } = useMemo(() => {
     if (!course) return { percentage: 0, total: 0 };
     return getCourseProgress(course.id, course.modules, courseCompletedLessons);
  }, [course, courseCompletedLessons]);

  // Flatten lessons to find active lesson object
  const allLessons = useMemo(() => modules.flatMap(m => m.lessons), [modules]);
  const activeLesson = useMemo(() => allLessons.find(l => l.id === activeLessonId), [allLessons, activeLessonId]);
  const isCourseComplete = progressPercentage === 100;

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h2>
        <button onClick={() => navigate('/courses')} className="text-brand-blue hover:underline">Return to Courses</button>
      </div>
    );
  }

  const toggleModule = (index: number) => {
    setOpenModules(prev => ({...prev, [index]: !prev[index]}));
  };

  const handleLessonSelect = (lesson: Lesson) => {
      if (!isEnrolled) {
          setIsEnrollModalOpen(true);
          return;
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
                        <VideoPlayer 
                            poster={course.thumbnail} 
                            title={activeLesson.title} 
                            autoPlay={true}
                            onComplete={() => {
                                if (courseId && !courseCompletedLessons.includes(activeLesson.id)) {
                                    onToggleLesson(courseId, activeLesson.id);
                                }
                            }}
                        />
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
                            <p>{activeLesson.description}</p>
                            
                            <h4 className="text-gray-900 font-semibold mt-6 mb-2">{t('details.resources')}</h4>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <FileText size={18} className="text-brand-orange" />
                                    <span className="text-sm font-medium">Lecture Notes.pdf</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <FileText size={18} className="text-blue-500" />
                                    <span className="text-sm font-medium">Source Code.zip</span>
                                </div>
                            </div>
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
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {course.level}
                        </span>
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
                            <span>Last updated 2 days ago</span>
                        </div>
                    </div>
                 </div>
             )}
          </div>

          {/* Instructor & Stats */}
          {!activeLesson && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to={`/instructor/${encodeURIComponent(course.instructor)}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm block hover:border-brand-blue/30 transition-colors group">
                    <h3 className="font-bold text-gray-800 mb-4 group-hover:text-brand-blue transition-colors">{t('details.instructor')}</h3>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-gray-200 rounded-full overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${course.instructor}&background=0ea5e9&color=fff`} alt={course.instructor} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{course.instructor}</h4>
                            <p className="text-brand-blue text-sm">Senior Lecturer</p>
                        </div>
                    </div>
                </Link>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">{t('details.whatLearn')}</h3>
                    <ul className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                <span>Comprehensive understanding of core concepts.</span>
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
                            <p className="text-xs text-gray-500">{isCourseComplete ? 'You did it! 🎉' : 'Keep learning!'}</p>
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
                                    if (firstIncomplete) handleLessonSelect(firstIncomplete);
                                    else if (allLessons.length > 0) handleLessonSelect(allLessons[0]);
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
                        <div className="bg-white/90 backdrop-blur rounded-full p-4 cursor-pointer hover:scale-110 transition-transform">
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
                        onClick={() => setIsEnrollModalOpen(true)}
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-blue-500/30 mb-4"
                    >
                        {t('details.enroll')}
                    </button>
                    <p className="text-center text-xs text-gray-500 mb-6">{t('details.moneyBack')}</p>
                </div>
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
                                <div className="divide-y divide-gray-100">
                                {module.lessons.map((lesson) => {
                                    const isCompleted = courseCompletedLessons.includes(lesson.id);
                                    const isActive = activeLessonId === lesson.id;
                                    const Icon = lesson.type === 'video' ? PlayCircle : lesson.type === 'quiz' ? AlertCircle : FileText;
                                    
                                    return (
                                    <div 
                                        key={lesson.id} 
                                        onClick={() => handleLessonSelect(lesson)}
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

                                        {!isEnrolled && <Lock size={14} className="text-gray-300 mt-1" />}
                                    </div>
                                    );
                                })}
                                </div>
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
        studentName="Jean Doe"
        courseTitle={course.title}
        instructorName={course.instructor}
        completionDate={new Date().toLocaleDateString()}
    />
    </>
  );
};