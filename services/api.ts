import supabase, { supabaseAdmin } from './supabaseClient';
import { sortCourses } from '../utils/courseUtils';

// ─── System Audit & Activity Logs API ───────────────────────────────────────────

export const auditLogsAPI = {
  /**
   * Log an audit event securely to public.audit_logs
   */
  log: async (event: {
    action: string;
    actionCategory: string;
    targetType?: string;
    targetId?: string;
    targetLabel?: string;
    details?: Record<string, any>;
  }) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      let userEmail = 'anonymous@system';
      let userName = 'Invité / Système';
      let userRole = 'student';

      if (authUser) {
        userEmail = authUser.email || 'unknown';
        const { data: profile } = await supabase
          .from('users')
          .select('first_name, last_name, email, role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile) {
          userEmail = profile.email || userEmail;
          userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userEmail;
          userRole = profile.role || userRole;
        } else if (authUser.user_metadata) {
          const metaName = `${authUser.user_metadata.first_name || ''} ${authUser.user_metadata.last_name || ''}`.trim();
          userName = metaName || authUser.user_metadata.full_name || authUser.email || 'Utilisateur';
          userRole = authUser.user_metadata.role || 'student';
        }
      }

      const payloadDetails = {
        email: userEmail,
        name: userName,
        role: userRole,
        ...(event.details || {}),
      };

      // 1. Try secure RPC function
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('log_audit_event', {
          p_action: event.action,
          p_action_category: event.actionCategory,
          p_target_type: event.targetType || null,
          p_target_id: event.targetId ? String(event.targetId) : null,
          p_target_label: event.targetLabel || null,
          p_details: payloadDetails,
        });
        if (!rpcError && rpcData) return rpcData;
      } catch {
        // Fallback to direct table insertion
      }

      // 2. Direct insert fallback
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: authUser?.id || null,
          user_email: userEmail,
          user_name: userName,
          user_role: userRole,
          action: event.action,
          action_category: event.actionCategory,
          target_type: event.targetType || null,
          target_id: event.targetId ? String(event.targetId) : null,
          target_label: event.targetLabel || null,
          details: payloadDetails,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('auditLogsAPI.log notice:', error.message);
      }
      return data;
    } catch (err) {
      console.warn('auditLogsAPI.log warning:', err);
    }
  },

  /**
   * Query audit logs with pagination, search, and category/role/date filters
   */
  getLogs: async (filters?: {
    page?: number;
    limit?: number;
    role?: string;
    category?: string;
    action?: string;
    search?: string;
    dateRange?: 'all' | 'today' | '7days' | '30days';
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters?.role && filters.role !== 'all') {
      query = query.eq('user_role', filters.role);
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('action_category', filters.category);
    }

    if (filters?.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }

    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        query = query.gte('created_at', startOfDay);
      } else if (filters.dateRange === '7days') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past7);
      } else if (filters.dateRange === '30days') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past30);
      }
    }

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(`user_email.ilike.%${s}%,user_name.ilike.%${s}%,action.ilike.%${s}%,target_label.ilike.%${s}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.warn('getLogs notice:', error.message);
      return { logs: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    }

    const logs = (data || []).map((l: any) => {
      const createdAt = l.created_at || l.createdAt || new Date().toISOString();
      const userEmail = l.user_email || l.userEmail || (l.details?.email ? String(l.details.email) : '');
      const rawName = l.user_name || l.userName || (l.details?.name ? String(l.details.name) : '');
      const userName = (rawName && rawName !== 'Utilisateur') ? rawName : (userEmail ? userEmail.split('@')[0] : 'Utilisateur');
      const userRole = l.user_role || l.userRole || (l.details?.role ? String(l.details.role) : 'student');
      const ipAddress = l.ip_address || l.ipAddress || '127.0.0.1';
      const userAgent = l.user_agent || l.userAgent || 'Client Web';
      const targetLabel = l.target_label || l.targetLabel;
      const targetType = l.target_type || l.targetType;
      const targetId = l.target_id || l.targetId;
      const actionCategory = l.action_category || l.actionCategory;

      return {
        id: l.id,
        // CamelCase
        userId: l.user_id || l.userId,
        userEmail,
        userName,
        userRole,
        action: l.action,
        actionCategory,
        targetType,
        targetId,
        targetLabel,
        details: l.details,
        ipAddress,
        userAgent,
        createdAt,
        // Snake_case aliases
        user_id: l.user_id || l.userId,
        user_email: userEmail,
        user_name: userName,
        user_role: userRole,
        action_category: actionCategory,
        target_type: targetType,
        target_id: targetId,
        target_label: targetLabel,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: createdAt,
      };
    });

    return {
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  },

  /**
   * Fast statistics for the audit log dashboard
   */
  getAuditStats: async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();

      const [
        { count: totalCount },
        { count: todayCount },
        { count: adminActionsCount },
        { count: authCount },
      ] = await Promise.all([
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).in('user_role', ['admin', 'super_admin']),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action_category', 'auth'),
      ]);

      return {
        totalEvents: totalCount || 0,
        todayEvents: todayCount || 0,
        adminEvents: adminActionsCount || 0,
        authEvents: authCount || 0,
      };
    } catch {
      return {
        totalEvents: 0,
        todayEvents: 0,
        adminEvents: 0,
        authEvents: 0,
      };
    }
  },
};

// ─── Auth API ──────────────────────────────────────────────────────────────────

export const authAPI = {
  /**
   * Check if any user with role 'admin' exists in public.users
   */
  hasAdmin: async (): Promise<boolean> => {
    try {
      const client = supabaseAdmin || supabase;
      const { count, error } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (error) {
        return false;
      }
      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  },

  /**
   * Check if any user with role 'super_admin' exists in public.users
   */
  hasSuperAdmin: async (): Promise<boolean> => {
    try {
      const client = supabaseAdmin || supabase;
      const { count, error } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if (error) {
        return false;
      }
      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  },

  /**
   * One-time setup / elevation for the initial Super Admin.
   * Can either elevate the currently logged-in admin OR register a new account if none exists.
   */
  setupInitialSuperAdmin: async (userData?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    targetUserId?: string;
  }) => {
    // 1. Strictly verify no super_admin exists
    const hasExisting = await authAPI.hasSuperAdmin();
    if (hasExisting) {
      throw new Error('Un Super Administrateur est déjà configuré sur la plateforme. Cette initialisation est à usage unique.');
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Mode A: Logged-in admin elevating current account
    if (authUser && (!userData?.email || userData.email === authUser.email || userData.targetUserId === authUser.id)) {
      const targetId = authUser.id;

      // Try secure RPC
      try {
        const { data, error } = await supabase.rpc('rpc_setup_initial_super_admin', {
          target_user_id: targetId,
        });
        if (!error && data) return data;
      } catch (e) {
        console.warn('RPC rpc_setup_initial_super_admin fallback:', e);
      }

      // Direct fallback update
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'super_admin', updated_at: new Date().toISOString() })
        .eq('id', targetId);

      if (updateError) throw new Error(updateError.message);

      // Update auth user metadata
      try {
        await supabase.auth.updateUser({
          data: { role: 'super_admin' },
        });
      } catch {}

      // Update localStorage stored user
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.role = 'super_admin';
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch {}
      }

      await auditLogsAPI.log({
        action: 'super_admin_initialized',
        actionCategory: 'system',
        targetType: 'user',
        targetId: targetId,
        targetLabel: authUser.email || 'Super Admin',
        details: { method: 'portal_elevation', email: authUser.email },
      });

      return {
        success: true,
        message: 'Félicitations ! Votre compte a été configuré en tant que Super Admin.',
        user: { id: targetId, email: authUser.email, role: 'super_admin' },
      };
    }

    // Mode B: Creating new Super Admin account via /admin portal
    if (userData?.email && userData?.password) {
      const firstName = userData.firstName?.trim() || 'Super';
      const lastName = userData.lastName?.trim() || 'Admin';

      // 1. Try dev/backend endpoint first (which uses service_role key and bypasses public MX domain checks)
      let backendUser: any = null;
      try {
        const resp = await fetch('/api/admin/setup-super-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            firstName,
            lastName,
          }),
        });
        if (resp.ok) {
          const resData = await resp.json();
          backendUser = resData.user;
        } else {
          const errData = await resp.json().catch(() => ({}));
          if (errData.error && errData.error.includes('existe déjà')) {
            throw new Error(errData.error);
          }
        }
      } catch (e: any) {
        if (e.message && e.message.includes('existe déjà')) throw e;
        console.warn('Backend setup-super-admin notice:', e);
      }

      if (backendUser) {
        // Authenticate the session in the client
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

        if (loginErr) {
          console.warn('Post-creation login notice:', loginErr.message);
        }

        return {
          success: true,
          message: 'Super Admin initial créé avec succès !',
          user: {
            id: loginData?.user?.id || backendUser.id,
            email: userData.email,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            role: 'super_admin',
            preferredLanguage: 'fr',
            avatar: null,
          },
        };
      }

      // 2. Fallback to standard client signup
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'super_admin',
          },
        },
      });

      if (authErr) {
        let msg = authErr.message;
        if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
          msg = `L'adresse "${userData.email}" a été rejetée par la vérification publique Supabase (vérification des serveurs de messagerie MX du domaine). Vous pouvez exécuter "npm run setup:super-admin" dans le terminal ou désactiver la vérification MX dans Supabase Auth.`;
        }
        throw new Error(msg);
      }
      if (!authData.user) throw new Error('Création du compte Super Admin échouée.');

      // Upsert profile in public.users
      const dbClient = supabaseAdmin || supabase;
      const { error: profileErr } = await dbClient.from('users').upsert({
        id: authData.user.id,
        email: userData.email,
        first_name: firstName,
        last_name: lastName,
        role: 'super_admin',
        preferred_language: 'fr',
        password: '**managed_by_supabase_auth**',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (profileErr) {
        console.warn('Profile creation warning:', profileErr.message);
      }

      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
      }

      const superUser = {
        id: authData.user.id,
        email: userData.email,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        role: 'super_admin',
        preferredLanguage: 'fr',
        avatar: null,
      };

      await auditLogsAPI.log({
        action: 'super_admin_initialized',
        actionCategory: 'system',
        targetType: 'user',
        targetId: authData.user.id,
        targetLabel: userData.email,
        details: { method: 'portal_initial_signup', email: userData.email },
      });

      return {
        success: true,
        message: 'Super Admin initial créé avec succès !',
        user: superUser,
      };
    }

    throw new Error('Paramètres manquants pour la création du Super Admin.');
  },

  /**
   * Initialize the first administrator account if none exists.
   */
  setupInitialAdmin: async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    // 1. Verify no admin exists
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if ((count ?? 0) > 0) {
      throw new Error('An administrator already exists. Please log in.');
    }

    const firstName = userData.firstName?.trim() || 'Admin';
    const lastName = userData.lastName?.trim() || 'User';

    // 2. Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Registration failed');

    // 3. Upsert admin profile row in public.users
    const dbClient = supabaseAdmin || supabase;
    const { error: profileError } = await dbClient.from('users').upsert({
      id: authData.user.id,
      email: userData.email,
      first_name: firstName,
      last_name: lastName,
      role: 'admin',
      preferred_language: 'en',
      password: '**managed_by_supabase_auth**',
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
    }

    // 4. Ensure sign in if no session was returned
    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });
      if (signInError) {
        console.warn('Auto sign-in warning:', signInError.message);
      }
    }

    const user = {
      id: authData.user.id,
      email: userData.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      role: 'admin',
      preferredLanguage: 'en',
      avatar: null,
    };

    return { user };
  },

  /**
   * Register a new user via Supabase Auth, then create a profile row in `users`.
   */
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    preferredLanguage?: string;
    subscription?: {
      planId?: string;
      planName: string;
      durationMonths: number;
      amountPaid: number;
      amountPaidHTG?: number;
      paymentMethod: 'stripe' | 'moncash' | 'natcash' | 'free';
      paymentReference?: string;
    };
  }) => {
    // Security: Public self-registration is strictly restricted to role 'student'
    const assignedRole = 'student';

    // Determine access level & subscription status
    const method = userData.subscription?.paymentMethod || 'free';
    const isMobile = method === 'moncash' || method === 'natcash';
    const isStripe = method === 'stripe';

    // Security: Client signup can never self-grant active premium status.
    // Payments require server webhook (Stripe) or manual admin verification (MonCash/NatCash).
    const accessLevel = 'free';
    const subscriptionStatus = (isMobile || isStripe) ? 'pending_verification' : 'none';

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: assignedRole,
          access_level: accessLevel,
          subscription_status: subscriptionStatus,
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Registration failed');

    // 2. Establish session if not automatically returned
    if (!authData.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
      } catch (signInErr) {
        console.warn('Post-registration auto-signin notice:', signInErr);
      }
    }

    // 3. Upsert profile row in public.users (linked by auth user id)
    const { error: profileError } = await supabase.from('users').upsert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: assignedRole,
      preferred_language: userData.preferredLanguage || 'en',
      password: '**managed_by_supabase_auth**', // placeholder
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
    }

    // 4. Create subscription record if a paid plan or mobile transfer was submitted
    const durationMonths = userData.subscription?.durationMonths || 1;
    let savedSubscription = null;
    if (userData.subscription && method !== 'free') {
      const subPayload = {
        user_id: authData.user.id,
        plan_name: userData.subscription.planName || 'Premium',
        duration_months: durationMonths,
        amount_paid: userData.subscription.amountPaid,
        amount_paid_htg: userData.subscription.amountPaidHTG || null,
        payment_method: method,
        payment_reference: userData.subscription.paymentReference || null,
        status: 'pending_verification',
        start_date: null,
        end_date: null,
        current_period_end: null,
      };

      try {
        const { data: subData, error: subError } = await supabase.from('subscriptions').insert(subPayload).select().maybeSingle();
        if (subError) {
          console.warn('Subscription insert warning:', subError.message);
        }
        savedSubscription = subData || subPayload;
      } catch (subErr) {
        console.warn('Subscription record notice:', subErr);
        savedSubscription = subPayload;
      }
    }

    const user = {
      id: authData.user.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: assignedRole,
      preferredLanguage: userData.preferredLanguage || 'en',
      avatar: null,
      accessLevel,
      subscriptionStatus,
      subscription: savedSubscription,
    };

    return { user };
  },

  /**
   * Login via Supabase Auth, fetch profile from public.users.
   */
  login: async (credentials: { email: string; password: string }) => {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Login failed');

    // Fetch full profile
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if ((!profile || profileError) && supabaseAdmin) {
      const adminRes = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (adminRes.data) {
        profile = adminRes.data;
      }
    }

    const user = profile
      ? {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          fullName: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          preferredLanguage: profile.preferred_language,
          avatar: profile.avatar,
          bio: profile.bio,
          title: profile.title,
        }
      : {
          id: authData.user.id,
          email: authData.user.email,
          firstName: authData.user.user_metadata?.first_name || '',
          lastName: authData.user.user_metadata?.last_name || '',
          fullName: `${authData.user.user_metadata?.first_name || ''} ${authData.user.user_metadata?.last_name || ''}`,
          role: authData.user.user_metadata?.role || 'student',
          preferredLanguage: 'en',
          avatar: null,
        };

    // Log login event to audit logs
    const loginUserFullName = user.fullName?.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    auditLogsAPI.log({
      action: 'user_login',
      actionCategory: 'auth',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      details: {
        role: user.role,
        email: user.email,
        name: loginUserFullName,
        login_at: new Date().toISOString()
      },
    }).catch(() => {});

    return { user };
  },

  /**
   * Get current authenticated user's profile.
   */
  getMe: async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    const user = profile
      ? {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          fullName: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          preferredLanguage: profile.preferred_language,
          avatar: profile.avatar,
          bio: profile.bio,
          title: profile.title,
        }
      : {
          id: authUser.id,
          email: authUser.email,
          firstName: authUser.user_metadata?.first_name || '',
          lastName: authUser.user_metadata?.last_name || '',
          fullName: `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`,
          role: authUser.user_metadata?.role || 'student',
          preferredLanguage: 'en',
          avatar: null,
        };

    return { user };
  },

  /**
   * Update the current user's profile in public.users.
   */
  updateProfile: async (profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    title?: string;
    preferredLanguage?: string;
    avatar?: string;
  }) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const updateObj: Record<string, any> = {};
    if (profileData.firstName !== undefined)
      updateObj.first_name = profileData.firstName;
    if (profileData.lastName !== undefined)
      updateObj.last_name = profileData.lastName;
    if (profileData.bio !== undefined) updateObj.bio = profileData.bio;
    if (profileData.title !== undefined) updateObj.title = profileData.title;
    if (profileData.preferredLanguage !== undefined)
      updateObj.preferred_language = profileData.preferredLanguage;
    if (profileData.avatar !== undefined) updateObj.avatar = profileData.avatar;
    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateObj)
      .eq('id', authUser.id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    const user = data
      ? {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          fullName: `${data.first_name} ${data.last_name}`,
          role: data.role,
          preferredLanguage: data.preferred_language,
          avatar: data.avatar,
          bio: data.bio,
          title: data.title,
        }
      : null;

    return { user };
  },

  /**
   * Request password reset link by email.
   * Also inserts an entry into public.password_reset_requests so administrators can monitor and act on it.
   */
  requestPasswordReset: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = `${window.location.origin}/reset-password`;

    // 1. Trigger Supabase recovery email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      console.warn('Supabase resetPasswordForEmail warning:', resetError.message);
    }

    // 2. Track request in public.password_reset_requests for administrator visibility
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      await supabase.from('password_reset_requests').insert({
        email: cleanEmail,
        user_id: userRow?.id || null,
        status: 'pending',
        notes: 'Demande effectuée par l’utilisateur depuis l’interface de connexion',
      });
    } catch (dbErr) {
      console.warn('Could not record password_reset_requests row:', dbErr);
    }

    return {
      success: true,
      message: 'Si un compte est associé à cette adresse, vous recevrez un e-mail de réinitialisation.',
    };
  },

  /**
   * Complete password reset when user is logged in via email recovery token.
   */
  completePasswordReset: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
    return { success: true, user: data.user };
  },
};

