import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, GripVertical, AlertCircle, Save } from 'lucide-react';
import { QuizData, Question, AnswerOption, QuestionType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuizBuilderProps {
  initialData?: QuizData;
  onSave: (data: QuizData) => void;
  onCancel: () => void;
}

const DEFAULT_QUESTION: Question = {
  id: '',
  type: 'single',
  text: '',
  points: 10,
  options: [
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ]
};

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [quizDetails, setQuizDetails] = useState<QuizData>(initialData || {
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    description: '',
    passingScore: 70,
    questions: []
  });

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const activeQuestion = quizDetails.questions.find(q => q.id === activeQuestionId);

  const addQuestion = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newQuestion: Question = {
      ...DEFAULT_QUESTION,
      id: newId,
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
      ]
    };
    setQuizDetails(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionId(newId);
  };

  const removeQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuizDetails(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const updateQuestion = (field: keyof Question, value: any) => {
    if (!activeQuestionId) return;
    setQuizDetails(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === activeQuestionId ? { ...q, [field]: value } : q)
    }));
  };

  const addOption = () => {
    if (!activeQuestionId) return;
    setQuizDetails(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === activeQuestionId) {
          return {
            ...q,
            options: [...q.options, { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }]
          };
        }
        return q;
      })
    }));
  };

  const updateOption = (optionId: string, field: keyof AnswerOption, value: any) => {
    if (!activeQuestionId) return;
    setQuizDetails(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === activeQuestionId) {
          // Logic for single choice: if marking correct, unmark others
          let newOptions = [...q.options];
          if (field === 'isCorrect' && value === true && q.type === 'single') {
             newOptions = newOptions.map(o => ({ ...o, isCorrect: false }));
          }
          
          newOptions = newOptions.map(o => o.id === optionId ? { ...o, [field]: value } : o);
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const removeOption = (optionId: string) => {
     if (!activeQuestionId) return;
     setQuizDetails(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === activeQuestionId ? { ...q, options: q.options.filter(o => o.id !== optionId) } : q)
    }));
  };

  const handleSave = () => {
    // Basic Validation
    if (!quizDetails.title.trim()) {
        alert("Please enter a quiz title");
        return;
    }
    if (quizDetails.questions.length === 0) {
        alert("Please add at least one question");
        return;
    }
    onSave(quizDetails);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X size={24} />
            </button>
            <div>
                <h2 className="text-xl font-bold text-gray-800">{t('admin.quizBuilder')}</h2>
                <p className="text-xs text-gray-500">Create engaging assessments for your students</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/20"
            >
                <Save size={18} />
                Save Quiz
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Question List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100">
                 <input 
                    type="text" 
                    value={quizDetails.title}
                    onChange={(e) => setQuizDetails({...quizDetails, title: e.target.value})}
                    placeholder="Quiz Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-blue outline-none font-bold text-gray-800"
                 />
                 <div className="mt-2 flex gap-2">
                     <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Passing %</label>
                        <input 
                            type="number" 
                            value={quizDetails.passingScore}
                            onChange={(e) => setQuizDetails({...quizDetails, passingScore: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-brand-blue outline-none"
                        />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Time (min)</label>
                        <input 
                            type="number" 
                            value={quizDetails.timeLimit || 0}
                            onChange={(e) => setQuizDetails({...quizDetails, timeLimit: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-brand-blue outline-none"
                        />
                     </div>
                 </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {quizDetails.questions.map((q, idx) => (
                    <motion.div 
                        key={q.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setActiveQuestionId(q.id)}
                        className={`p-3 rounded-xl border cursor-pointer group transition-all relative ${
                            activeQuestionId === q.id 
                            ? 'bg-blue-50 border-brand-blue shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-brand-blue/50'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold uppercase ${activeQuestionId === q.id ? 'text-brand-blue' : 'text-gray-500'}`}>
                                Question {idx + 1}
                            </span>
                            <button 
                                onClick={(e) => removeQuestion(q.id, e)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2 font-medium">
                            {q.text || "New Question"}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                             <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">{q.type}</span>
                        </div>
                    </motion.div>
                ))}

                <button 
                    onClick={addQuestion}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    {t('quiz.addQuestion')}
                </button>
            </div>
        </div>

        {/* Main Content: Editor */}
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
             {activeQuestion ? (
                 <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-in fade-in zoom-in duration-200 key={activeQuestionId}">
                     <div className="flex justify-between items-start mb-6">
                         <div>
                             <h3 className="text-xl font-bold text-gray-800">Edit Question</h3>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-sm text-gray-500">Points:</span>
                             <input 
                                type="number" 
                                value={activeQuestion.points}
                                onChange={(e) => updateQuestion('points', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-bold"
                             />
                         </div>
                     </div>

                     <div className="space-y-6">
                         {/* Question Type */}
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">{t('quiz.questionType')}</label>
                             <div className="grid grid-cols-4 gap-3">
                                 {[
                                     { id: 'single', label: 'Single Choice' },
                                     { id: 'multiple', label: 'Multiple Choice' },
                                     { id: 'true-false', label: 'True / False' },
                                     { id: 'text', label: 'Short Answer' },
                                 ].map(type => (
                                     <button
                                        key={type.id}
                                        onClick={() => updateQuestion('type', type.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                            activeQuestion.type === type.id 
                                            ? 'bg-brand-blue text-white border-brand-blue' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                     >
                                         {type.label}
                                     </button>
                                 ))}
                             </div>
                         </div>

                         {/* Question Text */}
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                             <textarea 
                                value={activeQuestion.text}
                                onChange={(e) => updateQuestion('text', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none h-32"
                                placeholder="What is the capital of Haiti?"
                             ></textarea>
                         </div>

                         {/* Options Editor */}
                         {activeQuestion.type !== 'text' && (
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">{t('quiz.options')}</label>
                                 <div className="space-y-3">
                                     <AnimatePresence>
                                         {activeQuestion.options.map((option, idx) => (
                                             <motion.div 
                                                key={option.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-3 group"
                                             >
                                                 <div className="pt-2 cursor-grab text-gray-300 hover:text-gray-500">
                                                     <GripVertical size={20} />
                                                 </div>
                                                 
                                                 {/* Correct Toggle */}
                                                 <button 
                                                    onClick={() => updateOption(option.id, 'isCorrect', !option.isCorrect)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        option.isCorrect 
                                                        ? 'bg-green-500 border-green-500 text-white' 
                                                        : 'border-gray-300 text-transparent hover:border-green-400'
                                                    }`}
                                                    title={t('quiz.correctAnswer')}
                                                 >
                                                     <Check size={14} strokeWidth={3} />
                                                 </button>

                                                 <input 
                                                    type="text" 
                                                    value={option.text}
                                                    onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                                                    className={`flex-1 px-4 py-2 border rounded-xl outline-none transition-all ${
                                                        option.isCorrect 
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-gray-300 focus:border-brand-blue'
                                                    }`}
                                                    placeholder={`Option ${idx + 1}`}
                                                 />

                                                 <button 
                                                    onClick={() => removeOption(option.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                 >
                                                     <X size={18} />
                                                 </button>
                                             </motion.div>
                                         ))}
                                     </AnimatePresence>
                                 </div>
                                 <button 
                                    onClick={addOption}
                                    className="mt-4 text-sm font-bold text-brand-blue hover:text-sky-600 flex items-center gap-1"
                                 >
                                     <Plus size={16} /> Add Option
                                 </button>
                             </div>
                         )}
                         
                         {/* Explanation */}
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                             <input 
                                type="text"
                                value={activeQuestion.explanation || ''}
                                onChange={(e) => updateQuestion('explanation', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue outline-none"
                                placeholder="Explain why the answer is correct..."
                             />
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <AlertCircle size={48} className="mb-4 text-gray-300" />
                     <p className="text-lg">Select a question to edit or add a new one.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};