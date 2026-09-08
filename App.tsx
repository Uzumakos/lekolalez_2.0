import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, Search, Plus, GraduationCap, Upload, X, Check, Loader2, FileVideo, Image as ImageIcon, AlertCircle, Layout as LayoutIcon, Shield } from 'lucide-react';
import { DashboardStats } from './components/DashboardStats';
import { StudentDashboard } from './components/StudentDashboard';
import { CourseCard } from './components/CourseCard';
import { AIAssistant } from './components/AIAssistant';
import { CourseDetailsPage } from './components/CourseDetailsPage';
import { InstructorProfilePage } from './components/InstructorProfilePage';
import { Course, SiteContent } from './types';
import { motion } from 'framer-motion';
import { CourseCardSkeleton } from './components/SkeletonLoader';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { PublicLayout } from './components/PublicLayout';
import { AboutPage, InstructorsPage, PricingPage, PublicCoursesPage } from './components/PublicPages';
import { TermsPage, PrivacyPage } from './components/LegalPages';
import { AdminContentManager } from './components/AdminContentManager';
import { SettingsPage } from './components/SettingsPage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationDropdown } from './components/NotificationDropdown';
import { AuthPage } from './components/AuthPage';
import { BrandLogo } from './components/BrandLogo';
import { CourseEditor } from './components/CourseEditor';
import { AdminManagement } from './components/AdminManagement';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { generateCourseContent, normalizeModule, sortCourses } from './utils/courseUtils';
import { coursesAPI, siteContentAPI, getStoredUser, clearAuthData, authAPI, monitoringAPI, enrollmentsAPI } from './services/api';
import supabase from './services/supabaseClient';



const INITIAL_SITE_CONTENT: SiteContent = {
  about: {
    title: "About Lekòl Alèz",
    subtitle: "Empowering Haiti's Future Through Accessible Education",
    content: "Lekòl Alèz was founded with a simple mission: to democratize education in Haiti and beyond. We believe that language should never be a barrier to learning. That's why we've built the first truly trilingual Learning Management System that seamlessly integrates English, French, and Haitian Creole.\n\nOur platform connects passionate expert instructors with eager students, fostering a community of growth, innovation, and mutual support. Whether you're looking to break into the tech industry, master a new language, or start your own business, Lekol Alèz provides the tools and guidance you need to succeed.",
    stats: [
      { label: "Students", value: "2k+" },
      { label: "Courses", value: "350+" },
      { label: "Instructors", value: "5+" },
      { label: "Years", value: "5+" }
    ],
    staff: [
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
    ]
  },
  pricing: {
    title: "Plan senp, transparan",
    subtitle: "Envesti nan avni w san kraze bank lan. Aksè gratis chak jou disponib pou tout moun!",
    plans: [
      {
        id: 'free',
        name: "Gratis (Free Access)",
        price: "0",
        period: "/mwa",
        features: [
          "1 videyo pa matyè pa jou (Franse, Matematik, elatriye)",
          "Aksè a tout kou nan nivo debaz",
          "Kwit ak egzèsis pratik",
          "Kominote elèv Lekòl Alèz"
        ],
        buttonText: "Kòmanse Gratis"
      },
      {
        id: 'premium',
        name: "Premium Alèz",
        price: "1.99",
        period: "/mwa",
        features: [
          "Aksè illimité a TOUT videyo ak tout kou san restriksyon",
          "Telechajman pou gade san entènèt (Offline)",
          "Sètifika rekonèt nan fen chak kou",
          "Sipò pwofesè ak chat dirèk",
          "Opsyon 1, 3, 6 oswa 12 mwa disponib",
          "Peye fasil pa Kat labank, MonCash oswa NatCash"
        ],
        isPopular: true,
        buttonText: "Chwazi Premium ($1.99/mwa)"
      }
    ]
  },
  instructors: {
    title: "Meet Our Experts",
    subtitle: "Learn from industry leaders and passionate educators dedicated to your success."
  },
  contact: {
    email: "hello@lekolalez.com",
    phone: "+509 1234 5678",
    address: "123 Innovation Dr, Port-au-Prince, Haiti"
  },
  freeAccess: {
    isEnabled: true,
    durationDays: null, // null = permanent free daily access
    videosPerSubjectPerDay: 1
  },
  paymentGateways: {
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
      instructions: 'Voye kòb la sou nimewo MonCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an (Ref) epi mete l nan bwat anba a pou admin lan valide aksè w.'
    },
    natcash: {
      isEnabled: true,
      merchantNumber: '+509 4000-0000',
      receiverName: 'Lekol Alez Haiti',
      instructions: 'Voye kòb la sou nimewo NatCash sa a. Nan deskripsyon an, mete non ou ak imèl ou. Lè ou fin peye, kopye ID Tranzaksyon an (Ref) epi mete l nan bwat anba a pou admin lan valide aksè w.'
    },
    exchangeRateHTG: 132
  }
};

