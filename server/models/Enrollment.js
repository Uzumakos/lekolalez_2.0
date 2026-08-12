import { SupabaseModel } from './supabaseModel.js';

const Enrollment = new SupabaseModel('enrollments', {
  user: 'users',
  course: 'courses'
});

export default Enrollment;
