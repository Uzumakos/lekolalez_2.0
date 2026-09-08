import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Award, PlayCircle, ArrowRight, CheckCircle, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course, Language } from '../types';
import { CourseCard } from './CourseCard';
import { useLanguage } from '../contexts/LanguageContext';
import { sortCourses } from '../utils/courseUtils';

const WHY_US_FEATURES: Record<Language, { title: string; desc: string }[]> = {
    [Language.FRENCH]: [
        { title: 'Plateforme Trilingue', desc: 'Basculez facilement entre le français, le créole haïtien et l\'anglais.' },
        { title: 'Support Assistant IA', desc: 'Obtenez de l\'aide 24h/24 et 7j/7 grâce à notre tuteur intelligent.' },


    ],
    [Language.ENGLISH]: [
        { title: 'Trilingual Platform', desc: 'Seamlessly switch between English, French, and Creole.' },
        { title: 'AI Assistant Support', desc: 'Get 24/7 help from our intelligent tutor bot.' },

    ],
    [Language.CREOLE]: [
        { title: 'Platfòm Triling', desc: 'Chanje fasilman ant kreyòl, franse ak anglè san difikilte.' },
        { title: 'Sipò Asistan IA', desc: 'Jwenn èd 24 sou 24, 7 jou sou 7 gras ak titè entèlijan nou an.' },

    ]
};

interface LandingPageProps {
    featuredCourses: Course[];
    onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ featuredCourses, onOpenAuth }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { t, language } = useLanguage();

    const sortedCourses = useMemo(() => {
        return sortCourses(featuredCourses);
    }, [featuredCourses]);

    const HERO_SLIDES = useMemo(() => {
        const slidesText = {
            [Language.FRENCH]: [
                {
                    title: t('hero.title'),
                    subtitle: t('hero.subtitle')
                },
                {
                    title: 'Une meilleure éducation pour vos enfants',
                    subtitle: 'L\'excellence dès l\'école fondamentale'
                },
                {
                    title: 'Bâtir l\'avenir de vos enfants dès le premier jour',
                    subtitle: 'Un programme structuré pour maîtriser les fondamentaux et grandir en toute confiance.'
                }
            ],
            [Language.ENGLISH]: [
                {
                    title: t('hero.title'),
                    subtitle: t('hero.subtitle')
                },
                {
                    title: 'A Better Education for Your Children',
                    subtitle: 'Excellence starting from fundamental school'
                },
                {
                    title: 'Build Your Children\'s Future from Day One',
                    subtitle: 'A structured program to master fundamentals and grow with confidence.'
                }
            ],
            [Language.CREOLE]: [
                {
                    title: t('hero.title'),
                    subtitle: t('hero.subtitle')
                },
                {
                    title: 'Yon pi bon edikasyon pou pitit ou yo',
                    subtitle: 'Ekselans depi nan lekòl fondamantal'
                },
                {
                    title: 'Bati lavni pitit ou depi premye jou a',
                    subtitle: 'Yon pwogram estriktire pou metrize baz yo epi grandi ak asirans.'
                }
            ]
        };

        const currentText = slidesText[language] || slidesText[Language.FRENCH];

        return [
            {
                id: 1,
                image: 'https://ik.imagekit.io/tche25kem/ChatGPT%20Image%20Sep%207,%202026,%2004_05_39%20PM.png',
                title: currentText[0].title,
                subtitle: currentText[0].subtitle,
                cta: t('hero.cta')
            },
            {
                id: 2,
                image: 'https://ik.imagekit.io/tche25kem/mom_son.jpeg',
                title: currentText[1].title,
                subtitle: currentText[1].subtitle,
                cta: t('hero.cta')
            },
            {
                id: 3,
                image: 'https://ik.imagekit.io/tche25kem/WhatsApp-Image-2024-03-29-at-7.07.42-PM.jpeg',
                title: currentText[2].title,
                subtitle: currentText[2].subtitle,
                cta: t('hero.cta')
            }
        ];
    }, [language, t]);

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
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pt-24 md:pt-0">
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="max-w-4xl"
                                    >
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
                        { label: t('stats.students'), value: '2k+', icon: Users, color: 'text-brand-blue' },
                        { label: t('stats.courses'), value: '350+', icon: BookOpen, color: 'text-brand-orange' },
                        { label: t('stats.instructors'), value: '5+', icon: Award, color: 'text-purple-600' },
                        { label: t('stats.countries'), value: '5+', icon: Globe, color: 'text-green-600' },
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
                        {sortedCourses.length > 0 ? (
                            sortedCourses.slice(0, 4).map(course => (
                                <div key={course.id} onClick={onOpenAuth} className="cursor-pointer h-full">
                                    <CourseCard course={course} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                                <BookOpen className="mx-auto mb-3 text-gray-400" size={36} />
                                <p className="font-medium text-gray-600">
                                    {language === Language.FRENCH
                                        ? 'Aucun cours disponible pour le moment.'
                                        : language === Language.CREOLE
                                            ? 'Pa gen kou ki disponib pou kounye a.'
                                            : 'No courses available at the moment.'}
                                </p>
                            </div>
                        )}
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
                                src="https://ik.imagekit.io/tche25kem/ChatGPT%20Image%20Sep%207,%202026,%2004_05_39%20PM.png"
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
                                {(WHY_US_FEATURES[language] || WHY_US_FEATURES[Language.FRENCH]).map((feature, i) => (
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