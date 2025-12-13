import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Globe, MapPin, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteContent } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLogo } from './BrandLogo';

interface PublicLayoutProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
  siteContent: SiteContent;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onOpenAuth, siteContent }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: t('nav.courses'), path: '/public-courses' },
    { name: t('nav.instructors'), path: '/instructors' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.pricing'), path: '/pricing' },
  ];

  const isHome = location.pathname === '/';
  const navTextColor = isScrolled || !isHome ? 'text-gray-800' : 'text-white';
  const switcherVariant = isScrolled || !isHome ? 'light' : 'dark';
  const logoVariant = isScrolled || !isHome ? 'dark' : 'light';

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled || !isHome ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-gray-100' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/">
            <BrandLogo variant={logoVariant} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
             {navLinks.map((item) => (
                <Link
                    key={item.name} 
                    to={item.path} 
                    className={`font-medium text-sm hover:text-brand-blue transition-colors ${
                        (isScrolled || !isHome) 
                        ? (location.pathname === item.path ? 'text-brand-blue' : 'text-gray-600') 
                        : 'text-white/90 hover:text-white'
                    }`}
                >
                    {item.name}
                </Link>
             ))}
             
             {/* Divider */}
             <div className={`h-6 w-px ${isScrolled || !isHome ? 'bg-gray-200' : 'bg-white/20'}`}></div>

             <LanguageSwitcher variant={switcherVariant} />
          </div>

          <div className="hidden md:flex items-center gap-4 ml-4">
            <Link 
                to="/login"
                className={`font-semibold text-sm hover:underline ${navTextColor}`}
            >
                {t('nav.login')}
            </Link>
            <Link 
                to="/signup"
                className="px-5 py-2.5 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
                {t('nav.getStarted')} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <div className="scale-90">
                <LanguageSwitcher variant={switcherVariant} />
            </div>
            <button 
                className="p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} className={navTextColor} /> : <Menu size={24} className={navTextColor} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
                >
                    <div className="flex flex-col p-6 gap-4">
                        {navLinks.map((item) => (
                            <Link key={item.name} to={item.path} className="font-medium text-gray-700 py-2 border-b border-gray-50">{item.name}</Link>
                        ))}
                        <Link to="/login" className="w-full py-3 text-center font-bold text-brand-blue border border-brand-blue rounded-xl mt-2 block">{t('nav.login')}</Link>
                        <Link to="/signup" className="w-full py-3 text-center font-bold text-white bg-brand-blue rounded-xl shadow-lg shadow-blue-500/20 block">{t('nav.getStarted')}</Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      <div className="flex-1">
          {children}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                  <div>
                      <div className="mb-6">
                        <BrandLogo variant="light" />
                      </div>
                      <p className="text-slate-400 leading-relaxed mb-6">
                          {t('footer.about')}
                      </p>
                      <div className="flex gap-4">
                          {[1,2,3,4].map(i => (
                              <div key={i} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-blue transition-colors cursor-pointer">
                                  <Globe size={18} />
                              </div>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h4 className="font-bold text-lg mb-6">{t('footer.platform')}</h4>
                      <ul className="space-y-4 text-slate-400">
                          <li><Link to="/public-courses" className="hover:text-white transition-colors">{t('nav.courses')}</Link></li>
                          <li><Link to="/instructors" className="hover:text-white transition-colors">{t('nav.instructors')}</Link></li>
                          <li><Link to="/pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</Link></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="font-bold text-lg mb-6">{t('footer.company')}</h4>
                      <ul className="space-y-4 text-slate-400">
                          <li><Link to="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
                          <li className="hover:text-white cursor-pointer transition-colors">{t('footer.terms')}</li>
                          <li className="hover:text-white cursor-pointer transition-colors">{t('footer.privacy')}</li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="font-bold text-lg mb-6">{t('footer.contact')}</h4>
                      <ul className="space-y-4 text-slate-400">
                          <li className="flex gap-3">
                              <MapPin size={20} className="text-brand-blue shrink-0" />
                              <span>{siteContent.contact.address}</span>
                          </li>
                          <li className="flex gap-3">
                              <Mail size={20} className="text-brand-blue shrink-0" />
                              <span>{siteContent.contact.email}</span>
                          </li>
                          <li className="flex gap-3">
                              <Phone size={20} className="text-brand-blue shrink-0" />
                              <span>{siteContent.contact.phone}</span>
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-slate-500 text-sm">© 2024 Lekol Alèz. {t('footer.rights')}</p>
                  <div className="flex gap-6">
                       <Link to="/admin-portal" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">{t('footer.adminPortal')}</Link>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};