// ─── Helper: map a DB course row to frontend Course shape ──────────────────────

const mapCourseRow = (c: any) => {
  if (!c) return null as any;
  const instructor = c.instructor
    ? {
        firstName: c.instructor.first_name,
        lastName: c.instructor.last_name,
        fullName: `${c.instructor.first_name} ${c.instructor.last_name}`,
        avatar: c.instructor.avatar,
        title: c.instructor.title,
        bio: c.instructor.bio,
        location: c.instructor.location,
      }
    : c.instructor_id || 'Unknown';

  return {
    _id: c.id,
    id: c.id,
    title: c.title,
    description: c.description,
    instructor,
    thumbnail: c.thumbnail || `https://picsum.photos/400/250?random=${c.id}`,
    totalDuration: c.total_duration || '0h',
    enrollmentCount: c.enrollment_count || 0,
    rating: c.rating || { average: 0, count: 0 },
    modules: c.modules || [],
    category: c.category,
    price: c.price || 0,
    level: c.level,
    showLevel: c.show_level !== undefined ? Boolean(c.show_level) : false,
    tags: c.tags || [],
    prerequisites: c.prerequisites || [],
    objectives: c.objectives || [],
    isPublished: c.is_published,
    status: c.status,
    createdAt: c.created_at,
  };
};

