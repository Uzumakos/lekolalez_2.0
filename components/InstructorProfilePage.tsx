import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Course } from '../types';
import { CourseCard } from './CourseCard';
import { Star, Globe, Linkedin, Twitter, ArrowLeft, MapPin, BookOpen } from 'lucide-react';

interface InstructorProfilePageProps {
  courses: Course[];
}

export const InstructorProfilePage: React.FC<InstructorProfilePageProps> = ({ courses }) => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const decodedName = decodeURIComponent(instructorName || '');

  // Filter courses for this instructor
  const instructorCourses = courses.filter(c => c.instructor === decodedName);

  // Calculate stats
  const totalStudents = instructorCourses.reduce((acc, c) => acc + c.students, 0);
  const averageRating = instructorCourses.length > 0
    ? (instructorCourses.reduce((acc, c) => acc + c.rating, 0) / instructorCourses.length).toFixed(1)
    : '0.0';
  const totalReviews = instructorCourses.length * 128; // Mock multiplier based on card data

  // Mock Profile Data generator
  const getInstructorDetails = (name: string) => {
    // Deterministic pseudo-random based on name length/chars for demo
    const titles = ['Senior Software Engineer', 'Language Specialist', 'Data Scientist PhD', 'Marketing Guru'];
    const title = titles[name.length % titles.length];
    
    return {
        name: name,
        title: title,
        bio: `${name} is a passionate educator with over 10 years of experience in ${title.toLowerCase().includes('data') ? 'data science and analytics' : title.toLowerCase().includes('marketing') ? 'digital marketing' : 'software development'}. They have helped thousands of students achieve their career goals through practical, hands-on learning strategies and real-world projects.`,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=0ea5e9&color=fff&size=200`,
        location: 'Port-au-Prince, Haiti',
        website: `www.${name.toLowerCase().replace(/\s/g, '')}.com`
    };
  };

  const profile = getInstructorDetails(decodedName);

  if (!instructorName || instructorCourses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Instructor Not Found</h2>
            <Link to="/courses" className="text-brand-blue hover:underline">Return to Courses</Link>
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Navigation */}
      <div className="mb-6">
        <Link 
            to="/courses"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-blue transition-colors group"
        >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Courses</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-50 to-brand-blue/10"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-10">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0 bg-white">
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center md:text-left mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-brand-blue font-medium text-lg">{profile.title}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                    <span className="flex items-center gap-1"><Globe size={14} /> {profile.website}</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
                    <Twitter size={20} />
                </button>
                <button className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg transition-colors">
                    <Linkedin size={20} />
                </button>
                <button className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-sky-600 transition-colors shadow-lg shadow-blue-500/30">
                    Follow
                </button>
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-8">
            <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wide mt-1">Total Students</div>
            </div>
             <div className="text-center border-l border-r border-gray-100">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
                    {averageRating} <Star size={24} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wide mt-1">{totalReviews} Reviews</div>
            </div>
             <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{instructorCourses.length}</div>
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wide mt-1">Courses</div>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">About Me</h3>
            <p className="text-gray-600 leading-relaxed max-w-4xl">
                {profile.bio}
            </p>
        </div>
      </div>

      {/* Courses Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BookOpen size={24} className="text-brand-blue" />
        Courses by {profile.name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructorCourses.map(course => (
            <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};