import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen, FileVideo, Image as ImageIcon, AlertCircle, Plus, Check, Loader2, Save,
  Trash2, Edit2, List, Settings, X, ChevronDown, ChevronUp, Youtube, Upload, Clock,
  AlignLeft, Lock, Unlock, ArrowUp, ArrowDown, Layers, ShieldCheck, User, Link as LinkIcon, CheckCircle2,
  Paperclip, FileText, ExternalLink
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Course, Module, Lesson, QuizData, Trimester, LessonResource } from '../types';
import { normalizeModule } from '../utils/courseUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { QuizBuilder } from './QuizBuilder';
import { motion, AnimatePresence } from 'framer-motion';
import { coursesAPI } from '../services/api';

interface CourseEditorProps {
  courses: Course[];
  onSave: (course: Course, originalId?: string) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ courses, onSave, categories, onAddCategory }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const isEditMode = !!courseId;
  const existingCourse = courses.find(c => c.id === courseId);

  // Form State
  const [activeTab, setActiveTab] = useState<'basic' | 'curriculum'>('basic');
  const [formData, setFormData] = useState<Partial<Course>>(() => {
    if (existingCourse) {
      const rawInitialModules = Array.isArray(existingCourse.moduleList)
        ? existingCourse.moduleList
        : Array.isArray(existingCourse.modules)
        ? existingCourse.modules
        : [];
      return {
        ...existingCourse,
        moduleList: rawInitialModules.map((m, idx) => normalizeModule(m, idx))
      };
    }
    const defaultCat = categories && categories.length > 0 ? categories[0] : 'Fondamentale';
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      category: defaultCat,
      level: 'Beginner',
      showLevel: false,
      duration: '',
      price: 0,
      description: '',
      prerequisites: [],
      tags: [],
      moduleList: []
    };
  });

  // Instructor Profile State
  const [instructorName, setInstructorName] = useState<string>(() => {
    if (existingCourse?.instructor) {
      if (typeof existingCourse.instructor === 'object') {
        const inst = existingCourse.instructor as any;
        return inst.fullName || `${inst.firstName || ''} ${inst.lastName || ''}`.trim() || 'Admin User';
      }
      return String(existingCourse.instructor);
    }
    return 'Admin User';
  });

  const [instructorTitle, setInstructorTitle] = useState<string>(() => {
    if (existingCourse?.instructor && typeof existingCourse.instructor === 'object') {
      return (existingCourse.instructor as any).title || 'Instructor';
    }
    return 'Instructor';
  });

  const [instructorAvatar, setInstructorAvatar] = useState<string>(() => {
    if (existingCourse?.instructor && typeof existingCourse.instructor === 'object') {
      return (existingCourse.instructor as any).avatar || '';
    }
    return '';
  });

  // What you will learn (Objectives) State
  const [objectives, setObjectives] = useState<string[]>(() => {
    if (existingCourse?.objectives && existingCourse.objectives.length > 0) {
      return [...existingCourse.objectives];
    }
    return [
      'Comprehensive understanding of core concepts',
      'Practical skills you can apply immediately',
      'Industry best practices and techniques'
    ];
  });

  // Thumbnail Mode & URL State
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>('url');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(() => {
    return existingCourse?.thumbnail || '';
  });

  useEffect(() => {
    const populateCourseData = (course: any) => {
      const rawModules = Array.isArray(course.moduleList)
        ? course.moduleList
        : Array.isArray(course.modules)
        ? course.modules
        : [];

      setFormData({
        ...course,
        duration: course.totalDuration || course.duration || '',
        moduleList: rawModules.map((m: any, idx: number) => normalizeModule(m, idx))
      });

      if (course.thumbnail) {
        setThumbnailUrl(course.thumbnail);
      }

      if (course.instructor) {
        if (typeof course.instructor === 'object') {
          const inst = course.instructor;
          setInstructorName(inst.fullName || `${inst.firstName || ''} ${inst.lastName || ''}`.trim() || 'Admin User');
          setInstructorTitle(inst.title || 'Instructor');
          setInstructorAvatar(inst.avatar || '');
        } else if (typeof course.instructor === 'string') {
          setInstructorName(course.instructor);
        }
      }

      if (course.objectives && Array.isArray(course.objectives) && course.objectives.length > 0) {
        setObjectives([...course.objectives]);
      }
    };

    if (existingCourse) {
      populateCourseData(existingCourse);
    } else if (isEditMode && courseId) {
      // Direct fetch from Supabase if not yet in courses prop (e.g. after browser refresh)
      coursesAPI.getById(courseId).then(res => {
        if (res.course) {
          populateCourseData(res.course);
        }
      }).catch(err => {
        console.warn('Could not fetch course by id:', err);
      });
    }
  }, [existingCourse, isEditMode, courseId]);

  // Media State
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  
  // Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Quiz Builder State
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [currentQuizLessonId, setCurrentQuizLessonId] = useState<string | null>(null);

  // Lesson Expansion State
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
          setIsAddingCategory(false);
          setNewCategoryName('');
      }
  };

  // --- Objective Management Handlers ---
  const handleAddObjective = () => {
    setObjectives(prev => [...prev, '']);
  };

  const handleObjectiveChange = (index: number, val: string) => {
    setObjectives(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(prev => prev.filter((_, i) => i !== index));
  };

  // --- Curriculum Management: Modules & Trimesters ---

  const addModule = () => {
      const newModuleId = `m-${Date.now()}`;
      const nextModNum = (formData.moduleList?.length || 0) + 1;
      const newModule: Module = {
          id: newModuleId,
          title: `Module ${nextModNum}: New Module`,
          trimesters: [
            {
              id: `t-${newModuleId}-1`,
              title: 'Trimester 1',
              isFree: nextModNum === 1, // First module's first trimester defaults to free preview
              lessons: [],
              order: 0,
            }
          ],
          lessons: []
      };
      setFormData(prev => ({ ...prev, moduleList: [...(prev.moduleList || []), newModule] }));
  };

  const updateModuleTitle = (idx: number, title: string) => {
      const newModules = [...(formData.moduleList || [])];
      newModules[idx].title = title;
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const deleteModule = (idx: number) => {
      const newModules = [...(formData.moduleList || [])];
      newModules.splice(idx, 1);
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const addTrimester = (moduleIdx: number) => {
      const newModules = [...(formData.moduleList || [])];
      const trimesters = [...(newModules[moduleIdx].trimesters || [])];
      const newTrimesterNum = trimesters.length + 1;
      const newTrimesterId = `t-${newModules[moduleIdx].id}-${Date.now()}`;
      const newTrimester: Trimester = {
          id: newTrimesterId,
          title: `Trimester ${newTrimesterNum}`,
          isFree: false,
          lessons: [],
          order: trimesters.length,
      };
      newModules[moduleIdx] = {
          ...newModules[moduleIdx],
          trimesters: [...trimesters, newTrimester],
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const updateTrimesterTitle = (moduleIdx: number, trimesterIdx: number, title: string) => {
      const newModules = [...(formData.moduleList || [])];
      if (newModules[moduleIdx]?.trimesters?.[trimesterIdx]) {
          newModules[moduleIdx].trimesters![trimesterIdx].title = title;
          setFormData(prev => ({ ...prev, moduleList: newModules }));
      }
  };

  const updateTrimesterAccess = (moduleIdx: number, trimesterIdx: number, isFree: boolean) => {
      const newModules = [...(formData.moduleList || [])];
      if (newModules[moduleIdx]?.trimesters?.[trimesterIdx]) {
          newModules[moduleIdx].trimesters![trimesterIdx].isFree = isFree;
          setFormData(prev => ({ ...prev, moduleList: newModules }));
      }
  };

  const moveTrimester = (moduleIdx: number, trimesterIdx: number, direction: 'up' | 'down') => {
      const newModules = [...(formData.moduleList || [])];
      const trimesters = [...(newModules[moduleIdx].trimesters || [])];
      const targetIdx = direction === 'up' ? trimesterIdx - 1 : trimesterIdx + 1;
      if (targetIdx < 0 || targetIdx >= trimesters.length) return;

      const temp = trimesters[trimesterIdx];
      trimesters[trimesterIdx] = trimesters[targetIdx];
      trimesters[targetIdx] = temp;
      trimesters.forEach((t, i) => (t.order = i));

      newModules[moduleIdx] = { ...newModules[moduleIdx], trimesters };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const deleteTrimester = (moduleIdx: number, trimesterIdx: number) => {
      const newModules = [...(formData.moduleList || [])];
      if (newModules[moduleIdx]?.trimesters) {
          newModules[moduleIdx].trimesters!.splice(trimesterIdx, 1);
          newModules[moduleIdx].trimesters!.forEach((t, i) => (t.order = i));
          setFormData(prev => ({ ...prev, moduleList: newModules }));
      }
  };

  // --- Lesson Management inside Trimester ---

  const addLessonToTrimester = (moduleIdx: number, trimesterIdx: number, type: 'video' | 'quiz' | 'reading') => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newLesson: Lesson = {
          id: newId,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          type: type,
          duration: '0:00',
          description: ''
      };
      const newModules = [...(formData.moduleList || [])];
      if (!newModules[moduleIdx].trimesters) {
          newModules[moduleIdx].trimesters = [];
      }
      if (!newModules[moduleIdx].trimesters![trimesterIdx]) {
          newModules[moduleIdx].trimesters![trimesterIdx] = {
              id: `t-${newModules[moduleIdx].id}-1`,
              title: 'Trimester 1',
              isFree: true,
              lessons: []
          };
      }
      newModules[moduleIdx].trimesters![trimesterIdx].lessons.push(newLesson);
      setFormData(prev => ({ ...prev, moduleList: newModules }));
      setExpandedLessonId(newId);
  };

  const updateLessonInTrimester = (
      moduleIdx: number,
      trimesterIdx: number,
      lessonIdx: number,
      field: keyof Lesson,
      value: any
  ) => {
      const newModules = [...(formData.moduleList || [])];
      const lesson = newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx];
      newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx] = {
          ...lesson,
          [field]: value
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const deleteLessonFromTrimester = (moduleIdx: number, trimesterIdx: number, lessonIdx: number) => {
      const newModules = [...(formData.moduleList || [])];
      newModules[moduleIdx].trimesters![trimesterIdx].lessons.splice(lessonIdx, 1);
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  // --- Lesson Resources Management ---

  const addResourceToLesson = (moduleIdx: number, trimesterIdx: number, lessonIdx: number) => {
      const newModules = [...(formData.moduleList || [])];
      const lesson = newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx];
      const newRes: LessonResource = {
          id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: '',
          url: '',
      };
      newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx] = {
          ...lesson,
          resources: [...(lesson.resources || []), newRes]
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const updateLessonResource = (
      moduleIdx: number,
      trimesterIdx: number,
      lessonIdx: number,
      resIdx: number,
      field: keyof LessonResource,
      value: string
  ) => {
      const newModules = [...(formData.moduleList || [])];
      const lesson = newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx];
      const resources = [...(lesson.resources || [])];
      resources[resIdx] = {
          ...resources[resIdx],
          [field]: value
      };
      newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx] = {
          ...lesson,
          resources
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const deleteLessonResource = (moduleIdx: number, trimesterIdx: number, lessonIdx: number, resIdx: number) => {
      const newModules = [...(formData.moduleList || [])];
      const lesson = newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx];
      const resources = [...(lesson.resources || [])];
      resources.splice(resIdx, 1);
      newModules[moduleIdx].trimesters![trimesterIdx].lessons[lessonIdx] = {
          ...lesson,
          resources
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const openQuizBuilder = (lessonId: string) => {
      setCurrentQuizLessonId(lessonId);
      setShowQuizBuilder(true);
  };

  const handleQuizSave = (quizData: QuizData) => {
      const newModules = [...(formData.moduleList || [])];
      for (const mod of newModules) {
          if (mod.trimesters) {
              for (const trim of mod.trimesters) {
                  const lessonIndex = trim.lessons.findIndex(l => l.id === currentQuizLessonId);
                  if (lessonIndex !== -1) {
                      trim.lessons[lessonIndex].quizData = quizData;
                      trim.lessons[lessonIndex].title = quizData.title;
                      break;
                  }
              }
          } else if (mod.lessons) {
              const lessonIndex = mod.lessons.findIndex(l => l.id === currentQuizLessonId);
              if (lessonIndex !== -1) {
                  mod.lessons[lessonIndex].quizData = quizData;
                  mod.lessons[lessonIndex].title = quizData.title;
                  break;
              }
          }
      }
      setFormData(prev => ({ ...prev, moduleList: newModules }));
      setShowQuizBuilder(false);
      setCurrentQuizLessonId(null);
  };

  const toggleLessonExpansion = (lessonId: string) => {
      setExpandedLessonId(prev => prev === lessonId ? null : lessonId);
  };

  // --- Submission ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.duration?.trim()) newErrors.duration = 'Duration is required';
    if (formData.price === undefined) newErrors.price = 'Price is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    
    const hasThumbnail = isEditMode ? (formData.thumbnail || thumbnail) : thumbnail;
    if (!hasThumbnail) newErrors.thumbnail = 'Course thumbnail is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Prepare serialized modules with nested trimesters & flat lessons fallback
      const serializedModules = (formData.moduleList || []).map((mod, modIdx) => {
        const normalizedTrimesters = (mod.trimesters && mod.trimesters.length > 0)
          ? mod.trimesters
          : [{
              id: `t-${mod.id || modIdx}-1`,
              title: 'Trimester 1',
              isFree: modIdx === 0,
              order: 0,
              lessons: mod.lessons || [],
            }];

        const cleanedTrimesters = normalizedTrimesters.map((trim, trimIdx) => ({
          id: trim.id,
          title: trim.title,
          description: trim.description || '',
          isFree: trim.isFree,
          order: trimIdx,
          lessons: (trim.lessons || []).map((lesson, lessonIdx) => {
            let cleanedQuizData = lesson.quizData;
            if (lesson.quizData && lesson.quizData.questions) {
              cleanedQuizData = {
                ...lesson.quizData,
                questions: lesson.quizData.questions
                  .filter((q: any) => q.text && q.text.trim())
                  .map((q: any) => ({
                    ...q,
                    options: (q.options || [])
                      .filter((opt: any) => opt.text && opt.text.trim())
                      .map((opt: any) => ({
                        id: opt.id || String(Math.random()),
                        text: opt.text,
                        isCorrect: opt.isCorrect || false,
                      })),
                  })),
              };
            }

            return {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description || '',
              type: lesson.type,
              duration: lesson.duration,
              videoUrl: lesson.videoUrl,
              content: lesson.content,
              quizData: cleanedQuizData,
              resources: (lesson.resources || [])
                .filter((r: any) => (r.title && r.title.trim()) || (r.url && r.url.trim()))
                .map((r: any) => ({
                  id: r.id || `res-${Math.random()}`,
                  title: (r.title || '').trim(),
                  url: (r.url || '').trim(),
                  type: r.type || 'link',
                })),
              order: lessonIdx,
              isFree: trim.isFree || (lessonIdx === 0 && trimIdx === 0 && modIdx === 0),
            };
          }),
        }));

        return {
          id: mod.id,
          title: mod.title,
          description: '',
          order: modIdx,
          trimesters: cleanedTrimesters,
          lessons: cleanedTrimesters.flatMap(t => t.lessons),
        };
      });

      // Resolve thumbnail: file upload, URL link, or current thumbnail
      let finalThumbnail = formData.thumbnail || '';
      if (thumbnail) {
        finalThumbnail = URL.createObjectURL(thumbnail);
      } else if (thumbnailUrl.trim()) {
        finalThumbnail = thumbnailUrl.trim();
      }

      const cleanedObjectives = objectives.map(o => o.trim()).filter(Boolean);

      const instructorPayload = {
        fullName: instructorName.trim() || 'Admin User',
        title: instructorTitle.trim() || 'Instructor',
        avatar: instructorAvatar.trim(),
      };

      const courseData = {
        title: formData.title || '',
        description: formData.description || '',
        shortDescription: formData.description?.substring(0, 300),
        category: mapCategory(formData.category || (categories && categories[0]) || 'Fondamentale'),
        level: formData.level || 'Beginner',
        showLevel: Boolean(formData.showLevel),
        price: Number(formData.price) || 0,
        thumbnail: finalThumbnail,
        totalDuration: formData.duration,
        isPublished: true,
        status: 'published',
        modules: serializedModules,
        tags: formData.tags || [],
        prerequisites: formData.prerequisites || [],
        objectives: cleanedObjectives,
        instructor: instructorPayload,
      };

      let savedCourse;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');
      if (isEditMode && courseId && isUUID) {
        const response = await coursesAPI.update(courseId, courseData);
        savedCourse = response.course;
      } else {
        const response = await coursesAPI.create(courseData);
        savedCourse = response.course;
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      const courseToSave: Course = {
          ...formData as Course,
          id: savedCourse._id || savedCourse.id,
          price: Number(formData.price),
          modules: formData.moduleList?.length || 0,
          moduleList: serializedModules,
          thumbnail: finalThumbnail,
          instructor: instructorPayload,
          objectives: cleanedObjectives,
          students: formData.students || 0,
          rating: formData.rating || 0,
          level: formData.level || 'Beginner',
          tags: formData.tags || [],
      };

      onSave(courseToSave, courseId);

      setTimeout(() => {
          navigate('/courses');
      }, 1500);
    } catch (error: any) {
      setIsSubmitting(false);
      setErrors({ submit: error.message || 'Failed to save course' });
      console.error('Error saving course:', error);
    }
  };

  const mapCategory = (category: string): string => {
    return category?.trim() || 'Other';
  };

  if (showQuizBuilder) {
      let currentQuiz: QuizData | undefined;
      if (currentQuizLessonId && formData.moduleList) {
          for (const mod of formData.moduleList) {
              const trimesters = mod.trimesters || [{ lessons: mod.lessons || [] }];
              for (const trim of trimesters) {
                  const lesson = trim.lessons.find((l: Lesson) => l.id === currentQuizLessonId);
                  if (lesson) {
                      currentQuiz = lesson.quizData;
                      break;
                  }
              }
              if (currentQuiz) break;
          }
      }

      return (
          <QuizBuilder 
              initialData={currentQuiz}
              onSave={handleQuizSave}
              onCancel={() => {
                  setShowQuizBuilder(false);
                  setCurrentQuizLessonId(null);
              }}
          />
      );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? t('editor.editTitle') : t('editor.createTitle')}</h1>
                <p className="text-gray-500 mt-1">{t('editor.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
                 <Link to="/courses" className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                     {t('editor.cancel')}
                 </Link>
                 <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                     {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     {isSubmitting ? t('editor.saving') : (isEditMode ? t('editor.updateCourse') : t('editor.publishCourse'))}
                 </button>
            </div>
        </div>

        {showSuccess && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3"
            >
                <Check className="p-1 bg-green-500 text-white rounded-full" size={24} />
                <div>
                    <h4 className="font-bold">{t('editor.saveSuccessTitle')}</h4>
                    <p className="text-sm">{t('editor.saveSuccessDesc')}</p>
                </div>
            </motion.div>
        )}

        {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
                <AlertCircle size={24} className="shrink-0" />
                <p className="text-sm">{errors.submit}</p>
            </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
            <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'basic' 
                    ? 'border-brand-blue text-brand-blue' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
                <Settings size={18} />
                {t('editor.tabCourseDetails')}
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('curriculum')}
                className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'curriculum' 
                    ? 'border-brand-blue text-brand-blue' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
                <Layers size={18} />
                {t('editor.tabCurriculum')}
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">
                    {formData.moduleList?.length || 0} {t('editor.modulesCount')}
                </span>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {activeTab === 'basic' && (
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.courseTitle')} <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                            placeholder={t('editor.courseTitlePlaceholder')}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">{t('editor.category')} <span className="text-red-500">*</span></label>
                                {!isAddingCategory && (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingCategory(true)}
                                        className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={12} /> {t('editor.addNewCategory')}
                                    </button>
                                )}
                            </div>
                            
                            {isAddingCategory ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder={t('editor.categoryNamePlaceholder')}
                                        className="flex-1 px-3 py-2 border border-brand-blue rounded-xl text-sm outline-none"
                                        autoFocus
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddCategorySubmit}
                                        className="px-3 py-2 bg-brand-blue text-white rounded-xl text-sm font-medium hover:bg-sky-600"
                                    >
                                        {t('editor.add')}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingCategory(false)}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                                    >
                                        {t('editor.cancel')}
                                    </button>
                                </div>
                            ) : (
                                <select 
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-brand-blue outline-none bg-white"
                                >
                                    {categories.map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">{t('editor.difficultyLevel')}</label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-medium select-none">
                                    <input 
                                        type="checkbox"
                                        name="showLevel"
                                        checked={Boolean(formData.showLevel)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, showLevel: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue/20 cursor-pointer"
                                    />
                                    <span>{t('editor.showDifficultyLevel')}</span>
                                </label>
                            </div>
                            <select 
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-brand-blue outline-none bg-white"
                            >
                                <option value="Beginner">{t('editor.levelBeginner')}</option>
                                <option value="Intermediate">{t('editor.levelIntermediate')}</option>
                                <option value="Advanced">{t('editor.levelAdvanced')}</option>
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {t('editor.showDifficultyLevelHelp')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.totalDuration')} <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder={t('editor.durationPlaceholder')}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.price')} <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.description')} <span className="text-red-500">*</span></label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none h-32 resize-none transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                            placeholder={t('editor.descriptionPlaceholder')}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('editor.tags')}</label>
                        <input 
                            type="text" 
                            value={formData.tags?.join(', ') || ''}
                            onChange={handleTagsChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-brand-blue outline-none"
                            placeholder={t('editor.tagsPlaceholder')} 
                        />
                    </div>

                    {/* Course Media Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{t('editor.mediaTitle')}</h3>
                                <p className="text-xs text-gray-500">{t('editor.mediaSubtitle')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thumbnail Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('editor.thumbnailLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('url')}
                                            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${thumbnailMode === 'url' ? 'bg-white text-brand-blue shadow-xs font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <LinkIcon size={12} /> {t('editor.linkUrl')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('upload')}
                                            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${thumbnailMode === 'upload' ? 'bg-white text-brand-blue shadow-xs font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Upload size={12} /> {t('editor.uploadFile')}
                                        </button>
                                    </div>
                                </div>

                                {thumbnailMode === 'url' ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="url"
                                                value={thumbnailUrl}
                                                onChange={(e) => {
                                                    setThumbnailUrl(e.target.value);
                                                    setFormData(prev => ({ ...prev, thumbnail: e.target.value }));
                                                    if (errors.thumbnail) setErrors(prev => ({ ...prev, thumbnail: '' }));
                                                }}
                                                placeholder={t('editor.thumbnailUrlPlaceholder')}
                                                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all ${errors.thumbnail ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                                            />
                                        </div>

                                        <div className="relative h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center group">
                                            {thumbnailUrl ? (
                                                <>
                                                    <img
                                                        src={thumbnailUrl}
                                                        alt="Thumbnail preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e: any) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                                                        }}
                                                    />
                                                    <div className="absolute top-2 right-2 flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setThumbnailUrl('');
                                                                setFormData(prev => ({ ...prev, thumbnail: '' }));
                                                            }}
                                                            className="p-1.5 bg-white/90 text-red-500 rounded-full hover:bg-white shadow-sm transition-transform hover:scale-105"
                                                            title={t('editor.clearImageLink')}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                                    <ImageIcon size={28} className="mb-1 text-gray-300" />
                                                    <p className="text-xs text-gray-500 font-medium">{t('editor.noImageProvided')}</p>
                                                    <p className="text-[11px] text-gray-400">{t('editor.pasteImageHint')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-44 ${errors.thumbnail ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-blue hover:bg-blue-50'}`}
                                    >
                                        {thumbnail ? (
                                            <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                <img src={URL.createObjectURL(thumbnail)} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}
                                                    className="absolute top-2 right-2 p-1 bg-white/90 text-red-500 rounded-full hover:bg-white shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : formData.thumbnail ? (
                                             <div className="relative w-full h-full rounded-lg overflow-hidden group">
                                                <img src={formData.thumbnail} alt="Current" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t('editor.clickToChange')}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <ImageIcon size={32} className="text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 text-center">{t('editor.clickToUploadThumbnail')}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('editor.recommendedThumbnailSize')}</p>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            ref={thumbnailInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setThumbnail(e.target.files[0]);
                                                    setErrors(prev => ({ ...prev, thumbnail: '' }));
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {errors.thumbnail && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.thumbnail}</p>}
                            </div>

                            {/* Promotional Video Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('editor.promoVideo')}</label>
                                <div 
                                    onClick={() => videoInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-blue-50 transition-colors h-44"
                                >
                                    {video ? (
                                        <div className="flex flex-col items-center justify-center gap-3 text-brand-blue font-medium h-full w-full">
                                            <FileVideo size={32} />
                                            <span className="truncate max-w-[200px] text-sm">{video.name}</span>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); setVideo(null); }}
                                                className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs hover:bg-red-200"
                                            >
                                                {t('editor.remove')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <FileVideo size={32} className="text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 text-center">{t('editor.clickToUploadVideo')}</p>
                                            <p className="text-xs text-gray-400 mt-1">{t('editor.videoFormats')}</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={videoInputRef} 
                                        className="hidden" 
                                        accept="video/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setVideo(e.target.files[0]);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructeur (Instructor Profile) Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center font-bold shrink-0">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">{t('editor.instructorSectionTitle')}</h3>
                                    <p className="text-xs text-gray-500">{t('editor.instructorSectionSubtitle')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                {/* Live Avatar Preview Card */}
                                <div className="md:col-span-3 flex flex-col items-center justify-center p-5 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                                    <div className="relative h-20 w-20 rounded-full overflow-hidden bg-sky-500 text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white ring-2 ring-brand-blue/30 mb-3">
                                        {instructorAvatar ? (
                                            <img
                                                src={instructorAvatar}
                                                alt="Instructor preview"
                                                className="w-full h-full object-cover"
                                                onError={(e: any) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName || 'Admin')}&background=0ea5e9&color=fff`;
                                                }}
                                            />
                                        ) : (
                                            <span>
                                                {(instructorName || 'Admin')
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 truncate max-w-full">{instructorName || 'Admin User'}</p>
                                    <p className="text-xs text-brand-blue font-medium truncate max-w-full">{instructorTitle || 'Instructor'}</p>
                                </div>

                                {/* Form Fields */}
                                <div className="md:col-span-9 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                                {t('editor.instructorName')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={instructorName}
                                                onChange={(e) => setInstructorName(e.target.value)}
                                                placeholder="e.g., Admin User"
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                                {t('editor.instructorTitle')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={instructorTitle}
                                                onChange={(e) => setInstructorTitle(e.target.value)}
                                                placeholder="e.g., Instructor, Professeur"
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            {t('editor.instructorAvatarUrl')}
                                        </label>
                                        <div className="relative">
                                            <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="url"
                                                value={instructorAvatar}
                                                onChange={(e) => setInstructorAvatar(e.target.value)}
                                                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white transition-all"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            {t('editor.instructorAvatarHint')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ce que vous apprendrez (What You Will Learn / Learning Objectives) Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="bg-gradient-to-br from-slate-50 to-green-50/30 rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">{t('editor.objectivesTitle')}</h3>
                                        <p className="text-xs text-gray-500">{t('editor.objectivesSubtitle')}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddObjective}
                                    className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                    <Plus size={14} /> {t('editor.addObjective')}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {objectives.map((obj, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs transition-all hover:border-gray-300">
                                        <CheckCircle2 size={18} className="text-green-500 shrink-0 ml-1.5" />
                                        <input
                                            type="text"
                                            value={obj}
                                            onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                                            placeholder={`${t('editor.objectivePlaceholder')} ${idx + 1}`}
                                            className="flex-1 text-sm text-gray-800 outline-none px-2 py-1 bg-transparent focus:ring-0"
                                        />
                                        {objectives.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveObjective(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('editor.deleteObjective')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {objectives.length === 0 && (
                                    <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white text-gray-400 text-sm">
                                        {t('editor.noObjectives')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'curriculum' && (
                 <div className="p-8 bg-slate-50 min-h-[500px] animate-in fade-in duration-300">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Information banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-3">
                            <Layers className="text-brand-blue mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="font-bold">{t('editor.trimesterBannerTitle')}</h4>
                                <p className="text-blue-700 text-xs mt-0.5">
                                    {t('editor.trimesterBannerSubtitle')}
                                </p>
                            </div>
                        </div>

                        {formData.moduleList?.map((module, mIdx) => {
                            const trimesters = module.trimesters && module.trimesters.length > 0
                                ? module.trimesters
                                : [{
                                    id: `t-${module.id}-1`,
                                    title: `${t('editor.trimester')} 1`,
                                    isFree: mIdx === 0,
                                    lessons: module.lessons || [],
                                    order: 0,
                                  }];

                            return (
                                <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                                    {/* Module Top Header */}
                                    <div className="bg-slate-100/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-brand-blue text-white text-xs font-bold shrink-0">
                                                M{mIdx + 1}
                                            </span>
                                            <input 
                                                type="text"
                                                value={module.title}
                                                onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                                                className="bg-transparent font-bold text-slate-800 text-base outline-none w-full border-b border-transparent hover:border-slate-300 focus:border-brand-blue transition-colors px-1"
                                                placeholder={t('editor.moduleTitlePlaceholder')}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                                                {trimesters.length} {trimesters.length === 1 ? t('editor.trimester') : t('editor.trimesters')}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => deleteModule(mIdx)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('editor.deleteModule')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Trimesters Container */}
                                    <div className="p-6 space-y-6">
                                        {trimesters.map((trimester, tIdx) => (
                                            <div 
                                                key={trimester.id} 
                                                className={`rounded-xl border transition-all ${
                                                    trimester.isFree 
                                                        ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' 
                                                        : 'border-amber-200 bg-amber-50/15 shadow-sm'
                                                }`}
                                            >
                                                {/* Trimester Header with Paywall / Access Control Toggle */}
                                                <div className={`p-4 border-b rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                    trimester.isFree 
                                                        ? 'bg-emerald-50/50 border-emerald-100' 
                                                        : 'bg-amber-50/50 border-amber-100'
                                                }`}>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {/* Reorder buttons */}
                                                        <div className="flex flex-col gap-0.5 text-slate-400">
                                                            <button 
                                                                type="button" 
                                                                disabled={tIdx === 0}
                                                                onClick={() => moveTrimester(mIdx, tIdx, 'up')}
                                                                className="hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                                                title={t('editor.moveUp')}
                                                            >
                                                                <ArrowUp size={12} />
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                disabled={tIdx === trimesters.length - 1}
                                                                onClick={() => moveTrimester(mIdx, tIdx, 'down')}
                                                                className="hover:text-brand-blue disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                                                title={t('editor.moveDown')}
                                                            >
                                                                <ArrowDown size={12} />
                                                            </button>
                                                        </div>

                                                        <input 
                                                            type="text" 
                                                            value={trimester.title}
                                                            onChange={(e) => updateTrimesterTitle(mIdx, tIdx, e.target.value)}
                                                            className="font-bold text-slate-900 text-sm bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-blue px-1 py-0.5 transition-colors w-full max-w-xs"
                                                            placeholder={`${t('editor.trimester')} ${tIdx + 1}`}
                                                        />
                                                    </div>

                                                    {/* Access Control Toggle & Badges */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Visual Badge */}
                                                        {trimester.isFree ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 shadow-sm">
                                                                <Unlock size={13} className="text-emerald-600" />
                                                                {t('editor.freePreview')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300/60 shadow-sm">
                                                                <Lock size={13} className="text-amber-600" />
                                                                {t('editor.paidRequired')}
                                                            </span>
                                                        )}

                                                        {/* Toggle Pill Switch */}
                                                        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTrimesterAccess(mIdx, tIdx, true)}
                                                                className={`px-2.5 py-1 rounded-md transition-all ${
                                                                    trimester.isFree
                                                                        ? 'bg-emerald-500 text-white shadow-sm'
                                                                        : 'text-slate-600 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {t('editor.free')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTrimesterAccess(mIdx, tIdx, false)}
                                                                className={`px-2.5 py-1 rounded-md transition-all ${
                                                                    !trimester.isFree
                                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                                        : 'text-slate-600 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {t('editor.locked')}
                                                            </button>
                                                        </div>

                                                        {/* Delete Trimester button */}
                                                        {trimesters.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteTrimester(mIdx, tIdx)}
                                                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                                title={t('editor.deleteTrimester')}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lessons in this Trimester */}
                                                <div className="p-4 space-y-3">
                                                    {trimester.lessons.length === 0 && (
                                                        <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                                                            {t('editor.noLessonsInTrimester')}
                                                        </div>
                                                    )}

                                                    {trimester.lessons.map((lesson, lIdx) => (
                                                        <div key={lesson.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                                                            {/* Lesson Header / Summary */}
                                                            <div className="flex items-center gap-3 p-3">
                                                                <div className="text-slate-400">
                                                                    {lesson.type === 'video' ? <FileVideo size={18} className="text-brand-blue" /> : lesson.type === 'quiz' ? <AlertCircle size={18} className="text-brand-orange" /> : <BookOpen size={18} className="text-emerald-600" />}
                                                                </div>
                                                                <div className="flex-1 font-medium text-slate-800 text-sm">
                                                                    {lesson.title}
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">{lesson.duration || '0:00'}</span>
                                                                    
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => toggleLessonExpansion(lesson.id)}
                                                                        className={`p-1.5 rounded-full transition-colors ${expandedLessonId === lesson.id ? 'bg-blue-100 text-brand-blue' : 'hover:bg-slate-100 text-slate-500'}`}
                                                                    >
                                                                        {expandedLessonId === lesson.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </button>

                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => deleteLessonFromTrimester(mIdx, tIdx, lIdx)}
                                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                                        title={t('editor.deleteLesson')}
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Expanded Detail Editor */}
                                                            <AnimatePresence>
                                                                {expandedLessonId === lesson.id && (
                                                                    <motion.div 
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="border-t border-slate-100 bg-slate-50/50 p-4"
                                                                    >
                                                                        <div className="space-y-4">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('editor.lessonTitle')}</label>
                                                                                    <input 
                                                                                        type="text" 
                                                                                        value={lesson.title}
                                                                                        onChange={(e) => updateLessonInTrimester(mIdx, tIdx, lIdx, 'title', e.target.value)}
                                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-blue outline-none bg-white"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('editor.duration')}</label>
                                                                                    <div className="relative">
                                                                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                                        <input 
                                                                                            type="text" 
                                                                                            value={lesson.duration}
                                                                                            onChange={(e) => updateLessonInTrimester(mIdx, tIdx, lIdx, 'duration', e.target.value)}
                                                                                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-blue outline-none bg-white"
                                                                                            placeholder="e.g. 10:00"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><AlignLeft size={14} /> {t('editor.description')}</label>
                                                                                <textarea 
                                                                                    value={lesson.description || ''}
                                                                                    onChange={(e) => updateLessonInTrimester(mIdx, tIdx, lIdx, 'description', e.target.value)}
                                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-blue outline-none h-20 resize-none bg-white"
                                                                                    placeholder={t('editor.lessonDescPlaceholder')}
                                                                                />
                                                                            </div>

                                                                            {lesson.type === 'video' && (
                                                                                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                                                                                    <label className="block text-xs font-bold text-brand-blue uppercase mb-2">{t('editor.videoSource')}</label>
                                                                                    <input 
                                                                                        type="text" 
                                                                                        value={lesson.videoUrl || ''}
                                                                                        onChange={(e) => updateLessonInTrimester(mIdx, tIdx, lIdx, 'videoUrl', e.target.value)}
                                                                                        className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:border-brand-blue outline-none bg-white"
                                                                                        placeholder={t('editor.videoUrlPlaceholder')}
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {lesson.type === 'reading' && (
                                                                                <div>
                                                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('editor.readingContent')}</label>
                                                                                    <textarea 
                                                                                        value={lesson.content || ''}
                                                                                        onChange={(e) => updateLessonInTrimester(mIdx, tIdx, lIdx, 'content', e.target.value)}
                                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand-blue outline-none h-24 bg-white"
                                                                                        placeholder={t('editor.readingPlaceholder')}
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {lesson.type === 'quiz' && (
                                                                                <div className="mt-2">
                                                                                    <button 
                                                                                        type="button" 
                                                                                        onClick={() => openQuizBuilder(lesson.id)}
                                                                                        className="w-full py-2 bg-brand-orange text-white font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                                                                                    >
                                                                                        <Edit2 size={16} /> {t('editor.openQuizBuilder')}
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            {/* Lesson Resources Section */}
                                                                            <div className="pt-3 border-t border-slate-200/80">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                                                        <Paperclip size={14} className="text-brand-orange" />
                                                                                        {t('editor.lessonResources')}
                                                                                        {lesson.resources && lesson.resources.length > 0 && (
                                                                                            <span className="px-1.5 py-0.2 bg-orange-100 text-brand-orange rounded-full text-[10px] font-extrabold">
                                                                                                {lesson.resources.length}
                                                                                            </span>
                                                                                        )}
                                                                                    </label>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => addResourceToLesson(mIdx, tIdx, lIdx)}
                                                                                        className="text-xs font-bold text-brand-blue hover:text-sky-600 flex items-center gap-1 transition-colors"
                                                                                    >
                                                                                        <Plus size={13} /> {t('editor.addResource')}
                                                                                    </button>
                                                                                </div>

                                                                                {(!lesson.resources || lesson.resources.length === 0) ? (
                                                                                    <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                                                                        {t('editor.noLessonResources')}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="space-y-2">
                                                                                        {lesson.resources.map((res, rIdx) => (
                                                                                            <div key={res.id || rIdx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                                                                <div className="flex items-center justify-between gap-2">
                                                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                                                                        <FileText size={14} className="text-brand-orange" />
                                                                                                        <span>{t('editor.lessonResources')} #{rIdx + 1}</span>
                                                                                                    </div>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => deleteLessonResource(mIdx, tIdx, lIdx, rIdx)}
                                                                                                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                                                                                                        title={t('editor.deleteResource')}
                                                                                                    >
                                                                                                        <Trash2 size={14} />
                                                                                                    </button>
                                                                                                </div>
                                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                                    <div>
                                                                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{t('editor.resourceTitle')}</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={res.title}
                                                                                                            onChange={(e) => updateLessonResource(mIdx, tIdx, lIdx, rIdx, 'title', e.target.value)}
                                                                                                            placeholder={t('editor.resourceTitlePlaceholder')}
                                                                                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-blue"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">{t('editor.resourceUrl')}</label>
                                                                                                        <div className="relative">
                                                                                                            <LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={res.url}
                                                                                                                onChange={(e) => updateLessonResource(mIdx, tIdx, lIdx, rIdx, 'url', e.target.value)}
                                                                                                                placeholder={t('editor.resourceUrlPlaceholder')}
                                                                                                                className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-blue font-mono"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Trimester Lesson Actions */}
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => addLessonToTrimester(mIdx, tIdx, 'video')} 
                                                            className="px-3 py-1.5 text-xs font-semibold border border-dashed border-blue-300 text-brand-blue bg-blue-50/50 rounded-lg hover:bg-blue-100/70 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={13} /> {t('editor.addVideo')}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => addLessonToTrimester(mIdx, tIdx, 'reading')} 
                                                            className="px-3 py-1.5 text-xs font-semibold border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/50 rounded-lg hover:bg-emerald-100/70 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={13} /> {t('editor.addReading')}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => addLessonToTrimester(mIdx, tIdx, 'quiz')} 
                                                            className="px-3 py-1.5 text-xs font-semibold border border-dashed border-amber-300 text-amber-700 bg-amber-50/50 rounded-lg hover:bg-amber-100/70 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={13} /> {t('editor.addQuiz')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Trimester Button inside Module */}
                                        <button
                                            type="button"
                                            onClick={() => addTrimester(mIdx)}
                                            className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 text-xs font-bold hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Plus size={16} />
                                            {t('editor.addTrimester')} {mIdx + 1}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Module Button */}
                        <button 
                            type="button" 
                            onClick={addModule}
                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-bold hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xs"
                        >
                            <Plus size={20} />
                            {t('admin.addModule')}
                        </button>
                    </div>
                 </div>
            )}
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                 <Link to="/courses" className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200/60 rounded-xl transition-colors">{t('editor.cancel')}</Link>
                 <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSubmitting ? t('editor.saving') : (isEditMode ? t('editor.updateCourse') : t('editor.createCourse'))}
                 </button>
            </div>
        </form>
    </div>
  );
};