const SidebarItem = ({ icon: Icon, text, path, active }: { icon: any, text: string, path: string, active: boolean }) => (
  <Link to={path}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${active ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-blue-50 hover:text-brand-blue'}`}>
      <Icon size={20} />
      <span className="font-medium">{text}</span>
    </div>
  </Link>
);

const Layout = ({
  children,
  userRole,
  setUserRole,
  onLogout,
  currentUser
}: {
  children?: React.ReactNode,
  userRole: 'admin' | 'student',
  setUserRole: (role: 'admin' | 'student') => void,
  onLogout: () => void,
  currentUser?: any
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { t } = useLanguage();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarOpen ? '260px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden fixed md:relative z-20"
      >
        <div className="p-6">
          <BrandLogo className="h-10 w-auto" />
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={LayoutDashboard} text={t('sidebar.dashboard')} path="/" active={location.pathname === '/'} />
          <SidebarItem icon={BookOpen} text={t('sidebar.allCourses')} path="/courses" active={location.pathname.startsWith('/courses')} />
          {isAdmin && (
            <>
              <SidebarItem icon={Plus} text={t('sidebar.addCourse')} path="/add-course" active={location.pathname === '/add-course'} />
              <SidebarItem icon={LayoutIcon} text={t('sidebar.siteContent')} path="/site-content" active={location.pathname === '/site-content'} />
              <SidebarItem
                icon={Shield}
                text={isSuperAdmin ? "Super Admin & Logs" : "Admin Management"}
                path="/admin-management"
                active={location.pathname === '/admin-management'}
              />
            </>
          )}
          <SidebarItem icon={Settings} text={t('sidebar.settings')} path="/settings" active={location.pathname === '/settings'} />
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
            <LogOut size={20} />
            <span className="font-medium">{t('sidebar.signOut')}</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Search courses..." className="bg-transparent border-none outline-none ml-2 text-sm w-full" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher in Dashboard */}
            <LanguageSwitcher variant="light" />

            <div className="hidden md:flex items-center">
              {isSuperAdmin ? (
                <span className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Shield size={13} className="text-purple-600" />
                  Super Admin
                </span>
              ) : isAdmin ? (
                <span className="bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-lg text-xs font-bold">
                  {t('role.admin')}
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-medium">
                  {t('role.student')}
                </span>
              )}
            </div>

            {/* Replaced static bell with Notification Dropdown */}
            <NotificationDropdown />

            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isSuperAdmin ? 'bg-purple-600 shadow-md shadow-purple-600/30' : 'bg-brand-blue'}`}>
              {currentUser?.firstName?.[0] || 'U'}{currentUser?.lastName?.[0] || ''}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminDashboardPage = ({ currentUser }: { currentUser?: any }) => {
  const { t } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.welcomeBack')}, {currentUser?.firstName || 'Administrator'} 👋</h1>
        <p className="text-gray-500">{t('admin.welcomeSubtitle')}</p>
      </div>
      <DashboardStats />
    </div>
  );
};

const CoursesPage = ({ courses, isLoading, userRole }: { courses: Course[], isLoading?: boolean, userRole: 'admin' | 'student' }) => {
  const { t } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('courses.browseTitle')}</h1>
          <p className="text-gray-500">{t('courses.browseSubtitle')}</p>
        </div>
        {userRole === 'admin' && (
          <Link to="/add-course" className="bg-brand-blue hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
            <Plus size={18} />
            {t('courses.addNewCourse')}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((n) => <CourseCardSkeleton key={n} />)
          : courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="relative group">
                <CourseCard course={course} />
                {userRole === 'admin' && (
                  <Link
                    to={`/edit-course/${course.id}`}
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md text-gray-600 hover:text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title={t('admin.editCourse')}
                  >
                    <Settings size={18} />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
              <BookOpen className="mx-auto mb-3 text-gray-400" size={40} />
              <h3 className="text-lg font-bold text-gray-700 mb-1">{t('courses.noCourses') || 'Aucun cours disponible'}</h3>
              <p className="text-sm text-gray-400">Les cours enregistrés dans Supabase apparaîtront ici.</p>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default function App() {
  // Start with empty courses, will load from database
  const [courses, setCourses] = useState<Course[]>([]);

  const [categories, setCategories] = useState(['Fondamentale', 'Secondaire', 'Universitaire', 'Autre']);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Site Content State for CMS
  const [siteContent, setSiteContent] = useState<SiteContent>(INITIAL_SITE_CONTENT);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check for existing auth on mount via Supabase session
  useEffect(() => {
    // First, try quick load from localStorage
    const storedUser = getStoredUser();
    if (storedUser) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser);
      setUserRole(storedUser.role === 'admin' || storedUser.role === 'instructor' || storedUser.role === 'super_admin' ? 'admin' : 'student');
    }

    // Then verify with Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !storedUser) {
        // Session exists but no stored user — fetch profile
        authAPI.getMe().then(({ user }) => {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setUserRole(user.role === 'admin' || user.role === 'instructor' || user.role === 'super_admin' ? 'admin' : 'student');
          localStorage.setItem('user', JSON.stringify(user));
        }).catch(() => { });
      } else if (!session && storedUser) {
        // No session but stale stored user — clear
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    // Listen for auth state changes (login/logout from other tabs etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole('student');
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Include unpublished courses for admin users
        const storedUser = getStoredUser();
        const isAdmin = storedUser?.role === 'admin' || storedUser?.role === 'instructor' || storedUser?.role === 'super_admin';
        const response = await coursesAPI.getAll({
          limit: 50,
          ...(isAdmin ? { includeUnpublished: 'true' } : {})
        });
        if (response.courses && response.courses.length > 0) {
          // Map database courses to frontend format
          const dbCourses = response.courses.map((c: any) => ({
            id: c.id || c._id,
            title: c.title,
            description: c.description,
            instructor: c.instructor?.fullName || (typeof c.instructor === 'string' ? c.instructor : 'Lekòl Alèz'),
            thumbnail: c.thumbnail || 'https://picsum.photos/400/250?random=' + (c.id || c._id),
            duration: c.totalDuration || '0h',
            students: c.enrollmentCount || 0,
            rating: c.rating?.average || 0,
            modules: Array.isArray(c.modules) ? c.modules.length : (typeof c.modules === 'number' ? c.modules : 0),
            category: c.category || 'Général',
            price: c.price || 0,
            level: c.level || 'Beginner',
            tags: c.tags || [],
            prerequisites: c.prerequisites || [],
            objectives: c.objectives || [],
            moduleList: (Array.isArray(c.modules) ? c.modules : (Array.isArray(c.moduleList) ? c.moduleList : [])).map((m: any, idx: number) => normalizeModule(m, idx))
          }));

          // Use strictly database courses sorted in curriculum sequence
          setCourses(sortCourses(dbCourses));
        } else {
          // No mock fallback - strictly reflect database
          setCourses([]);
        }
      } catch (error) {
        console.warn('Error fetching courses from database:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch site content from database
  useEffect(() => {
    const fetchSiteContent = async () => {
      try {
        const response = await siteContentAPI.get();
        if (response.content && !response.isDefault) {
          setSiteContent({
            about: {
              ...(response.content.about || INITIAL_SITE_CONTENT.about),
              staff: response.content.about?.staff || INITIAL_SITE_CONTENT.about.staff
            },
            pricing: response.content.pricing || INITIAL_SITE_CONTENT.pricing,
            instructors: response.content.instructors || INITIAL_SITE_CONTENT.instructors,
            contact: response.content.contact || INITIAL_SITE_CONTENT.contact,
            freeAccess: response.content.freeAccess || INITIAL_SITE_CONTENT.freeAccess,
            paymentGateways: response.content.paymentGateways || INITIAL_SITE_CONTENT.paymentGateways,
          });
        }
      } catch (error) {
        console.log('Using default site content (server may not be running)');
      }
    };

    fetchSiteContent();
  }, []);

  // Monitor expiring subscriptions for student
  useEffect(() => {
    if (currentUser?.id && userRole === 'student') {
      monitoringAPI.checkExpiringSubscriptions(currentUser.id).catch(() => { });
    }
  }, [currentUser?.id, userRole]);

  // Load enrolled courses and completed lessons for current student
  useEffect(() => {
    if (!currentUser?.id) {
      setEnrolledCourseIds([]);
      setCompletedLessons({});
      return;
    }

    const uid = currentUser.id;
    const enrolledStorageKey = `lekol_enrolled_${uid}`;
    const completedStorageKey = `lekol_completed_${uid}`;

    // 1. Fast hydrate from localStorage
    try {
      const cachedEnrolled = localStorage.getItem(enrolledStorageKey);
      if (cachedEnrolled) {
        const parsed = JSON.parse(cachedEnrolled);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnrolledCourseIds(parsed);
        }
      }
      const cachedCompleted = localStorage.getItem(completedStorageKey);
      if (cachedCompleted) {
        const parsed = JSON.parse(cachedCompleted);
        if (parsed && typeof parsed === 'object') {
          setCompletedLessons(parsed);
        }
      }
    } catch { }

    // 2. Fetch server-backed enrollments from Supabase
    enrollmentsAPI.getMyEnrollments().then(async ({ enrollments }) => {
      if (enrollments && enrollments.length > 0) {
        const ids = enrollments.map((e: any) => e.course?.id).filter(Boolean);
        setEnrolledCourseIds(prev => {
          const merged = Array.from(new Set([...prev, ...ids]));
          localStorage.setItem(enrolledStorageKey, JSON.stringify(merged));
          return merged;
        });

        // Load progress for each enrolled course
        const progressMap: Record<string, string[]> = {};
        await Promise.all(
          ids.map(async (cid: string) => {
            try {
              const { completedLessonIds } = await enrollmentsAPI.getProgress(cid);
              if (completedLessonIds && completedLessonIds.length > 0) {
                progressMap[cid] = completedLessonIds;
              }
            } catch { }
          })
        );

        if (Object.keys(progressMap).length > 0) {
          setCompletedLessons(prev => {
            const merged = { ...prev, ...progressMap };
            localStorage.setItem(completedStorageKey, JSON.stringify(merged));
            return merged;
          });
        }
      }
    }).catch(() => { });
  }, [currentUser?.id]);

  const handleEnroll = (courseId: string) => {
    setEnrolledCourseIds(prev => {
      if (!prev.includes(courseId)) {
        const next = [...prev, courseId];
        if (currentUser?.id) {
          localStorage.setItem(`lekol_enrolled_${currentUser.id}`, JSON.stringify(next));
          enrollmentsAPI.enroll(courseId).catch(() => { });
        }
        return next;
      }
      return prev;
    });
  };

  const handleToggleLesson = (courseId: string, lessonId: string) => {
    // Ensure course is marked as enrolled in state and storage so progress persists seamlessly
    setEnrolledCourseIds(prev => {
      if (!prev.includes(courseId)) {
        const next = [...prev, courseId];
        if (currentUser?.id) {
          localStorage.setItem(`lekol_enrolled_${currentUser.id}`, JSON.stringify(next));
        }
        return next;
      }
      return prev;
    });

    setCompletedLessons(prev => {
      const current = prev[courseId] || [];
      const isCompleted = current.includes(lessonId);

      let newCompleted;
      if (isCompleted) {
        newCompleted = current.filter(id => id !== lessonId);
      } else {
        newCompleted = [...current, lessonId];
      }

      const next = { ...prev, [courseId]: newCompleted };
      if (currentUser?.id) {
        localStorage.setItem(`lekol_completed_${currentUser.id}`, JSON.stringify(next));
        enrollmentsAPI.completeLesson(courseId, lessonId).catch(() => { });
      }
      return next;
    });
  };

  const handleSaveCourse = (updatedCourse: Course, originalId?: string) => {
    setCourses(prev => {
      const matchId = originalId || updatedCourse.id;
      const exists = prev.find(c => c.id === matchId || c.id === updatedCourse.id);
      let nextList: Course[];
      if (exists) {
        nextList = prev.map(c => (c.id === matchId || c.id === updatedCourse.id) ? updatedCourse : c);
      } else {
        nextList = [...prev, updatedCourse];
      }
      return sortCourses(nextList);
    });
  };

  const handleStudentLogin = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserRole(user.role === 'admin' || user.role === 'instructor' || user.role === 'super_admin' ? 'admin' : 'student');
  };

  const handleAdminLogin = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserRole('admin');
  };

  const handleLogout = async () => {
    await clearAuthData();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole('student');
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <Router>
          <AIAssistant
            siteContent={siteContent}
            courses={courses}
          />

          <Routes>
            {/* Password Reset Route (accessible directly from recovery email link) */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public Routes (Wrapped in PublicLayout) */}
            {!isAuthenticated && (
              <>
                <Route path="/" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <LandingPage
                      featuredCourses={courses}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                    />
                  </PublicLayout>
                } />
                <Route path="/about" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <AboutPage content={siteContent.about} />
                  </PublicLayout>
                } />
                <Route path="/instructors" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <InstructorsPage content={siteContent.instructors} courses={courses} />
                  </PublicLayout>
                } />
                <Route path="/pricing" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <PricingPage content={siteContent.pricing} onOpenAuth={() => setIsAuthModalOpen(true)} />
                  </PublicLayout>
                } />
                <Route path="/terms" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <TermsPage siteContent={siteContent} />
                  </PublicLayout>
                } />
                <Route path="/privacy" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <PrivacyPage siteContent={siteContent} />
                  </PublicLayout>
                } />
                <Route path="/public-courses" element={
                  <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                    <PublicCoursesPage courses={courses} onOpenAuth={() => setIsAuthModalOpen(true)} />
                  </PublicLayout>
                } />
                <Route path="/courses" element={<Navigate to="/public-courses" replace />} />

                <Route
                  path="/courses/:courseId"
                  element={
                    <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                      <div className="pt-20 px-6 max-w-7xl mx-auto">
                        <CourseDetailsPage
                          courses={courses}
                          enrolledCourseIds={enrolledCourseIds}
                          completedLessons={completedLessons}
                          onEnroll={handleEnroll}
                          onToggleLesson={handleToggleLesson}
                          siteContent={siteContent}
                        />
                      </div>
                    </PublicLayout>
                  }
                />

                <Route
                  path="/instructor/:instructorName"
                  element={
                    <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                      <div className="pt-20 px-6 max-w-7xl mx-auto">
                        <InstructorProfilePage courses={courses} />
                      </div>
                    </PublicLayout>
                  }
                />

                {/* Secure Admin Portal Route - Accessible via /admin */}
                <Route path="/admin" element={<AdminLoginPage onLogin={handleAdminLogin} />} />
                <Route path="/admin-portal" element={<Navigate to="/admin" replace />} />

                {/* New Auth Pages */}
                <Route path="/signup" element={<AuthPage initialMode='signup' onLogin={handleStudentLogin} siteContent={siteContent} />} />
                <Route path="/login" element={<AuthPage initialMode='signin' onLogin={handleStudentLogin} siteContent={siteContent} />} />

                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}

            {/* Protected Routes (Dashboard) */}
            {isAuthenticated && (
              <Route path="/*" element={
                <Layout userRole={userRole} setUserRole={setUserRole} onLogout={handleLogout} currentUser={currentUser}>
                  <Routes>
                    <Route path="/" element={
                      userRole === 'admin' ? (
                        <AdminDashboardPage currentUser={currentUser} />
                      ) : (
                        <StudentDashboard
                          courses={courses}
                          enrolledCourseIds={enrolledCourseIds}
                          completedLessons={completedLessons}
                          isLoading={isLoading}
                          currentUser={currentUser}
                          siteContent={siteContent}
                        />
                      )
                    } />
                    <Route path="/courses" element={<CoursesPage courses={courses} isLoading={isLoading} userRole={userRole} />} />
                    <Route
                      path="/courses/:courseId"
                      element={
                        <CourseDetailsPage
                          courses={courses}
                          enrolledCourseIds={enrolledCourseIds}
                          completedLessons={completedLessons}
                          onEnroll={handleEnroll}
                          onToggleLesson={handleToggleLesson}
                          currentUser={currentUser}
                          siteContent={siteContent}
                        />
                      }
                    />
                    <Route
                      path="/instructor/:instructorName"
                      element={<InstructorProfilePage courses={courses} />}
                    />
                    <Route
                      path="/settings"
                      element={
                        <SettingsPage
                          userRole={userRole}
                          currentUser={currentUser}
                          onUserUpdate={(user) => setCurrentUser(user)}
                        />
                      }
                    />
                    <Route path="/terms" element={<TermsPage siteContent={siteContent} />} />
                    <Route path="/privacy" element={<PrivacyPage siteContent={siteContent} />} />
                    {userRole === 'admin' && (
                      <>
                        <Route path="/add-course" element={<CourseEditor courses={courses} onSave={handleSaveCourse} categories={categories} onAddCategory={c => setCategories(prev => [...prev, c])} />} />
                        <Route path="/edit-course/:courseId" element={<CourseEditor courses={courses} onSave={handleSaveCourse} categories={categories} onAddCategory={c => setCategories(prev => [...prev, c])} />} />
                        <Route path="/site-content" element={<AdminContentManager content={siteContent} onUpdate={setSiteContent} />} />
                        <Route
                          path="/admin-management"
                          element={
                            <AdminManagement
                              siteContent={siteContent}
                              onUpdateSiteContent={setSiteContent}
                              currentUser={currentUser}
                              onUserUpdate={(updated) => {
                                setCurrentUser(updated);
                                localStorage.setItem('user', JSON.stringify(updated));
                              }}
                            />
                          }
                        />
                        <Route path="/admin" element={<Navigate to="/admin-management" replace />} />
                        <Route path="/admin-portal" element={<Navigate to="/admin-management" replace />} />
                      </>
                    )}
                    <Route path="*" element={<div className="p-10 text-center text-gray-500">Page not found 🚧</div>} />
                  </Routes>
                </Layout>
              } />
            )}
          </Routes>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLogin={handleStudentLogin}
            siteContent={siteContent}
          />
        </Router>
      </NotificationProvider>
    </LanguageProvider>
  );
}