const isUUID = (val?: string): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// ─── Courses API ───────────────────────────────────────────────────────────────

export const coursesAPI = {
  getAll: async (params?: {
    category?: string;
    level?: string;
    search?: string;
    limit?: number;
    page?: number;
    includeUnpublished?: string;
  }) => {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const buildQuery = (client: any) => {
      let q = client
        .from('courses')
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)', { count: 'exact' });

      // Filter published only unless explicitly requesting unpublished
      if (params?.includeUnpublished !== 'true') {
        q = q.or('is_published.eq.true,status.eq.published');
      }

      if (params?.category) q = q.eq('category', params.category);
      if (params?.level) q = q.eq('level', params.level);
      if (params?.search) q = q.ilike('title', `%${params.search}%`);

      q = q.order('created_at', { ascending: true });
      q = q.range(offset, offset + limit - 1);
      return q;
    };

    let { data, error, count } = await buildQuery(supabase);

    // If RLS returned 0 rows or errored, fallback to supabaseAdmin
    if ((error || !data || data.length === 0) && supabaseAdmin) {
      const adminRes = await buildQuery(supabaseAdmin);
      if (adminRes.data && adminRes.data.length > 0) {
        data = adminRes.data;
        count = adminRes.count;
        error = adminRes.error;
      }
    }

    if (error) throw new Error(error.message);

    const courses = (data || []).map(mapCourseRow).filter(Boolean);

    return {
      courses: sortCourses(courses),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  },

  getAllForInstructor: async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const client = supabaseAdmin || supabase;
    // Get user's role
    const { data: profile } = await client
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    const buildQuery = (c: any) => {
      let q = c
        .from('courses')
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)');

      if (profile?.role !== 'admin') {
        q = q.eq('instructor_id', authUser.id);
      }

      q = q.order('created_at', { ascending: true });
      return q;
    };

    let { data, error } = await buildQuery(supabase);
    if ((error || !data || data.length === 0) && supabaseAdmin) {
      const adminRes = await buildQuery(supabaseAdmin);
      if (adminRes.data && adminRes.data.length > 0) {
        data = adminRes.data;
        error = adminRes.error;
      }
    }

    if (error) throw new Error(error.message);

    return { courses: sortCourses((data || []).map(mapCourseRow).filter(Boolean)) };
  },

  getById: async (id: string) => {
    if (!isUUID(id)) {
      throw new Error('Course not found');
    }

    let { data, error } = await supabase
      .from('courses')
      .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
      .eq('id', id)
      .maybeSingle();

    if ((error || !data) && supabaseAdmin) {
      const adminRes = await supabaseAdmin
        .from('courses')
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .eq('id', id)
        .maybeSingle();
      data = adminRes.data;
      error = adminRes.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Course not found');

    return { course: mapCourseRow(data) };
  },

  create: async (courseData: {
    title: string;
    description: string;
    shortDescription?: string;
    category: string;
    level?: string;
    price?: number;
    thumbnail?: string;
    modules?: any[];
    tags?: string[];
    prerequisites?: string[];
    status?: string;
    isPublished?: boolean;
    [key: string]: any;
  }) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const insertPayload = {
      title: courseData.title,
      description: courseData.description,
      short_description: courseData.shortDescription || courseData.description?.substring(0, 300),
      category: courseData.category,
      level: courseData.level || 'Beginner',
      show_level: Boolean(courseData.showLevel),
      price: courseData.price || 0,
      thumbnail: courseData.thumbnail,
      modules: courseData.modules || [],
      tags: courseData.tags || [],
      prerequisites: courseData.prerequisites || [],
      objectives: courseData.objectives || [],
      instructor_id: authUser.id,
      is_free: (courseData.price || 0) === 0,
      status: courseData.status || 'published',
      is_published: courseData.isPublished !== undefined ? courseData.isPublished : true,
    };

    // Update instructor profile in users table if instructor metadata is provided
    if (courseData.instructor && typeof courseData.instructor === 'object') {
      const inst = courseData.instructor;
      const userUpdate: Record<string, any> = {};
      if (inst.fullName) {
        const parts = inst.fullName.trim().split(' ');
        userUpdate.first_name = parts[0] || 'Instructor';
        userUpdate.last_name = parts.slice(1).join(' ') || '';
      }
      if (inst.title !== undefined) userUpdate.title = inst.title;
      if (inst.avatar !== undefined) userUpdate.avatar = inst.avatar;

      if (Object.keys(userUpdate).length > 0) {
        await supabaseAdmin.from('users').update(userUpdate).eq('id', authUser.id);
      }
    }

    let { data, error } = await supabase
      .from('courses')
      .insert(insertPayload)
      .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
      .maybeSingle();

    // If error is about missing show_level column, retry without it
    if (error && error.message?.includes('show_level')) {
      const { show_level: _, ...safePayload } = insertPayload;
      const retry = await (supabaseAdmin || supabase)
        .from('courses')
        .insert(safePayload)
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    } else if ((error || !data) && supabaseAdmin) {
      // If RLS blocked insert, fallback to supabaseAdmin
      console.warn('Retrying course insert via admin client due to RLS restriction...');
      const adminRes = await supabaseAdmin
        .from('courses')
        .insert(insertPayload)
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .maybeSingle();
      data = adminRes.data;
      error = adminRes.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create course');

    return { course: mapCourseRow(data) };
  },

  update: async (id: string, courseData: any) => {
    // If id is not a valid UUID (e.g. mock demo courses with id '1', '2', etc.),
    // create it in the database as a new course instead of failing on Postgres UUID validation.
    if (!isUUID(id)) {
      return coursesAPI.create(courseData);
    }

    // Convert camelCase to snake_case for known fields
    const updateObj: Record<string, any> = {};
    if (courseData.title !== undefined) updateObj.title = courseData.title;
    if (courseData.description !== undefined)
      updateObj.description = courseData.description;
    if (courseData.shortDescription !== undefined)
      updateObj.short_description = courseData.shortDescription;
    if (courseData.category !== undefined)
      updateObj.category = courseData.category;
    if (courseData.level !== undefined) updateObj.level = courseData.level;
    if (courseData.showLevel !== undefined) updateObj.show_level = Boolean(courseData.showLevel);
    if (courseData.price !== undefined) updateObj.price = courseData.price;
    if (courseData.thumbnail !== undefined)
      updateObj.thumbnail = courseData.thumbnail;
    if (courseData.videoPreview !== undefined)
      updateObj.video_preview = courseData.videoPreview;
    if (courseData.modules !== undefined) updateObj.modules = courseData.modules;
    if (courseData.tags !== undefined) updateObj.tags = courseData.tags;
    if (courseData.prerequisites !== undefined)
      updateObj.prerequisites = courseData.prerequisites;
    if (courseData.objectives !== undefined)
      updateObj.objectives = courseData.objectives;
    if (courseData.isPublished !== undefined)
      updateObj.is_published = courseData.isPublished;
    if (courseData.status !== undefined) updateObj.status = courseData.status;
    if (courseData.totalDuration !== undefined)
      updateObj.total_duration = courseData.totalDuration;
    if (courseData.totalLessons !== undefined)
      updateObj.total_lessons = courseData.totalLessons;
    updateObj.updated_at = new Date().toISOString();

    // Update instructor profile in users table if instructor metadata is provided
    if (courseData.instructor && typeof courseData.instructor === 'object') {
      const inst = courseData.instructor;
      const userUpdate: Record<string, any> = {};
      if (inst.fullName) {
        const parts = inst.fullName.trim().split(' ');
        userUpdate.first_name = parts[0] || 'Instructor';
        userUpdate.last_name = parts.slice(1).join(' ') || '';
      }
      if (inst.title !== undefined) userUpdate.title = inst.title;
      if (inst.avatar !== undefined) userUpdate.avatar = inst.avatar;

      if (Object.keys(userUpdate).length > 0) {
        const { data: courseRow } = await supabaseAdmin.from('courses').select('instructor_id').eq('id', id).maybeSingle();
        const targetUserId = courseRow?.instructor_id;
        if (targetUserId) {
          await supabaseAdmin.from('users').update(userUpdate).eq('id', targetUserId);
        }
      }
    }

    let { data, error } = await supabase
      .from('courses')
      .update(updateObj)
      .eq('id', id)
      .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
      .maybeSingle();

    // If error is about missing show_level column, retry without it
    if (error && error.message?.includes('show_level')) {
      const { show_level: _, ...safeUpdate } = updateObj;
      const retry = await (supabaseAdmin || supabase)
        .from('courses')
        .update(safeUpdate)
        .eq('id', id)
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    } else if ((error || !data) && supabaseAdmin) {
      // If RLS blocked update (returning error or updating 0 rows resulting in null data), fallback to supabaseAdmin
      console.warn('Retrying course update via admin client...');
      const adminRes = await supabaseAdmin
        .from('courses')
        .update(updateObj)
        .eq('id', id)
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .maybeSingle();
      data = adminRes.data;
      error = adminRes.error;
    }

    if (!data) {
      // If course record does not exist in the database, create it!
      return coursesAPI.create({ ...courseData, id });
    }

    if (error) throw new Error(error.message);

    return { course: mapCourseRow(data) };
  },

  publish: async (id: string) => {
    if (!isUUID(id)) {
      return { course: null, isPublished: true, status: 'published' };
    }

    // Get current state
    const { data: current } = await supabase
      .from('courses')
      .select('is_published')
      .eq('id', id)
      .maybeSingle();

    const newPublished = !current?.is_published;
    const updateObj: Record<string, any> = {
      is_published: newPublished,
      status: newPublished ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    };
    if (newPublished) {
      updateObj.published_at = new Date().toISOString();
    }

    let { data, error } = await supabase
      .from('courses')
      .update(updateObj)
      .eq('id', id)
      .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
      .maybeSingle();

    if ((error || !data) && supabaseAdmin) {
      const adminRes = await supabaseAdmin
        .from('courses')
        .update(updateObj)
        .eq('id', id)
        .select('*, instructor:users!instructor_id(id, first_name, last_name, avatar, title, bio, location)')
        .maybeSingle();
      data = adminRes.data;
      error = adminRes.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to publish course');

    return { course: mapCourseRow(data) };
  },

  delete: async (id: string) => {
    if (!isUUID(id)) {
      return { message: 'Course deleted' };
    }
    let { error } = await supabase.from('courses').delete().eq('id', id);
    if (error && (error.code === '42501' || error.message?.toLowerCase().includes('row-level security'))) {
      const adminRes = await supabaseAdmin.from('courses').delete().eq('id', id);
      error = adminRes.error;
    }
    if (error) throw new Error(error.message);
    return { message: 'Course deleted' };
  },
};

// ─── Enrollments API ───────────────────────────────────────────────────────────

export const enrollmentsAPI = {
  getMyEnrollments: async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('enrollments')
      .select('*, course:courses(*, instructor:users!instructor_id(id, first_name, last_name, avatar))')
      .eq('user_id', authUser.id)
      .order('enrolled_at', { ascending: false });

    if (error) throw new Error(error.message);

    const enrollments = (data || []).map((e: any) => ({
      _id: e.id,
      user: e.user_id,
      course: e.course ? mapCourseRow(e.course) : null,
      status: e.status,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      progress: e.progress,
    }));

    return { enrollments };
  },

  enroll: async (courseId: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) throw new Error('Already enrolled in this course');

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: authUser.id,
        course_id: courseId,
        status: 'active',
      })
      .select('*, course:courses(*, instructor:users!instructor_id(id, first_name, last_name, avatar))')
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Increment enrollment count on course
    try {
      const { error: rpcError } = await supabase.rpc('increment_enrollment_count', { cid: courseId });
      if (rpcError) throw rpcError;
    } catch {
      // Fallback: manual increment if RPC doesn't exist
      try {
        const { data: course } = await supabase
          .from('courses')
          .select('enrollment_count')
          .eq('id', courseId)
          .maybeSingle();

        if (course) {
          await supabase
            .from('courses')
            .update({ enrollment_count: (course.enrollment_count || 0) + 1 })
            .eq('id', courseId);
        }
      } catch {
        // Ignore fallback error
      }
    }

    // Create notification
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle();

    if (course) {
      await supabase.from('notifications').insert({
        user_id: authUser.id,
        title: 'Enrollment Successful!',
        message: `You are now enrolled in "${course.title}"`,
        type: 'enrollment',
      });
    }

    const enrollment = data
      ? {
          _id: data.id,
          user: data.user_id,
          course: data.course ? mapCourseRow(data.course) : null,
          status: data.status,
          enrolledAt: data.enrolled_at,
        }
      : null;

    return { enrollment };
  },

  getProgress: async (courseId: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) return { completedLessonIds: [], progress: [] };

    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollment.id);

    if (error) throw new Error(error.message);

    const completedLessonIds = (data || [])
      .filter((p: any) => p.is_completed)
      .map((p: any) => p.lesson_id);

    return { completedLessonIds, progress: data || [] };
  },

  completeLesson: async (
    courseId: string,
    lessonId: string,
    extraData?: { moduleIndex?: number; lessonIndex?: number; moduleId?: string }
  ) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Get enrollment or auto-enroll if student is completing a lesson
    let { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      // Auto-enroll user in course so progress is saved and tracked
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: authUser.id,
          course_id: courseId,
          status: 'active',
        })
        .select('id')
        .maybeSingle();

      if (enrollError || !newEnrollment) {
        throw new Error(enrollError?.message || 'Failed to initialize enrollment');
      }
      enrollment = newEnrollment;
    }

    // Check if lesson progress exists
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    let lessonProgress;
    if (existing) {
      // Toggle completion
      const { data, error } = await supabase
        .from('lesson_progress')
        .update({
          is_completed: !existing.is_completed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      lessonProgress = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
        })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      lessonProgress = data;
    }

    // Calculate overall progress
    const { data: allProgress } = await supabase
      .from('lesson_progress')
      .select('is_completed')
      .eq('enrollment_id', enrollment.id);

    const completed = (allProgress || []).filter((p: any) => p.is_completed).length;
    const total = (allProgress || []).length;
    const courseProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update enrollment progress
    const enrollUpdate: Record<string, any> = {
      progress: courseProgress,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (courseProgress === 100) {
      enrollUpdate.status = 'completed';
      enrollUpdate.completed_at = new Date().toISOString();

      // Create completion notification
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle();

      if (course) {
        await supabase.from('notifications').insert({
          user_id: authUser.id,
          title: 'Course Completed!',
          message: `Congratulations! You completed "${course.title}"`,
          type: 'completion',
        });
      }
    }

    await supabase
      .from('enrollments')
      .update(enrollUpdate)
      .eq('id', enrollment.id);

    return {
      lessonProgress,
      courseProgress,
      isCompleted: lessonProgress?.is_completed,
    };
  },

  getCertificate: async (courseId: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) throw new Error('Not enrolled');

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Certificate not found');

    return { certificate: data };
  },
};

