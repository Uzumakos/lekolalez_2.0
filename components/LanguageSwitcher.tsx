import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FLAGS: Record<Language, { src: string; label: string }> = {
  [Language.FRENCH]: { 
    src: 'https://flagcdn.com/w40/fr.png', 
    label: 'Français' 
  },
  [Language.CREOLE]: { 
    src: 'https://flagcdn.com/w40/ht.png', 
    label: 'Kreyòl' 
  },
  [Language.ENGLISH]: { 
    src: 'https://flagcdn.com/w40/us.png', 
    label: 'English' 
  }
};

export const LanguageSwitcher: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFlag = FLAGS[language];
  const textColor = variant === 'light' ? 'text-gray-800' : 'text-white';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors ${textColor}`}
      >
        <img 
            src={currentFlag.src} 
            alt={currentFlag.label} 
            className="w-5 h-5 rounded-full object-cover shadow-sm" 
        />
        <span className="text-sm font-medium">{currentFlag.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {Object.entries(FLAGS).map(([key, { src, label }]) => (
              <button
                key={key}
                onClick={() => {
                  setLanguage(key as Language);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${language === key ? 'bg-blue-50 text-brand-blue font-semibold' : 'text-gray-700'}`}
              >
                <img src={src} alt={label} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};