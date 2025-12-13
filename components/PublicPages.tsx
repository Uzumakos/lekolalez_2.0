import React from 'react';
import { motion } from 'framer-motion';
import { SiteContent, Course } from '../types';
import { Users, Award, BookOpen, Check, Star, Globe, MapPin } from 'lucide-react';
import { CourseCard } from './CourseCard';

// --- About Page ---
export const AboutPage: React.FC<{ content: SiteContent['about'] }> = ({ content }) => {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{content.title}</h1>
          <p className="text-xl text-brand-blue font-medium">{content.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
            >
                <img 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
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
                <p className="whitespace-pre-line leading-relaxed">{content.content}</p>
            </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                    <p className="text-gray-600 font-medium uppercase tracking-wide text-sm">{stat.label}</p>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

// --- Instructors Page ---
export const InstructorsPage: React.FC<{ content: SiteContent['instructors'], courses: Course[] }> = ({ content, courses }) => {
    // Derive unique instructors from courses
    const uniqueInstructors = Array.from(new Set(courses.map(c => c.instructor))).map(name => {
        const course = courses.find(c => c.instructor === name);
        return {
            name,
            role: 'Senior Instructor', // Mock data
            coursesCount: courses.filter(c => c.instructor === name).length,
            image: `https://ui-avatars.com/api/?name=${name}&background=0ea5e9&color=fff&size=200`,
            students: courses.filter(c => c.instructor === name).reduce((acc, c) => acc + c.students, 0)
        };
    });

    return (
        <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h1>
                    <p className="text-lg text-gray-600">{content.subtitle}</p>
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
                                <span className="flex items-center gap-1"><BookOpen size={16} /> {instructor.coursesCount} Courses</span>
                                <span className="flex items-center gap-1"><Users size={16} /> {instructor.students} Students</span>
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
    return (
        <div className="pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h1>
                    <p className="text-xl text-gray-600">{content.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {content.plans.map((plan, idx) => (
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
                                    Most Popular
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
                                onClick={onOpenAuth}
                                className={`w-full py-4 rounded-xl font-bold transition-colors ${plan.isPopular ? 'bg-brand-blue hover:bg-sky-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
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
    return (
        <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
             <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Catalog</h1>
                    <p className="text-lg text-gray-600">Find the perfect course to upgrade your skills.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <div key={course.id} onClick={onOpenAuth} className="cursor-pointer">
                           <CourseCard course={course} />
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
};
