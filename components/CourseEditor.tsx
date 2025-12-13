import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, FileVideo, Image as ImageIcon, AlertCircle, Plus, Check, Loader2, Save, Trash2, Edit2, List, Settings, X, ChevronDown, ChevronUp, Youtube, Upload, Clock, AlignLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Course, Module, Lesson, QuizData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { QuizBuilder } from './QuizBuilder';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseEditorProps {
  courses: Course[];
  onSave: (course: Course) => void;
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
  const [formData, setFormData] = useState<Partial<Course>>(existingCourse || {
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    category: 'Development',
    level: 'Beginner',
    duration: '',
    price: 0,
    description: '',
    prerequisites: [],
    tags: [],
    moduleList: []
  });

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

  useEffect(() => {
    if (isEditMode && existingCourse) {
        setFormData(existingCourse);
    }
  }, [isEditMode, existingCourse]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const tags = e.target.value.split(',').map(tag => tag.trim());
      setFormData(prev => ({ ...prev, tags }));
  };

  const handlePrereqsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const prereqs = e.target.value.split('\n').filter(p => p.trim() !== '');
      setFormData(prev => ({ ...prev, prerequisites: prereqs }));
  };

  const handleAddCategory = () => {
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
          setIsAddingCategory(false);
          setNewCategoryName('');
      }
  };

  // --- Curriculum Management ---
  const addModule = () => {
      const newModule: Module = {
          id: Math.random().toString(36).substr(2, 9),
          title: `Module ${(formData.moduleList?.length || 0) + 1}`,
          lessons: []
      };
      setFormData(prev => ({ ...prev, moduleList: [...(prev.moduleList || []), newModule] }));
  };

  const updateModuleTitle = (idx: number, title: string) => {
      const newModules = [...(formData.moduleList || [])];
      newModules[idx].title = title;
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const addLesson = (moduleIdx: number, type: 'video' | 'quiz' | 'reading') => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newLesson: Lesson = {
          id: newId,
          title: `New ${type}`,
          type: type,
          duration: '0:00',
          description: ''
      };
      const newModules = [...(formData.moduleList || [])];
      newModules[moduleIdx].lessons.push(newLesson);
      setFormData(prev => ({ ...prev, moduleList: newModules }));
      // Automatically expand new lesson
      setExpandedLessonId(newId);
  };

  const updateLesson = (moduleIdx: number, lessonIdx: number, field: keyof Lesson, value: any) => {
      const newModules = [...(formData.moduleList || [])];
      newModules[moduleIdx].lessons[lessonIdx] = {
          ...newModules[moduleIdx].lessons[lessonIdx],
          [field]: value
      };
      setFormData(prev => ({ ...prev, moduleList: newModules }));
  };

  const openQuizBuilder = (lessonId: string) => {
      setCurrentQuizLessonId(lessonId);
      setShowQuizBuilder(true);
  };

  const handleQuizSave = (quizData: QuizData) => {
      // Find the lesson and attach quizData
      const newModules = [...(formData.moduleList || [])];
      for (const mod of newModules) {
          const lessonIndex = mod.lessons.findIndex(l => l.id === currentQuizLessonId);
          if (lessonIndex !== -1) {
              mod.lessons[lessonIndex].quizData = quizData;
              mod.lessons[lessonIndex].title = quizData.title; // Sync title
              break;
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
    
    // For new courses, require media (simplified check)
    const hasThumbnail = isEditMode ? (formData.thumbnail || thumbnail) : thumbnail;
    if (!hasThumbnail) newErrors.thumbnail = 'Course thumbnail is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API upload
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      const courseToSave: Course = {
          ...formData as Course,
          price: Number(formData.price), // Fix: Convert string from input to number
          modules: formData.moduleList?.length || 0, // Sync count
          // In real app, we would upload files and get URLs here
          thumbnail: thumbnail ? URL.createObjectURL(thumbnail) : formData.thumbnail || '',
          // Add default values for required fields if missing
          instructor: formData.instructor || 'Administrator',
          students: formData.students || 0,
          rating: formData.rating || 0,
          level: formData.level || 'Beginner',
          tags: formData.tags || [],
      };
      
      onSave(courseToSave);
      
      setTimeout(() => {
          navigate('/courses');
      }, 1500);
    }, 2000);
  };

  if (showQuizBuilder) {
      // Find current quiz data if existing
      let currentQuiz: QuizData | undefined;
      if (currentQuizLessonId && formData.moduleList) {
          for (const mod of formData.moduleList) {
              const lesson = mod.lessons.find(l => l.id === currentQuizLessonId);
              if (lesson) {
                  currentQuiz = lesson.quizData;
                  break;
              }
          }
      }

      return (
          <QuizBuilder 
              initialData={currentQuiz}
              onSave={handleQuizSave}
              onCancel={() => setShowQuizBuilder(false)}
          />
      );
  }

  if (showSuccess) {
     return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center mt-10">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Course {isEditMode ? 'Updated' : 'Created'} Successfully!</h2>
            <p className="text-gray-500 mb-8">Redirecting to courses list...</p>
        </div>
     );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? t('admin.editCourse') : t('admin.createCourse')}</h1>
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('basic')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'basic' ? 'bg-brand-blue text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    {t('admin.basicInfo')}
                </button>
                <button 
                    onClick={() => setActiveTab('curriculum')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'curriculum' ? 'bg-brand-blue text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    {t('admin.curriculum')}
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {activeTab === 'basic' && (
                <div className="p-8 space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                                placeholder="e.g., Advanced React Patterns" 
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            {isAddingCategory ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:border-brand-blue outline-none"
                                        placeholder="New Category Name"
                                        autoFocus
                                    />
                                    <button type="button" onClick={handleAddCategory} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600"><Check size={20} /></button>
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="p-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300"><X size={20} /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select 
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingCategory(true)}
                                        className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 border border-gray-200"
                                        title="Add New Category"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                            <select 
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all ${errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                                placeholder="e.g., 10h 30m" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) <span className="text-red-500">*</span></label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none h-32 resize-none transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-blue'}`}
                            placeholder="Describe what students will learn..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <input 
                            type="text" 
                            value={formData.tags?.join(', ') || ''}
                            onChange={handleTagsChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-brand-blue outline-none"
                            placeholder="e.g., React, Frontend, Web Development" 
                        />
                    </div>

                    {/* New Course Media Section */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Course Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thumbnail Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image <span className="text-red-500">*</span></label>
                                <div 
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-48 ${errors.thumbnail ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-blue hover:bg-blue-50'}`}
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
                                                Click to Change
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} className="text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 text-center">Click to upload thumbnail</p>
                                            <p className="text-xs text-gray-400 mt-1">1280x720 recommended</p>
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
                                {errors.thumbnail && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.thumbnail}</p>}
                            </div>

                            {/* Video Preview Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Promotional Video</label>
                                <div 
                                    onClick={() => videoInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-blue-50 transition-colors h-48"
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
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <FileVideo size={32} className="text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 text-center">Click to upload video</p>
                                            <p className="text-xs text-gray-400 mt-1">MP4, WebM (Max 20MB)</p>
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
                </div>
            )}

            {activeTab === 'curriculum' && (
                 <div className="p-8 bg-gray-50 min-h-[500px] animate-in fade-in duration-300">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {formData.moduleList?.map((module, mIdx) => (
                            <div key={module.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <input 
                                        type="text"
                                        value={module.title}
                                        onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                                        className="bg-transparent font-bold text-gray-800 outline-none w-full"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const newModules = [...(formData.moduleList || [])];
                                            newModules.splice(mIdx, 1);
                                            setFormData({...formData, moduleList: newModules});
                                        }}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="p-4 space-y-3">
                                    {module.lessons.map((lesson, lIdx) => (
                                        <div key={lesson.id} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                            {/* Lesson Header / Summary */}
                                            <div className="flex items-center gap-3 p-3">
                                                <div className="text-gray-400">
                                                    {lesson.type === 'video' ? <FileVideo size={18} /> : lesson.type === 'quiz' ? <AlertCircle size={18} className="text-brand-orange" /> : <BookOpen size={18} />}
                                                </div>
                                                <div className="flex-1 font-medium text-gray-800 text-sm">
                                                    {lesson.title}
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{lesson.duration}</span>
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={() => toggleLessonExpansion(lesson.id)}
                                                        className={`p-1.5 rounded-full transition-colors ${expandedLessonId === lesson.id ? 'bg-blue-100 text-brand-blue' : 'hover:bg-gray-200 text-gray-500'}`}
                                                    >
                                                        {expandedLessonId === lesson.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>

                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const newModules = [...(formData.moduleList || [])];
                                                            newModules[mIdx].lessons.splice(lIdx, 1);
                                                            setFormData({...formData, moduleList: newModules});
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
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
                                                        className="border-t border-gray-100 bg-white p-4"
                                                    >
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={lesson.title}
                                                                        onChange={(e) => updateLesson(mIdx, lIdx, 'title', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-brand-blue outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label>
                                                                    <div className="relative">
                                                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                        <input 
                                                                            type="text"
                                                                            value={lesson.duration}
                                                                            onChange={(e) => updateLesson(mIdx, lIdx, 'duration', e.target.value)}
                                                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-brand-blue outline-none"
                                                                            placeholder="e.g. 10:00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><AlignLeft size={14} /> Description</label>
                                                                <textarea 
                                                                    value={lesson.description || ''}
                                                                    onChange={(e) => updateLesson(mIdx, lIdx, 'description', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-brand-blue outline-none h-24 resize-none"
                                                                    placeholder="Brief overview of this lesson..."
                                                                />
                                                            </div>

                                                            {lesson.type === 'video' && (
                                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-3">Video Source</label>
                                                                    
                                                                    <div className="flex flex-col gap-3">
                                                                        <div className="flex gap-4 mb-2">
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input 
                                                                                    type="radio" 
                                                                                    name={`videoType-${lesson.id}`}
                                                                                    defaultChecked={!lesson.videoUrl || lesson.videoUrl.includes('youtube')}
                                                                                    className="text-brand-blue focus:ring-brand-blue"
                                                                                />
                                                                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Youtube size={16} className="text-red-500" /> YouTube</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input 
                                                                                    type="radio" 
                                                                                    name={`videoType-${lesson.id}`}
                                                                                    defaultChecked={lesson.videoUrl && !lesson.videoUrl.includes('youtube')}
                                                                                    className="text-brand-blue focus:ring-brand-blue"
                                                                                />
                                                                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Upload size={16} className="text-brand-blue" /> Upload File</span>
                                                                            </label>
                                                                        </div>

                                                                        <input 
                                                                            type="text"
                                                                            value={lesson.videoUrl || ''}
                                                                            onChange={(e) => updateLesson(mIdx, lIdx, 'videoUrl', e.target.value)}
                                                                            className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:border-brand-blue outline-none bg-white"
                                                                            placeholder="Paste YouTube Link or Video URL here..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {lesson.type === 'quiz' && (
                                                                <div className="mt-2">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => openQuizBuilder(lesson.id)}
                                                                        className="w-full py-2 bg-brand-orange text-white font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <Edit2 size={16} /> Open Quiz Builder
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => addLesson(mIdx, 'video')} 
                                            className="px-3 py-1.5 text-xs font-medium border border-dashed border-gray-300 rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors"
                                        >
                                            + Video
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => addLesson(mIdx, 'reading')} 
                                            className="px-3 py-1.5 text-xs font-medium border border-dashed border-gray-300 rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors"
                                        >
                                            + Reading
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => addLesson(mIdx, 'quiz')} 
                                            className="px-3 py-1.5 text-xs font-medium border border-dashed border-brand-orange text-brand-orange rounded-lg hover:bg-orange-50 transition-colors"
                                        >
                                            + Quiz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            type="button"
                            onClick={addModule}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            {t('admin.addModule')}
                        </button>
                    </div>
                 </div>
            )}
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                 <Link to="/courses" className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</Link>
                 <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course')}
                 </button>
            </div>
        </form>
    </div>
  );
};