import { SupabaseModel } from './supabaseModel.js';

const ChatHistory = new SupabaseModel('chat_history', {
  user: 'users'
});

export default ChatHistory;
