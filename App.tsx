import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, Search, Plus, GraduationCap, Upload, X, Check, Loader2, FileVideo, Image as ImageIcon, AlertCircle, Layout as LayoutIcon } from 'lucide-react';
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
import { AdminContentManager } from './components/AdminContentManager';
import { SettingsPage } from './components/SettingsPage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationDropdown } from './components/NotificationDropdown';
import { AuthPage } from './components/AuthPage';
import { BrandLogo } from './components/BrandLogo';
import { CourseEditor } from './components/CourseEditor';
import { generateCourseContent } from './utils/courseUtils';

// Mock Data
const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    title: 'Introduction to React & TypeScript',
    description: 'Learn the fundamentals of modern web development with React 18 and TypeScript. Build real-world applications.',
    instructor: 'Jean Pierre',
    thumbnail: 'https://picsum.photos/400/250?random=1',
    duration: '12h 30m',
    students: 1240,
    rating: 4.8,
    modules: 12,
    category: 'Development',
    price: 49.99,
    level: 'Beginner',
    tags: ['React', 'TypeScript', 'Frontend'],
    prerequisites: ['Basic JavaScript knowledge', 'HTML & CSS']
  },
  {
    id: '2',
    title: 'Kreyòl pou Debutant (Creole for Beginners)',
    description: 'Aprann baz lang Kreyòl Ayisyen an. Gramè, vokabilè ak kilti. Yon kou konplè pou moun ki vle pale kreyòl.',
    instructor: 'Marie Desir',
    thumbnail: 'https://picsum.photos/400/250?random=2',
    duration: '8h 15m',
    students: 3450,
    rating: 4.9,
    modules: 8,
    category: 'Language',
    price: 0,
    level: 'Beginner',
    tags: ['Language', 'Culture', 'Haiti']
  },
  {
    id: '3',
    title: 'Advanced Data Science with Python',
    description: 'Master data analysis, visualization and machine learning algorithms using Python libraries like Pandas and Scikit-learn.',
    instructor: 'Dr. Alex Smith',
    thumbnail: 'https://picsum.photos/400/250?random=3',
    duration: '24h 00m',
    students: 850,
    rating: 4.7,
    modules: 20,
    category: 'Data Science',
    price: 89.99,
    level: 'Advanced',
    tags: ['Python', 'Machine Learning', 'Data']
  },
  {
    id: '4',
    title: 'Digital Marketing Mastery',
    description: 'Grow your business with SEO, Social Media, and Email Marketing strategies. Learn to use Facebook Ads and Google Analytics.',
    instructor: 'Sarah Connor',
    thumbnail: 'https://picsum.photos/400/250?random=4',
    duration: '10h 45m',
    students: 2100,
    rating: 4.6,
    modules: 15,
    category: 'Marketing',
    price: 29.99,
    level: 'Intermediate',
    tags: ['SEO', 'Social Media', 'Marketing']
  }
];

