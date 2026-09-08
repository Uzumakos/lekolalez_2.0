import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SiteContent, Course, Language, StaffMember } from '../types';
import { Users, Award, BookOpen, Check, Star, Globe, MapPin, Briefcase } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { useLanguage } from '../contexts/LanguageContext';

// --- Default Staff Members ---
export const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Jean-Robert Paul',
    role: 'Directeur Général & Co-fondateur',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'staff-2',
    name: 'Nathalie Joseph',
    role: 'Directrice Pédagogique',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'staff-3',
    name: 'Marc-Antoine Étienne',
    role: 'Responsable Technique & IT',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'staff-4',
    name: 'Darline Guerrier',
    role: 'Coordinatrice Communauté & Étudiants',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  }
];

// --- Multilingual Dictionaries for Public Pages ---

const ABOUT_I18N = {
  [Language.FRENCH]: {
    title: "À propos de Lekòl Alèz",
    subtitle: "Propulser l'avenir d'Haïti grâce à une éducation accessible",
    content: "Lekòl Alèz a été fondé avec une mission simple : démocratiser l'éducation en Haïti et au-delà. Nous croyons que la langue ne doit jamais être un obstacle à l'apprentissage. C'est pourquoi nous avons conçu la première plateforme d'apprentissage véritablement trilingue qui intègre le français, le créole haïtien et l'anglais.\n\nNotre plateforme met en relation des enseignants passionnés et experts avec des étudiants motivés, favorisant une communauté d'apprentissage, d'innovation et de soutien mutuel. Que vous souhaitiez vous initier aux nouvelles technologies, maîtriser une nouvelle matière ou développer vos compétences professionnelles, Lekòl Alèz vous donne les outils pour réussir.",
    staffTitle: "Rencontrez Notre Équipe",
    staffSubtitle: "Des professionnels engagés et dévoués au développement de notre communauté éducative.",
    statsLabels: {
      Students: "Étudiants",
      Courses: "Cours",
      Instructors: "Enseignants",
      Years: "Années d'excellence"
    } as Record<string, string>
  },
  [Language.ENGLISH]: {
    title: "About Lekol Alèz",
    subtitle: "Empowering Haiti's Future Through Accessible Education",
    content: "Lekol Alèz was founded with a simple mission: to democratize education in Haiti and beyond. We believe that language should never be a barrier to learning. That's why we've built the first truly trilingual Learning Management System that seamlessly integrates English, French, and Haitian Creole.\n\nOur platform connects passionate expert instructors with eager students, fostering a community of growth, innovation, and mutual support. Whether you're looking to break into the tech industry, master a new language, or start your own business, Lekol Alèz provides the tools and guidance you need to succeed.",
    staffTitle: "Meet the Staff",
    staffSubtitle: "Dedicated professionals committed to the growth of our learning community.",
    statsLabels: {
      Students: "Students",
      Courses: "Courses",
      Instructors: "Instructors",
      Years: "Years"
    } as Record<string, string>
  },
  [Language.CREOLE]: {
    title: "Konsènan Lekòl Alèz",
    subtitle: "Bati lavni Ayiti grasa yon edikasyon aksesib pou tout moun",
    content: "Lekòl Alèz te fonde avèk yon misyon klè : demokratize edikasyon an Ayiti ak nan tout rès mond lan. Nou kwè lang pa dwe janm yon baryè pou moun aprann. Se poutèt sa nou devlope premye platfòm aprantisaj triling ki konekte kreyòl, franse ak anglè san difikilte.\n\nPlatfòm nou an mete ansanm pwofesè kalifye ak elèv ki motive pou kreye yon gwo kominote devlopman, inovasyon ak sipò mityèl. Kit ou vle antre nan teknoloji, metrize yon nouvo matyè, oswa devlope konpetans ou, Lekòl Alèz ba ou zouti ak konsèy ou bezwen pou w reyisi.",
    staffTitle: "Rankontre Ekip Nou an",
    staffSubtitle: "Pwofesyonèl devwe k ap travay chak jou pou siksè chak elèv nan kominote a.",
    statsLabels: {
      Students: "Elèv",
      Courses: "Kou",
      Instructors: "Pwofesè",
      Years: "Ane Eksperyans"
    } as Record<string, string>
  }
};

