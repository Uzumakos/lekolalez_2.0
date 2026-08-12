import { SupabaseModel } from './supabaseModel.js';

const Notification = new SupabaseModel('notifications', {
  user: 'users'
});

export default Notification;
