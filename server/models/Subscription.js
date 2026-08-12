import { SupabaseModel } from './supabaseModel.js';

const Subscription = new SupabaseModel('subscriptions', {
  user: 'users',
  plan: 'pricing_plans'
});

export default Subscription;