// ─── Notifications API ─────────────────────────────────────────────────────────

export const notificationsAPI = {
  getAll: async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const notifications = (data || []).map((n: any) => ({
      _id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return { notifications, unreadCount };
  },

  markAsRead: async (id: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { notification: data };
  },

  markAllAsRead: async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authUser.id)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return { message: 'All notifications marked as read' };
  },

  create: async ({
    userId,
    title,
    message,
    type = 'info',
  }: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('notificationsAPI.create error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('notificationsAPI.create exception:', err);
      return null;
    }
  },
};

// ─── Site Content API ──────────────────────────────────────────────────────────

export const siteContentAPI = {
  get: async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'main')
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) return { content: null, isDefault: true };

    const content = {
      ...data,
      freeAccess: data.pricing?.freeAccess || data.free_access || null,
      paymentGateways: data.pricing?.paymentGateways || data.payment_gateways || null,
    };

    return { content };
  },

  update: async (content: {
    about?: any;
    pricing?: any;
    instructors?: any;
    contact?: any;
    freeAccess?: any;
    paymentGateways?: any;
  }) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    // Security: Only administrators can update site content
    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (callerProfile?.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can modify site content.');
    }

    const pricingMerged = {
      ...content.pricing,
      freeAccess: content.freeAccess || content.pricing?.freeAccess,
      paymentGateways: content.paymentGateways || content.pricing?.paymentGateways,
    };

    const updatePayload = {
      key: 'main',
      about: content.about,
      pricing: pricingMerged,
      instructors: content.instructors,
      contact: content.contact,
      last_updated_by: authUser.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('site_content')
      .upsert(updatePayload, { onConflict: 'key' })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    return { message: 'Site content updated successfully', content: data };
  },

  updateSection: async (section: string, sectionData: any) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    // Security: Only administrators can update site content sections
    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (callerProfile?.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can modify site content.');
    }

    const validSections = ['about', 'pricing', 'instructors', 'contact', 'freeAccess', 'paymentGateways'];
    if (!validSections.includes(section))
      throw new Error('Invalid section');

    let { data: existing } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'main')
      .maybeSingle();

    const updatePayload: Record<string, any> = {
      key: 'main',
      last_updated_by: authUser.id,
      updated_at: new Date().toISOString(),
    };

    if (section === 'freeAccess' || section === 'paymentGateways') {
      const currentPricing = existing?.pricing || {};
      updatePayload.pricing = {
        ...currentPricing,
        [section]: sectionData,
      };
    } else {
      updatePayload[section] = sectionData;
    }

    const { data, error } = await supabase
      .from('site_content')
      .upsert(updatePayload, { onConflict: 'key' })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    return {
      message: `${section} section updated successfully`,
      content: data,
    };
  },
};

