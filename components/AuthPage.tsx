import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin', onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Sync state if prop changes (e.g. navigation between /login and /signup)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (formData.email === 'admin@lekol.com') {
         setError('Please use the Admin Portal for instructor access.');
         setIsLoading(false);
         return;
      }
      
      setIsLoading(false);
      onLogin(); 
      navigate('/'); 
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <header className="w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto">
            <Link to="/" className="flex items-center gap-2 group">
                <BrandLogo />
            </Link>
            <LanguageSwitcher variant="light" />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6 z-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]"
            >
                {/* Left Side: Visuals (Hidden on small mobile) */}
                <div className="hidden md:flex md:w-1/2 bg-brand-blue relative items-center justify-center p-12 overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-blue-600"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    {/* Floating Elements */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                        className="relative z-10 text-center"
                    >
                        <div className="mb-8 inline-flex p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                            <BookOpen size={48} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">
                            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
                        </h2>
                        <p className="text-blue-100 text-lg max-w-xs mx-auto leading-relaxed opacity-90">
                            {mode === 'signin' 
                                ? t('hero.subtitle') 
                                : t('hero.title')}
                        </p>
                    </motion.div>

                    {/* Decorative circles */}
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-brand-orange/20 rounded-full blur-3xl"></div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                     <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-8 md:hidden">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
                            </h2>
                            <p className="text-gray-500 text-sm mt-2">
                                {mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
                            </p>
                        </div>
                        
                        <div className="hidden md:block mb-8">
                             <h3 className="text-xl font-bold text-gray-800">
                                {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                             </h3>
                             <p className="text-gray-400 text-sm mt-1">
                                {mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
                             </p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="popLayout">
                                {mode === 'signup' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1 overflow-hidden"
                                    >
                                        <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">{t('auth.fullName')}</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                required={mode === 'signup'}
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">{t('auth.email')}</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium"
                                        placeholder="student@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wide">{t('auth.password')}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={18} />
                                    <input 
                                        type="password" 
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'signin' ? t('auth.signIn') : t('auth.signUp'))}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-600">
                                {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                                <Link 
                                    to={mode === 'signin' ? "/signup" : "/login"}
                                    className="text-brand-blue font-bold hover:underline ml-1"
                                >
                                    {mode === 'signin' ? t('auth.signupLink') : t('auth.loginLink')}
                                </Link>
                            </p>
                        </div>
                     </div>
                </div>
            </motion.div>
        </main>
    </div>
  );
};