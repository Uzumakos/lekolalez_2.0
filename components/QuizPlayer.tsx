import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QuizData, Question, AnswerOption } from '../types';
import { CheckCircle, XCircle, Clock, Award, AlertCircle, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';

interface QuizPlayerProps {
  quizData: QuizData;
  onComplete?: (score: number, passed: boolean) => void;
}

interface UserAnswer {
  questionId: string;
  selectedIds: string[]; // For single, multiple, true-false
  textAnswer?: string; // For text questions
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizData, onComplete }) => {
  const { t } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quizData.timeLimit ? quizData.timeLimit * 60 : null
  );

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAnswer = (): UserAnswer | undefined => {
    return userAnswers.find((a) => a.questionId === currentQuestion?.id);
  };

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted || !currentQuestion) return;

    setUserAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === currentQuestion.id);

      if (currentQuestion.type === 'multiple') {
        // Multiple selection
        const currentIds = existing?.selectedIds || [];
        const newIds = currentIds.includes(optionId)
          ? currentIds.filter((id) => id !== optionId)
          : [...currentIds, optionId];

        if (existing) {
          return prev.map((a) =>
            a.questionId === currentQuestion.id ? { ...a, selectedIds: newIds } : a
          );
        }
        return [...prev, { questionId: currentQuestion.id, selectedIds: newIds }];
      } else {
        // Single selection (single, true-false)
        if (existing) {
          return prev.map((a) =>
            a.questionId === currentQuestion.id ? { ...a, selectedIds: [optionId] } : a
          );
        }
        return [...prev, { questionId: currentQuestion.id, selectedIds: [optionId] }];
      }
    });
  };

  const handleTextAnswer = (text: string) => {
    if (isSubmitted || !currentQuestion) return;

    setUserAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === currentQuestion.id);
      if (existing) {
        return prev.map((a) =>
          a.questionId === currentQuestion.id ? { ...a, textAnswer: text } : a
        );
      }
      return [...prev, { questionId: currentQuestion.id, selectedIds: [], textAnswer: text }];
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    setShowResults(true);
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setIsSubmitted(false);
    setShowResults(false);
    setTimeLeft(quizData.timeLimit ? quizData.timeLimit * 60 : null);
  };

  // Calculate score
  const { score, totalPoints, percentage, passed } = useMemo(() => {
    if (!isSubmitted) return { score: 0, totalPoints: 0, percentage: 0, passed: false };

    let earnedPoints = 0;
    let total = 0;

    questions.forEach((q) => {
      total += q.points || 1;
      const answer = userAnswers.find((a) => a.questionId === q.id);

      if (q.type === 'text') {
        // For text questions, check if answer contains any correct keyword
        const correctKeywords = q.options
          .filter((o) => o.isCorrect)
          .map((o) => o.text.toLowerCase());
        const userText = (answer?.textAnswer || '').toLowerCase();
        const hasCorrectKeyword = correctKeywords.some((kw) => userText.includes(kw));
        if (hasCorrectKeyword) earnedPoints += q.points || 1;
      } else {
        // For choice questions
        const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        const selectedIds = answer?.selectedIds || [];

        if (q.type === 'multiple') {
          // All correct must be selected, no incorrect
          const allCorrectSelected = correctIds.every((id) => selectedIds.includes(id));
          const noIncorrectSelected = selectedIds.every((id) => correctIds.includes(id));
          if (allCorrectSelected && noIncorrectSelected) earnedPoints += q.points || 1;
        } else {
          // Single or true-false
          if (selectedIds.length === 1 && correctIds.includes(selectedIds[0])) {
            earnedPoints += q.points || 1;
          }
        }
      }
    });

    const pct = total > 0 ? Math.round((earnedPoints / total) * 100) : 0;
    const didPass = pct >= (quizData.passingScore || 70);

    return { score: earnedPoints, totalPoints: total, percentage: pct, passed: didPass };
  }, [isSubmitted, questions, userAnswers, quizData.passingScore]);

  // Trigger confetti and call onComplete when quiz is submitted
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (isSubmitted) {
      if (passed && !confettiFiredRef.current) {
        confettiFiredRef.current = true;
        
        // Initial center burst
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        });

        // Left and right side fireworks
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors: ['#0284c7', '#10b981', '#f59e0b', '#ec4899'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors: ['#0284c7', '#10b981', '#f59e0b', '#ec4899'],
          });
        }, 250);
      }

      if (onComplete) {
        onComplete(percentage, passed);
      }
    } else {
      confettiFiredRef.current = false;
    }
  }, [isSubmitted, percentage, passed, onComplete]);

  const isOptionSelected = (optionId: string): boolean => {
    const answer = getCurrentAnswer();
    return answer?.selectedIds.includes(optionId) || false;
  };

  const isOptionCorrect = (option: AnswerOption): boolean => {
    return option.isCorrect;
  };

  const getOptionStyle = (option: AnswerOption) => {
    const selected = isOptionSelected(option.id);

    if (!isSubmitted) {
      return selected
        ? 'border-brand-blue bg-blue-50 ring-2 ring-brand-blue'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }

    // After submission
    if (option.isCorrect) {
      return 'border-green-500 bg-green-50';
    }
    if (selected && !option.isCorrect) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-60';
  };

  if (!questions.length) {
    return (
      <div className="bg-gray-100 rounded-2xl p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">{t('quiz.noQuestions')}</h3>
        <p className="text-gray-500">{t('quiz.noQuestionsDesc')}</p>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {passed ? (
              <Award size={40} className="text-green-600" />
            ) : (
              <XCircle size={40} className="text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? t('quiz.congratsTitle') : t('quiz.failTitle')}
          </h2>
          <p className="text-gray-600">
            {passed
              ? t('quiz.congratsSubtitle')
              : t('quiz.failSubtitle').replace('{score}', String(quizData.passingScore || 70))}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-blue">{percentage}%</div>
              <div className="text-sm text-gray-500">{t('quiz.score')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {score}/{totalPoints}
              </div>
              <div className="text-sm text-gray-500">{t('quiz.pointsLabel')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {userAnswers.length}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-500">{t('quiz.answered')}</div>
            </div>
          </div>
        </div>

        {/* Review Questions */}
        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-gray-800">{t('quiz.reviewAnswers')}</h3>
          {questions.map((q, idx) => {
            const answer = userAnswers.find((a) => a.questionId === q.id);
            const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
            const selectedIds = answer?.selectedIds || [];
            const isCorrect =
              q.type === 'text'
                ? q.options
                    .filter((o) => o.isCorrect)
                    .some((o) => (answer?.textAnswer || '').toLowerCase().includes(o.text.toLowerCase()))
                : correctIds.every((id) => selectedIds.includes(id)) &&
                  selectedIds.every((id) => correctIds.includes(id));

            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      {idx + 1}. {q.text}
                    </p>
                    {q.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleRestartQuiz}
          className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          {t('quiz.retakeQuiz')}
        </button>
      </motion.div>
    );
  }

  // Quiz Questions Screen
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{quizData.title}</h2>
          <p className="text-sm text-gray-500">{quizData.description}</p>
        </div>
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
              timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {t('quiz.questionOf')
              .replace('{current}', String(currentQuestionIndex + 1))
              .replace('{total}', String(totalQuestions))}
          </span>
          <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-blue"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-6"
        >
          <div className="flex items-start gap-3 mb-6">
            <span className="bg-brand-blue text-white px-3 py-1 rounded-lg font-bold text-sm shrink-0">
              Q{currentQuestionIndex + 1}
            </span>
            <div>
              <p className="text-lg font-medium text-gray-900">{currentQuestion?.text}</p>
              <p className="text-sm text-gray-500 mt-1">
                {currentQuestion?.type === 'multiple'
                  ? t('quiz.selectAllThatApply')
                  : currentQuestion?.type === 'text'
                  ? t('quiz.typeYourAnswer')
                  : t('quiz.selectOneAnswer')}
                {currentQuestion?.points && (
                  <span className="ml-2 text-brand-blue">({currentQuestion.points} pts)</span>
                )}
              </p>
            </div>
          </div>

          {/* Options */}
          {currentQuestion?.type === 'text' ? (
            <textarea
              value={getCurrentAnswer()?.textAnswer || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder={t('quiz.typePlaceholder')}
              className="w-full p-4 border border-gray-200 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none resize-none h-32"
              disabled={isSubmitted}
            />
          ) : (
            <div className="space-y-3">
              {currentQuestion?.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isSubmitted}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${getOptionStyle(
                    option
                  )}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isOptionSelected(option.id)
                        ? 'border-brand-blue bg-brand-blue'
                        : 'border-gray-300'
                    }`}
                  >
                    {isOptionSelected(option.id) && (
                      <CheckCircle size={16} className="text-white" fill="currentColor" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{option.text}</span>
                  {isSubmitted && option.isCorrect && (
                    <CheckCircle size={20} className="ml-auto text-green-500" />
                  )}
                  {isSubmitted && isOptionSelected(option.id) && !option.isCorrect && (
                    <XCircle size={20} className="ml-auto text-red-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
          {t('quiz.previous')}
        </button>

        <div className="flex gap-2">
          {questions.map((_, idx) => {
            const answered = userAnswers.some((a) => a.questionId === questions[idx].id);
            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-brand-blue text-white'
                    : answered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="flex items-center gap-2 px-6 py-2 bg-brand-orange text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            {t('quiz.submitQuiz')}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-4 py-2 text-brand-blue hover:text-sky-600 font-medium transition-colors"
          >
            {t('quiz.next')}
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
