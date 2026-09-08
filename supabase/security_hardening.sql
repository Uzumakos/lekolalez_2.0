-- ==============================================================================
-- LEKÒL ALÈZ — COMPLETE DATABASE HARDENING & ROW LEVEL SECURITY (RLS) MIGRATION
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DAILY VIDEO USAGE TABLE (Server-side tracking for free daily quotas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_video_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject, usage_date)
);

ALTER TABLE IF EXISTS public.daily_video_usage ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS public.daily_video_usage ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.daily_video_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own video usage." ON public.daily_video_usage;
CREATE POLICY "Users can view own video usage."
  ON public.daily_video_usage FOR SELECT
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Allow authenticated users to insert and update their own daily video usage
DROP POLICY IF EXISTS "Deny direct client insert on daily_video_usage" ON public.daily_video_usage;
DROP POLICY IF EXISTS "Users can insert own video usage" ON public.daily_video_usage;
CREATE POLICY "Users can insert own video usage"
  ON public.daily_video_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Deny direct client update on daily_video_usage" ON public.daily_video_usage;
DROP POLICY IF EXISTS "Users can update own video usage" ON public.daily_video_usage;
CREATE POLICY "Users can update own video usage"
  ON public.daily_video_usage FOR UPDATE
  USING (user_id = auth.uid());


-- ==============================================================================
-- 2. USERS TABLE SECURITY HARDENING & ANTI-PRIVILEGE ESCALATION
-- ==============================================================================
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Trigger to prevent regular users from elevating role to admin or instructor
CREATE OR REPLACE FUNCTION public.protect_user_role_escalation()
RETURNS trigger AS $$
BEGIN
  -- If role is changing
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only existing admins can change user roles
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your own role or assign administrative privileges.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_user_role ON public.users;
CREATE TRIGGER trg_protect_user_role
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_role_escalation();

-- Secure handle_new_user trigger: NEVER trusts raw_user_meta_data->>'role'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    preferred_language,
    password
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Student'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    -- ALWAYS set 'student' by default. Admins must be explicitly promoted by existing admin or initial setup.
    'student',
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
    '**managed_by_supabase_auth**'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
    -- NEVER update role from conflict insert
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Only admins can delete users." ON public.users;
CREATE POLICY "Only admins can delete users." 
  ON public.users FOR DELETE 
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.role() = 'anon');


-- ==============================================================================
-- 3. SUBSCRIPTIONS TABLE HARDENING (NO CLIENT-SIDE 'active' INJECTION)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(100),
  plan_name VARCHAR(100) DEFAULT 'Premium Alèz',
  duration_months INTEGER DEFAULT 1,
  amount_paid NUMERIC DEFAULT 0,
  amount_paid_htg NUMERIC,
  payment_method VARCHAR(50) DEFAULT 'moncash',
  payment_reference VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all necessary columns exist if table already existed with older schema
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_id VARCHAR(100);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) DEFAULT 'Premium Alèz';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount_paid_htg NUMERIC;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'moncash';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_verification';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on payment_reference if present to prevent replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_payment_reference 
  ON public.subscriptions(payment_reference) 
  WHERE payment_reference IS NOT NULL AND payment_reference != '';

DROP POLICY IF EXISTS "Users can view own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions." 
  ON public.subscriptions FOR SELECT 
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Users can only insert pending_verification subscriptions (for manual payments)
-- Normal users can NEVER directly insert status = 'active'
DROP POLICY IF EXISTS "Users can insert own subscriptions or registration." ON public.subscriptions;
DROP POLICY IF EXISTS "Users can submit pending subscriptions." ON public.subscriptions;
CREATE POLICY "Users can submit pending subscriptions." 
  ON public.subscriptions FOR INSERT 
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending_verification')
    OR ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  );

-- Only admins can update subscriptions (approving/rejecting/modifying period)
DROP POLICY IF EXISTS "Admins can update subscriptions." ON public.subscriptions;
CREATE POLICY "Admins can update subscriptions." 
  ON public.subscriptions FOR UPDATE 
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- ==============================================================================
-- 4. COURSES TABLE SECURITY HARDENING
-- ==============================================================================
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS instructor_id UUID;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published courses are viewable by everyone." ON public.courses;
CREATE POLICY "Published courses are viewable by everyone." 
  ON public.courses FOR SELECT 
  USING (
    is_published = true 
    OR status = 'published' 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

DROP POLICY IF EXISTS "Instructors can create courses." ON public.courses;
CREATE POLICY "Instructors can create courses." 
  ON public.courses FOR INSERT 
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('instructor', 'admin'));

