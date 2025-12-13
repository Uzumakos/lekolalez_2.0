import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLoginPageProps {
  onLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock Admin Auth Logic
    setTimeout(() => {
        // Simple mock validation
        if (email.includes('admin') || password === 'admin') {
            onLogin();
        } else {
            setError('Invalid credentials. Access denied.');
            setIsLoading(false);
        }
    }, 1500);
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
            <div className="flex justify-center mb-8">
                <div className="h-16 w-16 bg-slate-700 rounded-2xl flex items-center justify-center text-brand-orange shadow-lg border border-slate-600">
                    <ShieldCheck size={32} />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
                <p className="text-slate-400 text-sm">Restricted access for instructors and staff only.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                            placeholder="admin@lekol.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none text-white placeholder-slate-600 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Access Dashboard'}
                    {!isLoading && <ArrowRight size={18} />}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                <Link to="/" className="text-sm text-slate-500 hover:text-white transition-colors">
                    Return to Homepage
                </Link>
            </div>
        </motion.div>
    </div>
  );
};