const INITIAL_SITE_CONTENT: SiteContent = {
  about: {
    title: "About Lekol Alèz",
    subtitle: "Empowering Haiti's Future Through Accessible Education",
    content: "Lekol Alèz was founded with a simple mission: to democratize education in Haiti and beyond. We believe that language should never be a barrier to learning. That's why we've built the first truly trilingual Learning Management System that seamlessly integrates English, French, and Haitian Creole.\n\nOur platform connects passionate expert instructors with eager students, fostering a community of growth, innovation, and mutual support. Whether you're looking to break into the tech industry, master a new language, or start your own business, Lekol Alèz provides the tools and guidance you need to succeed.",
    stats: [
        { label: "Students", value: "12k+" },
        { label: "Courses", value: "350+" },
        { label: "Instructors", value: "85+" },
        { label: "Years", value: "5+" }
    ]
  },
  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle: "Invest in your future without breaking the bank.",
    plans: [
        { id: '1', name: "Free", price: "0", period: "/mo", features: ["Access to free courses", "Community support", "Basic quizzes"], buttonText: "Join for Free" },
        { id: '2', name: "Pro", price: "29", period: "/mo", features: ["All courses included", "Recognized Certificates", "Priority Mentor chat", "Offline Downloads"], isPopular: true, buttonText: "Go Pro" },
        { id: '3', name: "Business", price: "99", period: "/mo", features: ["For teams of 5+", "Admin Analytics", "Custom Learning Paths", "Dedicated Support"], buttonText: "Contact Sales" }
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
  onLogout
}: { 
  children?: React.ReactNode, 
  userRole: 'admin' | 'student', 
  setUserRole: (role: 'admin' | 'student') => void,
  onLogout: () => void
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { t } = useLanguage();

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
          {userRole === 'admin' && (
             <>
              <SidebarItem icon={Plus} text={t('sidebar.addCourse')} path="/add-course" active={location.pathname === '/add-course'} />
              <SidebarItem icon={LayoutIcon} text={t('sidebar.siteContent')} path="/site-content" active={location.pathname === '/site-content'} />
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

            <div className="hidden md:flex items-center bg-gray-100 px-3 py-1 rounded-lg text-xs font-medium text-gray-500">
                {userRole === 'admin' ? t('role.admin') : t('role.student')}
            </div>

            {/* Replaced static bell with Notification Dropdown */}
            <NotificationDropdown />

            <div className="h-8 w-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
              JD
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

const AdminDashboardPage = () => (
  <div className="max-w-7xl mx-auto">
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-800">Welcome back, Administrator 👋</h1>
      <p className="text-gray-500">Here is what's happening with your courses today.</p>
    </div>
    <DashboardStats />
  </div>
);

const CoursesPage = ({ courses, isLoading, userRole }: { courses: Course[], isLoading?: boolean, userRole: 'admin' | 'student' }) => (
  <div className="max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Browse Courses</h1>
        <p className="text-gray-500">Expand your knowledge with our top courses.</p>
      </div>
      {userRole === 'admin' && (
          <Link to="/add-course" className="bg-brand-blue hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
            <Plus size={18} />
            Add New Course
          </Link>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {isLoading 
        ? [1, 2, 3, 4, 5, 6, 7, 8].map((n) => <CourseCardSkeleton key={n} />)
        : courses.map(course => (
            <div key={course.id} className="relative group">
                <CourseCard course={course} />
                {userRole === 'admin' && (
                    <Link 
                        to={`/edit-course/${course.id}`}
                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md text-gray-600 hover:text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Edit Course"
                    >
                        <Settings size={18} />
                    </Link>
                )}
            </div>
        ))
      }
    </div>
  </div>
);

export default function App() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES.map(c => ({
      ...c,
      moduleList: generateCourseContent(c.id, c.modules) // Hydrate mock data
  })));
  
  const [categories, setCategories] = useState(['Development', 'Business', 'Design', 'Language', 'Data Science', 'Marketing']);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Site Content State for CMS
  const [siteContent, setSiteContent] = useState<SiteContent>(INITIAL_SITE_CONTENT);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnroll = (courseId: string) => {
    setEnrolledCourseIds(prev => {
      if (!prev.includes(courseId)) {
        return [...prev, courseId];
      }
      return prev;
    });
  };

  const handleToggleLesson = (courseId: string, lessonId: string) => {
    setCompletedLessons(prev => {
      const current = prev[courseId] || [];
      const isCompleted = current.includes(lessonId);
      
      let newCompleted;
      if (isCompleted) {
        newCompleted = current.filter(id => id !== lessonId);
      } else {
        newCompleted = [...current, lessonId];
      }
      
      return { ...prev, [courseId]: newCompleted };
    });
  };

  const handleSaveCourse = (updatedCourse: Course) => {
      setCourses(prev => {
          const exists = prev.find(c => c.id === updatedCourse.id);
          if (exists) {
              return prev.map(c => c.id === updatedCourse.id ? updatedCourse : c);
          } else {
              return [...prev, updatedCourse];
          }
      });
  };

  const handleStudentLogin = () => {
    setIsAuthenticated(true);
    setUserRole('student');
  };

  const handleAdminLogin = () => {
    setIsAuthenticated(true);
    setUserRole('admin');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('student');
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <Router>
          <AIAssistant 
            courses={courses} 
            enrolledCourseIds={isAuthenticated ? enrolledCourseIds : []}
            completedLessons={isAuthenticated ? completedLessons : {}}
          />

          <Routes>
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
                    <Route path="/public-courses" element={
                        <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)} siteContent={siteContent}>
                            <PublicCoursesPage courses={courses} onOpenAuth={() => setIsAuthModalOpen(true)} />
                        </PublicLayout>
                    } />
                    
                    <Route path="/admin-portal" element={<AdminLoginPage onLogin={handleAdminLogin} />} />
                    
                    {/* New Auth Pages */}
                    <Route path="/signup" element={<AuthPage initialMode='signup' onLogin={handleStudentLogin} />} />
                    <Route path="/login" element={<AuthPage initialMode='signin' onLogin={handleStudentLogin} />} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </>
            )}

            {/* Protected Routes (Dashboard) */}
            {isAuthenticated && (
                <Route path="/*" element={
                    <Layout userRole={userRole} setUserRole={setUserRole} onLogout={handleLogout}>
                        <Routes>
                            <Route path="/" element={
                                userRole === 'admin' ? (
                                    <AdminDashboardPage />
                                ) : (
                                    <StudentDashboard 
                                        courses={courses} 
                                        enrolledCourseIds={enrolledCourseIds} 
                                        completedLessons={completedLessons} 
                                        isLoading={isLoading}
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
                                />
                                } 
                            />
                            <Route 
                                path="/instructor/:instructorName"
                                element={<InstructorProfilePage courses={courses} />}
                            />
                            <Route 
                                path="/settings" 
                                element={<SettingsPage userRole={userRole} />} 
                            />
                            {userRole === 'admin' && (
                                <>
                                    <Route path="/add-course" element={<CourseEditor courses={courses} onSave={handleSaveCourse} categories={categories} onAddCategory={c => setCategories(prev => [...prev, c])} />} />
                                    <Route path="/edit-course/:courseId" element={<CourseEditor courses={courses} onSave={handleSaveCourse} categories={categories} onAddCategory={c => setCategories(prev => [...prev, c])} />} />
                                    <Route path="/site-content" element={<AdminContentManager content={siteContent} onUpdate={setSiteContent} />} />
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
          />
        </Router>
      </NotificationProvider>
    </LanguageProvider>
  );
}