import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, BookOpen, AlertCircle, CheckCircle, Sparkles, CreditCard, Smartphone, ShieldCheck, Copy, Check } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';
import { authAPI, setAuthData } from '../services/api';
import { SiteContent, SubscriptionDurationMonths, PaymentMethodType, Language } from '../types';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onLogin: (user: any) => void;
  siteContent?: SiteContent;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin', onLogin, siteContent }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  // Signup Subscription State
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [durationMonths, setDurationMonths] = useState<SubscriptionDurationMonths>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('moncash');
  const [transactionCode, setTransactionCode] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Card details (simulated Stripe)
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Multilingual content
  const authContent = useMemo(() => {
    switch (language) {
      case Language.CREOLE:
        return {
          welcomeBack: 'Byenvini ankò !',
          learnWithoutLimits: 'Aprann San Limit',
          signInLeftDesc: 'Konekte sou kont ou pou w kontinye leson ou yo kote w te rete a.',
          signUpLeftDesc: 'Fè pati premye platfòm aprantisaj an Kreyòl, Franse ak Anglè an Ayiti.',
          featureFreeVideo: 'Aksè gratis 1 videyo pa matyè chak jou',
          featurePremium: 'Opsyon Premium pou $1.99/mwa sèlman',
          featurePayment: 'Peman fasil pa Kat, MonCash oswa NatCash',
          footerBrand: 'Lekòl Alèz • Edikasyon Kalite Pou Tout Moun',

          signInTitle: 'Konekte',
          signUpTitle: 'Kreye Kont Ou',
          signInSubtitle: 'Antre imèl ak modpas ou pou jwenn aksè a espas elèv ou a.',
          signUpSubtitle: 'Chwazi fason ou vle kòmanse aprann sou Lekòl Alèz.',

          chooseAccessType: 'Chwazi Tip Aksè Ou',
          freePlanTitle: 'Aksè Gratis',
          freePlanDesc: '1 videyo pa matyè pa jou. San kat, san obligasyon.',
          premiumPlanTitle: 'Premium Alèz',
          premiumPlanBadge: '$1.99/m',
          premiumPlanDesc: 'Aksè illimité a TOUT kou, sètifika ak sipò pwofesè.',

          durationLabel: 'Dire Abònman an :',
          durationUnit: (m: number) => `${m} Mwa`,
          totalLabel: 'Total :',
          paymentMethodLabel: 'Mwayen Peman :',
          creditCard: 'Kat Labank',

          merchantNumber: 'Nimewo Machann :',
          receiverName: 'Non :',
          copy: 'Kopye',
          copied: 'Kopye !',
          moncashTxLabel: 'Kòd / ID Tranzaksyon MonCash',
          natcashTxLabel: 'Kòd / ID Tranzaksyon NatCash',
          examplePrefix: 'Egzanp :',
          secureStripeNotice: 'Peman Sekirize pa Kat Labank',
          cardNumber: 'Nimewo Kat la',
          expiry: 'Ekspirasyon (MM/AA)',
          cvc: 'CVC',

          fullNameLabel: 'Non Konplè',
          fullNamePlaceholder: 'Jan Batis',
          emailLabel: 'Adrès Imèl',
          emailPlaceholder: 'student@lekolalez.com',
          passwordLabel: 'Modpas',

          signInBtn: 'Konekte',
          createFreeBtn: 'Kreye Kont Mwen Gratis',
          payStripeBtn: (usd: number) => `Peye $${usd} & Aktive Premium`,
          sendCodeBtn: (method: string) => `Voye Kòd ${method} & Kreye Kont`,

          noAccountPrompt: 'Ou pa gen kont ankò ?',
          hasAccountPrompt: 'Ou gen yon kont deja ?',
          signupLink: 'Kreye yon kont',
          loginLink: 'Konekte',

          successTitle: 'Operasyon an reyisi !',
          defaultError: 'Operasyon an pa t reyisi. Tanpri verifye enfòmasyon w yo.',
          missingTxCode: (method: string) => `Tanpri antre Kòd / ID Tranzaksyon ${method} ou an.`,
          missingCardInfo: 'Tanpri ranpli tout enfòmasyon kat labank ou.',
          pendingVerificationNotice: (method: string, code: string) =>
            `Kont ou kreye avèk siksè! Peman ${method} ou an (${code}) ap verifye pa yon administratè. Ou gen aksè gratis a 1 videyo pa matyè pa jou touswit!`
        };

      case Language.ENGLISH:
        return {
          welcomeBack: 'Welcome Back!',
          learnWithoutLimits: 'Learn Without Limits',
          signInLeftDesc: 'Sign in to your account to continue your lessons right where you left off.',
          signUpLeftDesc: 'Join the premier learning platform in Creole, French, and English in Haiti.',
          featureFreeVideo: 'Free daily access: 1 video per subject every day',
          featurePremium: 'Premium option for just $1.99/month',
          featurePayment: 'Easy payment via Card, MonCash, or NatCash',
          footerBrand: 'Lekòl Alèz • Quality Education for Everyone',

          signInTitle: 'Sign In',
          signUpTitle: 'Create Your Account',
          signInSubtitle: 'Enter your email and password to access your student dashboard.',
          signUpSubtitle: 'Choose how you want to start learning on Lekòl Alèz.',

          chooseAccessType: 'Choose Your Access Plan',
          freePlanTitle: 'Free Access',
          freePlanDesc: '1 video per subject per day. No card required.',
          premiumPlanTitle: 'Premium Alèz',
          premiumPlanBadge: '$1.99/mo',
          premiumPlanDesc: 'Unlimited access to ALL courses, certificates, and instructor support.',

          durationLabel: 'Subscription Duration:',
          durationUnit: (m: number) => `${m} ${m === 1 ? 'Month' : 'Months'}`,
          totalLabel: 'Total:',
          paymentMethodLabel: 'Payment Method:',
          creditCard: 'Credit Card',

          merchantNumber: 'Merchant Number:',
          receiverName: 'Name:',
          copy: 'Copy',
          copied: 'Copied!',
          moncashTxLabel: 'MonCash Transaction Code / ID',
          natcashTxLabel: 'NatCash Transaction Code / ID',
          examplePrefix: 'e.g.:',
          secureStripeNotice: 'Secure Payment via Credit Card',
          cardNumber: 'Card Number',
          expiry: 'Expiration (MM/YY)',
          cvc: 'CVC',

          fullNameLabel: 'Full Name',
          fullNamePlaceholder: 'John Doe',
          emailLabel: 'Email Address',
          emailPlaceholder: 'student@lekolalez.com',
          passwordLabel: 'Password',

          signInBtn: 'Sign In',
          createFreeBtn: 'Create My Free Account',
          payStripeBtn: (usd: number) => `Pay $${usd} & Activate Premium`,
          sendCodeBtn: (method: string) => `Submit ${method} Code & Create Account`,

          noAccountPrompt: 'Don\'t have an account?',
          hasAccountPrompt: 'Already have an account?',
          signupLink: 'Sign up',
          loginLink: 'Sign in',

          successTitle: 'Operation Successful!',
          defaultError: 'Operation failed. Please check your information.',
          missingTxCode: (method: string) => `Please enter your ${method} transaction code / ID.`,
          missingCardInfo: 'Please fill in all credit card details.',
          pendingVerificationNotice: (method: string, code: string) =>
            `Your account has been created! Your ${method} payment (${code}) is pending administrator verification. You have instant free access to 1 video per subject each day!`
        };

      case Language.FRENCH:
      default:
        return {
          welcomeBack: 'Bon retour !',
          learnWithoutLimits: 'Apprenez sans limite',
          signInLeftDesc: 'Connectez-vous à votre compte pour reprendre vos cours là où vous vous êtes arrêté.',
          signUpLeftDesc: 'Rejoignez la première plateforme d\'apprentissage en Créole, Français et Anglais en Haïti.',
          featureFreeVideo: 'Accès gratuit : 1 vidéo par matière chaque jour',
          featurePremium: 'Option Premium pour 1,99 $/mois seulement',
          featurePayment: 'Paiement facile par Carte, MonCash ou NatCash',
          footerBrand: 'Lekòl Alèz • Éducation de qualité pour tous',

          signInTitle: 'Connexion',
          signUpTitle: 'Créez votre compte',
          signInSubtitle: 'Entrez votre e-mail et mot de passe pour accéder à votre espace étudiant.',
          signUpSubtitle: 'Choisissez comment vous souhaitez commencer sur Lekòl Alèz.',

          chooseAccessType: 'Choisissez votre type d\'accès',
          freePlanTitle: 'Accès Gratuit',
          freePlanDesc: '1 vidéo par matière par jour. Sans carte, sans engagement.',
          premiumPlanTitle: 'Premium Alèz',
          premiumPlanBadge: '1,99 $/m',
          premiumPlanDesc: 'Accès illimité à TOUS les cours, certificats et support enseignant.',

          durationLabel: 'Durée de l\'abonnement :',
          durationUnit: (m: number) => `${m} ${m === 1 ? 'Mois' : 'Mois'}`,
          totalLabel: 'Total :',
          paymentMethodLabel: 'Moyen de paiement :',
          creditCard: 'Carte Bancaire',

          merchantNumber: 'Numéro Marchand :',
          receiverName: 'Nom :',
          copy: 'Copier',
          copied: 'Copié !',
          moncashTxLabel: 'Code / ID de Transaction MonCash',
          natcashTxLabel: 'Code / ID de Transaction NatCash',
          examplePrefix: 'Exemple :',
          secureStripeNotice: 'Paiement sécurisé par Carte Bancaire',
          cardNumber: 'Numéro de carte',
          expiry: 'Expiration (MM/AA)',
          cvc: 'CVC',

          fullNameLabel: 'Nom complet',
          fullNamePlaceholder: 'Jean Baptiste',
          emailLabel: 'Adresse e-mail',
          emailPlaceholder: 'etudiant@lekolalez.com',
          passwordLabel: 'Mot de passe',

          signInBtn: 'Se connecter',
          createFreeBtn: 'Créer mon compte gratuit',
          payStripeBtn: (usd: number) => `Payer ${usd} $ & Activer Premium`,
          sendCodeBtn: (method: string) => `Envoyer le code ${method} & Créer le compte`,

          noAccountPrompt: 'Pas encore membre ?',
          hasAccountPrompt: 'Vous avez déjà un compte ?',
          signupLink: 'Créer un compte',
          loginLink: 'Se connecter',

          successTitle: 'Opération réussie !',
          defaultError: 'L\'opération a échoué. Veuillez vérifier vos informations.',
          missingTxCode: (method: string) => `Veuillez entrer votre code / ID de transaction ${method}.`,
          missingCardInfo: 'Veuillez remplir toutes les informations de votre carte bancaire.',
          pendingVerificationNotice: (method: string, code: string) =>
            `Votre compte a été créé avec succès ! Votre paiement ${method} (${code}) est en cours de vérification par un administrateur. Vous bénéficiez immédiatement de l'accès gratuit à 1 vidéo par matière par jour !`
        };
    }
  }, [language]);

  // Check URL query parameters (e.g. /signup?plan=premium)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    if (planParam === 'premium') {
      setSelectedPlan('premium');
    }
  }, [location.search]);

  // Sync state if prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Pricing calculations
  const baseMonthlyPrice = 1.99;
  const exchangeRate = siteContent?.paymentGateways?.exchangeRateHTG || 132;
  const calculatedUSD = Number((baseMonthlyPrice * durationMonths).toFixed(2));
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let response: any;
      if (mode === 'forgot') {
        if (!formData.email.trim()) {
          throw new Error(t('auth.email') + ' requis');
        }
        await authAPI.requestPasswordReset(formData.email.trim());
        setSuccessNotice(t('auth.resetEmailSentDesc'));
        setIsLoading(false);
        return;
      } else if (mode === 'signup') {
        // Validation for premium manual payments
        if (selectedPlan === 'premium') {
          if ((paymentMethod === 'moncash' || paymentMethod === 'natcash') && !transactionCode.trim()) {
            throw new Error(authContent.missingTxCode(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash'));
          }
          if (paymentMethod === 'stripe' && (!cardData.number || !cardData.expiry || !cardData.cvc)) {
            throw new Error(authContent.missingCardInfo);
          }
        }

        // Split name into first and last name
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Prepare subscription payload if premium
        const subscriptionPayload = selectedPlan === 'premium' ? {
          planName: 'Premium Alèz',
          durationMonths,
          paymentMethod,
          paymentReference: (paymentMethod === 'moncash' || paymentMethod === 'natcash') ? transactionCode.trim() : `stripe_ref_${Date.now()}`,
          amountPaid: calculatedUSD,
          amountPaidHTG: calculatedHTG,
          currency: paymentMethod === 'stripe' ? 'USD' : 'HTG'
        } : undefined;

        response = await authAPI.register({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          role: 'student',
          subscription: subscriptionPayload
        });

        // If manual payment pending verification, show message
        if (selectedPlan === 'premium' && (paymentMethod === 'moncash' || paymentMethod === 'natcash')) {
          setSuccessNotice(
            authContent.pendingVerificationNotice(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash', transactionCode)
          );
        }
      } else {
        response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
      }

      // Store user session data
      setAuthData('', response.user);

      // Delay if notice is shown so student sees confirmation
      if (selectedPlan === 'premium' && (paymentMethod === 'moncash' || paymentMethod === 'natcash') && mode === 'signup') {
        setTimeout(() => {
          onLogin(response.user);
          navigate('/');
        }, 3000);
      } else {
        onLogin(response.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || authContent.defaultError);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header - Stacking context z-50 to ensure Language dropdown always overlays card */}
      <header className="w-full p-6 flex justify-between items-center relative z-50 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <BrandLogo />
        </Link>
        <LanguageSwitcher variant="light" />
      </header>

      {/* Main Content - z-10 so it sits below header dropdown */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[640px]"
        >
          {/* Left Side: Visuals */}
          <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-brand-blue via-sky-600 to-indigo-800 relative items-center justify-center p-10 overflow-hidden text-white flex-col justify-between">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="relative z-10 text-center my-auto">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="mb-6 inline-flex p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl"
              >
                <BookOpen size={44} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">
                {mode === 'signin' ? authContent.welcomeBack : authContent.learnWithoutLimits}
              </h2>
              <p className="text-blue-100 text-sm max-w-xs mx-auto leading-relaxed opacity-95">
                {mode === 'signin' ? authContent.signInLeftDesc : authContent.signUpLeftDesc}
              </p>

              {mode === 'signup' && (
                <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-left text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-200">
                    <CheckCircle size={15} className="text-sky-300 shrink-0" />
                    <span>{authContent.featureFreeVideo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-200">
                    <CheckCircle size={15} className="text-sky-300 shrink-0" />
                    <span>{authContent.featurePremium}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-200">
                    <CheckCircle size={15} className="text-sky-300 shrink-0" />
                    <span>{authContent.featurePayment}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 text-xs text-blue-200 text-center opacity-80 pt-4">
              {authContent.footerBrand}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-7/12 p-6 sm:p-10 flex flex-col justify-center bg-white relative overflow-y-auto max-h-[90vh]">
            <div className="max-w-lg mx-auto w-full">
              {/* Form Title */}
              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {mode === 'forgot'
                    ? t('auth.forgotPassword')
                    : mode === 'signin'
                    ? authContent.signInTitle
                    : authContent.signUpTitle}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {mode === 'forgot'
                    ? t('auth.forgotPasswordSubtitle')
                    : mode === 'signin'
                    ? authContent.signInSubtitle
                    : authContent.signUpSubtitle}
                </p>
              </div>

              {/* Success Notification Banner */}
              {successNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-sm rounded-2xl flex items-start gap-3 border border-emerald-200 shadow-sm"
                >
                  <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">{authContent.successTitle}</p>
                    <p className="text-xs leading-relaxed text-emerald-700">{successNotice}</p>
                  </div>
                </motion.div>
              )}

              {/* Error Notice */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-3 border border-red-200"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Mode: Sign Up Plan Selector */}
              {mode === 'signup' && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    {authContent.chooseAccessType}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Free Plan Tab */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('free')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        selectedPlan === 'free'
                          ? 'border-brand-blue bg-blue-50/70 shadow-sm ring-2 ring-brand-blue/20'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{authContent.freePlanTitle}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                          $0
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        {authContent.freePlanDesc}
                      </p>
                    </button>

                    {/* Premium Plan Tab */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('premium')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        selectedPlan === 'premium'
                          ? 'border-brand-orange bg-orange-50/70 shadow-sm ring-2 ring-brand-orange/20'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">
                          {authContent.premiumPlanTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {authContent.premiumPlanBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        {authContent.premiumPlanDesc}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: Sign Up Premium Options (Duration & Payment Gateway) */}
              {mode === 'signup' && selectedPlan === 'premium' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4"
                >
                  {/* Duration Selector */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-600">{authContent.durationLabel}</span>
                      <span className="text-xs font-bold text-brand-orange">
                        {authContent.totalLabel} ${calculatedUSD} USD ({calculatedHTG.toLocaleString()} HTG)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {([1, 3, 6, 12] as SubscriptionDurationMonths[]).map(months => {
                        const usd = Number((baseMonthlyPrice * months).toFixed(2));
                        const isSelected = durationMonths === months;
                        return (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setDurationMonths(months)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div>{authContent.durationUnit(months)}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                              ${usd}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <span className="text-xs font-bold text-gray-600 block mb-1.5">{authContent.paymentMethodLabel}</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('moncash')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                          paymentMethod === 'moncash'
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {moncashSettings.logoUrl ? (
                          <img 
                            src={moncashSettings.logoUrl} 
                            alt="MonCash" 
                            className="h-5 max-w-[70px] object-contain rounded" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Smartphone size={16} />
                        )}
                        <span>MonCash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('natcash')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                          paymentMethod === 'natcash'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {natcashSettings.logoUrl ? (
                          <img 
                            src={natcashSettings.logoUrl} 
                            alt="NatCash" 
                            className="h-5 max-w-[70px] object-contain rounded" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Smartphone size={16} />
                        )}
                        <span>NatCash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                          paymentMethod === 'stripe'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard size={16} />
                        <span>{authContent.creditCard}</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Area */}
                  {/* MonCash Details */}
                  {paymentMethod === 'moncash' && (
                    <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs text-red-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {moncashSettings.logoUrl && (
                            <img 
                              src={moncashSettings.logoUrl} 
                              alt="MonCash" 
                              className="h-5 max-w-[60px] object-contain rounded bg-white px-1 border border-red-200"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span className="font-bold text-red-900">Digicel MonCash:</span>
                        </div>
                        <span className="font-extrabold text-red-700 text-sm">{calculatedHTG.toLocaleString()} HTG</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-red-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-gray-500">{authContent.merchantNumber}</div>
                          <div className="font-mono font-bold text-gray-900 text-sm">{moncashSettings.merchantNumber}</div>
                          <div className="text-[10px] text-gray-500">{authContent.receiverName} {moncashSettings.receiverName}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(moncashSettings.merchantNumber, 'mc')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-medium text-[11px]"
                        >
                          {copiedField === 'mc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          {copiedField === 'mc' ? authContent.copied : authContent.copy}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-tight">
                        {moncashSettings.instructions}
                      </p>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {authContent.moncashTxLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionCode}
                          onChange={e => setTransactionCode(e.target.value)}
                          placeholder={`${authContent.examplePrefix} MC-8934521`}
                          className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* NatCash Details */}
                  {paymentMethod === 'natcash' && (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {natcashSettings.logoUrl && (
                            <img 
                              src={natcashSettings.logoUrl} 
                              alt="NatCash" 
                              className="h-5 max-w-[60px] object-contain rounded bg-white px-1 border border-blue-200"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span className="font-bold text-blue-900">Natcom NatCash:</span>
                        </div>
                        <span className="font-extrabold text-blue-700 text-sm">{calculatedHTG.toLocaleString()} HTG</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-gray-500">{authContent.merchantNumber}</div>
                          <div className="font-mono font-bold text-gray-900 text-sm">{natcashSettings.merchantNumber}</div>
                          <div className="text-[10px] text-gray-500">{authContent.receiverName} {natcashSettings.receiverName}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(natcashSettings.merchantNumber, 'nc')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 font-medium text-[11px]"
                        >
                          {copiedField === 'nc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          {copiedField === 'nc' ? authContent.copied : authContent.copy}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-tight">
                        {natcashSettings.instructions}
                      </p>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {authContent.natcashTxLabel} <span className="text-blue-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionCode}
                          onChange={e => setTransactionCode(e.target.value)}
                          placeholder={`${authContent.examplePrefix} NC-9812450`}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stripe Card Details */}
                  {paymentMethod === 'stripe' && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="font-bold flex items-center gap-1">
                          <ShieldCheck size={14} className="text-emerald-600" /> {authContent.secureStripeNotice}
                        </span>
                        <span className="font-extrabold text-gray-900 text-sm">${calculatedUSD} USD</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{authContent.cardNumber}</label>
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={e => setCardData({ ...cardData, number: e.target.value })}
                          placeholder="4242 •••• •••• 4242"
                          maxLength={19}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none font-mono text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{authContent.expiry}</label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                            placeholder="12/28"
                            maxLength={5}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{authContent.cvc}</label>
                          <input
                            type="password"
                            value={cardData.cvc}
                            onChange={e => setCardData({ ...cardData, cvc: e.target.value })}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Form Fields: Name, Email, Password */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1"
                    >
                      <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">
                        {authContent.fullNameLabel}
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                        <input
                          type="text"
                          required={mode === 'signup'}
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium text-sm"
                          placeholder={authContent.fullNamePlaceholder}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">
                    {authContent.emailLabel}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium text-sm"
                      placeholder={authContent.emailPlaceholder}
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">
                        {authContent.passwordLabel}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setError('');
                            setSuccessNotice(null);
                          }}
                          className="text-xs font-semibold text-brand-blue hover:underline"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                      <input
                        type="password"
                        required={mode !== 'forgot'}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] ${
                    mode === 'signup' && selectedPlan === 'premium'
                      ? 'bg-gradient-to-r from-brand-orange to-amber-600 shadow-orange-500/30'
                      : 'bg-brand-blue hover:bg-sky-600 shadow-blue-500/30'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : mode === 'forgot' ? (
                    t('auth.sendResetLink')
                  ) : mode === 'signin' ? (
                    authContent.signInBtn
                  ) : selectedPlan === 'free' ? (
                    authContent.createFreeBtn
                  ) : paymentMethod === 'stripe' ? (
                    authContent.payStripeBtn(calculatedUSD)
                  ) : (
                    authContent.sendCodeBtn(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash')
                  )}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>

              {/* Toggle Sign In / Sign Up or Back to Sign In */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccessNotice(null);
                    }}
                    className="text-sm text-brand-blue font-bold hover:underline inline-flex items-center gap-1.5"
                  >
                    ← {t('auth.backToLogin')}
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">
                    {mode === 'signin' ? authContent.noAccountPrompt : authContent.hasAccountPrompt}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setError('');
                        setSuccessNotice(null);
                      }}
                      className="text-brand-blue font-bold hover:underline ml-1"
                    >
                      {mode === 'signin' ? authContent.signupLink : authContent.loginLink}
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};