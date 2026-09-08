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

export interface LessonResource {
  id: string;
  title: string;
  url: string;
  type?: 'pdf' | 'zip' | 'link' | 'doc' | 'file';
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  description?: string;
  videoUrl?: string; // URL for YouTube or uploaded video
  quizData?: QuizData; // Optional: if type is quiz
  content?: string; // Optional: content for reading type lessons
  resources?: LessonResource[];
}

export interface Trimester {
  id: string;
  title: string;
  description?: string;
  isFree: boolean; // true = Free Preview, false = Locked / Requires Subscription or Paid Plan
  lessons: Lesson[];
  order?: number;
}

export interface Module {
  id: string;
  title: string;
  trimesters?: Trimester[];
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string | { firstName?: string; lastName?: string; fullName?: string; title?: string; avatar?: string };
  thumbnail: string;
  duration: string;
  students: number;
  rating: number;
  modules: number; // Keep for backward compatibility count
  moduleList?: Module[]; // The actual content
  category: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  showLevel?: boolean; // Whether to display difficulty level badge
  prerequisites?: string[];
  objectives?: string[];
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

// Access & Subscription System
export type AccessLevel = 'free' | 'premium';

export type SubscriptionStatus =
  | 'none'
  | 'pending_verification'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type PaymentMethodType = 'stripe' | 'moncash' | 'natcash' | 'free';

export type SubscriptionDurationMonths = 1 | 3 | 6 | 12;

export interface FreeAccessSettings {
  isEnabled: boolean;
  durationDays: number | null; // null = unlimited/permanent free daily access
  videosPerSubjectPerDay: number; // default: 1
}

export interface PaymentGatewaySettings {
  stripe: {
    isEnabled: boolean;
    publishableKey: string;
    currency: string;
    allowRecurring: boolean;
    allowPrepaid: boolean;
  };
  moncash: {
    isEnabled: boolean;
    merchantNumber: string;
    receiverName: string;
    instructions: string;
    logoUrl?: string;
  };
  natcash: {
    isEnabled: boolean;
    merchantNumber: string;
    receiverName: string;
    instructions: string;
    logoUrl?: string;
  };
  exchangeRateHTG: number; // e.g. 132 HTG = 1 USD
}

export interface UserSubscription {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  planId: string;
  planName: string;
  accessLevel: AccessLevel;
  subscriptionStatus: SubscriptionStatus;
  paymentMethod: PaymentMethodType;
  durationMonths: number;
  amountPaid: number;
  amountPaidHTG?: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentReference?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

export interface SubjectDailyUsage {
  subjectId: string;
  date: string; // YYYY-MM-DD
  videosWatched: number;
  dailyLimit: number;
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

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  bio?: string;
}

export interface SiteContent {
  about: {
    title: string;
    subtitle: string;
    content: string;
    stats: { label: string; value: string }[];
    staff?: StaffMember[];
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
  freeAccess: FreeAccessSettings;
  paymentGateways: PaymentGatewaySettings;
}

// User Roles & Hierarchy
export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin';

// System Audit & Activity Logging
export type AuditLogCategory = 
  | 'auth'
  | 'users'
  | 'billing'
  | 'courses'
  | 'quiz'
  | 'settings'
  | 'system';

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail: string;
  userName?: string | null;
  userRole: UserRole | string;
  action: string;
  actionCategory: AuditLogCategory | string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  role?: string;
  category?: string;
  action?: string;
  search?: string;
  dateRange?: 'all' | 'today' | '7days' | '30days';
}