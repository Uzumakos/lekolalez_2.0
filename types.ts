import React from 'react';

export enum Language {
  ENGLISH = 'en',
  FRENCH = 'fr',
  CREOLE = 'ht'
}

export type QuestionType = 'single' | 'multiple' | 'true-false' | 'text';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options: AnswerOption[]; // For text questions, this might be empty or contain keywords
  explanation?: string; // Shown after answering
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number; // in minutes
  questions: Question[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  description?: string;
  videoUrl?: string; // URL for YouTube or uploaded video
  quizData?: QuizData; // Optional: if type is quiz
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  students: number;
  rating: number;
  modules: number; // Keep for backward compatibility count
  moduleList?: Module[]; // The actual content
  category: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites?: string[];
  tags?: string[];
  videoPreview?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
  link?: string;
}

// Site Configuration for CMS capabilities
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

export interface SiteContent {
  about: {
    title: string;
    subtitle: string;
    content: string;
    stats: { label: string; value: string }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: PricingPlan[];
  };
  instructors: {
    title: string;
    subtitle: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}