// ─── Subscriptions API ────────────────────────────────────────────────────────

export const subscriptionsAPI = {
  getCurrent: async (userId?: string) => {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId) return { subscription: null, accessLevel: 'free', subscriptionStatus: 'none', daysRemaining: 0 };

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { subscription: null, accessLevel: 'free', subscriptionStatus: 'none', daysRemaining: 0 };
      }

      let accessLevel: 'free' | 'premium' = 'free';
      let subscriptionStatus = data.status || 'none';
      let daysRemaining = 0;

      if (data.end_date) {
        const diffTime = new Date(data.end_date).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      if (data.status === 'active') {
        if (daysRemaining > 0) {
          accessLevel = 'premium';
          subscriptionStatus = 'active';
        } else {
          accessLevel = 'free';
          subscriptionStatus = 'expired';
        }
      } else if (data.status === 'pending_verification') {
        accessLevel = 'free';
        subscriptionStatus = 'pending_verification';
      }

      return {
        subscription: data,
        accessLevel,
        subscriptionStatus,
        daysRemaining,
      };
    } catch (err) {
      console.warn('subscriptionsAPI.getCurrent error:', err);
      return { subscription: null, accessLevel: 'free', subscriptionStatus: 'none', daysRemaining: 0 };
    }
  },

  create: async (payload: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    planId?: string;
    planName: string;
    durationMonths: number;
    amountPaid: number;
    amountPaidHTG?: number;
    paymentMethod: 'stripe' | 'moncash' | 'natcash' | 'free';
    paymentReference?: string;
    currency?: string;
  }) => {
    let targetUserId = payload.userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId) throw new Error('Not authenticated');

    const isMobile = payload.paymentMethod === 'moncash' || payload.paymentMethod === 'natcash';
    const isStripe = payload.paymentMethod === 'stripe';

    // Security: Subscriptions created by the client can NEVER be marked active.
    // They must remain pending_verification until confirmed server-side or by an administrator.
    const status = (isMobile || isStripe) ? 'pending_verification' : 'none';
    const accessLevel = 'free';

    const insertPayload = {
      user_id: targetUserId,
      plan_name: payload.planName,
      duration_months: payload.durationMonths,
      amount_paid: payload.amountPaid,
      amount_paid_htg: payload.amountPaidHTG || null,
      payment_method: payload.paymentMethod,
      payment_reference: payload.paymentReference || null,
      status,
      start_date: null,
      end_date: null,
      current_period_end: null,
    };

    const { data, error } = await supabase.from('subscriptions').insert(insertPayload).select().maybeSingle();
    if (error) {
      console.warn('Could not insert subscription into DB:', error.message);
      return { subscription: insertPayload, accessLevel, subscriptionStatus: status };
    }

    return { subscription: data, accessLevel, subscriptionStatus: status };
  },

  getAllPending: async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, user:users!user_id(id, first_name, last_name, email, avatar)')
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        userName: s.user ? `${s.user.first_name || ''} ${s.user.last_name || ''}`.trim() : '',
        userEmail: s.user?.email || '',
        planId: s.plan_id || '',
        planName: s.plan_name || 'Premium Alèz',
        accessLevel: (s.status === 'active' ? 'premium' : 'free') as any,
        subscriptionStatus: s.status as any,
        paymentMethod: s.payment_method as any,
        durationMonths: s.duration_months || 1,
        amountPaid: Number(s.amount_paid) || 0,
        amountPaidHTG: s.amount_paid_htg ? Number(s.amount_paid_htg) : undefined,
        currency: s.payment_method === 'stripe' ? 'USD' : 'HTG',
        startDate: s.start_date,
        endDate: s.end_date,
        paymentReference: s.payment_reference,
        createdAt: s.created_at,
      }));
      return { pendingSubscriptions: mapped };
    } catch (err: any) {
      console.warn('getAllPending error:', err);
      return { pendingSubscriptions: [] };
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, user:users!user_id(id, first_name, last_name, email, avatar)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        userName: s.user ? `${s.user.first_name || ''} ${s.user.last_name || ''}`.trim() : '',
        userEmail: s.user?.email || '',
        planId: s.plan_id || '',
        planName: s.plan_name || 'Premium Alèz',
        accessLevel: (s.status === 'active' ? 'premium' : 'free') as any,
        subscriptionStatus: s.status as any,
        paymentMethod: s.payment_method as any,
        durationMonths: s.duration_months || 1,
        amountPaid: Number(s.amount_paid) || 0,
        amountPaidHTG: s.amount_paid_htg ? Number(s.amount_paid_htg) : undefined,
        currency: s.payment_method === 'stripe' ? 'USD' : 'HTG',
        startDate: s.start_date,
        endDate: s.end_date,
        paymentReference: s.payment_reference,
        createdAt: s.created_at,
      }));
      return { subscriptions: mapped };
    } catch (err: any) {
      console.warn('subscriptionsAPI.getAll error:', err);
      return { subscriptions: [] };
    }
  },

  verifyPayment: async (subscriptionId: string, action: 'approve' | 'reject', notes?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Security: Enforce that only an administrator can verify payments
    const { data: callerProfile, error: callerErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (callerErr || (callerProfile?.role !== 'admin' && callerProfile?.role !== 'super_admin')) {
      throw new Error('Unauthorized: Only administrators can approve or reject payments.');
    }

    // Attempt RPC verification first (SECURITY DEFINER server-side)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_admin_verify_payment', {
        p_subscription_id: subscriptionId,
        p_action: action,
        p_notes: notes || null
      });
      if (!rpcError && rpcData) {
        auditLogsAPI.log({
          action: action === 'approve' ? 'payment_approved' : 'payment_rejected',
          actionCategory: 'billing',
          targetType: 'subscription',
          targetId: subscriptionId,
          targetLabel: `Ref: ${subscriptionId}`,
          details: { action, notes: notes || null },
        }).catch(() => {});
        return { subscription: rpcData };
      }
    } catch (rpcEx) {
      console.warn('RPC rpc_admin_verify_payment fallback:', rpcEx);
    }

    // Direct DB update under verified admin session
    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'active' : 'cancelled';

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    const durationMonths = existingSub?.duration_months || 1;
    const startDate = new Date().toISOString();
    const endDate = isApprove
      ? new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : existingSub?.end_date;

    const updateObj: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (isApprove) {
      updateObj.start_date = startDate;
      updateObj.end_date = endDate;
      updateObj.current_period_end = endDate;
    }

    const { data: updatedSub, error } = await supabase
      .from('subscriptions')
      .update(updateObj)
      .eq('id', subscriptionId)
      .select('*, user:users!user_id(id, first_name, last_name, email)')
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Notify user
    const targetUserId = existingSub?.user_id;
    if (targetUserId) {
      await notificationsAPI.create({
        userId: targetUserId,
        title: isApprove ? 'Abonnement Premium Activé ! 🎉' : 'Paiement non confirmé',
        message: isApprove
          ? `Votre paiement par ${existingSub.payment_method?.toUpperCase()} a été vérifié avec succès. Vous bénéficiez désormais d'un accès illimité à toutes les matières pendant ${durationMonths} mois.`
          : `Votre paiement n'a pas pu être validé${notes ? `: ${notes}` : '. Veuillez vérifier le numéro de transaction ou contacter le support.'}`,
        type: isApprove ? 'success' : 'warning',
      });
    }

    // Log audit event
    auditLogsAPI.log({
      action: isApprove ? 'payment_approved' : 'payment_rejected',
      actionCategory: 'billing',
      targetType: 'subscription',
      targetId: subscriptionId,
      targetLabel: `Ref: ${existingSub?.payment_reference || subscriptionId}`,
      details: {
        amount_paid: existingSub?.amount_paid,
        amount_paid_htg: existingSub?.amount_paid_htg,
        payment_method: existingSub?.payment_method,
        user_id: targetUserId,
        notes: notes || null,
      },
    }).catch(() => {});

    return { subscription: updatedSub };
  },
};

