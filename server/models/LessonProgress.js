import { SupabaseModel } from './supabaseModel.js';

const LessonProgress = new SupabaseModel('lesson_progress', {
  enrollment: 'enrollments'
});

export default LessonProgress;