const INSTRUCTORS_I18N = {
  [Language.FRENCH]: {
    title: "Rencontrez Nos Experts",
    subtitle: "Apprenez auprès de professionnels passionnés et dévoués à votre réussite.",
    courses: "Cours",
    students: "Étudiants",
    defaultRole: "Enseignant Principal"
  },
  [Language.ENGLISH]: {
    title: "Meet Our Experts",
    subtitle: "Learn from industry leaders and passionate educators dedicated to your success.",
    courses: "Courses",
    students: "Students",
    defaultRole: "Senior Instructor"
  },
  [Language.CREOLE]: {
    title: "Rankontre Ekspè Nou Yo",
    subtitle: "Aprann ak pi bon pwofesè ki dedye a siksè ou.",
    courses: "Kou",
    students: "Elèv",
    defaultRole: "Pwofesè Prensipal"
  }
};

const PRICING_I18N = {
  [Language.FRENCH]: {
    title: "Des tarifs simples et transparents",
    subtitle: "Investissez dans votre avenir sans vous ruiner. Accès gratuit chaque jour disponible pour tous !",
    popularBadge: "Le Plus Populaire",
    freePlan: {
      name: "Accès Gratuit",
      period: "/mois",
      features: [
        "1 vidéo par matière par jour (Français, Mathématiques, etc.)",
        "Quiz et exercices pratiques",
        "Communauté d'élèves Lekòl Alèz"
      ],
      buttonText: "Commencer Gratuitement"
    },
    premiumPlan: {
      name: "Premium Alèz",
      period: "/mois",
      features: [
        "Accès illimité à TOUTES les vidéos et tous les cours sans restriction",
        "Options 1, 3, 6 ou 12 mois disponibles",
        "Paiement facile par Carte bancaire, MonCash ou NatCash"
      ],
      buttonText: (price: string) => `Choisir Premium ($${price}/mois)`
    },
    customButtonText: "Choisir ce forfait"
  },
  [Language.ENGLISH]: {
    title: "Simple, Transparent Pricing",
    subtitle: "Invest in your future without breaking the bank. Free daily access available for everyone!",
    popularBadge: "Most Popular",
    freePlan: {
      name: "Free Access",
      period: "/mo",
      features: [
        "1 video per subject per day (French, Math, etc.)",
        "Quizzes and practical exercises",
        "Lekòl Alèz student community"
      ],
      buttonText: "Start for Free"
    },
    premiumPlan: {
      name: "Premium Alèz",
      period: "/mo",
      features: [
        "Unlimited access to ALL videos and courses without restriction",
        "1, 3, 6, or 12-month options available",
        "Easy payment via Credit Card, MonCash, or NatCash"
      ],
      buttonText: (price: string) => `Choose Premium ($${price}/mo)`
    },
    customButtonText: "Choose this plan"
  },
  [Language.CREOLE]: {
    title: "Plan senp, transparan",
    subtitle: "Envesti nan avni w san kraze bank lan. Aksè gratis chak jou disponib pou tout moun!",
    popularBadge: "Pli Popilè",
    freePlan: {
      name: "Gratis (Free Access)",
      period: "/mwa",
      features: [
        "1 videyo pa matyè pa jou (Franse, Matematik, elatriye)",
        "Kwiz ak egzèsis pratik",
        "Kominote elèv Lekòl Alèz"
      ],
      buttonText: "Kòmanse Gratis"
    },
    premiumPlan: {
      name: "Premium Alèz",
      period: "/mwa",
      features: [
        "Aksè illimité a TOUT videyo ak tout kou san restriksyon",
        "Opsyon 1, 3, 6 oswa 12 mwa disponib",
        "Peye fasil pa Kat labank, MonCash oswa NatCash"
      ],
      buttonText: (price: string) => `Chwazi Premium ($${price}/mwa)`
    },
    customButtonText: "Chwazi plan sa a"
  }
};

const PUBLIC_COURSES_I18N = {
  [Language.FRENCH]: {
    title: "Explorez Notre Catalogue",
    subtitle: "Trouvez le cours idéal pour perfectionner vos compétences.",
    noCourses: "Aucun cours disponible",
    noCoursesDesc: "Les cours publiés sur la plateforme apparaîtront ici."
  },
  [Language.ENGLISH]: {
    title: "Explore Our Catalog",
    subtitle: "Find the perfect course to upgrade your skills.",
    noCourses: "No courses available",
    noCoursesDesc: "Courses published on the platform will appear here."
  },
  [Language.CREOLE]: {
    title: "Eksplore Katalòg Nou an",
    subtitle: "Jwenn bon kou pou amelyore konesans ou.",
    noCourses: "Pa gen kou ki disponib",
    noCoursesDesc: "Kou ki pibliye sou platfòm lan ap parèt la a."
  }
};

