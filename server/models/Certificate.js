import { SupabaseModel } from './supabaseModel.js';

const Certificate = new SupabaseModel('certificates', {
  enrollment: 'enrollments'
});

export default Certificate;
