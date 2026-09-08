import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertTriangle, UserPlus, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, setAuthData } from '../services/api';

interface AdminLoginPageProps {
  onLogin: (user: any) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [isSuperAdminSetup, setIsSuperAdminSetup] = useState(false);
  const [hasSuperAdmin, setHasSuperAdmin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const [adminExists, superAdminExists] = await Promise.all([
          authAPI.hasAdmin(),
          authAPI.hasSuperAdmin(),
        ]);
        setHasSuperAdmin(superAdminExists);
      } catch {
        // Ignore check error
      } finally {
        setCheckingSetup(false);
      }
    };
    checkAdminStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    // Handle One-Time Super Admin Creation
    if (isSuperAdminSetup) {
      if (!email || !password) {
        setError('Veuillez fournir un e-mail et un mot de passe.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Le mot de passe doit comporter au moins 6 caractères.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.setupInitialSuperAdmin({
          email,
          password,
          firstName: firstName || 'Super',
          lastName: lastName || 'Admin',
        });

        setSuccessMsg('Compte Super Admin créé avec succès ! Connexion en cours...');
        setAuthData('', response.user);
        onLogin(response.user);
        setTimeout(() => navigate('/admin-management'), 800);
      } catch (err: any) {
        setError(err.message || 'Échec de la création du Super Admin.');
        setIsLoading(false);
      }
      return;
    }

    if (isInitialSetup) {
      if (!email || !password) {
        setError('Please provide an email and password.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.setupInitialAdmin({
          email,
          password,
          firstName: firstName || 'Admin',
          lastName: lastName || 'User',
        });

        setSuccessMsg('Admin created successfully! Logging you in...');
        setAuthData('', response.user);
        onLogin(response.user);
        setTimeout(() => navigate('/'), 800);
      } catch (err: any) {
        let msg = err.message || 'Failed to create initial admin account.';
        if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
          msg = 'Supabase rejected this email domain because DNS MX records are not yet configured on the internet. Since the admin was provisioned, please switch to "Sign In" below or run "npm run setup:admin".';
        }
        setError(msg);
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await authAPI.login({ email, password });

      // Check if user is super_admin, admin or instructor
      if (response.user.role !== 'admin' && response.user.role !== 'instructor' && response.user.role !== 'super_admin') {
        setError('Accès refusé. Rôle Administrateur ou Super Admin requis.');
        setIsLoading(false);
        return;
      }

      // Store user data
      setAuthData('', response.user);

      // Call parent callback with user data
      onLogin(response.user);
      navigate(response.user.role === 'super_admin' ? '/admin-management' : '/');
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides. Accès refusé.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg border ${
            isSuperAdminSetup
              ? 'bg-purple-900/50 text-purple-400 border-purple-500/50 shadow-purple-950/50'
              : 'bg-slate-700 text-brand-orange border-slate-600'
          }`}>
            {isSuperAdminSetup ? <ShieldCheck size={36} /> : isInitialSetup ? <UserPlus size={32} /> : <ShieldCheck size={32} />}
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSuperAdminSetup 
              ? 'Configuration Super Admin' 
              : isInitialSetup 
                ? 'Configuration Admin Initial' 
                : 'Portail Administration'}
          </h1>
          <p className="text-slate-400 text-sm">
            {checkingSetup ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Vérification de l'état système...
              </span>
            ) : isSuperAdminSetup ? (
              'Créez les identifiants du Super Administrateur de la plateforme (usage unique).'
            ) : isInitialSetup ? (
              'Aucun administrateur détecté. Créez vos identifiants ci-dessous.'
            ) : (
              'Accès réservé aux administrateurs et au personnel autorisé.'
            )}
          </p>
        </div>

        {/* One-Time Super Admin Setup Banner (Only shown if no super admin exists yet) */}
        {!hasSuperAdmin && !checkingSetup && (
          <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl text-left">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-1">
              <ShieldCheck size={16} className="text-purple-400 shrink-0" />
              <span>Initialisation Unique du Super Admin</span>
            </div>
            <p className="text-xs text-purple-200/70 mb-3">
              Aucun Super Administrateur n'a encore été créé. Activez votre compte Super Admin pour débloquer le Journal d'Audit système.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSuperAdminSetup(!isSuperAdminSetup);
                setIsInitialSetup(false);
                setError('');
                setSuccessMsg('');
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isSuperAdminSetup
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40'
              }`}
            >
              {isSuperAdminSetup ? '← Revenir à la Connexion Classique' : 'Créer le Super Admin (1 fois) →'}
            </button>
          </div>
        )}

        {isInitialSetup && !checkingSetup && !isSuperAdminSetup && (
          <div className="mb-6 p-3 bg-brand-blue/10 border border-brand-blue/30 text-blue-300 text-xs rounded-xl">
            ✨ <strong>Premier administrateur :</strong> Cette action enregistrera votre compte avec le rôle <code>admin</code>.
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(isInitialSetup || isSuperAdminSetup) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white text-sm placeholder-slate-600 transition-all"
                    placeholder={isSuperAdminSetup ? "Super" : "Admin"}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Nom</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white text-sm placeholder-slate-600 transition-all"
                  placeholder="Admin"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                placeholder="admin@lekolalez.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {(isInitialSetup || isSuperAdminSetup) && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirmer le Mot de Passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || checkingSetup}
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed ${
              isSuperAdminSetup
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/50'
                : 'bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-blue-900/50'
            }`}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isSuperAdminSetup ? (
              'Créer le Super Admin & Accéder au Dashboard'
            ) : isInitialSetup ? (
              'Créer le Compte Admin & Connexion'
            ) : (
              'Accéder au Dashboard'
            )}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-col items-center gap-3 text-center">
          {!isSuperAdminSetup && (
            <button
              type="button"
              onClick={() => {
                setIsInitialSetup(!isInitialSetup);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-brand-orange hover:text-orange-400 font-medium transition-colors"
            >
              {isInitialSetup 
                ? '← Vous avez déjà un compte ? Se Connecter' 
                : 'Besoin de configurer un administrateur ? Configuration Initiale →'}
            </button>
          )}

          <Link to="/" className="text-xs text-slate-500 hover:text-white transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};