DROP POLICY IF EXISTS "Instructors can update own courses." ON public.courses;
CREATE POLICY "Instructors can update own courses." 
  ON public.courses FOR UPDATE 
  USING (instructor_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Instructors can delete own courses." ON public.courses;
CREATE POLICY "Instructors can delete own courses." 
  ON public.courses FOR DELETE 
  USING (instructor_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- ==============================================================================
-- 5. ENROLLMENTS & LESSON PROGRESS
-- ==============================================================================
ALTER TABLE IF EXISTS public.enrollments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments." ON public.enrollments;
CREATE POLICY "Users can view own enrollments." 
  ON public.enrollments FOR SELECT 
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can create own enrollments." ON public.enrollments;
CREATE POLICY "Users can create own enrollments." 
  ON public.enrollments FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own enrollments." ON public.enrollments;
CREATE POLICY "Users can update own enrollments." 
  ON public.enrollments FOR UPDATE 
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

ALTER TABLE IF EXISTS public.lesson_progress ADD COLUMN IF NOT EXISTS enrollment_id UUID;
ALTER TABLE IF EXISTS public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lesson progress." ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress." 
  ON public.lesson_progress FOR SELECT 
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own lesson progress." ON public.lesson_progress;
CREATE POLICY "Users can insert own lesson progress." 
  ON public.lesson_progress FOR INSERT 
  WITH CHECK (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own lesson progress." ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress." 
  ON public.lesson_progress FOR UPDATE 
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE user_id = auth.uid()));


-- ==============================================================================
-- 6. SITE CONTENT TABLE HARDENING
-- ==============================================================================
ALTER TABLE IF EXISTS public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site content viewable by everyone." ON public.site_content;
CREATE POLICY "Site content viewable by everyone." 
  ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify site content." ON public.site_content;
CREATE POLICY "Only admins can modify site content." 
  ON public.site_content FOR ALL 
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- ==============================================================================
-- 7. SECURE RPC FUNCTIONS (SECURITY DEFINER WITH STRICT PERMISSIONS)
-- ==============================================================================

-- A. Server-Side Video Quota & Premium Check
CREATE OR REPLACE FUNCTION public.rpc_check_video_access(p_subject TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_role TEXT;
  v_is_premium BOOLEAN := false;
  v_limit INTEGER := 1;
  v_watched INTEGER := 0;
  v_remaining INTEGER := 1;
  v_clean_subject TEXT := LOWER(TRIM(COALESCE(p_subject, 'general')));
  v_content_rec RECORD;
BEGIN
  -- 1. Unauthenticated users cannot view video lessons without an account
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'is_premium', false,
      'remaining', 0,
      'watched', 0,
      'limit', 1,
      'reason', 'auth_required'
    );
  END IF;

  -- 2. Fetch user role
  SELECT role INTO v_user_role FROM public.users WHERE id = v_user_id;

  -- Admin & Instructor have unlimited access
  IF v_user_role IN ('admin', 'instructor') THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'is_premium', true,
      'remaining', 999,
      'watched', 0,
      'limit', 999,
      'reason', 'staff_access'
    );
  END IF;

  -- 3. Check active verified subscription in DB
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW())
  ) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'is_premium', true,
      'remaining', 999,
      'watched', 0,
      'limit', 999,
      'reason', 'premium_subscription'
    );
  END IF;

  -- 4. Free Tier Quota Calculation from site_content
  BEGIN
    SELECT COALESCE((pricing->'freeAccess'->>'videosPerSubjectPerDay')::INTEGER, 1) INTO v_limit
    FROM public.site_content WHERE key = 'main';
    IF v_limit IS NULL OR v_limit <= 0 THEN
      v_limit := 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_limit := 1;
  END;

  -- 5. Query daily_video_usage for today (using local/Haiti timezone date)
  SELECT COALESCE(view_count, views_count, 0) INTO v_watched
  FROM public.daily_video_usage
  WHERE user_id = v_user_id
    AND subject = v_clean_subject
    AND (usage_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Port-au-Prince')::DATE OR usage_date = CURRENT_DATE);

  v_remaining := GREATEST(0, v_limit - v_watched);

  RETURN jsonb_build_object(
    'allowed', v_watched < v_limit,
    'is_premium', false,
    'remaining', v_remaining,
    'watched', v_watched,
    'limit', v_limit,
    'reason', CASE WHEN v_watched < v_limit THEN 'quota_available' ELSE 'quota_exceeded' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- B. Server-Side Atomic Record Video View
CREATE OR REPLACE FUNCTION public.rpc_record_video_view(p_subject TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_check JSONB;
  v_clean_subject TEXT := LOWER(TRIM(COALESCE(p_subject, 'general')));
  v_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Port-au-Prince')::DATE;
  v_new_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record video view';
  END IF;

  -- Verify access first
  v_check := public.rpc_check_video_access(p_subject);
  
  -- If premium/staff, no need to increment daily free quota
  IF (v_check->>'is_premium')::BOOLEAN THEN
    RETURN jsonb_build_object('success', true, 'is_premium', true, 'view_count', 0);
  END IF;

  IF NOT (v_check->>'allowed')::BOOLEAN THEN
    RAISE EXCEPTION 'Daily free video quota exceeded for this subject';
  END IF;

  -- Atomically upsert today's view count
  INSERT INTO public.daily_video_usage (user_id, subject, usage_date, view_count, views_count, updated_at)
  VALUES (v_user_id, v_clean_subject, v_today, 1, 1, NOW())
  ON CONFLICT (user_id, subject, usage_date)
  DO UPDATE SET
    view_count = public.daily_video_usage.view_count + 1,
    views_count = COALESCE(public.daily_video_usage.views_count, 0) + 1,
    updated_at = NOW()
  RETURNING view_count INTO v_new_count;

  RETURN jsonb_build_object(
    'success', true,
    'is_premium', false,
    'view_count', v_new_count,
    'views_count', v_new_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 8. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info';
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
CREATE POLICY "Users can view own notifications."
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
CREATE POLICY "Users can update own notifications."
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Anyone can insert notifications." ON public.notifications;
CREATE POLICY "Anyone can insert notifications."
  ON public.notifications FOR INSERT
  WITH CHECK (true);


-- C. Server-Side Secure Payment Approval / Rejection (Admins Only)
CREATE OR REPLACE FUNCTION public.rpc_admin_verify_payment(
  p_subscription_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_role TEXT;
  v_sub RECORD;
  v_duration_months INTEGER;
  v_new_status TEXT;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- 1. Strictly verify caller is admin
  SELECT role INTO v_admin_role FROM public.users WHERE id = v_admin_id;
  IF v_admin_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only platform administrators can verify payments.';
  END IF;

  -- 2. Fetch existing subscription
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription record not found.';
  END IF;

  IF p_action = 'approve' THEN
    v_new_status := 'active';
    v_duration_months := COALESCE(v_sub.duration_months, 1);
    -- Calculate end_date securely on server from approval time
    v_end_date := NOW() + (v_duration_months * INTERVAL '30 days');
  ELSIF p_action = 'reject' THEN
    v_new_status := 'rejected';
    v_end_date := v_sub.end_date;
  ELSE
    RAISE EXCEPTION 'Invalid action: must be approve or reject';
  END IF;

  -- 3. Update subscription
  UPDATE public.subscriptions
  SET
    status = v_new_status,
    start_date = CASE WHEN p_action = 'approve' THEN NOW() ELSE start_date END,
    end_date = v_end_date,
    current_period_end = v_end_date,
    updated_at = NOW()
  WHERE id = p_subscription_id;

  -- 4. Send notification to student
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_sub.user_id,
    CASE WHEN p_action = 'approve' THEN 'Paiement Approuvé ! 🎉' ELSE 'Paiement Non Validé' END,
    CASE 
      WHEN p_action = 'approve' THEN 'Votre abonnement ' || COALESCE(v_sub.plan_name, 'Premium') || ' est désormais actif.'
      ELSE 'Votre référence de paiement n''a pas pu être validée. ' || COALESCE(p_notes, 'Veuillez contacter le support.')
    END,
    CASE WHEN p_action = 'approve' THEN 'success' ELSE 'error' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'status', v_new_status,
    'end_date', v_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 9. PASSWORD RESET REQUESTS & ADMIN PASSWORD MANAGEMENT
-- ==============================================================================

-- Enable pgcrypto if not already enabled (for bcrypt hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table to log password reset requests so Admins can see and audit them
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'cancelled'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_email ON public.password_reset_requests(email);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_status ON public.password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_user ON public.password_reset_requests(user_id);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated users requesting a reset) to insert requests
DROP POLICY IF EXISTS "Anyone can create password reset requests" ON public.password_reset_requests;
CREATE POLICY "Anyone can create password reset requests"
  ON public.password_reset_requests FOR INSERT
  WITH CHECK (true);

-- Only Admins can view password reset requests
DROP POLICY IF EXISTS "Admins can view password reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can view password reset requests"
  ON public.password_reset_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- Only Admins can update password reset requests (resolve them)
DROP POLICY IF EXISTS "Admins can update password reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can update password reset requests"
  ON public.password_reset_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- RPC: Admin Directly Changes a User Password in auth.users and marks pending requests resolved
CREATE OR REPLACE FUNCTION public.rpc_admin_change_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  target_user RECORD;
BEGIN
  -- 1. Check if caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Check if caller is admin
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change user passwords.';
  END IF;

  -- 3. Check password length
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Le mot de passe doit contenir au moins 6 caractères.';
  END IF;

  -- 4. Check if target user exists in auth.users
  SELECT id, email INTO target_user FROM auth.users WHERE id = target_user_id;
  IF target_user.id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable.';
  END IF;

  -- 5. Update auth.users encrypted password with bcrypt hash
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- 6. Update public.users updated_at
  UPDATE public.users
  SET updated_at = NOW()
  WHERE id = target_user_id;

  -- 7. Mark any pending password reset requests for this user or email as resolved
  UPDATE public.password_reset_requests
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    notes = 'Mot de passe modifié manuellement par administrateur'
  WHERE (user_id = target_user_id OR email = target_user.email) AND status = 'pending';

  -- 8. Create a system notification for the user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    target_user_id,
    'Mot de passe mis à jour',
    'Votre mot de passe a été modifié par un administrateur.',
    'system'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mot de passe mis à jour avec succès.',
    'user_id', target_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_change_user_password(UUID, TEXT) TO authenticated;