// --- About Page ---
export const AboutPage: React.FC<{ content: SiteContent['about'] }> = ({ content }) => {
  const { language } = useLanguage();
  const i18n = ABOUT_I18N[language] || ABOUT_I18N[Language.FRENCH];

  // Use localized strings if current content matches default English or is empty
  const isDefaultOrEmpty = !content?.title || content.title === "About Lekol Alèz";
  const displayTitle = isDefaultOrEmpty ? i18n.title : content.title;
  const displaySubtitle = !content?.subtitle || content.subtitle.includes("Empowering Haiti's Future")
    ? i18n.subtitle
    : content.subtitle;
  const displayContent = !content?.content || content.content.includes("Lekol Alèz was founded")
    ? i18n.content
    : content.content;

  const staffMembers = (content?.staff && content.staff.length > 0) ? content.staff : DEFAULT_STAFF;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{displayTitle}</h1>
          <p className="text-xl text-brand-blue font-medium">{displaySubtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img
              src="https://ik.imagekit.io/tche25kem/ChatGPT%20Image%20Sep%207,%202026,%2004_05_39%20PM.png"
              alt="Team collaboration"
              className="rounded-3xl shadow-2xl"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg text-gray-600"
          >
            <p className="whitespace-pre-line leading-relaxed">{displayContent}</p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {content.stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-50 p-8 rounded-2xl text-center border border-gray-100"
            >
              <h3 className="text-4xl font-bold text-brand-blue mb-2">{stat.value}</h3>
              <p className="text-gray-600 font-medium uppercase tracking-wide text-sm">
                {i18n.statsLabels[stat.label] || stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Meet the Staff Section */}
        {staffMembers.length > 0 && (
          <div className="mt-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-sky-100">
                <Users size={14} /> {i18n.staffTitle}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{i18n.staffTitle}</h2>
              <p className="text-lg text-gray-600">{i18n.staffSubtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {staffMembers.map((member, idx) => (
                <motion.div
                  key={member.id || idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col"
                >
                  <div className="h-72 overflow-hidden relative bg-gradient-to-tr from-sky-100 to-blue-50">
                    <img
                      src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Staff')}&background=0ea5e9&color=fff&size=300`}
                      alt={member.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Staff')}&background=0ea5e9&color=fff&size=300`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white">
                      <h3 className="font-bold text-lg text-white leading-snug">{member.name}</h3>
                      <p className="text-xs font-semibold text-amber-300 mt-1 flex items-center gap-1.5">
                        <Briefcase size={12} className="shrink-0" />
                        <span>{member.role}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to get instructor name from string or object
const getInstructorName = (instructor: any): string => {
  if (!instructor) return 'Unknown';
  if (typeof instructor === 'string') return instructor;
  if (typeof instructor === 'object') {
    return instructor.fullName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Unknown';
  }
  return 'Unknown';
};

// Helper to get instructor avatar from object or generate one
const getInstructorAvatar = (instructor: any, name: string): string => {
  if (typeof instructor === 'object' && instructor?.avatar) {
    return instructor.avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=200`;
};

// --- Instructors Page ---
export const InstructorsPage: React.FC<{ content: SiteContent['instructors'], courses: Course[] }> = ({ content, courses }) => {
  const { language } = useLanguage();
  const i18n = INSTRUCTORS_I18N[language] || INSTRUCTORS_I18N[Language.FRENCH];

  // Derive unique instructors from courses
  const instructorNames = courses.map(c => getInstructorName(c.instructor));
  const uniqueNames: string[] = Array.from(new Set(instructorNames));

  const uniqueInstructors = uniqueNames.map(name => {
    const course = courses.find(c => getInstructorName(c.instructor) === name);
    const instructorObj = course?.instructor;
    return {
      name,
      role: (typeof instructorObj === 'object' && instructorObj?.title) || i18n.defaultRole,
      coursesCount: courses.filter(c => getInstructorName(c.instructor) === name).length,
      image: getInstructorAvatar(instructorObj, name),
      students: courses.filter(c => getInstructorName(c.instructor) === name).reduce((acc, c) => acc + c.students, 0)
    };
  });

  const isDefaultOrEmpty = !content?.title || content.title === "Meet Our Experts";
  const displayTitle = isDefaultOrEmpty ? i18n.title : content.title;
  const displaySubtitle = !content?.subtitle || content.subtitle.includes("Learn from industry leaders")
    ? i18n.subtitle
    : content.subtitle;

  return (
    <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayTitle}</h1>
          <p className="text-lg text-gray-600">{displaySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {uniqueInstructors.map((instructor, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="h-64 overflow-hidden relative">
                <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h3 className="font-bold text-lg">{instructor.name}</h3>
                  <p className="text-sm opacity-90">{instructor.role}</p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center text-sm text-gray-500">
                <span className="flex items-center gap-1"><BookOpen size={16} /> {instructor.coursesCount} {i18n.courses}</span>
                <span className="flex items-center gap-1"><Users size={16} /> {instructor.students} {i18n.students}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Pricing Page ---
export const PricingPage: React.FC<{ content: SiteContent['pricing'], onOpenAuth: () => void }> = ({ content, onOpenAuth }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const i18n = PRICING_I18N[language] || PRICING_I18N[Language.FRENCH];

  const handlePlanClick = (plan: any) => {
    if (plan.id === 'free' || Number(plan.price) === 0) {
      navigate('/signup');
    } else {
      navigate('/signup?plan=premium');
    }
  };

  // Determine localized title & subtitle
  const defaultTitles = [
    "Plan senp, transparan",
    "Tarifs",
    "Pricing",
    "Des tarifs simples et transparents",
    "Simple, Transparent Pricing"
  ];
  const defaultSubtitles = [
    "Envesti nan avni w san kraze bank lan. Aksè gratis chak jou disponib pou tout moun!",
    "Investissez dans votre avenir sans vous ruiner. Accès gratuit chaque jour disponible pour tous !",
    "Invest in your future without breaking the bank. Free daily access available for everyone!"
  ];

  const displayTitle = (!content?.title || defaultTitles.some(t => content.title.toLowerCase().includes(t.toLowerCase())))
    ? i18n.title
    : content.title;

  const displaySubtitle = (!content?.subtitle || defaultSubtitles.some(s => content.subtitle.toLowerCase().includes(s.toLowerCase())))
    ? i18n.subtitle
    : content.subtitle;

  // Localize plans while preserving price, ID, isPopular
  const plans = (content?.plans || []).map(plan => {
    if (plan.id === 'free' || Number(plan.price) === 0) {
      return {
        ...plan,
        name: i18n.freePlan.name,
        period: i18n.freePlan.period,
        features: i18n.freePlan.features,
        buttonText: i18n.freePlan.buttonText
      };
    }
    if (plan.id === 'premium' || plan.isPopular) {
      return {
        ...plan,
        name: i18n.premiumPlan.name,
        period: i18n.premiumPlan.period,
        features: i18n.premiumPlan.features,
        buttonText: i18n.premiumPlan.buttonText(plan.price || '1.99')
      };
    }
    return {
      ...plan,
      period: i18n.freePlan.period,
      buttonText: plan.buttonText || i18n.customButtonText
    };
  });

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayTitle}</h1>
          <p className="text-xl text-gray-600">{displaySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-3xl p-8 relative flex flex-col ${plan.isPopular ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-white border border-gray-200 text-gray-800 hover:shadow-lg'}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                  {i18n.popularBadge}
                </div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${plan.isPopular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-bold">$</span>
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={`ml-2 text-sm ${plan.isPopular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`mt-1 p-0.5 rounded-full ${plan.isPopular ? 'bg-brand-blue text-white' : 'bg-blue-100 text-brand-blue'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={`text-sm ${plan.isPopular ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-colors ${plan.isPopular ? 'bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20' : 'bg-brand-blue hover:bg-sky-600 text-white'}`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Public Courses Page ---
export const PublicCoursesPage: React.FC<{ courses: Course[], onOpenAuth: () => void }> = ({ courses, onOpenAuth }) => {
  const { language } = useLanguage();
  const i18n = PUBLIC_COURSES_I18N[language] || PUBLIC_COURSES_I18N[Language.FRENCH];

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{i18n.title}</h1>
          <p className="text-lg text-gray-600">{i18n.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} onClick={onOpenAuth} className="cursor-pointer">
                <CourseCard course={course} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
              <BookOpen className="mx-auto mb-3 text-gray-400" size={40} />
              <h3 className="text-lg font-bold text-gray-700 mb-1">{i18n.noCourses}</h3>
              <p className="text-sm text-gray-400">{i18n.noCoursesDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

