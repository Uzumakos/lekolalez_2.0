import React from 'react';
import { Course } from '../types';
import { getCourseProgress } from '../utils/courseUtils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, Award, BookOpen, Flame, ArrowRight } from 'lucide-react';
import { LearningCardSkeleton, CourseCardSkeleton } from './SkeletonLoader';
import { useLanguage } from '../contexts/LanguageContext';

interface StudentDashboardProps {
  courses: Course[];
  enrolledCourseIds: string[];
  completedLessons: Record<string, string[]>;
  isLoading?: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  courses, 
  enrolledCourseIds, 
  completedLessons,
  isLoading = false
}) => {
  const { t } = useLanguage();
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  const recommendedCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));

  // Calculate total stats
  const totalCompletedLessons = Object.values(completedLessons).flat().length;
  const averageProgress = enrolledCourses.length > 0 
    ? Math.round(enrolledCourses.reduce((acc, course) => {
        const { percentage } = getCourseProgress(course.id, course.modules, completedLessons[course.id]);
        return acc + percentage;
      }, 0) / enrolledCourses.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.welcome')} Student 👋</h1>
          <p className="text-gray-500">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                <Flame size={20} />
                <span>{t('dashboard.streak')}</span>
            </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
            <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
                <BookOpen size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{t('dashboard.enrolled')}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                    {isLoading ? <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /> : enrolledCourses.length}
                </h3>
            </div>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <PlayCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{t('dashboard.lessonsCompleted')}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                    {isLoading ? <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /> : totalCompletedLessons}
                </h3>
            </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Award size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{t('dashboard.avgScore')}</p>
                <h3 className="text-2xl font-bold text-gray-800">92%</h3>
            </div>
        </motion.div>
      </div>

      {/* My Learning Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.myLearning')}</h2>
        {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => <LearningCardSkeleton key={i} />)}
            </div>
        ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledCourses.map((course) => {
                    const { percentage, completed, total } = getCourseProgress(course.id, course.modules, completedLessons[course.id]);
                    
                    return (
                        <motion.div 
                            key={course.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
                        >
                            <img src={course.thumbnail} alt={course.title} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{course.title}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{course.category}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{completed} / {total} {t('details.lessons')}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end text-xs">
                                        <span className="font-medium text-gray-600">{t('details.progress')}</span>
                                        <span className="font-bold text-brand-blue">{percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-blue rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Link 
                                    to={`/courses/${course.id}`}
                                    className="p-2 bg-brand-blue text-white rounded-lg hover:bg-sky-600 transition-colors"
                                >
                                    <PlayCircle size={20} />
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-700">{t('dashboard.noCourses')}</h3>
                <p className="text-gray-500 mb-6">{t('dashboard.explore')}</p>
                <Link to="/courses" className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-2.5 rounded-xl hover:bg-sky-600 transition-colors font-medium">
                    {t('landing.browse')}
                </Link>
            </div>
        )}
      </div>

      {/* Recommendations */}
      {(isLoading || recommendedCourses.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('dashboard.recommended')}</h2>
                <Link to="/courses" className="text-brand-blue text-sm font-medium hover:underline flex items-center gap-1">
                    {t('landing.viewAll')} <ArrowRight size={16} />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading 
                    ? [1, 2, 3, 4].map(i => <CourseCardSkeleton key={i} />)
                    : recommendedCourses.slice(0, 4).map(course => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="group block">
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full hover:shadow-lg transition-all">
                            <div className="h-32 overflow-hidden relative">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-brand-blue uppercase">
                                    {course.category}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors">{course.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={12} />
                                    <span>{course.duration}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
          </div>
      )}
    </div>
  );
};