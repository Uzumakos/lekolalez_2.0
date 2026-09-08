import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Sparkles, Smartphone, CreditCard, Copy, Check, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { authAPI, setAuthData } from '../services/api';
import { SiteContent, SubscriptionDurationMonths, PaymentMethodType, Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  siteContent?: SiteContent;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, siteContent }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const { t, language } = useLanguage();

  // Signup Subscription State
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [durationMonths, setDurationMonths] = useState<SubscriptionDurationMonths>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('moncash');
  const [transactionCode, setTransactionCode] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Card details (simulated Stripe)
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });

  // Multilingual content
  const modalContent = useMemo(() => {
    switch (language) {
      case Language.CREOLE:
        return {
          welcomeBack: 'Byenvini ankò !',
          signUpHeading: 'Kòmanse sou Lekòl Alèz',
          signInSubtitle: 'Konekte pou w kontinye leson ou yo.',
          signUpSubtitle: 'Kreye kont ou pou jwenn aksè a tout leson yo.',
          freePlanTitle: 'Aksè Gratis',
          freePlanDesc: '1 videyo pa matyè/jou',
          premiumPlanTitle: 'Premium',
          premiumPlanBadge: '$1.99/m',
          premiumPlanDesc: 'Aksè illimité & sètifika',
          durationLabel: 'Dire :',
          paymentMethodLabel: 'Peye pa :',
          creditCard: 'Kat Labank',
          merchantNumber: 'Nimewo :',
          copy: 'Kopye',
          copied: 'Kopye !',
          txCodeLabel: (method: string) => `ID Tranzaksyon ${method} *`,
          examplePrefix: 'Egzanp :',
          cardNumberPlaceholder: 'Nimewo Kat (4242 ...)',
          fullNamePlaceholder: 'Jan Batis',
          emailPlaceholder: 'student@lekolalez.com',
          signInBtn: 'Konekte',
          createFreeBtn: 'Kreye Kont Gratis',
          payAndCreateBtn: (usd: number) => `Peye $${usd} & Kreye Kont`,
          sendCodeBtn: 'Voye Kòd & Kreye Kont',
          noAccountPrompt: 'Ou pa gen kont ankò ?',
          hasAccountPrompt: 'Ou gen yon kont deja ?',
          signupLink: 'Kreye yon kont',
          loginLink: 'Konekte',
          successTitle: 'Operasyon an reyisi !',
          defaultError: 'Operasyon an pa t reyisi. Tanpri verifye enfòmasyon w yo.',
          missingTxCode: (method: string) => `Tanpri antre Kòd / ID Tranzaksyon ${method} ou an.`,
          missingCardInfo: 'Tanpri ranpli tout enfòmasyon kat labank ou.',
          pendingNotice: (method: string, code: string) =>
            `Kont ou kreye! Peman ${method} (${code}) ap verifye pa yon administratè. Ou gen aksè gratis a 1 videyo pa matyè/jou kounye a!`
        };

      case Language.ENGLISH:
        return {
          welcomeBack: 'Welcome Back!',
          signUpHeading: 'Get Started on Lekòl Alèz',
          signInSubtitle: 'Sign in to continue your learning journey.',
          signUpSubtitle: 'Create your account to unlock lessons.',
          freePlanTitle: 'Free Access',
          freePlanDesc: '1 video per subject/day',
          premiumPlanTitle: 'Premium',
          premiumPlanBadge: '$1.99/mo',
          premiumPlanDesc: 'Unlimited access & certificates',
          durationLabel: 'Duration:',
          paymentMethodLabel: 'Pay with:',
          creditCard: 'Credit Card',
          merchantNumber: 'Number:',
          copy: 'Copy',
          copied: 'Copied!',
          txCodeLabel: (method: string) => `${method} Transaction ID *`,
          examplePrefix: 'e.g.:',
          cardNumberPlaceholder: 'Card Number (4242 ...)',
          fullNamePlaceholder: 'John Doe',
          emailPlaceholder: 'student@lekolalez.com',
          signInBtn: 'Sign In',
          createFreeBtn: 'Create Free Account',
          payAndCreateBtn: (usd: number) => `Pay $${usd} & Create Account`,
          sendCodeBtn: 'Submit Code & Create Account',
          noAccountPrompt: 'Don\'t have an account?',
          hasAccountPrompt: 'Already have an account?',
          signupLink: 'Create an account',
          loginLink: 'Sign in',
          successTitle: 'Operation Successful!',
          defaultError: 'Operation failed. Please check your information.',
          missingTxCode: (method: string) => `Please enter your ${method} transaction code / ID.`,
          missingCardInfo: 'Please fill in all card details.',
          pendingNotice: (method: string, code: string) =>
            `Account created! Your ${method} payment (${code}) is pending admin verification. You have instant free access to 1 video per subject/day!`
        };

      case Language.FRENCH:
      default:
        return {
          welcomeBack: 'Bon retour !',
          signUpHeading: 'Commencer sur Lekòl Alèz',
          signInSubtitle: 'Connectez-vous pour continuer vos cours.',
          signUpSubtitle: 'Créez votre compte pour accéder aux leçons.',
          freePlanTitle: 'Accès Gratuit',
          freePlanDesc: '1 vidéo par matière/jour',
          premiumPlanTitle: 'Premium',
          premiumPlanBadge: '1,99 $/m',
          premiumPlanDesc: 'Accès illimité & certificats',
          durationLabel: 'Durée :',
          paymentMethodLabel: 'Payer par :',
          creditCard: 'Carte Bancaire',
          merchantNumber: 'Numéro :',
          copy: 'Copier',
          copied: 'Copié !',
          txCodeLabel: (method: string) => `ID de Transaction ${method} *`,
          examplePrefix: 'Exemple :',
          cardNumberPlaceholder: 'Numéro de Carte (4242 ...)',
          fullNamePlaceholder: 'Jean Baptiste',
          emailPlaceholder: 'etudiant@lekolalez.com',
          signInBtn: 'Se connecter',
          createFreeBtn: 'Créer un compte gratuit',
          payAndCreateBtn: (usd: number) => `Payer ${usd} $ & Créer le compte`,
          sendCodeBtn: 'Envoyer le code & Créer le compte',
          noAccountPrompt: 'Pas encore membre ?',
          hasAccountPrompt: 'Vous avez déjà un compte ?',
          signupLink: 'Créer votre compte',
          loginLink: 'Se connecter',
          successTitle: 'Opération réussie !',
          defaultError: 'L\'opération a échoué. Veuillez vérifier vos informations.',
          missingTxCode: (method: string) => `Veuillez entrer votre code / ID de transaction ${method}.`,
          missingCardInfo: 'Veuillez remplir toutes les informations de carte bancaire.',
          pendingNotice: (method: string, code: string) =>
            `Compte créé ! Votre paiement ${method} (${code}) est en cours de vérification. Vous bénéficiez de l'accès gratuit à 1 vidéo par matière/jour immédiatement !`
        };
    }
  }, [language]);

  // Calculations
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

  const toggleMode = () => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setError('');
    setSuccessNotice(null);
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
        if (selectedPlan === 'premium') {
          if ((paymentMethod === 'moncash' || paymentMethod === 'natcash') && !transactionCode.trim()) {
            throw new Error(modalContent.missingTxCode(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash'));
          }
          if (paymentMethod === 'stripe' && (!cardData.number || !cardData.expiry || !cardData.cvc)) {
            throw new Error(modalContent.missingCardInfo);
          }
        }

        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

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

        if (selectedPlan === 'premium' && (paymentMethod === 'moncash' || paymentMethod === 'natcash')) {
          setSuccessNotice(
            modalContent.pendingNotice(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash', transactionCode)
          );
        }
      } else {
        response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
      }

      setAuthData('', response.user);

      if (selectedPlan === 'premium' && (paymentMethod === 'moncash' || paymentMethod === 'natcash') && mode === 'signup') {
        setTimeout(() => {
          onLogin(response.user);
          onClose();
        }, 3000);
      } else {
        onLogin(response.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || modalContent.defaultError);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="relative overflow-y-auto flex-1">
              {/* Decorative Header Background */}
              <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-brand-blue to-blue-600"></div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md z-10"
              >
                <X size={20} />
              </button>

              <div className="relative pt-8 px-6 pb-6">
                <div className="bg-white rounded-2xl p-6 shadow-xl mb-4 border border-gray-100">
                  <div className="text-center mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {mode === 'forgot'
                        ? t('auth.forgotPassword')
                        : mode === 'signin'
                        ? modalContent.welcomeBack
                        : modalContent.signUpHeading}
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      {mode === 'forgot'
                        ? t('auth.forgotPasswordSubtitle')
                        : mode === 'signin'
                        ? modalContent.signInSubtitle
                        : modalContent.signUpSubtitle}
                    </p>
                  </div>

                  {successNotice && (
                    <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      <span>{successNotice}</span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Plan Tabs in Signup mode */}
                  {mode === 'signup' && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('free')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedPlan === 'free'
                              ? 'border-brand-blue bg-blue-50/70 shadow-xs ring-2 ring-brand-blue/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-900">{modalContent.freePlanTitle}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">$0</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{modalContent.freePlanDesc}</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPlan('premium')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedPlan === 'premium'
                              ? 'border-brand-orange bg-orange-50/70 shadow-xs ring-2 ring-brand-orange/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-900">
                              {modalContent.premiumPlanTitle}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{modalContent.premiumPlanBadge}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{modalContent.premiumPlanDesc}</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Premium Options */}
                  {mode === 'signup' && selectedPlan === 'premium' && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                      {/* Duration */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                          <span>{modalContent.durationLabel}</span>
                          <span className="text-brand-orange">${calculatedUSD} ({calculatedHTG.toLocaleString()} HTG)</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {([1, 3, 6, 12] as SubscriptionDurationMonths[]).map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setDurationMonths(m)}
                              className={`py-1 rounded-lg text-center font-semibold text-[11px] border transition-all ${
                                durationMonths === m ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-700 border-gray-200'
                              }`}
                            >
                              {m}m (${(baseMonthlyPrice * m).toFixed(2)})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <span className="text-[11px] font-bold text-gray-600 block mb-1">{modalContent.paymentMethodLabel}</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('moncash')}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              paymentMethod === 'moncash' ? 'bg-red-500 text-white border-red-500 shadow-xs' : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            {moncashSettings.logoUrl ? (
                              <img 
                                src={moncashSettings.logoUrl} 
                                alt="MonCash" 
                                className="h-4 max-w-[60px] object-contain rounded" 
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : null}
                            <span>MonCash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('natcash')}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              paymentMethod === 'natcash' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            {natcashSettings.logoUrl ? (
                              <img 
                                src={natcashSettings.logoUrl} 
                                alt="NatCash" 
                                className="h-4 max-w-[60px] object-contain rounded" 
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : null}
                            <span>NatCash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('stripe')}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              paymentMethod === 'stripe' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            <span>{modalContent.creditCard}</span>
                          </button>
                        </div>
                      </div>

                      {/* MonCash/NatCash info */}
                      {(paymentMethod === 'moncash' || paymentMethod === 'natcash') && (
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center font-bold">
                            <div className="flex items-center gap-1.5">
                              {paymentMethod === 'moncash' && moncashSettings.logoUrl && (
                                <img src={moncashSettings.logoUrl} alt="MonCash" className="h-4 w-auto object-contain rounded" />
                              )}
                              {paymentMethod === 'natcash' && natcashSettings.logoUrl && (
                                <img src={natcashSettings.logoUrl} alt="NatCash" className="h-4 w-auto object-contain rounded" />
                              )}
                              <span>{modalContent.merchantNumber} {paymentMethod === 'moncash' ? moncashSettings.merchantNumber : natcashSettings.merchantNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(paymentMethod === 'moncash' ? moncashSettings.merchantNumber : natcashSettings.merchantNumber, 'modal_phone')}
                              className="text-brand-blue flex items-center gap-0.5 text-[10px] font-semibold"
                            >
                              {copiedField === 'modal_phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              {copiedField === 'modal_phone' ? modalContent.copied : modalContent.copy}
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                              {modalContent.txCodeLabel(paymentMethod === 'moncash' ? 'MonCash' : 'NatCash')}
                            </label>
                            <input
                              type="text"
                              required
                              value={transactionCode}
                              onChange={e => setTransactionCode(e.target.value)}
                              placeholder={`${modalContent.examplePrefix} ${paymentMethod === 'moncash' ? 'MC-12345' : 'NC-67890'}`}
                              className="w-full px-2 py-1.5 bg-gray-50 border rounded text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Stripe card fields */}
                      {paymentMethod === 'stripe' && (
                        <div className="space-y-1.5 text-[11px]">
                          <input
                            type="text"
                            placeholder={modalContent.cardNumberPlaceholder}
                            value={cardData.number}
                            onChange={e => setCardData({ ...cardData, number: e.target.value })}
                            className="w-full px-2 py-1.5 bg-white border rounded font-mono text-xs"
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={cardData.expiry}
                              onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                              className="w-full px-2 py-1.5 bg-white border rounded font-mono text-xs"
                            />
                            <input
                              type="password"
                              placeholder="CVC"
                              value={cardData.cvc}
                              onChange={e => setCardData({ ...cardData, cvc: e.target.value })}
                              className="w-full px-2 py-1.5 bg-white border rounded font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === 'signup' && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 ml-1">{t('auth.fullName')}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            required={mode === 'signup'}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-xs"
                            placeholder={modalContent.fullNamePlaceholder}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 ml-1">{t('auth.email')}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-xs"
                          placeholder={modalContent.emailPlaceholder}
                        />
                      </div>
                    </div>

                    {mode !== 'forgot' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-600 ml-1">{t('auth.password')}</label>
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
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="password"
                            required={mode !== 'forgot'}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-xs"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 text-sm ${
                        mode === 'signup' && selectedPlan === 'premium'
                          ? 'bg-gradient-to-r from-brand-orange to-amber-600 shadow-orange-500/20'
                          : 'bg-brand-blue hover:bg-sky-600 shadow-blue-500/20'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : mode === 'forgot' ? (
                        t('auth.sendResetLink')
                      ) : mode === 'signin' ? (
                        modalContent.signInBtn
                      ) : selectedPlan === 'free' ? (
                        modalContent.createFreeBtn
                      ) : paymentMethod === 'stripe' ? (
                        modalContent.payAndCreateBtn(calculatedUSD)
                      ) : (
                        modalContent.sendCodeBtn
                      )}
                      {!isLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                </div>

                <div className="text-center">
                  {mode === 'forgot' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError('');
                        setSuccessNotice(null);
                      }}
                      className="text-xs text-brand-blue font-bold hover:underline inline-flex items-center gap-1"
                    >
                      ← {t('auth.backToLogin')}
                    </button>
                  ) : (
                    <p className="text-xs text-gray-600">
                      {mode === 'signin' ? modalContent.noAccountPrompt : modalContent.hasAccountPrompt}{' '}
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-brand-blue font-bold hover:underline"
                      >
                        {mode === 'signin' ? modalContent.signupLink : modalContent.loginLink}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};