// ─── Video Access & Daily Usage API ───────────────────────────────────────────

export const videoAccessAPI = {
  /**
   * Returns current date string formatted as YYYY-MM-DD in user's local timezone.
   * This guarantees midnight resets strictly at local midnight, preventing early rollovers.
   */
  getTodayKey: (date?: Date): string => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * UTC date string for backward-compatibility lookup with database CURRENT_DATE.
   */
  getUtcTodayKey: (date?: Date): string => {
    return (date || new Date()).toISOString().split('T')[0];
  },

  formatSubjectKey: (subjectId: string, courseId?: string): string => {
    const cleanSub = (subjectId || 'general').toLowerCase().trim();
    return courseId ? `${courseId}::${cleanSub}` : cleanSub;
  },

  getStorageKey: (userId: string, subjectId: string, courseId?: string): string => {
    const today = videoAccessAPI.getTodayKey();
    const scopedSubject = videoAccessAPI.formatSubjectKey(subjectId, courseId);
    return `lekol_usage_${userId || 'anon'}_${scopedSubject}_${today}`;
  },

  /**
   * Check if a user currently has an active, unexpired subscription directly from DB.
   */
  isUserPremium: async (userId: string): Promise<boolean> => {
    if (!userId || userId === 'guest') return false;
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Async server-backed access check. Checks DB subscription & server-side daily usage quota.
   * Scoped by courseId when provided so usage in one course does not lock another.
   */
  checkAccessAsync: async (
    user: any,
    subjectId: string,
    limit: number = 1,
    courseId?: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    watched: number;
    limit: number;
    isPremium: boolean;
  }> => {
    // Admin / instructor roles bypass video quotas
    if (user?.role === 'admin' || user?.role === 'instructor') {
      return { allowed: true, remaining: 999, watched: 0, limit, isPremium: true };
    }

    // Database verification of active subscription
    if (user?.id) {
      const isSubActive = await videoAccessAPI.isUserPremium(user.id);
      if (isSubActive) {
        return { allowed: true, remaining: 999, watched: 0, limit, isPremium: true };
      }
    }

    const userId = user?.id;
    const cleanSubject = (subjectId || 'general').toLowerCase().trim();
    const scopedSubject = videoAccessAPI.formatSubjectKey(cleanSubject, courseId);

    // If authenticated, check server RPC or daily_video_usage table
    if (userId) {
      // 1. Try RPC check with exact parameter name
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_check_video_access', {
          p_subject: scopedSubject,
        });
        if (!rpcErr && rpcRes && typeof rpcRes.allowed === 'boolean') {
          return {
            allowed: Boolean(rpcRes.allowed),
            remaining: Number(rpcRes.remaining) || 0,
            watched: Number(rpcRes.watched) || 0,
            limit: Number(rpcRes.limit) || limit,
            isPremium: Boolean(rpcRes.is_premium),
          };
        }
      } catch {
        // Fall through to table query
      }

      // 2. Direct table check on daily_video_usage (check both local date and UTC date)
      try {
        const localToday = videoAccessAPI.getTodayKey();
        const utcToday = videoAccessAPI.getUtcTodayKey();
        const datesToCheck = Array.from(new Set([localToday, utcToday]));
        const subjectsToCheck = courseId ? [scopedSubject] : [cleanSubject];

        const { data: usageRows, error: usageErr } = await supabase
          .from('daily_video_usage')
          .select('views_count, view_count')
          .eq('user_id', userId)
          .in('subject', subjectsToCheck)
          .in('usage_date', datesToCheck);

        if (!usageErr && usageRows && usageRows.length > 0) {
          const watched = usageRows.reduce((max: number, r: any) => Math.max(max, r.views_count || r.view_count || 0), 0);
          return {
            allowed: watched < limit,
            remaining: Math.max(0, limit - watched),
            watched,
            limit,
            isPremium: false,
          };
        }
      } catch {
        // Fall through to local cache
      }
    }

    // Fallback: local usage cache
    const watched = videoAccessAPI.getTodayUsage(userId || 'guest', scopedSubject);
    return {
      allowed: watched < limit,
      remaining: Math.max(0, limit - watched),
      watched,
      limit,
      isPremium: false,
    };
  },

  /**
   * Async server-backed view recorder. Scoped by courseId when provided.
   */
  recordViewAsync: async (userId: string, subjectId: string, courseId?: string): Promise<number> => {
    const cleanSubject = (subjectId || 'general').toLowerCase().trim();
    const scopedSubject = videoAccessAPI.formatSubjectKey(cleanSubject, courseId);
    if (!userId || userId === 'guest') {
      return videoAccessAPI.recordView(userId, cleanSubject, courseId);
    }

    let recordedCount = 0;

    // 1. Try secure RPC with scoped subject parameter
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_record_video_view', {
        p_subject: scopedSubject,
      });
      if (!rpcErr && rpcRes) {
        const count = rpcRes.view_count ?? rpcRes.views_count;
        if (typeof count === 'number') {
          recordedCount = count;
        }
      }
    } catch {
      // Fall through
    }

    // 2. Direct table upsert on daily_video_usage (saves under user's local date)
    try {
      const todayStr = videoAccessAPI.getTodayKey();
      const { data: existing } = await supabase
        .from('daily_video_usage')
        .select('id, views_count, view_count')
        .eq('user_id', userId)
        .eq('subject', scopedSubject)
        .eq('usage_date', todayStr)
        .maybeSingle();

      const existingCount = Math.max(existing?.views_count || 0, existing?.view_count || 0);
      const newCount = Math.max(existingCount + 1, recordedCount || 1);

      const { error: upsertErr } = await supabase
        .from('daily_video_usage')
        .upsert({
          user_id: userId,
          subject: scopedSubject,
          usage_date: todayStr,
          view_count: newCount,
          views_count: newCount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,subject,usage_date' });

      if (!upsertErr) {
        recordedCount = Math.max(recordedCount, newCount);
      }
    } catch {
      // Fall through
    }

    // 3. Always update localStorage across both local and UTC keys to guarantee UI sync
    const localCount = videoAccessAPI.recordView(userId, cleanSubject, courseId);
    return Math.max(recordedCount, localCount);
  },

  getTodayUsageAsync: async (userId: string): Promise<Record<string, number>> => {
    if (!userId) return {};
    try {
      const localToday = videoAccessAPI.getTodayKey();
      const utcToday = videoAccessAPI.getUtcTodayKey();
      const datesToQuery = Array.from(new Set([localToday, utcToday]));

      const { data, error } = await supabase
        .from('daily_video_usage')
        .select('subject, views_count, view_count, usage_date')
        .eq('user_id', userId)
        .in('usage_date', datesToQuery);

      const result: Record<string, number> = {};
      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const sub = (row.subject || '').toLowerCase().trim();
          const count = Number(row.views_count ?? row.view_count) || 0;
          result[sub] = Math.max(result[sub] || 0, count);
        });
      }

      // Merge with local storage usage as well
      const localUsage = videoAccessAPI.getTodayUsage(userId);
      for (const [sub, cnt] of Object.entries(localUsage)) {
        result[sub] = Math.max(result[sub] || 0, Number(cnt) || 0);
      }

      return result;
    } catch {
      return videoAccessAPI.getTodayUsage(userId);
    }
  },

  getTodayUsage: (userId: string, subjectId?: string): any => {
    try {
      const localToday = videoAccessAPI.getTodayKey();
      const utcToday = videoAccessAPI.getUtcTodayKey();
      const validDates = [localToday, utcToday];

      if (subjectId) {
        const cleanSub = (subjectId || 'general').toLowerCase().trim();
        let maxVal = 0;
        for (const d of validDates) {
          const key = `lekol_usage_${userId || 'anon'}_${cleanSub}_${d}`;
          const val = localStorage.getItem(key);
          if (val) {
            maxVal = Math.max(maxVal, parseInt(val, 10) || 0);
          }
        }
        return maxVal;
      }

      const prefix = `lekol_usage_${userId || 'anon'}_`;
      const result: Record<string, number> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          for (const d of validDates) {
            if (key.endsWith(`_${d}`)) {
              const subject = key.substring(prefix.length, key.length - d.length - 1);
              const val = localStorage.getItem(key);
              const count = val ? parseInt(val, 10) || 0 : 0;
              result[subject] = Math.max(result[subject] || 0, count);
            }
          }
        }
      }
      return result;
    } catch {
      return subjectId ? 0 : {};
    }
  },

  checkAccess: (
    user: any,
    subjectId: string,
    limit: number = 1
  ): {
    allowed: boolean;
    remaining: number;
    watched: number;
    limit: number;
    isPremium: boolean;
  } => {
    const isPremium =
      user?.role === 'admin' ||
      user?.role === 'instructor' ||
      user?.accessLevel === 'premium' ||
      user?.subscriptionStatus === 'active';

    if (isPremium) {
      return { allowed: true, remaining: 999, watched: 0, limit, isPremium: true };
    }

    const userId = user?.id || 'guest';
    const watched = videoAccessAPI.getTodayUsage(userId, subjectId);
    const remaining = Math.max(0, limit - watched);
    const allowed = watched < limit;

    return { allowed, remaining, watched, limit, isPremium: false };
  },

  recordView: (userId: string, subjectId: string, courseId?: string): number => {
    try {
      const cleanSubject = (subjectId || 'general').toLowerCase().trim();
      const scopedSubject = videoAccessAPI.formatSubjectKey(cleanSubject, courseId);
      const current = videoAccessAPI.getTodayUsage(userId, scopedSubject);
      const updated = current + 1;

      // Save under both local date and UTC date to bridge midnight cleanly
      const localToday = videoAccessAPI.getTodayKey();
      const utcToday = videoAccessAPI.getUtcTodayKey();
      localStorage.setItem(`lekol_usage_${userId || 'anon'}_${scopedSubject}_${localToday}`, String(updated));
      localStorage.setItem(`lekol_usage_${userId || 'anon'}_${scopedSubject}_${utcToday}`, String(updated));
      return updated;
    } catch {
      return 1;
    }
  },
};

