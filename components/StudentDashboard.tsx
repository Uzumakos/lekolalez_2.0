import React, { useState, useEffect, useMemo } from 'react';
import { Course, SiteContent, UserSubscription, SubscriptionDurationMonths, PaymentMethodType } from '../types';
import { getCourseProgress } from '../utils/courseUtils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Clock, Award, BookOpen, Flame, ArrowRight, Sparkles, ShieldCheck, AlertCircle, CheckCircle, Smartphone, CreditCard, Copy, Check, Calendar, ChevronRight, X, Loader2 } from 'lucide-react';
import { LearningCardSkeleton, CourseCardSkeleton } from './SkeletonLoader';
import { useLanguage } from '../contexts/LanguageContext';
import { subscriptionsAPI, videoAccessAPI } from '../services/api';
import supabase from '../services/supabaseClient';

interface StudentDashboardProps {
  courses: Course[];
  enrolledCourseIds: string[];
  completedLessons: Record<string, string[]>;
  isLoading?: boolean;
  currentUser?: any;
  siteContent?: SiteContent;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  courses,
  enrolledCourseIds,
  completedLessons,
  isLoading = false,
  currentUser,
  siteContent
}) => {
  const { t } = useLanguage();
  const enrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
  const recommendedCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));

  // Course selection for quota display (defaults to first enrolled course, or first available course, or 'all')
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return enrolledCourseIds[0] || (courses.length > 0 ? courses[0].id : 'all');
  });

  // Sync selected course when enrolled courses or courses are loaded
  useEffect(() => {
    if (selectedCourseId === 'all') {
      if (enrolledCourseIds.length > 0) {
        setSelectedCourseId(enrolledCourseIds[0]);
      } else if (courses.length > 0) {
        setSelectedCourseId(courses[0].id);
      }
    }
  }, [enrolledCourseIds, courses, selectedCourseId]);

  // Subscription state
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [isSubLoading, setIsSubLoading] = useState(true);

  // Daily Usage Tracker state
  const [dailyUsage, setDailyUsage] = useState<Record<string, number>>({});
  const dailyLimit = siteContent?.freeAccess?.videosPerSubjectPerDay || 1;

  // Upgrade / Renew Modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [modalDuration, setModalDuration] = useState<SubscriptionDurationMonths>(1);
  const [modalMethod, setModalMethod] = useState<PaymentMethodType>('moncash');
  const [modalTxCode, setModalTxCode] = useState('');
  const [modalCard, setModalCard] = useState({ number: '', expiry: '', cvc: '' });
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subNotice, setSubNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Stats calculations
  const totalCompletedLessons = Object.values(completedLessons).flat().length;

  // Pricing calculations
  const baseMonthlyPrice = 1.99;
  const exchangeRate = siteContent?.paymentGateways?.exchangeRateHTG || 132;
  const calculatedUSD = Number((baseMonthlyPrice * modalDuration).toFixed(2));
  const calculatedHTG = Math.round(calculatedUSD * exchangeRate);

  const moncashSettings = siteContent?.paymentGateways?.moncash || {
    isEnabled: true,
    merchantNumber: '+509 3700-0000',
    receiverName: 'Lekol Alez Haiti',
    instructions: 'Voye kòb la sou nimewo MonCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an epi kole li anba a.'
  };

  const natcashSettings = siteContent?.paymentGateways?.natcash || {
    isEnabled: true,
    merchantNumber: '+509 4000-0000',
    receiverName: 'Lekol Alez Haiti',
    instructions: 'Voye kòb la sou nimewo NatCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an epi kole li anba a.'
  };

  // Load subscription and daily usage on mount + live refresh
  useEffect(() => {
    if (!currentUser?.id) {
      setIsSubLoading(false);
      return;
    }

    const refreshDailyUsage = () => {
      const usage = videoAccessAPI.getTodayUsage(currentUser.id);
      if (usage && Object.keys(usage).length > 0) {
        setDailyUsage(prev => ({ ...prev, ...usage }));
      }

      videoAccessAPI.getTodayUsageAsync(currentUser.id).then(serverUsage => {
        if (serverUsage && Object.keys(serverUsage).length > 0) {
          setDailyUsage(prev => ({ ...prev, ...serverUsage }));
        }
      }).catch(() => {});
    };

    subscriptionsAPI.getCurrent(currentUser.id).then(res => {
      setCurrentSub(res.subscription);
    }).catch(() => {}).finally(() => {
      setIsSubLoading(false);
    });

    refreshDailyUsage();

    window.addEventListener('focus', refreshDailyUsage);
    window.addEventListener('storage', refreshDailyUsage);
    return () => {
      window.removeEventListener('focus', refreshDailyUsage);
      window.removeEventListener('storage', refreshDailyUsage);
    };
  }, [currentUser?.id]);

  // Handle copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Days remaining calculation
  const getRemainingDays = () => {
    if (!currentSub || !currentSub.endDate) return null;
    const end = new Date(currentSub.endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays();
  const isExpiringSoon = remainingDays !== null && remainingDays <= 10 && remainingDays > 0;
  const isExpired = remainingDays !== null && remainingDays === 0;
  const isPremiumActive = currentSub?.subscriptionStatus === 'active' && !isExpired;
  const isPendingVerification = currentSub?.subscriptionStatus === 'pending_verification';

  // Seamlessly remap legacy 'fondamentale' usage to 'français'
  useEffect(() => {
    if (dailyUsage['fondamentale']) {
      const fCount = Number(dailyUsage['fondamentale']) || 0;
      setDailyUsage(prev => {
        const next = { ...prev };
        delete next['fondamentale'];
        next['français'] = Math.max(Number(prev['français'] || 0), fCount);
        next['franse'] = Math.max(Number(prev['franse'] || 0), fCount);
        return next;
      });

      // Also migrate in Supabase database
      if (currentUser?.id) {
        supabase
          .from('daily_video_usage')
          .update({ subject: 'français' })
          .eq('user_id', currentUser.id)
          .eq('subject', 'fondamentale')
          .then(() => {}, () => {});
      }
    }
  }, [dailyUsage, currentUser?.id]);

  const cleanSubjectFromTitle = (title: string): string => {
    return (title || '').replace(/^\d+[\.\-\s:]+/, '').trim();
  };

  const standardSubjects = useMemo(() => [
    {
      id: 'math',
      name: t('subject.math'),
      synonyms: ['matematik', 'math', 'maths', 'mathématique', 'mathématiques', 'mathematics', 'algeb', 'aljèb', 'geometrie']
    },
    {
      id: 'french',
      name: t('subject.french'),
      synonyms: ['franse', 'français', 'francais', 'french', 'grammaire', 'littérature', 'fondamentale']
    },
    {
      id: 'creole',
      name: t('subject.creole'),
      synonyms: ['kreyol', 'kreyòl', 'creole', 'kreyol ayisyen']
    },
    {
      id: 'science',
      name: t('subject.science'),
      synonyms: ['syans', 'science', 'sciences', 'fizik', 'chimie', 'biology', 'biologie', 'svt']
    },
    {
      id: 'english',
      name: t('subject.english'),
      synonyms: ['angle', 'anglè', 'anglais', 'english', 'esl']
    },
    {
      id: 'computer',
      name: t('subject.computer'),
      synonyms: ['enformatik', 'enfòmatik', 'informatique', 'computer', 'tech', 'technology', 'development', 'programmation', 'coding', 'web']
    }
  ], [t]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Derive subjects to display: if a course is selected and has modules, show its modules
  const displayedSubjects = useMemo(() => {
    if (selectedCourse && selectedCourse.moduleList && selectedCourse.moduleList.length > 0) {
      return selectedCourse.moduleList.map((m: any, idx: number) => {
        const cleanTitle = cleanSubjectFromTitle(m.title || `Module ${idx + 1}`);
        const lowerTitle = cleanTitle.toLowerCase().trim();

        // Exact specific synonyms for the module (preventing collisions between Sciences Sociales and Sciences Expérimentales)
        const moduleSpecificSynonyms = [lowerTitle];
        if (lowerTitle.includes('social')) {
          moduleSpecificSynonyms.push('sociales', 'syans sosyal', 'social', 'histoire', 'géographie');
        } else if (lowerTitle.includes('expériment') || lowerTitle.includes('experim') || lowerTitle.includes('naturel')) {
          moduleSpecificSynonyms.push('expérimentales', 'experimentales', 'svt', 'syans eksperimantal', 'naturelles');
        } else if (lowerTitle.includes('math')) {
          moduleSpecificSynonyms.push('matematik', 'math', 'maths', 'mathématique', 'mathématiques');
        } else if (lowerTitle.includes('fran')) {
          moduleSpecificSynonyms.push('français', 'francais', 'franse', 'french');
        } else if (lowerTitle.includes('krey') || lowerTitle.includes('creol')) {
          moduleSpecificSynonyms.push('kreyòl', 'kreyol', 'creole');
        } else if (lowerTitle.includes('angl') || lowerTitle.includes('engl')) {
          moduleSpecificSynonyms.push('anglais', 'angle', 'anglè', 'english');
        } else if (lowerTitle.includes('info') || lowerTitle.includes('comp') || lowerTitle.includes('tech')) {
          moduleSpecificSynonyms.push('informatique', 'enformatik', 'tech', 'computer');
        }

        return {
          id: m.id || `mod-${idx}`,
          name: cleanTitle || m.title,
          originalTitle: m.title,
          synonyms: moduleSpecificSynonyms,
          courseId: selectedCourse.id,
          lessons: m.lessons || [],
        };
      });
    }
    return standardSubjects;
  }, [selectedCourse, standardSubjects]);

  const getSubjectUsageCount = (synonyms: string[], lessons?: any[], subjectCourseId?: string) => {
    let count = 0;
    const targetCourseId = subjectCourseId || selectedCourse?.id;

    // 1. Scoped keys ("courseId::subject")
    let hasScopedMatch = false;
    for (const [key, val] of Object.entries(dailyUsage)) {
      const cleanKey = key.toLowerCase().trim();
      if (cleanKey.includes('::')) {
        const [kCourseId, kSubject] = cleanKey.split('::');
        if (targetCourseId && kCourseId === targetCourseId) {
          if (synonyms.some(s => kSubject === s || kSubject.includes(s) || s.includes(kSubject))) {
            count = Math.max(count, Number(val) || 0);
            hasScopedMatch = true;
          }
        }
      }
    }

    // 2. Unscoped keys fallback (only if no scoped match was found for this course)
    if (!hasScopedMatch) {
      for (const [key, val] of Object.entries(dailyUsage)) {
        const cleanKey = key.toLowerCase().trim();
        if (!cleanKey.includes('::')) {
          if (targetCourseId) {
            const hasCompletedInCourse = completedLessons[targetCourseId] && completedLessons[targetCourseId].length > 0;
            if (!hasCompletedInCourse) continue;
          }
          if (synonyms.some(s => cleanKey === s || cleanKey.includes(s) || s.includes(cleanKey))) {
            count = Math.max(count, Number(val) || 0);
          }
        }
      }
    }

    // 3. Data reconciliation with completedLessons for this specific course
    if (targetCourseId && completedLessons[targetCourseId] && lessons && lessons.length > 0) {
      const completedCount = lessons.filter((l: any) => completedLessons[targetCourseId].includes(l.id)).length;
      if (completedCount > 0) {
        count = Math.max(count, completedCount);
      }
    }

    // Never exceed dailyLimit on display
    return Math.min(count, dailyLimit);
  };

  // Synchronize completed lessons into dailyUsage so student actions are always reflected per course
  useEffect(() => {
    if (!currentUser?.id || !selectedCourse || !completedLessons[selectedCourse.id]) return;

    const courseCompleted = completedLessons[selectedCourse.id] || [];
    if (courseCompleted.length === 0) return;

    let hasNewSync = false;
    const updates: Record<string, number> = {};

    displayedSubjects.forEach((subject: any) => {
      const subjectLessons = subject.lessons || [];
      const completedInSubject = subjectLessons.filter((l: any) => courseCompleted.includes(l.id)).length;
      if (completedInSubject > 0) {
        const currentCount = getSubjectUsageCount(subject.synonyms, subject.lessons, selectedCourse.id);
        if (currentCount < Math.min(completedInSubject, dailyLimit)) {
          hasNewSync = true;
          const cleanName = (subject.name || '').toLowerCase().trim();
          const scopedKey = `${selectedCourse.id}::${cleanName}`;
          updates[scopedKey] = Math.min(completedInSubject, dailyLimit);
          // Persist to server and storage with courseId
          videoAccessAPI.recordViewAsync(currentUser.id, cleanName, selectedCourse.id).catch(() => {});
        }
      }
    });

    if (hasNewSync && Object.keys(updates).length > 0) {
      setDailyUsage(prev => ({ ...prev, ...updates }));
    }
  }, [currentUser?.id, selectedCourse?.id, completedLessons, displayedSubjects, dailyLimit]);

  // Find any extra non-standard subjects present in daily usage, strictly filtering out generic cycle terms
  const ignoredGenericKeys = ['fondamentale', 'fondamental', 'general', 'général', 'other', 'autre'];
  const extraSubjects = Object.entries(dailyUsage).filter(([key, count]) => {
    if (Number(count) <= 0) return false;
    let cleanKey = key.toLowerCase().trim();
    if (cleanKey.includes('::')) {
      const [kCourseId, kSubject] = cleanKey.split('::');
      if (selectedCourse && kCourseId !== selectedCourse.id) return false;
      cleanKey = kSubject;
    } else if (selectedCourse && (!completedLessons[selectedCourse.id] || completedLessons[selectedCourse.id].length === 0)) {
      return false;
    }
    if (ignoredGenericKeys.includes(cleanKey)) return false;
    return !displayedSubjects.some(s => s.synonyms.some(syn => cleanKey.includes(syn) || syn.includes(cleanKey)));
  });

  // Handle subscription upgrade / renewal submit
  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsSubmittingSub(true);
    setSubNotice(null);

    try {
      if ((modalMethod === 'moncash' || modalMethod === 'natcash') && !modalTxCode.trim()) {
        throw new Error(`Tanpri antre Kòd / ID Tranzaksyon ${modalMethod === 'moncash' ? 'MonCash' : 'NatCash'} ou an.`);
      }

      const newSub = await subscriptionsAPI.create({
        userId: currentUser.id,
        userName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
        userEmail: currentUser.email,
        planName: 'Premium Alèz',
        durationMonths: modalDuration,
        paymentMethod: modalMethod,
        paymentReference: (modalMethod === 'moncash' || modalMethod === 'natcash') ? modalTxCode.trim() : `stripe_ref_${Date.now()}`,
        amountPaid: calculatedUSD,
        amountPaidHTG: calculatedHTG,
        currency: modalMethod === 'stripe' ? 'USD' : 'HTG'
      });

      setCurrentSub(newSub.subscription);
      setSubNotice(
        modalMethod === 'stripe'
          ? 'Abònman Premium ou an aktif kounye a!'
          : `Tranzaksyon ${modalMethod === 'moncash' ? 'MonCash' : 'NatCash'} ou an soumèt! Yon administratè ap verifye li talè konsa.`
      );

      setTimeout(() => {
        setIsUpgradeModalOpen(false);
        setSubNotice(null);
        setModalTxCode('');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Echèk pandan operasyon an.');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('dashboard.welcome')} {currentUser?.firstName || 'Student'} 👋
          </h1>
          <p className="text-gray-500 text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm">
            <Flame size={18} />
            <span>{t('dashboard.streak')}</span>
          </div>

          {!isPremiumActive && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles size={16} />
              <span>{t('dashboard.upgradeToPremiumShort')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending MonCash/NatCash Verification Banner */}
      {isPendingVerification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900"
        >
          <div className="flex items-start gap-3">
            <Clock size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{t('dashboard.pendingPaymentBannerTitle')}</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {t('dashboard.pendingPaymentBannerDesc')}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200/80 rounded-full text-xs font-black uppercase text-amber-900 self-start sm:self-auto">
            {t('dashboard.statusPending')}
          </span>
        </motion.div>
      )}

      {/* Expiring Soon Banner */}
      {isExpiringSoon && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-orange-950"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-brand-orange shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">
                {t('dashboard.expiringBannerTitle').replace('{days}', String(remainingDays))}
              </h4>
              <p className="text-xs text-orange-800 mt-0.5">
                {t('dashboard.expiringBannerDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shrink-0 shadow-sm"
          >
            {t('dashboard.renewSubscription')}
          </button>
        </motion.div>
      )}

      {/* Expired Subscription Banner */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 rounded-2xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-950"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{t('dashboard.expiredBannerTitle')}</h4>
              <p className="text-xs text-red-800 mt-0.5">
                {t('dashboard.expiredBannerDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shrink-0 shadow-sm"
          >
            {t('dashboard.upgradeToPremiumShort')}
          </button>
        </motion.div>
      )}

      {/* Subscription & Daily Free Quota Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {t('dashboard.yourPlan')}
              </span>
              {isPremiumActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle size={12} /> {t('dashboard.statusActive')}
                </span>
              ) : isPendingVerification ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {t('dashboard.statusPending')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {t('dashboard.statusFree')}
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">
              {isPremiumActive ? 'Premium Alèz' : t('dashboard.freePlan')}
            </h3>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              {isPremiumActive
                ? t('dashboard.premiumPlanDesc')
                : `${dailyLimit} ${t('dashboard.freePlanDesc')}`}
            </p>

            {isPremiumActive && currentSub?.endDate && (
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('dashboard.expiration')}</span>
                  <span className="font-bold">{new Date(currentSub.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('dashboard.daysRemaining')}</span>
                  <span className="font-bold">{remainingDays} {t('dashboard.daysUnit')}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                isPremiumActive
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-brand-blue hover:bg-sky-600 text-white shadow-blue-500/20'
              }`}
            >
              <Sparkles size={15} />
              <span>
                {isPremiumActive
                  ? t('dashboard.manageSubscription')
                  : t('dashboard.upgradeToPremium')}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Free Daily Quota Tracker Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('dashboard.todayQuotaTitle')}</h3>
                <p className="text-xs text-gray-500">
                  {t('dashboard.todayQuotaDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Course selector dropdown */}
                {courses.length > 0 && (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 cursor-pointer"
                    aria-label={t('dashboard.filterCourse')}
                  >
                    {enrolledCourses.length > 0 && (
                      <optgroup label={t('dashboard.enrolled')}>
                        {enrolledCourses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {recommendedCourses.length > 0 && (
                      <optgroup label={t('nav.courses')}>
                        {recommendedCourses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="all">
                      {t('dashboard.allSubjects')}
                    </option>
                  </select>
                )}
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100 flex items-center gap-1">
                  <Clock size={12} /> {t('dashboard.renewsAtMidnight')}
                </span>
              </div>
            </div>

            {/* Subjects Progress Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3">
              {displayedSubjects.map((subject: any) => {
                const count = getSubjectUsageCount(subject.synonyms, subject.lessons, subject.courseId || selectedCourse?.id);
                const isLimitReached = count >= dailyLimit;

                const cardContent = (
                  <div
                    className={`p-3 rounded-2xl border text-xs transition-all h-full flex flex-col justify-between ${
                      isPremiumActive
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                        : isLimitReached
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-800 hover:border-brand-blue/40'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1 font-bold">
                        <span className="truncate pr-1" title={subject.name}>{subject.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                          isPremiumActive
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : isLimitReached
                            ? 'bg-amber-200 text-amber-900'
                            : count > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-brand-blue'
                        }`}>
                          {isPremiumActive ? t('dashboard.unlimitedAccess') : `${Math.min(count, dailyLimit)}/${dailyLimit}`}
                        </span>
                      </div>
                      <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-black/5 my-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPremiumActive
                              ? 'bg-emerald-500 w-full'
                              : isLimitReached
                              ? 'bg-amber-500 w-full'
                              : count > 0
                              ? 'bg-brand-blue w-full'
                              : 'bg-gray-200 w-0'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-gray-500 truncate">
                        {isPremiumActive
                          ? t('dashboard.unlimitedAccess')
                          : isLimitReached
                          ? t('dashboard.limitReached')
                          : t('dashboard.videoAvailable')}
                      </p>
                      {subject.courseId && (
                        <ChevronRight size={12} className="text-gray-400 shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                );

                if (subject.courseId) {
                  return (
                    <Link
                      key={subject.id}
                      to={`/courses/${subject.courseId}`}
                      className="block group"
                      title={subject.originalTitle || subject.name}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div key={subject.id}>
                    {cardContent}
                  </div>
                );
              })}

              {/* Extra non-standard subjects viewed today */}
              {extraSubjects.map(([key, count]) => {
                const countNum = Number(count) || 0;
                const isLimitReached = countNum >= dailyLimit;
                const formattedName = key.charAt(0).toUpperCase() + key.slice(1);

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-2xl border text-xs transition-all ${
                      isPremiumActive
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                        : isLimitReached
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 font-bold">
                      <span className="truncate pr-1">{formattedName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                        isPremiumActive
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : isLimitReached
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isPremiumActive ? t('dashboard.unlimitedAccess') : `${countNum}/${dailyLimit}`}
                      </span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-black/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPremiumActive
                            ? 'bg-emerald-500 w-full'
                            : isLimitReached
                            ? 'bg-amber-500 w-full'
                            : 'bg-brand-blue w-full'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">
                      {isPremiumActive
                        ? t('dashboard.unlimitedAccess')
                        : isLimitReached
                        ? t('dashboard.limitReached')
                        : t('dashboard.videoAvailable')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-500">
            <span>{t('dashboard.wantMoreLessons')}</span>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-brand-blue font-bold hover:underline flex items-center gap-1"
            >
              <span>{t('dashboard.unlockAllWithPremium')}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 text-brand-blue rounded-2xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('dashboard.enrolled')}</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {isLoading ? <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /> : enrolledCourses.length}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <PlayCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('dashboard.lessonsCompleted')}</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {isLoading ? <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /> : totalCompletedLessons}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('dashboard.avgScore')}</p>
            <h3 className="text-2xl font-bold text-gray-800">95%</h3>
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
                  className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
                >
                  <img src={course.thumbnail} alt={course.title} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{course.title}</h3>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">{course.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{completed} / {total} {t('details.lessons')}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end text-xs">
                        <span className="font-medium text-gray-600 text-[11px]">{t('details.progress')}</span>
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
                      className="p-2.5 bg-brand-blue text-white rounded-xl hover:bg-sky-600 transition-colors"
                    >
                      <PlayCircle size={20} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/80">
            <BookOpen size={44} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">{t('dashboard.noCourses')}</h3>
            <p className="text-xs text-gray-500 mb-5">{t('dashboard.explore')}</p>
            <Link to="/courses" className="inline-flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl hover:bg-sky-600 transition-colors font-bold text-xs">
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
            <Link to="/courses" className="text-brand-blue text-xs font-bold hover:underline flex items-center gap-1">
              {t('landing.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? [1, 2, 3, 4].map(i => <CourseCardSkeleton key={i} />)
              : recommendedCourses.slice(0, 4).map(course => (
                <Link key={course.id} to={`/courses/${course.id}`} className="group block">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 h-full hover:shadow-lg transition-all">
                    <div className="h-32 overflow-hidden relative">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-brand-blue uppercase">
                        {course.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 text-xs line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors">{course.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
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

      {/* UPGRADE / RENEW SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpgradeModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mx-auto mb-2">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isPremiumActive ? 'Pwolonje Abònman Premium Ou' : 'Pase sou Premium Alèz'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Aksè illimité a TOUT videyo, tout matyè ak sètifika rekonèt.
                </p>
              </div>

              {subNotice && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{subNotice}</span>
                </div>
              )}

              <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                {/* Duration Picker */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
                    <span>Chwazi Dire:</span>
                    <span className="text-brand-orange">${calculatedUSD} USD ({calculatedHTG.toLocaleString()} HTG)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {([1, 3, 6, 12] as SubscriptionDurationMonths[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModalDuration(m)}
                        className={`py-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                          modalDuration === m
                            ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>{m} {m === 1 ? 'Mwa' : 'Mwa'}</div>
                        <div className={`text-[10px] ${modalDuration === m ? 'text-blue-100' : 'text-gray-400'}`}>
                          ${(baseMonthlyPrice * m).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Gateway Picker */}
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-1.5">Mwayen Peman:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalMethod('moncash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                        modalMethod === 'moncash' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {moncashSettings.logoUrl ? (
                        <img 
                          src={moncashSettings.logoUrl} 
                          alt="MonCash" 
                          className="h-4 max-w-[65px] object-contain rounded" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Smartphone size={16} />
                      )}
                      <span>MonCash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalMethod('natcash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                        modalMethod === 'natcash' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {natcashSettings.logoUrl ? (
                        <img 
                          src={natcashSettings.logoUrl} 
                          alt="NatCash" 
                          className="h-4 max-w-[65px] object-contain rounded" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Smartphone size={16} />
                      )}
                      <span>NatCash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalMethod('stripe')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                        modalMethod === 'stripe' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span>Kat Labank</span>
                    </button>
                  </div>
                </div>

                {/* MonCash details */}
                {modalMethod === 'moncash' && (
                  <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-red-900">
                      <div className="flex items-center gap-1.5">
                        {moncashSettings.logoUrl && (
                          <img 
                            src={moncashSettings.logoUrl} 
                            alt="MonCash" 
                            className="h-4 max-w-[50px] object-contain rounded bg-white px-1 border border-red-200" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span>Digicel MonCash:</span>
                      </div>
                      <span className="text-red-700">{calculatedHTG.toLocaleString()} HTG</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-red-200 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-gray-500">Nimewo Machann:</div>
                        <div className="font-mono font-bold text-gray-900">{moncashSettings.merchantNumber}</div>
                        <div className="text-[10px] text-gray-500">Non: {moncashSettings.receiverName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(moncashSettings.merchantNumber, 'dash_mc')}
                        className="text-red-600 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        {copiedField === 'dash_mc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedField === 'dash_mc' ? 'Kopye!' : 'Kopye'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-tight">{moncashSettings.instructions}</p>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        ID Tranzaksyon MonCash <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={modalTxCode}
                        onChange={e => setModalTxCode(e.target.value)}
                        placeholder="Egzanp: MC-9812450"
                        className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* NatCash details */}
                {modalMethod === 'natcash' && (
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <div className="flex items-center gap-1.5">
                        {natcashSettings.logoUrl && (
                          <img 
                            src={natcashSettings.logoUrl} 
                            alt="NatCash" 
                            className="h-4 max-w-[50px] object-contain rounded bg-white px-1 border border-blue-200" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span>Natcom NatCash:</span>
                      </div>
                      <span className="text-blue-700">{calculatedHTG.toLocaleString()} HTG</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-blue-200 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-gray-500">Nimewo Machann:</div>
                        <div className="font-mono font-bold text-gray-900">{natcashSettings.merchantNumber}</div>
                        <div className="text-[10px] text-gray-500">Non: {natcashSettings.receiverName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(natcashSettings.merchantNumber, 'dash_nc')}
                        className="text-blue-600 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        {copiedField === 'dash_nc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedField === 'dash_nc' ? 'Kopye!' : 'Kopye'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-tight">{natcashSettings.instructions}</p>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        ID Tranzaksyon NatCash <span className="text-blue-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={modalTxCode}
                        onChange={e => setModalTxCode(e.target.value)}
                        placeholder="Egzanp: NC-8821940"
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Stripe details */}
                {modalMethod === 'stripe' && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Kat Labank pa Stripe:</span>
                      <span>${calculatedUSD} USD</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Nimewo Kat (4242 ...)"
                      value={modalCard.number}
                      onChange={e => setModalCard({ ...modalCard, number: e.target.value })}
                      className="w-full px-3 py-2 bg-white border rounded-xl font-mono text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={modalCard.expiry}
                        onChange={e => setModalCard({ ...modalCard, expiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border rounded-xl font-mono text-xs"
                      />
                      <input
                        type="password"
                        placeholder="CVC"
                        value={modalCard.cvc}
                        onChange={e => setModalCard({ ...modalCard, cvc: e.target.value })}
                        className="w-full px-3 py-2 bg-white border rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingSub}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingSub ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : modalMethod === 'stripe' ? (
                    `Peye $${calculatedUSD} USD & Aktive`
                  ) : (
                    `Voye Kòd ${modalMethod === 'moncash' ? 'MonCash' : 'NatCash'} pou Verifikasyon`
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};