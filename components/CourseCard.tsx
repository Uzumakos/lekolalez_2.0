import React from 'react';
import { Course } from '../types';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { t } = useLanguage();

  // Helper to get instructor name from string or object
  const getInstructorName = () => {
    const inst = course.instructor;
    if (!inst) return 'Unknown';
    if (typeof inst === 'string') return inst;
    if (typeof inst === 'object') {
      const instObj = inst as any;
      return instObj.fullName || `${instObj.firstName || ''} ${instObj.lastName || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  };

  const instructorName = getInstructorName();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {course.showLevel && course.level && (
            <div className="bg-amber-100/95 backdrop-blur-sm px-2 py-1 rounded-md text-[11px] font-bold text-amber-800 uppercase tracking-wider shadow-2xs">
              {course.level}
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-brand-blue uppercase tracking-wider">
            {course.category}
          </div>
        </div>
        {course.price === 0 && (
          <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider">
            {t('course.free')}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center text-amber-500 text-sm">
             <Star size={14} fill="#f59e0b" className="mr-1" />
             <span className="font-semibold">{course.rating}</span>
           </div>
           <Link to={`/instructor/${encodeURIComponent(instructorName)}`} className="text-gray-400 text-xs hover:text-brand-blue transition-colors">
              {t('course.by')} {instructorName}
           </Link>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{course.title}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-400 text-xs mb-4">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
           <div className="flex items-center gap-1">
            <BookOpen size={14} />
            <span>{course.modules} {t('course.modules')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{course.students}</span>
          </div>
        </div>
        
        <Link 
          to={`/courses/${course.id}`}
          className="w-full block text-center bg-brand-blue/10 text-brand-blue font-semibold py-2 rounded-lg hover:bg-brand-blue hover:text-white transition-colors duration-200"
        >
          {t('course.view')}
        </Link>
      </div>
    </motion.div>
  );
};