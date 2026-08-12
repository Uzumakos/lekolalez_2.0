import { SupabaseModel } from './supabaseModel.js';

const SiteContent = new SupabaseModel('site_content', {
  lastUpdatedBy: 'users'
});

export default SiteContent;