// ─── Monitoring & Renewal Alerts API ──────────────────────────────────────────

export const monitoringAPI = {
  checkExpiringSubscriptions: async (
    user: any,
    onNotify?: (title: string, message: string) => void
  ) => {
    if (!user || user.role === 'admin' || user.role === 'instructor') return;

    try {
      const subInfo = await subscriptionsAPI.getCurrent(user.id);
      if (subInfo.subscriptionStatus === 'active' && subInfo.daysRemaining <= 10 && subInfo.daysRemaining > 0) {
        const notifyKey = `renewal_notified_${user.id}_${subInfo.subscription?.id}_${videoAccessAPI.getTodayKey()}`;
        if (!localStorage.getItem(notifyKey)) {
          localStorage.setItem(notifyKey, 'true');
          const title = `Votre abonnement Premium expire dans ${subInfo.daysRemaining} jour${subInfo.daysRemaining > 1 ? 's' : ''}`;
          const message = `Renouvelez votre abonnement dès maintenant pour continuer à profiter de l'accès illimité sans interruption.`;
          if (onNotify) {
            onNotify(title, message);
          }
          await notificationsAPI.create({
            userId: user.id,
            title,
            message,
            type: 'warning',
          });
        }
      }
    } catch (err) {
      console.warn('checkExpiringSubscriptions error:', err);
    }
  },
};

// ─── Admin API ─────────────────────────────────────────────────────────────────

