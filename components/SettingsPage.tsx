import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Globe, Camera, Save, Check, Shield, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authAPI, getStoredUser, setAuthData } from '../services/api';

interface SettingsPageProps {
  userRole: 'admin' | 'student';
  currentUser?: any;
  onUserUpdate?: (user: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userRole, currentUser, onUserUpdate }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addNotification } = useNotifications();

  // Load user data from props or localStorage
  const storedUser = getStoredUser();
  const userData = currentUser || storedUser;

  const [profile, setProfile] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    bio: userData?.bio || '',
    title: userData?.title || '',
    preferredLanguage: userData?.preferredLanguage || 'en',
    avatar: userData?.avatar || `https://ui-avatars.com/api/?name=${userData?.firstName || 'User'}&background=0ea5e9&color=fff`
  });

  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    newMessages: true,
    promotions: false,
    securityAlerts: true
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Update profile state when userData changes
  useEffect(() => {
    if (userData) {
      setProfile({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        bio: userData.bio || '',
        title: userData.title || '',
        preferredLanguage: userData.preferredLanguage || 'en',
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.firstName || 'User'}&background=0ea5e9&color=fff`
      });
    }
  }, [userData?.id]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        title: profile.title,
        preferredLanguage: profile.preferredLanguage,
        avatar: profile.avatar
      });

      // Update stored user data
      const token = localStorage.getItem('token');
      if (token && response.user) {
        setAuthData(token, response.user);
      }

      // Notify parent component
      if (onUserUpdate && response.user) {
        onUserUpdate(response.user);
      }

      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

      addNotification({
        title: t('settings.saved'),
        message: "Your profile has been updated successfully.",
        type: 'success'
      });
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to save profile');
      addNotification({
        title: 'Error',
        message: err.message || 'Failed to save profile',
        type: 'error'
      });
    }
  };

  const handleTestNotification = () => {
    addNotification({
      title: "Test Notification",
      message: "This is a test to verify notifications are working correctly.",
      type: 'info'
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfile(prev => ({ ...prev, avatar: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
        <p className="text-gray-500">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'general' ? 'bg-blue-50 text-brand-blue border-l-4 border-brand-blue font-medium' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <User size={20} /> {t('settings.general')}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-brand-blue border-l-4 border-brand-blue font-medium' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <Lock size={20} /> {t('settings.security')}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-brand-blue border-l-4 border-brand-blue font-medium' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <Bell size={20} /> {t('settings.notifications')}
            </button>
          </div>

          {userRole === 'admin' && (
            <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold mb-2">
                <Shield size={18} /> Admin Access
              </div>
              <p className="text-xs text-amber-700">
                You have elevated privileges. Changes made here apply to your admin profile only.
              </p>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-brand-blue text-white rounded-full cursor-pointer hover:bg-sky-600 transition-colors shadow-lg">
                      <Camera size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{t('settings.profilePic')}</h3>
                    <p className="text-gray-500 text-sm">PNG, JPG or GIF no bigger than 2MB.</p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('auth.email')}</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title / Role</label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="e.g., Web Developer, Student"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none"
                    />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Globe size={16} /> Language Preference
                    </label>
                    <select
                      value={profile.preferredLanguage}
                      onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    >
                      <option value="en">English (US)</option>
                      <option value="fr">Français</option>
                      <option value="ht">Kreyòl Ayisyen</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-4">{t('settings.changePwd')}</h3>

                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-2">Two-Factor Authentication</h3>
                  <p className="text-gray-500 text-sm mb-4">Add an extra layer of security to your account.</p>
                  <button className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Email Notifications</h3>
                  <button
                    onClick={handleTestNotification}
                    className="text-sm text-brand-blue hover:text-sky-600 font-medium px-3 py-1 bg-blue-50 rounded-lg"
                  >
                    Send Test Notification
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'courseUpdates', label: 'Course Updates', desc: 'Receive emails about your course progress and new modules.' },
                    { id: 'newMessages', label: 'New Messages', desc: 'Get notified when an instructor replies to you.' },
                    { id: 'promotions', label: 'Marketing & Promotions', desc: 'Receive offers and new course recommendations.' },
                    { id: 'securityAlerts', label: 'Security Alerts', desc: 'Get notified about logins from new devices.' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          // @ts-ignore
                          checked={notifications[item.id]}
                          // @ts-ignore
                          onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button Area */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${isSaved ? 'bg-green-500 shadow-green-500/30' : 'bg-brand-blue hover:bg-sky-600 shadow-blue-500/30'} disabled:opacity-70`}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                {isSaved ? <><Check size={20} /> {t('settings.saved')}</> : <><Save size={20} /> {t('settings.save')}</>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
