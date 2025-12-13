import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Award, PlayCircle, ArrowRight, CheckCircle, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { CourseCard } from './CourseCard';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  featuredCourses: Course[];
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ featuredCourses, onOpenAuth }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const HERO_SLIDES = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      cta: t('hero.cta')
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: 'Learn Creole, English & French',
      subtitle: 'Connect with the world through our immersive language programs designed for fast fluency.',
      cta: 'Explore Languages'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: 'Build the Future with Code',
      subtitle: 'From React to Python, get the hands-on coding experience you need to launch your career.',
      cta: 'View Coding Courses'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center -mt-[80px]"> {/* Negative margin to go behind transparent nav */}
        <AnimatePresence mode='wait'>
            {HERO_SLIDES.map((slide, index) => (
                index === currentSlide && (
                    <motion.div 
                        key={slide.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0 bg-black/40 z-10" />
                        <motion.img 
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 6 }}
                            src={slide.image} 
                            alt={slide.title} 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                            <motion.div 
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="max-w-4xl"
                            >
                                <span className="inline-block py-1 px-3 rounded-full bg-brand-orange/90 text-white text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm">
                                    {t('hero.badge')}
                                </span>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                                    {slide.title}
                                </h1>
                                <p className="text-lg md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                                    {slide.subtitle}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link 
                                        to="/signup"
                                        className="px-8 py-4 bg-brand-blue hover:bg-sky-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-105 flex items-center gap-2"
                                    >
                                        {slide.cta} <ArrowRight size={20} />
                                    </Link>
                                    <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2">
                                        <PlayCircle size={20} /> {t('hero.demo')}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )
            ))}
        </AnimatePresence>

        {/* Slider Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {HERO_SLIDES.map((_, idx) => (
                <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-brand-blue' : 'w-2 bg-white/50 hover:bg-white'}`}
                />
            ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative -mt-10 z-30 px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
                { label: t('stats.students'), value: '12k+', icon: Users, color: 'text-brand-blue' },
                { label: t('stats.courses'), value: '350+', icon: BookOpen, color: 'text-brand-orange' },
                { label: t('stats.instructors'), value: '85+', icon: Award, color: 'text-purple-600' },
                { label: t('stats.countries'), value: '15+', icon: Globe, color: 'text-green-600' },
            ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                    <stat.icon className={`mb-3 ${stat.color}`} size={32} />
                    <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mt-1">{stat.label}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section id="courses" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                  <div>
                      <h2 className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-2">{t('landing.discover')}</h2>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t('landing.popularCourses')}</h3>
                  </div>
                  <Link to="/public-courses" className="text-gray-600 hover:text-brand-blue font-semibold flex items-center gap-2 transition-colors">
                      {t('landing.viewAll')} <ArrowRight size={18} />
                  </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCourses.slice(0, 4).map(course => (
                      <Link key={course.id} to={`/signup`} className="cursor-pointer h-full">
                          <CourseCard course={course} />
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* Features / Why Choose Us */}
      <section id="about-us" className="py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                  >
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-orange/10 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-blue/10 rounded-full blur-3xl"></div>
                      <img 
                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                        alt="Student learning" 
                        className="rounded-3xl shadow-2xl relative z-10 w-full" 
                      />
                  </motion.div>

                  <div>
                      <h2 className="text-sm font-bold text-brand-orange uppercase tracking-widest mb-2">{t('landing.whyChoose')}</h2>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t('landing.whyTitle')}</h3>
                      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                          {t('landing.whyDesc')}
                      </p>

                      <div className="space-y-6">
                          {[
                              { title: 'Trilingual Platform', desc: 'Seamlessly switch between English, French, and Creole.' },
                              { title: 'AI Assistant Support', desc: 'Get 24/7 help from our intelligent tutor bot.' },
                              { title: 'Offline Access', desc: 'Download lessons and learn without internet connection.' },
                              { title: 'Recognized Certificates', desc: 'Earn certificates to boost your LinkedIn profile.' }
                          ].map((feature, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-4"
                              >
                                  <div className="mt-1">
                                      <CheckCircle className="text-brand-blue" size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900 text-lg">{feature.title}</h4>
                                      <p className="text-gray-500">{feature.desc}</p>
                                  </div>
                              </motion.div>
                          ))}
                      </div>

                      <Link to="/signup" className="mt-10 inline-flex px-8 py-4 bg-brand-dark text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg items-center gap-2">
                          {t('landing.joinFree')} <ChevronRight size={20} />
                      </Link>
                  </div>
              </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto bg-brand-blue rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{t('landing.ready')}</h2>
                  <p className="text-xl text-blue-100 mb-10">{t('landing.readyDesc')}</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Link to="/signup" className="px-8 py-4 bg-white text-brand-blue font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-xl">
                          {t('auth.signUp')}
                      </Link>
                      <Link to="/public-courses" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                          {t('landing.browse')}
                      </Link>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
};