export const adminAPI = {
  inviteAdmin: async (email: string): Promise<{
    message: string;
    user?: any;
    email?: string;
    inviteLink?: string;
  }> => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.role === 'admin') {
        throw new Error('User is already an admin');
      }

      // Promote to admin
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', existingUser.id);

      if (error) throw new Error(error.message);

      // Notify
      await supabase.from('notifications').insert({
        user_id: existingUser.id,
        title: 'Admin Access Granted',
        message: 'You have been granted administrator privileges.',
        type: 'system',
      });

      return {
        message: 'Existing user has been promoted to admin',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: `${existingUser.first_name} ${existingUser.last_name}`,
          role: 'admin',
        },
      };
    }

    // User doesn't exist — return info so admin can tell them to sign up
    return {
      message:
        'No account found with that email. Ask them to register first, then promote them.',
      email,
    };
  },

  getUsers: async (params?: {
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (params?.role) query = query.eq('role', params.role);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const users = (data || []).map((u: any) => ({
      _id: u.id,
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      fullName: `${u.first_name} ${u.last_name}`,
      role: u.role,
      avatar: u.avatar,
      isActive: u.is_active,
      createdAt: u.created_at,
      lastLogin: u.last_login,
    }));

    return {
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  },

  updateUserRole: async (userId: string, role: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Security: Only an administrator or super_admin can update user roles
    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    const isSuperAdmin = callerProfile?.role === 'super_admin';
    const isAdmin = callerProfile?.role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      throw new Error('Unauthorized: Only administrators can modify user roles.');
    }

    if (!['student', 'instructor', 'admin', 'super_admin'].includes(role))
      throw new Error('Invalid role');

    // Fetch target user to check permissions
    const { data: targetProfile } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (!targetProfile) throw new Error('User not found');

    // A standard admin cannot modify a super_admin
    if (targetProfile.role === 'super_admin' && !isSuperAdmin) {
      throw new Error('Unauthorized: Seul un Super Admin peut modifier un compte Super Admin.');
    }

    // Only a super_admin can assign the admin or super_admin role
    if ((role === 'admin' || role === 'super_admin') && !isSuperAdmin) {
      throw new Error('Unauthorized: Seul un Super Admin peut accorder des privilèges d\'administration.');
    }

    if (userId === authUser.id && role !== callerProfile?.role)
      throw new Error('Cannot change your own role');

    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Role Updated',
      message: `Your role has been changed to ${role}.`,
      type: 'system',
    });

    // Log audit event
    auditLogsAPI.log({
      action: 'role_changed',
      actionCategory: 'users',
      targetType: 'user',
      targetId: userId,
      targetLabel: targetProfile.email,
      details: {
        target_name: `${targetProfile.first_name || ''} ${targetProfile.last_name || ''}`.trim(),
        old_role: targetProfile.role,
        new_role: role,
      },
    }).catch(() => {});

    return {
      user: {
        _id: data.id,
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        fullName: `${data.first_name} ${data.last_name}`,
        role: data.role,
        avatar: data.avatar,
      },
    };
  },

  deleteUser: async (userId: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    const isSuperAdmin = callerProfile?.role === 'super_admin';
    const isAdmin = callerProfile?.role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      throw new Error('Unauthorized: Only administrators can delete users.');
    }

    if (userId === authUser.id)
      throw new Error('Cannot delete your own account');

    const { data: targetProfile } = await supabase
      .from('users')
      .select('email, first_name, last_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (targetProfile?.role === 'super_admin' && !isSuperAdmin) {
      throw new Error('Unauthorized: Impossible de supprimer un compte Super Admin.');
    }

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw new Error(error.message);

    // Log audit event
    auditLogsAPI.log({
      action: 'user_deleted',
      actionCategory: 'users',
      targetType: 'user',
      targetId: userId,
      targetLabel: targetProfile?.email || userId,
      details: {
        deleted_role: targetProfile?.role,
        deleted_name: `${targetProfile?.first_name || ''} ${targetProfile?.last_name || ''}`.trim(),
      },
    }).catch(() => {});

    return { message: 'User deleted successfully' };
  },

  getStats: async () => {
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalInstructors },
      { count: totalAdmins },
      { count: totalSuperAdmins },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin'),
    ]);

    // Get recent users
    const { data: recentUsersRaw } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentUsers = (recentUsersRaw || []).map((u: any) => ({
      _id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      fullName: `${u.first_name} ${u.last_name}`,
      role: u.role,
      createdAt: u.created_at,
    }));

    return {
      stats: {
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalInstructors: totalInstructors || 0,
        totalAdmins: totalAdmins || 0,
      },
      recentUsers,
    };
  },

  getDashboardAnalytics: async () => {
    const client = supabaseAdmin || supabase;
    const now = new Date();
    
    // Dates for current month and previous month comparison
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    const [
      { data: users, error: uErr },
      { data: courses, error: cErr },
      { data: enrollments, error: eErr },
      { data: subscriptions, error: sErr },
    ] = await Promise.all([
      client.from('users').select('id, role, created_at'),
      client.from('courses').select('id, is_published, created_at'),
      client.from('enrollments').select('id, progress, status, completed_at, enrolled_at, created_at'),
      client.from('subscriptions').select('id, status, amount_paid, amount_paid_htg, created_at'),
    ]);

    if (uErr) console.warn('getDashboardAnalytics users error:', uErr.message);
    if (cErr) console.warn('getDashboardAnalytics courses error:', cErr.message);
    if (eErr) console.warn('getDashboardAnalytics enrollments error:', eErr.message);
    if (sErr) console.warn('getDashboardAnalytics subscriptions error:', sErr.message);

    const userList = users || [];
    const courseList = courses || [];
    const enrollmentList = enrollments || [];
    const subList = subscriptions || [];

    // 1. Total Students
    const studentList = userList.filter((u: any) => u.role === 'student');
    // If studentList is 0 but there are users, show non-admin users or total student count
    const totalStudents = studentList.length > 0 ? studentList.length : userList.filter((u: any) => u.role !== 'admin').length;
    const studentsThisMonth = studentList.filter((u: any) => u.created_at && u.created_at >= firstDayThisMonth).length;
    const studentsLastMonth = studentList.filter((u: any) => u.created_at && u.created_at >= firstDayLastMonth && u.created_at <= lastDayLastMonth).length;
    const studentGrowth = studentsLastMonth > 0
      ? Math.round(((studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100)
      : (studentsThisMonth > 0 ? 100 : 0);

    // 2. Active Courses
    const activeCourses = courseList.filter((c: any) => c.is_published !== false).length;
    const coursesThisMonth = courseList.filter((c: any) => c.created_at && c.created_at >= firstDayThisMonth).length;
    const coursesLastMonth = courseList.filter((c: any) => c.created_at && c.created_at >= firstDayLastMonth && c.created_at <= lastDayLastMonth).length;
    const coursesGrowth = coursesLastMonth > 0
      ? Math.round(((coursesThisMonth - coursesLastMonth) / coursesLastMonth) * 100)
      : (coursesThisMonth > 0 ? 100 : 0);

    // 3. Course Completion
    const totalEnrollments = enrollmentList.length;
    const completedEnrollments = enrollmentList.filter((e: any) => 
      (e.progress && Number(e.progress) >= 100) || e.status === 'completed' || Boolean(e.completed_at)
    ).length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    
    // Enrollments growth
    const enrollmentsThisMonth = enrollmentList.filter((e: any) => (e.enrolled_at || e.created_at) >= firstDayThisMonth).length;
    const enrollmentsLastMonth = enrollmentList.filter((e: any) => {
      const d = e.enrolled_at || e.created_at;
      return d && d >= firstDayLastMonth && d <= lastDayLastMonth;
    }).length;
    const enrollmentsGrowth = enrollmentsLastMonth > 0
      ? Math.round(((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100)
      : (enrollmentsThisMonth > 0 ? 100 : 0);

    // 4. Revenue
    const validSubs = subList.filter((s: any) => s.status === 'active' || s.status === 'approved' || (s.amount_paid && Number(s.amount_paid) > 0));
    const totalRevenue = validSubs.reduce((acc: number, s: any) => acc + (Number(s.amount_paid) || 0), 0);
    const revenueThisMonth = validSubs
      .filter((s: any) => s.created_at && s.created_at >= firstDayThisMonth)
      .reduce((acc: number, s: any) => acc + (Number(s.amount_paid) || 0), 0);
    const revenueLastMonth = validSubs
      .filter((s: any) => s.created_at && s.created_at >= firstDayLastMonth && s.created_at <= lastDayLastMonth)
      .reduce((acc: number, s: any) => acc + (Number(s.amount_paid) || 0), 0);
    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : (revenueThisMonth > 0 ? 100 : 0);

    // 5. Activity Overview & Enrollment Trends (Past 7 Days: Sunday to Saturday or trailing 7 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const past7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
      
      const dayName = dayNames[d.getDay()];
      const dayStudents = userList.filter((u: any) => u.created_at && u.created_at >= dayStart && u.created_at <= dayEnd).length;
      const dayEnrollments = enrollmentList.filter((e: any) => {
        const dateStr = e.enrolled_at || e.created_at;
        return dateStr && dateStr >= dayStart && dateStr <= dayEnd;
      }).length;
      
      past7DaysData.push({
        name: dayName,
        date: d.toISOString().split('T')[0],
        students: dayStudents,
        courses: dayEnrollments,
      });
    }

    return {
      stats: {
        totalStudents,
        studentGrowth,
        isStudentGrowthPositive: studentGrowth >= 0,
        activeCourses,
        coursesGrowth,
        isCoursesGrowthPositive: coursesGrowth >= 0,
        completionRate,
        enrollmentsGrowth,
        isEnrollmentsGrowthPositive: enrollmentsGrowth >= 0,
        totalRevenue,
        revenueGrowth,
        isRevenueGrowthPositive: revenueGrowth >= 0,
      },
      activityChart: past7DaysData,
    };
  },

  /**
   * Fetch all password reset requests (pending and resolved) for admin monitoring.
   */
  getPasswordResetRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*, user:users!user_id(id, first_name, last_name, email, avatar)')
        .order('requested_at', { ascending: false });

      if (error) {
        console.warn('getPasswordResetRequests notice:', error.message);
        return { requests: [] };
      }

      return { requests: data || [] };
    } catch (err) {
      console.warn('getPasswordResetRequests error:', err);
      return { requests: [] };
    }
  },

  /**
   * Send a password reset email to a user from the Admin dashboard.
   */
  sendPasswordResetEmail: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) throw new Error(error.message);

    // Log audit event
    auditLogsAPI.log({
      action: 'password_reset_email_sent',
      actionCategory: 'users',
      targetType: 'user',
      targetId: cleanEmail,
      targetLabel: cleanEmail,
      details: { email: cleanEmail },
    }).catch(() => {});

    // Also update any pending reset request notes
    try {
      await supabase
        .from('password_reset_requests')
        .update({
          notes: 'Lien de réinitialisation renvoyé par l’administrateur',
          resolved_at: new Date().toISOString(),
        })
        .eq('email', cleanEmail)
        .eq('status', 'pending');
    } catch (e) {
      console.warn('Could not update reset request status:', e);
    }

    return { success: true, message: 'E-mail de réinitialisation envoyé avec succès.' };
  },

  /**
   * Directly change a user's password in the database (auth.users) via secure PostgreSQL RPC.
   */
  changeUserPasswordDirect: async (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }

    const { data, error } = await supabase.rpc('rpc_admin_change_user_password', {
      target_user_id: userId,
      new_password: newPassword,
    });

    if (error) throw new Error(error.message);

    // Log audit event
    auditLogsAPI.log({
      action: 'password_reset_direct',
      actionCategory: 'users',
      targetType: 'user',
      targetId: userId,
      targetLabel: `ID: ${userId}`,
      details: { user_id: userId, changed_by: 'admin_direct' },
    }).catch(() => {});

    return data;
  },

  /**
   * Manually mark a password reset request as resolved or dismissed.
   */
  resolveResetRequest: async (requestId: string, notes?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('password_reset_requests')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: authUser?.id || null,
        notes: notes || 'Marqué comme résolu par l’administrateur',
      })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ─── Auth Helpers ──────────────────────────────────────────────────────────────
// These maintain the same external API as before, but now backed by Supabase session

/**
 * Store auth data. With Supabase Auth, the session is managed automatically.
 * We just persist user profile to localStorage for quick access.
 */
export const setAuthData = (_token: string, user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = async () => {
  localStorage.removeItem('user');
  await supabase.auth.signOut();
};

export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default {
  auth: authAPI,
  courses: coursesAPI,
  enrollments: enrollmentsAPI,
  notifications: notificationsAPI,
  admin: adminAPI,
  subscriptions: subscriptionsAPI,
  videoAccess: videoAccessAPI,
  monitoring: monitoringAPI,
  siteContent: siteContentAPI,
  auditLogs: auditLogsAPI,
};
