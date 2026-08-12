import { SupabaseModel } from './supabaseModel.js';

const Course = new SupabaseModel('courses', {
  instructor: 'users'
});

export default Course;
