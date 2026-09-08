import React, { useState } from 'react';
import { SiteContent, PricingPlan, FreeAccessSettings, PaymentGatewaySettings, StaffMember } from '../types';
import { Save, Plus, Trash2, Layout, Info, Users, CreditCard, Phone, Check, Loader2, AlertCircle, Sparkles, Smartphone, Shield, Clock, DollarSign, Image, UserPlus, Briefcase } from 'lucide-react';
import { siteContentAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { DEFAULT_STAFF } from './PublicPages';

interface AdminContentManagerProps {
  content: SiteContent;
  onUpdate: (newContent: SiteContent) => void;
}

export const AdminContentManager: React.FC<AdminContentManagerProps> = ({ content, onUpdate }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'about' | 'pricing' | 'freeAccess' | 'paymentGateways' | 'instructors' | 'contact'>('freeAccess');
  const [tempContent, setTempContent] = useState<SiteContent>({
    ...content,
    about: {
      ...content.about,
      staff: content.about?.staff && content.about.staff.length > 0 ? content.about.staff : DEFAULT_STAFF
    },
    freeAccess: content.freeAccess || {
      isEnabled: true,
      durationDays: null,
      videosPerSubjectPerDay: 1
    },
    paymentGateways: content.paymentGateways || {
      stripe: {
        isEnabled: true,
        publishableKey: '',
        currency: 'usd',
        allowRecurring: true,
        allowPrepaid: true
      },
      moncash: {
        isEnabled: true,
        merchantNumber: '+509 3700-0000',
        receiverName: 'Lekol Alez Haiti',
        instructions: 'Voye kòb la sou nimewo MonCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an (Ref) epi mete l nan bwat anba a pou admin lan valide aksè w.',
        logoUrl: ''
      },
      natcash: {
        isEnabled: true,
        merchantNumber: '+509 4000-0000',
        receiverName: 'Lekol Alez Haiti',
        instructions: 'Voye kòb la sou nimewo NatCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an (Ref) epi mete l nan bwat anba a pou admin lan valide aksè w.',
        logoUrl: ''
      },
      exchangeRateHTG: 132
    }
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      await siteContentAPI.update({
        about: tempContent.about,
        pricing: tempContent.pricing,
        instructors: tempContent.instructors,
        contact: tempContent.contact,
        freeAccess: tempContent.freeAccess,
        paymentGateways: tempContent.paymentGateways
      });

      onUpdate(tempContent);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || t('content.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (section: keyof SiteContent, field: string, value: any) => {
    setTempContent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  // Free Access Handlers
  const handleFreeAccessChange = (field: keyof FreeAccessSettings, value: any) => {
    setTempContent(prev => ({
      ...prev,
      freeAccess: {
        ...prev.freeAccess,
        [field]: value
      }
    }));
  };

  // Payment Gateway Handlers
  const handleGatewayFieldChange = (gateway: 'stripe' | 'moncash' | 'natcash', field: string, value: any) => {
    setTempContent(prev => ({
      ...prev,
      paymentGateways: {
        ...prev.paymentGateways,
        [gateway]: {
          ...(prev.paymentGateways[gateway] as any),
          [field]: value
        }
      }
    }));
  };

  // Plan Handlers
  const handleAddPlan = () => {
    const newPlan: PricingPlan = {
      id: `plan_${Date.now()}`,
      name: t('content.defaultPlanName'),
      price: '1.99',
      period: '/mwa',
      features: [t('content.defaultFeatureAccess'), t('content.defaultFeatureCertificate')],
      buttonText: t('content.defaultBtnText')
    };
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: [...(prev.pricing.plans || []), newPlan]
      }
    }));
  };

  const handleUpdatePlan = (index: number, field: keyof PricingPlan, value: any) => {
    const updatedPlans = [...(tempContent.pricing.plans || [])];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: updatedPlans
      }
    }));
  };

  const handleDeletePlan = (index: number) => {
    const updatedPlans = tempContent.pricing.plans.filter((_, i) => i !== index);
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: updatedPlans
      }
    }));
  };

  const handleAddFeatureToPlan = (planIdx: number) => {
    const updatedPlans = [...(tempContent.pricing.plans || [])];
    updatedPlans[planIdx] = {
      ...updatedPlans[planIdx],
      features: [...(updatedPlans[planIdx].features || []), t('content.defaultFeatureNew')]
    };
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: updatedPlans
      }
    }));
  };

  const handleUpdateFeature = (planIdx: number, featIdx: number, value: string) => {
    const updatedPlans = [...(tempContent.pricing.plans || [])];
    const newFeatures = [...updatedPlans[planIdx].features];
    newFeatures[featIdx] = value;
    updatedPlans[planIdx] = { ...updatedPlans[planIdx], features: newFeatures };
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: updatedPlans
      }
    }));
  };

  const handleDeleteFeature = (planIdx: number, featIdx: number) => {
    const updatedPlans = [...(tempContent.pricing.plans || [])];
    updatedPlans[planIdx] = {
      ...updatedPlans[planIdx],
      features: updatedPlans[planIdx].features.filter((_, i) => i !== featIdx)
    };
    setTempContent(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: updatedPlans
      }
    }));
  };

  const handleStatChange = (idx: number, field: 'label' | 'value', value: string) => {
    const newStats = [...tempContent.about.stats];
    newStats[idx] = { ...newStats[idx], [field]: value };
    setTempContent(prev => ({ ...prev, about: { ...prev.about, stats: newStats } }));
  };

  const handleAddStaffMember = () => {
    const newMember: StaffMember = {
      id: `staff_${Date.now()}`,
      name: '',
      role: '',
      photoUrl: ''
    };
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: [...(prev.about.staff || []), newMember]
      }
    }));
  };

  const handleUpdateStaffMember = (index: number, field: keyof StaffMember, value: string) => {
    const updated = [...(tempContent.about.staff || [])];
    updated[index] = { ...updated[index], [field]: value };
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: updated
      }
    }));
  };

  const handleDeleteStaffMember = (index: number) => {
    const updated = (tempContent.about.staff || []).filter((_, i) => i !== index);
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: updated
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('content.title')}</h1>
          <p className="text-gray-500 text-sm">{t('content.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70 ${
              isSaved ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-brand-blue hover:bg-sky-600 shadow-blue-500/20'
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <Check size={18} /> : <Save size={18} />}
            <span>{isLoading ? t('content.savingBtn') : isSaved ? t('content.savedBtn') : t('content.saveBtn')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50/80 border-r border-gray-100 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('freeAccess')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'freeAccess' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-100/70'
            }`}
          >
            <Clock size={18} className="text-emerald-600" /> {t('content.tabFreeAccess')}
          </button>

          <button
            onClick={() => setActiveTab('paymentGateways')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'paymentGateways' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-100/70'
            }`}
          >
            <Smartphone size={18} className="text-brand-orange" /> {t('content.tabPaymentGateways')}
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === 'pricing' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-100/70'
            }`}
          >
            <CreditCard size={18} className="text-brand-blue" /> {t('content.tabPricingPlans')}
          </button>

          <div className="pt-2 border-t border-gray-200/60 my-2"></div>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'about' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <Info size={16} /> {t('content.tabAbout')}
          </button>

          <button
            onClick={() => setActiveTab('instructors')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'instructors' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <Users size={16} /> {t('content.tabInstructors')}
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'contact' ? 'bg-white shadow-sm text-brand-blue font-bold ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <Phone size={16} /> {t('content.tabContact')}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">
          {/* FREE ACCESS SETTINGS */}
          {activeTab === 'freeAccess' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">{t('content.freeTitle')}</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {t('content.freeSubtitle')}
                </p>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                <div>
                  <label className="font-bold text-sm text-gray-900 block">{t('content.freeEnableLabel')}</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('content.freeEnableDesc')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={tempContent.freeAccess.isEnabled}
                  onChange={e => handleFreeAccessChange('isEnabled', e.target.checked)}
                  className="w-5 h-5 accent-brand-blue rounded cursor-pointer"
                />
              </div>

              {/* Videos per subject per day */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                <label className="font-bold text-sm text-gray-900 block mb-1">
                  {t('content.freeDailyQuotaLabel')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t('content.freeDailyQuotaDesc')}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tempContent.freeAccess.videosPerSubjectPerDay || 1}
                    onChange={e => handleFreeAccessChange('videosPerSubjectPerDay', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-sm text-gray-900 text-center"
                  />
                  <span className="text-xs text-gray-600 font-medium">{t('content.freeDailyQuotaUnit')}</span>
                </div>
              </div>

              {/* Free Access Duration */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                <label className="font-bold text-sm text-gray-900 block">
                  {t('content.freeDurationLabel')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="freeDuration"
                      checked={tempContent.freeAccess.durationDays === null}
                      onChange={() => handleFreeAccessChange('durationDays', null)}
                      className="accent-brand-blue"
                    />
                    <span className="font-semibold">{t('content.freeDurationPermanent')}</span> — {t('content.freeDurationPermanentDesc')}
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="freeDuration"
                      checked={tempContent.freeAccess.durationDays !== null}
                      onChange={() => handleFreeAccessChange('durationDays', 30)}
                      className="accent-brand-blue"
                    />
                    <span className="font-semibold">{t('content.freeDurationLimited')}</span> — {t('content.freeDurationLimitedDesc')}
                  </label>
                </div>

                {tempContent.freeAccess.durationDays !== null && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-gray-600">{t('content.freeDurationDaysLabel')}</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={tempContent.freeAccess.durationDays || 30}
                      onChange={e => handleFreeAccessChange('durationDays', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-sm text-center"
                    />
                    <span className="text-xs text-gray-500">{t('content.freeDurationDaysUnit')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENT GATEWAYS SETTINGS */}
          {activeTab === 'paymentGateways' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">{t('content.gatewaysTitle')}</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {t('content.gatewaysSubtitle')}
                </p>
              </div>

              {/* Exchange Rate HTG */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <label className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                    <DollarSign size={16} /> {t('content.exchangeRateLabel')}
                  </label>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {t('content.exchangeRateDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800">1 USD =</span>
                  <input
                    type="number"
                    min={1}
                    value={tempContent.paymentGateways.exchangeRateHTG || 132}
                    onChange={e => setTempContent(prev => ({
                      ...prev,
                      paymentGateways: {
                        ...prev.paymentGateways,
                        exchangeRateHTG: Number(e.target.value) || 132
                      }
                    }))}
                    className="w-24 px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-sm text-center text-amber-950"
                  />
                  <span className="text-xs font-bold text-amber-800">HTG</span>
                </div>
              </div>

              {/* MonCash (Digicel) */}
              <div className="p-5 bg-red-50/50 rounded-2xl border border-red-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg text-xs tracking-wider uppercase">
                      MonCash
                    </span>
                    <h4 className="font-bold text-sm text-red-950">{t('content.moncashTitle')}</h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-red-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.moncash.isEnabled}
                      onChange={e => handleGatewayFieldChange('moncash', 'isEnabled', e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <span>{t('content.activeStatus')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.merchantNumber')}</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.moncash.merchantNumber}
                      onChange={e => handleGatewayFieldChange('moncash', 'merchantNumber', e.target.value)}
                      placeholder="+509 3700-0000"
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.receiverName')}</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.moncash.receiverName}
                      onChange={e => handleGatewayFieldChange('moncash', 'receiverName', e.target.value)}
                      placeholder="Lekol Alez Haiti"
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.logoUrlLabel')}</label>
                  <input
                    type="text"
                    value={tempContent.paymentGateways.moncash.logoUrl || ''}
                    onChange={e => handleGatewayFieldChange('moncash', 'logoUrl', e.target.value)}
                    placeholder={t('content.logoUrlPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-mono"
                  />
                  {tempContent.paymentGateways.moncash.logoUrl && (
                    <div className="flex items-center gap-2 p-2 mt-2 bg-white rounded-xl border border-red-100">
                      <img
                        src={tempContent.paymentGateways.moncash.logoUrl}
                        alt="MonCash Logo"
                        className="h-8 object-contain rounded"
                        onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="text-[11px] text-gray-500 font-mono truncate">{tempContent.paymentGateways.moncash.logoUrl}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.instructions')}</label>
                  <textarea
                    rows={2}
                    value={tempContent.paymentGateways.moncash.instructions}
                    onChange={e => handleGatewayFieldChange('moncash', 'instructions', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-gray-700"
                  />
                </div>
              </div>

              {/* NatCash (Natcom) */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs tracking-wider uppercase">
                      NatCash
                    </span>
                    <h4 className="font-bold text-sm text-blue-950">{t('content.natcashTitle')}</h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.natcash.isEnabled}
                      onChange={e => handleGatewayFieldChange('natcash', 'isEnabled', e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span>{t('content.activeStatus')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.merchantNumber')}</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.natcash.merchantNumber}
                      onChange={e => handleGatewayFieldChange('natcash', 'merchantNumber', e.target.value)}
                      placeholder="+509 4000-0000"
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.receiverName')}</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.natcash.receiverName}
                      onChange={e => handleGatewayFieldChange('natcash', 'receiverName', e.target.value)}
                      placeholder="Lekol Alez Haiti"
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.logoUrlLabel')}</label>
                  <input
                    type="text"
                    value={tempContent.paymentGateways.natcash.logoUrl || ''}
                    onChange={e => handleGatewayFieldChange('natcash', 'logoUrl', e.target.value)}
                    placeholder={t('content.logoUrlPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                  />
                  {tempContent.paymentGateways.natcash.logoUrl && (
                    <div className="flex items-center gap-2 p-2 mt-2 bg-white rounded-xl border border-blue-100">
                      <img
                        src={tempContent.paymentGateways.natcash.logoUrl}
                        alt="NatCash Logo"
                        className="h-8 object-contain rounded"
                        onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="text-[11px] text-gray-500 font-mono truncate">{tempContent.paymentGateways.natcash.logoUrl}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.instructions')}</label>
                  <textarea
                    rows={2}
                    value={tempContent.paymentGateways.natcash.instructions}
                    onChange={e => handleGatewayFieldChange('natcash', 'instructions', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-gray-700"
                  />
                </div>
              </div>

              {/* Stripe (Credit/Debit Card) */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs tracking-wider uppercase">
                      Stripe
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{t('content.stripeTitle')}</h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.stripe.isEnabled}
                      onChange={e => handleGatewayFieldChange('stripe', 'isEnabled', e.target.checked)}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                    />
                    <span>{t('content.activeStatus')}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.stripeKeyLabel')}</label>
                  <input
                    type="text"
                    value={tempContent.paymentGateways.stripe.publishableKey}
                    onChange={e => handleGatewayFieldChange('stripe', 'publishableKey', e.target.value)}
                    placeholder={t('content.stripeKeyPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.stripe.allowRecurring}
                      onChange={e => handleGatewayFieldChange('stripe', 'allowRecurring', e.target.checked)}
                      className="accent-slate-900"
                    />
                    <span>{t('content.stripeRecurring')}</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.stripe.allowPrepaid}
                      onChange={e => handleGatewayFieldChange('stripe', 'allowPrepaid', e.target.checked)}
                      className="accent-slate-900"
                    />
                    <span>{t('content.stripePrepaid')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRICING PLANS CRUD */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('content.plansTitle')}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{t('content.plansSubtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition-colors"
                >
                  <Plus size={14} /> {t('content.addPlanBtn')}
                </button>
              </div>

              {/* Plans List */}
              <div className="space-y-4">
                {(tempContent.pricing.plans || []).map((plan, planIdx) => (
                  <div key={plan.id || planIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 mr-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('content.planName')}</label>
                          <input
                            type="text"
                            value={plan.name}
                            onChange={e => handleUpdatePlan(planIdx, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('content.planPrice')}</label>
                          <input
                            type="text"
                            value={plan.price}
                            onChange={e => handleUpdatePlan(planIdx, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('content.planPeriod')}</label>
                          <input
                            type="text"
                            value={plan.period}
                            onChange={e => handleUpdatePlan(planIdx, 'period', e.target.value)}
                            placeholder="/mwa"
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] font-bold text-brand-orange cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(plan.isPopular)}
                            onChange={e => handleUpdatePlan(planIdx, 'isPopular', e.target.checked)}
                            className="accent-brand-orange"
                          />
                          <span>{t('content.planPopular')}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeletePlan(planIdx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('content.deletePlan')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Features List */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-gray-600">{t('content.planFeatures')}</span>
                        <button
                          type="button"
                          onClick={() => handleAddFeatureToPlan(planIdx)}
                          className="text-[11px] text-brand-blue font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> {t('content.addFeatureBtn')}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(plan.features || []).map((feat, featIdx) => (
                          <div key={featIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={feat}
                              onChange={e => handleUpdateFeature(planIdx, featIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteFeature(planIdx, featIdx)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABOUT PAGE */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('content.aboutTitle')}</h3>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.pageTitle')}</label>
                <input
                  type="text"
                  value={tempContent.about.title}
                  onChange={e => handleChange('about', 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.pageSubtitle')}</label>
                <input
                  type="text"
                  value={tempContent.about.subtitle}
                  onChange={e => handleChange('about', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.mainContent')}</label>
                <textarea
                  rows={5}
                  value={tempContent.about.content}
                  onChange={e => handleChange('about', 'content', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">{t('content.keyStats')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {tempContent.about.stats.map((stat, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={stat.value}
                        onChange={e => handleStatChange(idx, 'value', e.target.value)}
                        className="w-full mb-1 px-2 py-1 text-base font-bold border rounded-lg"
                        placeholder={t('content.statValuePlaceholder')}
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={e => handleStatChange(idx, 'label', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-gray-600 border rounded-lg"
                        placeholder={t('content.statLabelPlaceholder')}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* STAFF / MEET THE TEAM SECTION */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users size={16} className="text-brand-blue" />
                      Section Personnel & Équipe (Meet the Staff)
                    </h4>
                    <p className="text-xs text-gray-500">
                      Ajoutez, modifiez ou supprimez les membres de l'équipe affichés sur la page À propos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStaffMember}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Ajouter un membre
                  </button>
                </div>

                {(!tempContent.about.staff || tempContent.about.staff.length === 0) ? (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Users className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-xs text-gray-500 font-medium">Aucun membre du personnel configuré.</p>
                    <button
                      type="button"
                      onClick={handleAddStaffMember}
                      className="mt-2 text-xs text-brand-blue font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <Plus size={12} /> Ajouter le premier membre
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tempContent.about.staff.map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 hover:border-brand-blue/40 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center"
                      >
                        {/* Avatar preview */}
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 border border-gray-300 shrink-0 shadow-sm">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name || 'Staff avatar'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Staff')}&background=0284c7&color=fff&size=128`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Image size={24} />
                            </div>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Nom complet *
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => handleUpdateStaffMember(idx, 'name', e.target.value)}
                              placeholder="Ex: Jean-Robert Paul"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Fonction / Poste *
                            </label>
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) => handleUpdateStaffMember(idx, 'role', e.target.value)}
                              placeholder="Ex: Directeur Général & Fondateur"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Lien de la photo (URL) *
                            </label>
                            <input
                              type="url"
                              value={member.photoUrl}
                              onChange={(e) => handleUpdateStaffMember(idx, 'photoUrl', e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                            />
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStaffMember(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 self-end md:self-center"
                          title="Supprimer ce membre"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INSTRUCTORS PAGE */}
          {activeTab === 'instructors' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('content.instructorsTitle')}</h3>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.pageTitle')}</label>
                <input
                  type="text"
                  value={tempContent.instructors.title}
                  onChange={e => handleChange('instructors', 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.pageSubtitle')}</label>
                <input
                  type="text"
                  value={tempContent.instructors.subtitle}
                  onChange={e => handleChange('instructors', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                <Info size={16} className="text-brand-blue shrink-0" />
                {t('content.instructorsNote')}
              </p>
            </div>
          )}

          {/* CONTACT INFO */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('content.contactTitle')}</h3>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.emailLabel')}</label>
                <input
                  type="text"
                  value={tempContent.contact.email}
                  onChange={e => handleChange('contact', 'email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.phoneLabel')}</label>
                <input
                  type="text"
                  value={tempContent.contact.phone}
                  onChange={e => handleChange('contact', 'phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('content.addressLabel')}</label>
                <input
                  type="text"
                  value={tempContent.contact.address}
                  onChange={e => handleChange('contact', 'address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};