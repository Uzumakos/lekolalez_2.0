import { SupabaseModel } from './supabaseModel.js';

const QuizAttempt = new SupabaseModel('quiz_attempts', {
  enrollment: 'enrollments'
});

export default QuizAttempt;
