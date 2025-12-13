import React, { useState } from 'react';
import { SiteContent, PricingPlan } from '../types';
import { Save, Plus, Trash2, Layout, Info, Users, CreditCard, Phone, Check } from 'lucide-react';

interface AdminContentManagerProps {
  content: SiteContent;
  onUpdate: (newContent: SiteContent) => void;
}

export const AdminContentManager: React.FC<AdminContentManagerProps> = ({ content, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'pricing' | 'instructors' | 'contact'>('about');
  const [tempContent, setTempContent] = useState<SiteContent>(content);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdate(tempContent);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChange = (section: keyof SiteContent, field: string, value: any) => {
    setTempContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleStatChange = (idx: number, field: 'label' | 'value', value: string) => {
    const newStats = [...tempContent.about.stats];
    newStats[idx] = { ...newStats[idx], [field]: value };
    setTempContent(prev => ({ ...prev, about: { ...prev.about, stats: newStats } }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site Content Manager</h1>
          <p className="text-gray-500">Edit public facing pages of your LMS.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/20"
        >
          {isSaved ? <Check size={20} /> : <Save size={20} />}
          {isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2">
           <button 
             onClick={() => setActiveTab('about')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'about' ? 'bg-white shadow text-brand-blue font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
           >
             <Info size={18} /> About Us
           </button>
           <button 
             onClick={() => setActiveTab('instructors')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'instructors' ? 'bg-white shadow text-brand-blue font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
           >
             <Users size={18} /> Instructors
           </button>
           <button 
             onClick={() => setActiveTab('pricing')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'pricing' ? 'bg-white shadow text-brand-blue font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
           >
             <CreditCard size={18} /> Pricing
           </button>
           <button 
             onClick={() => setActiveTab('contact')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'contact' ? 'bg-white shadow text-brand-blue font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
           >
             <Phone size={18} /> Contact Info
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
           {activeTab === 'about' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">About Page Settings</h3>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                   <input 
                     type="text" 
                     value={tempContent.about.title}
                     onChange={(e) => handleChange('about', 'title', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                   <input 
                     type="text" 
                     value={tempContent.about.subtitle}
                     onChange={(e) => handleChange('about', 'subtitle', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Main Content</label>
                   <textarea 
                     value={tempContent.about.content}
                     onChange={(e) => handleChange('about', 'content', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none h-40"
                   />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Key Statistics</label>
                    <div className="grid grid-cols-2 gap-4">
                        {tempContent.about.stats.map((stat, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <input 
                                    type="text" 
                                    value={stat.value}
                                    onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                                    className="w-full mb-2 px-2 py-1 text-lg font-bold border rounded"
                                    placeholder="Value (e.g. 10k)"
                                />
                                <input 
                                    type="text" 
                                    value={stat.label}
                                    onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                                    className="w-full px-2 py-1 text-sm text-gray-500 border rounded"
                                    placeholder="Label"
                                />
                            </div>
                        ))}
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'instructors' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Instructors Page Header</h3>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                   <input 
                     type="text" 
                     value={tempContent.instructors.title}
                     onChange={(e) => handleChange('instructors', 'title', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                   <input 
                     type="text" 
                     value={tempContent.instructors.subtitle}
                     onChange={(e) => handleChange('instructors', 'subtitle', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                    <Info size={16} className="text-brand-blue shrink-0 mt-0.5" />
                    Note: The list of instructors is automatically generated from the active courses in the system.
                </p>
             </div>
           )}
           
           {activeTab === 'pricing' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Pricing Settings</h3>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                   <input 
                     type="text" 
                     value={tempContent.pricing.title}
                     onChange={(e) => handleChange('pricing', 'title', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                   <input 
                     type="text" 
                     value={tempContent.pricing.subtitle}
                     onChange={(e) => handleChange('pricing', 'subtitle', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                {/* Editing individual plans is complex for a simple demo, so we stick to headers for now or simple JSON edit if needed. For UI simplicity, just headers here. */}
             </div>
           )}

           {activeTab === 'contact' && (
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Contact Information</h3>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                   <input 
                     type="text" 
                     value={tempContent.contact.email}
                     onChange={(e) => handleChange('contact', 'email', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                   <input 
                     type="text" 
                     value={tempContent.contact.phone}
                     onChange={(e) => handleChange('contact', 'phone', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                   <input 
                     type="text" 
                     value={tempContent.contact.address}
                     onChange={(e) => handleChange('contact', 'address', e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                   />
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};