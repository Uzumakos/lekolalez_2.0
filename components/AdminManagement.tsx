import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, Trash2, Mail, Check, AlertCircle, Search, 
  ChevronLeft, ChevronRight, CreditCard, Smartphone, Copy, CheckCircle, 
  Clock, RefreshCw, Filter, Sliders, Image, ExternalLink, Loader2, KeyRound, Eye, EyeOff, Shield,
  Activity, CheckCircle2, XCircle, Sparkles, UserCheck, FileText
} from 'lucide-react';
import { adminAPI, subscriptionsAPI, siteContentAPI, auditLogsAPI, authAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { SiteContent, UserSubscription, AuditLog } from '../types';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  avatar?: string;
}

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalSuperAdmins?: number;
}

interface AdminManagementProps {
  siteContent?: SiteContent;
  onUpdateSiteContent?: (content: SiteContent) => void;
  currentUser?: any;
  onUserUpdate?: (user: any) => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ 
  siteContent, 
  onUpdateSiteContent, 
  currentUser,
  onUserUpdate 
}) => {
  const { t } = useLanguage();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'payments' | 'payment_methods' | 'users' | 'invite' | 'audit_logs'>('payments');

  // Super Admin Check & Elevation State
  const [hasSuperAdmin, setHasSuperAdmin] = useState(true);
  const [isElevatingSuperAdmin, setIsElevatingSuperAdmin] = useState(false);
  const [superAdminNotice, setSuperAdminNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLog | null>(null);
  const [auditStats, setAuditStats] = useState<{ totalEvents: number; todayEvents: number; adminEvents: number; authEvents: number } | null>(null);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Action States
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Password Management & Reset Requests State
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [selectedPasswordUser, setSelectedPasswordUser] = useState<User | null>(null);
  const [passwordModalTab, setPasswordModalTab] = useState<'email' | 'direct'>('email');
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordActionFeedback, setPasswordActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payments / Subscriptions State
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('pending_verification');
  const [paymentActionLoadingId, setPaymentActionLoadingId] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection modal
  const [rejectModalSub, setRejectModalSub] = useState<UserSubscription | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Payment Methods Settings State
  const [moncashConfig, setMoncashConfig] = useState({
    isEnabled: true,
    merchantNumber: '4040-1234',
    receiverName: 'Lekol Alèz EdTech',
    instructions: 'Voye montan an sou nimewo sa a, epi antre kòd tranzaksyon MonCash ou resevwa a pou aktive kont ou.',
    logoUrl: '',
  });

  const [natcashConfig, setNatcashConfig] = useState({
    isEnabled: true,
    merchantNumber: '3232-5678',
    receiverName: 'Lekol Alèz EdTech',
    instructions: 'Fè transfè NatCash la sou nimewo sa a epi soumèt kòd tranzaksyon an.',
    logoUrl: '',
  });

  const [exchangeRateHTG, setExchangeRateHTG] = useState(132);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize Payment Gateways from siteContent
  useEffect(() => {
    if (siteContent?.paymentGateways) {
      const pg = siteContent.paymentGateways;
      if (pg.moncash) {
        setMoncashConfig({
          isEnabled: pg.moncash.isEnabled ?? true,
          merchantNumber: pg.moncash.merchantNumber || '',
          receiverName: pg.moncash.receiverName || '',
          instructions: pg.moncash.instructions || '',
          logoUrl: pg.moncash.logoUrl || '',
        });
      }
      if (pg.natcash) {
        setNatcashConfig({
          isEnabled: pg.natcash.isEnabled ?? true,
          merchantNumber: pg.natcash.merchantNumber || '',
          receiverName: pg.natcash.receiverName || '',
          instructions: pg.natcash.instructions || '',
          logoUrl: pg.natcash.logoUrl || '',
        });
      }
      if (pg.exchangeRateHTG) {
        setExchangeRateHTG(pg.exchangeRateHTG);
      }
    }
  }, [siteContent]);

  useEffect(() => {
    authAPI.hasSuperAdmin().then(exists => setHasSuperAdmin(exists)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchStats();
      fetchResetRequests();
    } else if (activeTab === 'payments') {
      fetchSubscriptions();
    } else if (activeTab === 'audit_logs') {
      fetchAuditLogs();
      fetchAuditStats();
    }
  }, [activeTab, pagination.page, roleFilter, logPagination.page, logRoleFilter, logCategoryFilter, logDateFilter]);

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await auditLogsAPI.getLogs({
        page: logPagination.page,
        limit: logPagination.limit,
        role: logRoleFilter !== 'all' ? logRoleFilter : undefined,
        category: logCategoryFilter !== 'all' ? logCategoryFilter : undefined,
        dateRange: logDateFilter,
        search: logSearch.trim() || undefined,
      });
      setAuditLogs(res.logs || []);
      setLogPagination(prev => ({ ...prev, ...res.pagination }));
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const res = await auditLogsAPI.getAuditStats();
      setAuditStats(res);
    } catch (err) {
      console.warn('fetchAuditStats error:', err);
    }
  };

  const handleElevateToSuperAdmin = async () => {
    if (!currentUser?.id) return;
    setIsElevatingSuperAdmin(true);
    setSuperAdminNotice(null);
    try {
      const res = await authAPI.setupInitialSuperAdmin({
        targetUserId: currentUser.id,
        email: currentUser.email,
      });
      setSuperAdminNotice({
        type: 'success',
        message: res.message || 'Votre compte a été configuré avec succès en tant que Super Admin !',
      });
      setHasSuperAdmin(true);
      const updated = { ...currentUser, role: 'super_admin' };
      if (onUserUpdate) onUserUpdate(updated);
      setActiveTab('audit_logs');
    } catch (err: any) {
      setSuperAdminNotice({
        type: 'error',
        message: err.message || 'Échec de l\'initialisation du Super Admin.',
      });
    } finally {
      setIsElevatingSuperAdmin(false);
    }
  };

  const handleAuditSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogPagination(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  const handleRefreshAuditLogs = () => {
    fetchAuditLogs();
    fetchAuditStats();
  };

  // Periodic or initial fetch of stats and pending payments count
  useEffect(() => {
    fetchStats();
    fetchSubscriptions();
    fetchResetRequests();
    if (isSuperAdmin) {
      fetchAuditStats();
    }
  }, []);

  const fetchResetRequests = async () => {
    try {
      const res = await adminAPI.getPasswordResetRequests();
      setResetRequests(res.requests || []);
    } catch (err) {
      console.warn('fetchResetRequests error:', err);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter || undefined
      });
      setUsers(response.users);
      setPagination(prev => ({ ...prev, ...response.pagination }));
      await fetchResetRequests();
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setIsLoadingSubscriptions(true);
    try {
      const res: any = await subscriptionsAPI.getAll();
      const list = Array.isArray(res) ? res : (res?.subscriptions || []);
      setSubscriptions(list);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const response = await adminAPI.inviteAdmin(inviteEmail);
      setInviteSuccess(response.message);
      setInviteEmail('');

      if (response.inviteLink) {
        setInviteSuccess(`${response.message}\n\nInvite Link (dev only): ${response.inviteLink}`);
      }
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'instructor' | 'admin' | 'super_admin') => {
    setUpdatingUserId(userId);
    try {
      const response = await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, role: response.user.role } : user
      ));
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('admin.deleteUserConfirm'))) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user._id !== userId));
      fetchStats();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Password Management Handlers
  const handleSendResetEmail = async (email: string) => {
    setIsSubmittingPassword(true);
    setPasswordActionFeedback(null);
    try {
      await adminAPI.sendPasswordResetEmail(email);
      setPasswordActionFeedback({
        type: 'success',
        message: t('admin.resetEmailSentSuccess'),
      });
      await fetchResetRequests();
    } catch (err: any) {
      setPasswordActionFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de l’envoi de l’e-mail',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleChangePasswordDirect = async (userId: string) => {
    if (!newDirectPassword || newDirectPassword.length < 6) {
      setPasswordActionFeedback({
        type: 'error',
        message: 'Le mot de passe doit contenir au moins 6 caractères.',
      });
      return;
    }
    setIsSubmittingPassword(true);
    setPasswordActionFeedback(null);
    try {
      await adminAPI.changeUserPasswordDirect(userId, newDirectPassword);
      setPasswordActionFeedback({
        type: 'success',
        message: t('admin.passwordUpdatedSuccess'),
      });
      setNewDirectPassword('');
      await fetchResetRequests();
    } catch (err: any) {
      setPasswordActionFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la modification du mot de passe',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewDirectPassword(pwd);
  };

  // Payment Verification Handlers
  const handleApprovePayment = async (sub: UserSubscription) => {
    setPaymentActionLoadingId(sub.id);
    setPaymentNotice(null);
    try {
      await subscriptionsAPI.verifyPayment(sub.id, 'approve');
      setPaymentNotice({
        type: 'success',
        message: `${t('admin.paymentApprovedNotice')} (${sub.userName || sub.userEmail})`
      });
      await fetchSubscriptions();
    } catch (err: any) {
      setPaymentNotice({
        type: 'error',
        message: err.message || 'Validation failed'
      });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectModalSub) return;
    setPaymentActionLoadingId(rejectModalSub.id);
    setPaymentNotice(null);
    try {
      await subscriptionsAPI.verifyPayment(rejectModalSub.id, 'reject', rejectReason);
      setPaymentNotice({
        type: 'success',
        message: `${t('admin.paymentRejectedNotice')} (${rejectModalSub.userName || rejectModalSub.userEmail})`
      });
      setRejectModalSub(null);
      setRejectReason('');
      await fetchSubscriptions();
    } catch (err: any) {
      setPaymentNotice({
        type: 'error',
        message: err.message || 'Rejection failed'
      });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Payment Settings Save Handler
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveNotice(null);
    try {
      const updatedPaymentGateways = {
        stripe: siteContent?.paymentGateways?.stripe || {
          isEnabled: true,
          publishableKey: '',
          currency: 'USD',
          allowRecurring: true,
          allowPrepaid: true,
        },
        moncash: {
          ...moncashConfig,
        },
        natcash: {
          ...natcashConfig,
        },
        exchangeRateHTG: Number(exchangeRateHTG) || 132,
      };

      const payload = {
        ...(siteContent || {}),
        paymentGateways: updatedPaymentGateways,
        pricing: {
          ...(siteContent?.pricing || { title: 'Tarifs', subtitle: '', plans: [] }),
          paymentGateways: updatedPaymentGateways,
        },
      };

      await siteContentAPI.update(payload);

      if (onUpdateSiteContent) {
        onUpdateSiteContent(payload as any);
      }

      setSaveNotice({
        type: 'success',
        message: t('admin.pmSaveSuccess'),
      });
    } catch (err: any) {
      console.error('Error saving payment settings:', err);
      setSaveNotice({
        type: 'error',
        message: err.message || t('admin.pmSaveError'),
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query)
    );
  });

  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
  const pendingCount = safeSubscriptions.filter(s => s.subscriptionStatus === 'pending_verification').length;

  const filteredSubscriptions = safeSubscriptions.filter(sub => {
    if (paymentFilter === 'all') return true;
    return sub.subscriptionStatus === paymentFilter;
  });

  const getActionBadge = (action: string, _category?: string) => {
    switch (action) {
      case 'user_login':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 size={13} className="text-blue-500" /> Connexion
          </span>
        );
      case 'user_register':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
            <UserPlus size={13} className="text-emerald-500" /> Inscription
          </span>
        );
      case 'payment_approved':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
            <CreditCard size={13} className="text-emerald-500" /> Paiement Validé
          </span>
        );
      case 'payment_rejected':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 shrink-0">
            <XCircle size={13} className="text-red-500" /> Paiement Rejeté
          </span>
        );
      case 'role_changed':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 shrink-0">
            <Shield size={13} className="text-purple-500" /> Rôle Modifié
          </span>
        );
      case 'user_deleted':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shrink-0">
            <Trash2 size={13} className="text-rose-500" /> Compte Supprimé
          </span>
        );
      case 'password_reset_direct':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shrink-0">
            <KeyRound size={13} className="text-amber-500" /> MDP Modifié (Direct)
          </span>
        );
      case 'password_reset_email_sent':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1.5 shrink-0">
            <Mail size={13} className="text-cyan-500" /> Lien MDP Envoyé
          </span>
        );
      case 'super_admin_initialized':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shrink-0">
            <Sparkles size={13} className="text-amber-600" /> Super Admin Créé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5 shrink-0">
            <Activity size={13} className="text-gray-500" /> {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('admin.mgmtTitle')}</h1>
        <p className="text-gray-500 text-sm">{t('admin.mgmtSubtitle')}</p>
      </div>

      {/* One-Time Super Admin Elevation Banner */}
      {!hasSuperAdmin && (
        <div className="mb-8 p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl border border-purple-500/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300 shrink-0">
                <Sparkles size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">Initialisation Unique : Rôle Super Admin</h3>
                  <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/40 rounded-full text-[11px] font-bold text-purple-200">Action Unique</span>
                </div>
                <p className="text-sm text-purple-200/80 max-w-2xl leading-relaxed">
                  Aucun compte Super Administrateur n'a encore été créé sur la plateforme. En tant qu'administrateur, vous pouvez élever votre compte au rang de <strong>Super Admin</strong> en 1 clic pour débloquer le <strong>Journal d'Audit de tous les utilisateurs et administrateurs</strong>. Cette opportunité disparaîtra dès son activation.
                </p>
              </div>
            </div>
            <button
              onClick={handleElevateToSuperAdmin}
              disabled={isElevatingSuperAdmin}
              className="px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/40 shrink-0 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isElevatingSuperAdmin ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              <span>{isElevatingSuperAdmin ? 'Activation en cours...' : 'Initialiser le Super Admin'}</span>
            </button>
          </div>
          {superAdminNotice && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-semibold ${superAdminNotice.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}>
              {superAdminNotice.message}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">{t('admin.statTotalUsers')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">{t('admin.statStudents')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalInstructors}</p>
                <p className="text-xs text-gray-500">{t('admin.statInstructors')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-gray-500">{t('admin.statPendingPayments')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CreditCard size={18} />
          <span>{t('admin.tabPaymentVerification')}</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-brand-orange text-white">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payment_methods')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'payment_methods'
              ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Sliders size={18} />
          <span>{t('admin.tabPaymentMethods')}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users size={18} />
          <span>{t('admin.tabManageUsers')}</span>
          {resetRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white flex items-center gap-1">
              <KeyRound size={12} />
              {resetRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invite')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'invite'
              ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <UserPlus size={18} />
          <span>{t('admin.tabInviteAdmin')}</span>
        </button>

        {/* Audit Logs Tab - Exclusively for Super Admin */}
        {(isSuperAdmin || activeTab === 'audit_logs') && (
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'audit_logs'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Activity size={18} />
            <span>Journal d'Audit</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${activeTab === 'audit_logs' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-800'}`}>
              Super Admin
            </span>
          </button>
        )}
      </div>

      {/* Payment Notice Message */}
      {paymentNotice && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-3 border ${
            paymentNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {paymentNotice.type === 'success' ? (
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span>{paymentNotice.message}</span>
        </div>
      )}

      {/* TAB: PAYMENT METHODS SETTINGS */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('admin.pmTitle')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('admin.pmSubtitle')}</p>
              </div>

              {/* Currency Exchange Rate Quick Box */}
              <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/80 px-4 py-2.5 rounded-2xl">
                <div>
                  <div className="text-[11px] font-bold text-amber-900">{t('admin.pmExchangeRateTitle')}</div>
                  <div className="text-[10px] text-amber-700">1 USD = {exchangeRateHTG} HTG</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={exchangeRateHTG}
                    onChange={e => setExchangeRateHTG(Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-xs font-bold text-gray-800 bg-white border border-amber-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-amber-800">HTG</span>
                </div>
              </div>
            </div>

            {/* Save Notice */}
            {saveNotice && (
              <div
                className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-3 border ${
                  saveNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {saveNotice.type === 'success' ? (
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-red-600 shrink-0" />
                )}
                <span>{saveNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleSavePaymentSettings} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MonCash Panel */}
                <div className="border border-red-100 rounded-3xl p-6 bg-red-50/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-red-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      {moncashConfig.logoUrl ? (
                        <img 
                          src={moncashConfig.logoUrl} 
                          alt="MonCash" 
                          className="h-7 w-auto object-contain max-w-[100px] rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                          MC
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{t('admin.pmMoncashTitle')}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          moncashConfig.isEnabled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {moncashConfig.isEnabled ? t('admin.pmEnabled') : t('admin.pmDisabled')}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={moncashConfig.isEnabled}
                        onChange={e => setMoncashConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {/* Merchant Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmMerchantNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={moncashConfig.merchantNumber}
                      onChange={e => setMoncashConfig(prev => ({ ...prev, merchantNumber: e.target.value }))}
                      placeholder="Ex: 4040-1234 oswa +509 4040 1234"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    />
                  </div>

                  {/* Receiver Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmReceiverName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={moncashConfig.receiverName}
                      onChange={e => setMoncashConfig(prev => ({ ...prev, receiverName: e.target.value }))}
                      placeholder="Ex: Lekol Alèz EdTech"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    />
                  </div>

                  {/* Logo Image Link (URL) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>{t('admin.pmLogoUrl')}</span>
                      <span className="text-[10px] text-gray-400 font-normal">PNG / SVG / JPG</span>
                    </label>
                    <div className="relative">
                      <Image size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={moncashConfig.logoUrl}
                        onChange={e => setMoncashConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder={t('admin.pmLogoUrlPlaceholder')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Logo Preview */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="w-16 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {moncashConfig.logoUrl ? (
                        <img 
                          src={moncashConfig.logoUrl} 
                          alt="MonCash preview" 
                          className="max-h-full max-w-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x50?text=Invalid+URL';
                          }}
                        />
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold text-center px-1">MC</div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-gray-800">{t('admin.pmLogoPreview')}</div>
                      <div className="text-[11px] text-gray-500">
                        {moncashConfig.logoUrl ? moncashConfig.logoUrl : t('admin.pmNoLogo')}
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmInstructions')}
                    </label>
                    <textarea
                      rows={3}
                      value={moncashConfig.instructions}
                      onChange={e => setMoncashConfig(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder={t('admin.pmInstructionsPlaceholder')}
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                {/* NatCash Panel */}
                <div className="border border-blue-100 rounded-3xl p-6 bg-blue-50/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      {natcashConfig.logoUrl ? (
                        <img 
                          src={natcashConfig.logoUrl} 
                          alt="NatCash" 
                          className="h-7 w-auto object-contain max-w-[100px] rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                          NC
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{t('admin.pmNatcashTitle')}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          natcashConfig.isEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {natcashConfig.isEnabled ? t('admin.pmEnabled') : t('admin.pmDisabled')}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={natcashConfig.isEnabled}
                        onChange={e => setNatcashConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Merchant Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmMerchantNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={natcashConfig.merchantNumber}
                      onChange={e => setNatcashConfig(prev => ({ ...prev, merchantNumber: e.target.value }))}
                      placeholder="Ex: 3232-5678 oswa +509 3232 5678"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Receiver Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmReceiverName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={natcashConfig.receiverName}
                      onChange={e => setNatcashConfig(prev => ({ ...prev, receiverName: e.target.value }))}
                      placeholder="Ex: Lekol Alèz EdTech"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Logo Image Link (URL) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>{t('admin.pmLogoUrl')}</span>
                      <span className="text-[10px] text-gray-400 font-normal">PNG / SVG / JPG</span>
                    </label>
                    <div className="relative">
                      <Image size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={natcashConfig.logoUrl}
                        onChange={e => setNatcashConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder={t('admin.pmLogoUrlPlaceholder')}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Logo Preview */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="w-16 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {natcashConfig.logoUrl ? (
                        <img 
                          src={natcashConfig.logoUrl} 
                          alt="NatCash preview" 
                          className="max-h-full max-w-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x50?text=Invalid+URL';
                          }}
                        />
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold text-center px-1">NC</div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-gray-800">{t('admin.pmLogoPreview')}</div>
                      <div className="text-[11px] text-gray-500">
                        {natcashConfig.logoUrl ? natcashConfig.logoUrl : t('admin.pmNoLogo')}
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.pmInstructions')}
                    </label>
                    <textarea
                      rows={3}
                      value={natcashConfig.instructions}
                      onChange={e => setNatcashConfig(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder={t('admin.pmInstructionsPlaceholder')}
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-3 bg-brand-blue hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('admin.pmSavingBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{t('admin.pmSaveBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS VERIFICATION */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header & Filter */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('admin.portalTitle')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('admin.portalSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchSubscriptions}
                disabled={isLoadingSubscriptions}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title={t('admin.refreshList')}
              >
                <RefreshCw size={16} className={isLoadingSubscriptions ? 'animate-spin' : ''} />
              </button>

              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                <Filter size={14} className="text-gray-400 ml-1.5" />
                <button
                  onClick={() => setPaymentFilter('pending_verification')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    paymentFilter === 'pending_verification'
                      ? 'bg-white shadow text-amber-600 font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.filterPending')} ({pendingCount})
                </button>
                <button
                  onClick={() => setPaymentFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    paymentFilter === 'active'
                      ? 'bg-white shadow text-emerald-600 font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.filterActive')}
                </button>
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    paymentFilter === 'all'
                      ? 'bg-white shadow text-brand-blue font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.filterAll')} ({safeSubscriptions.length})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoadingSubscriptions ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-brand-blue" />
              <p className="text-sm">{t('admin.loadingPayments')}</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <CreditCard size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-base font-semibold text-gray-700">{t('admin.noPaymentsFound')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('admin.noPaymentsFoundDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">{t('admin.thStudent')}</th>
                    <th className="px-6 py-3.5">{t('admin.thPlanDuration')}</th>
                    <th className="px-6 py-3.5">{t('admin.thAmount')}</th>
                    <th className="px-6 py-3.5">{t('admin.thMethodTransId')}</th>
                    <th className="px-6 py-3.5">{t('admin.thDate')}</th>
                    <th className="px-6 py-3.5">{t('admin.thStatus')}</th>
                    <th className="px-6 py-3.5 text-right">{t('admin.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredSubscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{sub.userName || t('admin.thStudent')}</div>
                        <div className="text-gray-500 text-xs">{sub.userEmail || sub.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{sub.planName}</span>
                        <div className="text-gray-500 text-[11px]">{sub.durationMonths} Mwa</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">${sub.amountPaid.toFixed(2)} USD</div>
                        {sub.amountPaidHTG && (
                          <div className="text-emerald-700 font-semibold text-[11px]">
                            {sub.amountPaidHTG.toLocaleString()} HTG
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {sub.paymentMethod === 'moncash' ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold text-[10px] uppercase">
                              MonCash
                            </span>
                          ) : sub.paymentMethod === 'natcash' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase">
                              NatCash
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase">
                              Stripe Kat
                            </span>
                          )}
                        </div>
                        {sub.paymentReference && (
                          <div className="flex items-center gap-1 font-mono text-gray-800 font-bold text-xs bg-gray-100 px-2 py-1 rounded-md w-fit">
                            <span>{sub.paymentReference}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyRef(sub.paymentReference || '')}
                              className="text-gray-400 hover:text-brand-blue"
                              title={t('admin.copy')}
                            >
                              {copiedRef === sub.paymentReference ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                        <div className="text-[10px]">{new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        {sub.subscriptionStatus === 'pending_verification' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock size={12} /> {t('admin.filterPending')}
                          </span>
                        ) : sub.subscriptionStatus === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle size={12} /> {t('admin.filterActive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                            {sub.subscriptionStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.subscriptionStatus === 'pending_verification' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprovePayment(sub)}
                              disabled={paymentActionLoadingId === sub.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                            >
                              {paymentActionLoadingId === sub.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                              <span>{t('admin.approve')}</span>
                            </button>

                            <button
                              onClick={() => {
                                setRejectModalSub(sub);
                                setRejectReason('');
                              }}
                              disabled={paymentActionLoadingId === sub.id}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all border border-red-200"
                            >
                              {t('admin.reject')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.rejectModalTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">
              {t('admin.rejectModalDesc')} (<strong>{rejectModalSub.paymentReference}</strong> - {rejectModalSub.userName || rejectModalSub.userEmail})
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('admin.reasonLabel')}</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('admin.reasonPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                {t('admin.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                disabled={paymentActionLoadingId === rejectModalSub.id}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-1.5"
              >
                {paymentActionLoadingId === rejectModalSub.id && <Loader2 size={14} className="animate-spin" />}
                <span>{t('admin.confirmReject')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INVITE ADMIN */}
      {activeTab === 'invite' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-blue/10 rounded-2xl">
                <UserPlus size={24} className="text-brand-blue" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('admin.inviteTitle')}</h2>
                <p className="text-sm text-gray-500">{t('admin.inviteSubtitle')}</p>
              </div>
            </div>

            {inviteSuccess && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl flex items-start gap-3 border border-green-200 whitespace-pre-wrap">
                <Check size={18} className="shrink-0 mt-0.5" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            {inviteError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-3 border border-red-200">
                <AlertCircle size={18} className="shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.inviteEmailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t('admin.inviteEmailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full py-2.5 bg-brand-blue hover:bg-sky-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 text-sm"
              >
                {isInviting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{t('admin.inviteSendingBtn')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>{t('admin.inviteSendBtn')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Pending Password Reset Requests Alert Banner */}
          {resetRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {resetRequests.filter(r => r.status === 'pending').length} demande(s) de réinitialisation de mot de passe en attente
                  </h4>
                  <p className="text-xs text-amber-700">
                    Des utilisateurs ont cliqué sur "Mot de passe oublié ?". Vous pouvez leur renvoyer l'e-mail ou leur définir un nouveau mot de passe directement via l'icône clé.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filters and Search */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.searchUsersPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue"
              >
                <option value="">{t('admin.filterAllRoles')}</option>
                <option value="student">{t('admin.statStudents')}</option>
                <option value="instructor">{t('admin.statInstructors')}</option>
                <option value="admin">{t('role.admin')}</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {isLoadingUsers ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              {t('admin.loadingPayments')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-4">{t('admin.thUser')}</th>
                    <th className="p-4">{t('admin.thRole')}</th>
                    <th className="p-4">{t('admin.thStatus')}</th>
                    <th className="p-4">{t('admin.thJoined')}</th>
                    <th className="p-4 text-right">{t('admin.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUsers.map((user) => {
                    const userPendingReset = resetRequests.find(
                      r => (r.user_id === user._id || r.email === user.email) && r.status === 'pending'
                    );

                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs">
                              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                                {userPendingReset && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                    <KeyRound size={10} /> Reset demandé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {user.role === 'super_admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                              <Shield size={12} className="text-purple-600" />
                              Super Admin
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                              disabled={updatingUserId === user._id || (!isSuperAdmin && user.role === 'admin')}
                              className="text-xs px-2 py-1 rounded border border-gray-200 bg-white focus:outline-none focus:border-brand-blue capitalize disabled:opacity-60"
                            >
                              <option value="student">{t('admin.statStudents')}</option>
                              <option value="instructor">{t('admin.statInstructors')}</option>
                              <option value="admin">{t('role.admin')}</option>
                              {isSuperAdmin && (
                                <option value="super_admin">Super Admin</option>
                              )}
                            </select>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? t('admin.filterActive') : t('admin.pmDisabled')}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPasswordUser(user);
                                setPasswordModalTab('email');
                                setNewDirectPassword('');
                                setPasswordActionFeedback(null);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors relative"
                              title={t('admin.passwordManagement')}
                            >
                              <KeyRound size={16} />
                              {userPendingReset && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deletingUserId === user._id || user.role === 'super_admin'}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                              title={user.role === 'super_admin' ? "Impossible de supprimer un Super Admin" : t('admin.thActions')}
                            >
                              {deletingUserId === user._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab Content (Super Admin Exclusive) */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          {/* Header & Description */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-xl border border-purple-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300">
                  <Activity size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Journal d'Audit Global</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-purple-200/70 max-w-2xl leading-relaxed">
                Suivi en temps réel de toutes les actions et interactions des utilisateurs et des autres administrateurs sur la plateforme (connexions, modifications de rôles, validations financières, suppressions de comptes, réinitialisations de mots de passe).
              </p>
            </div>
            <button
              onClick={handleRefreshAuditLogs}
              disabled={isLoadingLogs}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
              <span>Actualiser le journal</span>
            </button>
          </div>

          {/* Audit Stats KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{auditStats?.totalEvents ?? logPagination.total}</p>
                  <p className="text-xs text-gray-500">Total des événements</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{auditStats?.adminEvents ?? 0}</p>
                  <p className="text-xs text-gray-500">Actions d'administrateurs</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{auditStats?.authEvents ?? 0}</p>
                  <p className="text-xs text-gray-500">Connexions & Authentification</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{auditStats?.todayEvents ?? 0}</p>
                  <p className="text-xs text-gray-500">Activité aujourd'hui</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <form onSubmit={handleAuditSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par utilisateur, email, action ou cible..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Role Filter */}
                <select
                  value={logRoleFilter}
                  onChange={(e) => {
                    setLogRoleFilter(e.target.value);
                    setLogPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="text-xs px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructeur</option>
                  <option value="student">Étudiant</option>
                </select>

                {/* Category Filter */}
                <select
                  value={logCategoryFilter}
                  onChange={(e) => {
                    setLogCategoryFilter(e.target.value);
                    setLogPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="text-xs px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="auth">Authentification</option>
                  <option value="admin_action">Actions Admin</option>
                  <option value="subscription">Paiements / Abonnements</option>
                  <option value="security">Sécurité</option>
                  <option value="course">Cours</option>
                </select>

                {/* Date Filter */}
                <select
                  value={logDateFilter}
                  onChange={(e) => {
                    setLogDateFilter(e.target.value as any);
                    setLogPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="text-xs px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Toutes dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Search size={14} />
                  <span>Filtrer</span>
                </button>
              </div>
            </form>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoadingLogs ? (
              <div className="p-12 text-center">
                <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">Chargement du journal d'audit...</p>
                <p className="text-xs text-gray-400">Récupération des événements avec horodatages</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Activity size={24} />
                </div>
                <p className="text-base font-bold text-gray-800">Aucun événement enregistré</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Aucun log ne correspond à vos filtres actuels ou aucune action n'a encore été tracée.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4">Date & Heure</th>
                      <th className="p-4">Utilisateur / Auteur</th>
                      <th className="p-4">Action Effectuée</th>
                      <th className="p-4">Ressource Cible</th>
                      <th className="p-4">Adresse IP</th>
                      <th className="p-4 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {auditLogs.map((log) => {
                      const logDateStr = log.created_at || log.createdAt;
                      const logDate = logDateStr ? new Date(logDateStr) : new Date();
                      const isValidDate = !isNaN(logDate.getTime());
                      const displayName = log.user_name || log.userName || (log.user_email || log.userEmail ? (log.user_email || log.userEmail).split('@')[0] : 'Utilisateur');
                      const displayEmail = log.user_email || log.userEmail || '';
                      const displayRole = log.user_role || log.userRole || 'student';
                      const initialChar = (displayName || displayEmail || '?').charAt(0).toUpperCase();
                      const displayIp = log.ip_address || log.ipAddress || '127.0.0.1';
                      const displayTarget = log.target_label || log.targetLabel || log.target_id || log.targetId;
                      const displayTargetType = log.target_type || log.targetType;
                      const displayCategory = log.action_category || log.actionCategory;

                      return (
                        <tr key={log.id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {isValidDate
                                    ? logDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : 'Date inconnue'}
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono">
                                  {isValidDate
                                    ? logDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                    : '--:--'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 shrink-0">
                                {initialChar}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                                    displayRole === 'super_admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : displayRole === 'admin'
                                      ? 'bg-blue-100 text-blue-800'
                                      : displayRole === 'instructor'
                                      ? 'bg-violet-100 text-violet-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {displayRole === 'super_admin' ? 'Super Admin' : displayRole}
                                  </span>
                                </div>
                                {displayEmail && (
                                  <div className="text-[11px] text-gray-500">{displayEmail}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {getActionBadge(log.action, displayCategory)}
                          </td>
                          <td className="p-4">
                            {displayTarget || displayTargetType ? (
                              <div>
                                <span className="font-semibold text-gray-800">{displayTarget || '-'}</span>
                                {displayTargetType && (
                                  <div className="text-[10px] text-gray-400 capitalize">{displayTargetType}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                            {displayIp}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedLogForModal(log)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 font-medium text-xs transition-colors inline-flex items-center gap-1.5"
                              title="Voir les métadonnées de l'action"
                            >
                              <FileText size={14} />
                              <span>Inspecter</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {logPagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Affichage de {((logPagination.page - 1) * logPagination.limit) + 1} à {Math.min(logPagination.page * logPagination.limit, logPagination.total)} sur {logPagination.total} événements
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLogPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={logPagination.page <= 1 || isLoadingLogs}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                    Page {logPagination.page} / {logPagination.pages}
                  </span>
                  <button
                    onClick={() => setLogPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={logPagination.page >= logPagination.pages || isLoadingLogs}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {selectedPasswordUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{t('admin.passwordManagement')}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedPasswordUser.fullName} ({selectedPasswordUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPasswordUser(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Check if user requested a reset */}
            {(() => {
              const pendingReq = resetRequests.find(
                r => (r.user_id === selectedPasswordUser._id || r.email === selectedPasswordUser.email) && r.status === 'pending'
              );
              if (pendingReq) {
                return (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Demande de réinitialisation reçue :</span>{' '}
                      {new Date(pendingReq.requested_at).toLocaleString()}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Sub-tabs */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setPasswordModalTab('email');
                  setPasswordActionFeedback(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  passwordModalTab === 'email'
                    ? 'bg-white text-brand-blue shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail size={14} />
                <span>{t('admin.resetPasswordEmail')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalTab('direct');
                  setPasswordActionFeedback(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  passwordModalTab === 'direct'
                    ? 'bg-white text-brand-blue shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield size={14} />
                <span>{t('admin.setNewPasswordDirect')}</span>
              </button>
            </div>

            {/* Option 1: Send Reset Email */}
            {passwordModalTab === 'email' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                  L'utilisateur recevra un e-mail officiel à l'adresse <strong>{selectedPasswordUser.email}</strong> contenant un lien sécurisé lui permettant de réinitialiser son mot de passe en toute autonomie.
                </div>
                <button
                  type="button"
                  onClick={() => handleSendResetEmail(selectedPasswordUser.email)}
                  disabled={isSubmittingPassword}
                  className="w-full py-2.5 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmittingPassword ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  <span>Envoyer l'e-mail de réinitialisation</span>
                </button>
              </div>
            )}

            {/* Option 2: Set New Password Directly in Database */}
            {passwordModalTab === 'direct' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed">
                  Cette action applique immédiatement le nouveau mot de passe chiffré dans la base de données (<code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">auth.users</code>). L'utilisateur pourra s'y connecter immédiatement.
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">Nouveau mot de passe</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-xs text-brand-blue font-bold hover:underline"
                    >
                      {t('admin.generatePassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordInput ? "text" : "password"}
                      value={newDirectPassword}
                      onChange={e => setNewDirectPassword(e.target.value)}
                      placeholder="Au moins 6 caractères..."
                      className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordInput ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChangePasswordDirect(selectedPasswordUser._id)}
                  disabled={isSubmittingPassword || !newDirectPassword}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmittingPassword ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Enregistrer dans la base de données</span>
                </button>
              </div>
            )}

            {/* Action Feedback */}
            {passwordActionFeedback && (
              <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordActionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordActionFeedback.type === 'success' ? (
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                )}
                <span>{passwordActionFeedback.message}</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPasswordUser(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Details Inspector Modal */}
      {selectedLogForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Activity size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Détails de l'Événement d'Audit</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedLogForModal.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Quick Grid Details */}
            {(() => {
              const modalDateStr = selectedLogForModal.created_at || selectedLogForModal.createdAt;
              const modalDate = modalDateStr ? new Date(modalDateStr) : new Date();
              const isModalDateValid = !isNaN(modalDate.getTime());
              const modalName = selectedLogForModal.user_name || selectedLogForModal.userName || (selectedLogForModal.user_email || selectedLogForModal.userEmail ? (selectedLogForModal.user_email || selectedLogForModal.userEmail).split('@')[0] : 'Utilisateur');
              const modalEmail = selectedLogForModal.user_email || selectedLogForModal.userEmail || '';
              const modalRole = selectedLogForModal.user_role || selectedLogForModal.userRole || 'student';
              const modalCategory = selectedLogForModal.action_category || selectedLogForModal.actionCategory;
              const modalTarget = selectedLogForModal.target_label || selectedLogForModal.targetLabel || selectedLogForModal.target_id || selectedLogForModal.targetId || 'Aucune';
              const modalTargetType = selectedLogForModal.target_type || selectedLogForModal.targetType;
              const modalIp = selectedLogForModal.ip_address || selectedLogForModal.ipAddress || '127.0.0.1';
              const modalAgent = selectedLogForModal.user_agent || selectedLogForModal.userAgent || 'Client Web';

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date & Heure exacte</div>
                      <div className="text-xs font-semibold text-gray-800">
                        {isModalDateValid
                          ? modalDate.toLocaleString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'Date non renseignée'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auteur de l'action</div>
                      <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span>{modalName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                          {modalRole}
                        </span>
                      </div>
                      {modalEmail && <div className="text-[11px] text-gray-500">{modalEmail}</div>}
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Action & Catégorie</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getActionBadge(selectedLogForModal.action, modalCategory)}
                        {modalCategory && <span className="text-xs text-gray-500 capitalize">({modalCategory})</span>}
                      </div>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cible concernée</div>
                      <div className="text-xs font-semibold text-gray-800">{modalTarget}</div>
                      {modalTargetType && (
                        <div className="text-[10px] text-gray-400 capitalize">Type: {modalTargetType}</div>
                      )}
                    </div>
                  </div>

                  {/* Technical Context */}
                  <div className="mb-5 p-3.5 bg-slate-900 rounded-2xl text-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contexte Réseau & Système</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">Traçabilité Active</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500">Adresse IP: </span>
                        <span className="text-slate-200 font-bold">{modalIp}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500">Agent: </span>
                        <span className="text-slate-300" title={modalAgent}>{modalAgent}</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Payload JSON */}
            {selectedLogForModal.details && Object.keys(selectedLogForModal.details).length > 0 && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-2">Données & Paramètres de l'Action (Payload)</label>
                <div className="p-3.5 bg-gray-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto max-h-48 border border-gray-800">
                  <pre>{JSON.stringify(selectedLogForModal.details, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForModal(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
