-- ==============================================================================
-- LEKÒL ALÈZ — AUDIT LOGS & SUPER ADMIN SCHEMA MIGRATION
-- ==============================================================================

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(50) NOT NULL DEFAULT 'student',
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50) NOT NULL DEFAULT 'system',
  target_type VARCHAR(50),
  target_id TEXT,
  target_label TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance sorting and filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(action_category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. READ POLICY: Only users with role = 'super_admin' can view audit logs
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 2. INSERT POLICY: Allow authenticated clients or triggers to insert
DROP POLICY IF EXISTS "Allow authenticated to insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated to insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- 3. IMMUTABILITY: Disallow updates and deletions to preserve audit trail integrity
DROP POLICY IF EXISTS "Deny update on audit_logs" ON public.audit_logs;
CREATE POLICY "Deny update on audit_logs"
  ON public.audit_logs FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Deny delete on audit_logs" ON public.audit_logs;
CREATE POLICY "Deny delete on audit_logs"
  ON public.audit_logs FOR DELETE
  USING (false);


-- ==============================================================================
-- 2. SECURE LOGGING RPC FUNCTION (SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action VARCHAR(100),
  p_action_category VARCHAR(50),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_target_label TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email VARCHAR(255);
  v_user_name VARCHAR(255);
  v_user_role VARCHAR(50);
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT 
      email, 
      COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email), 
      COALESCE(role, 'student')
    INTO 
      v_user_email, 
      v_user_name, 
      v_user_role
    FROM public.users 
    WHERE id = v_user_id;
  ELSE
    v_user_email := COALESCE(p_details->>'email', 'anonymous@system');
    v_user_name := COALESCE(p_details->>'name', 'Invité / Système');
    v_user_role := 'anonymous';
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_name,
    user_role,
    action,
    action_category,
    target_type,
    target_id,
    target_label,
    details,
    created_at
  )
  VALUES (
    v_user_id,
    COALESCE(v_user_email, 'unknown'),
    COALESCE(v_user_name, 'Utilisateur'),
    COALESCE(v_user_role, 'student'),
    p_action,
    p_action_category,
    p_target_type,
    p_target_id,
    p_target_label,
    COALESCE(p_details, '{}'::jsonb),
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 3. ONE-TIME INITIAL SUPER ADMIN CREATION / PROMOTION RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.rpc_setup_initial_super_admin(
  target_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_has_super_admin BOOLEAN;
  v_target UUID;
  v_target_email TEXT;
BEGIN
  v_caller_id := auth.uid();

  -- 1. Strictly verify if a super_admin already exists
  SELECT EXISTS(SELECT 1 FROM public.users WHERE role = 'super_admin') INTO v_has_super_admin;
  IF v_has_super_admin THEN
    RAISE EXCEPTION 'Un Super Administrateur est déjà configuré sur la plateforme. Cette initialisation est à usage unique.';
  END IF;

  -- 2. Determine target user ID
  v_target := COALESCE(target_user_id, v_caller_id);
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Aucun identifiant utilisateur spécifié pour l''initialisation du Super Admin.';
  END IF;

  -- 3. Fetch target user
  SELECT email INTO v_target_email FROM public.users WHERE id = v_target;
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible introuvable.';
  END IF;

  -- 4. Promote to super_admin
  UPDATE public.users
  SET role = 'super_admin', updated_at = NOW()
  WHERE id = v_target;

  -- 5. Record this momentous event in audit_logs
  PERFORM public.log_audit_event(
    'super_admin_initialized',
    'system',
    'user',
    v_target::TEXT,
    v_target_email,
    jsonb_build_object(
      'promoted_user_id', v_target,
      'promoted_email', v_target_email,
      'method', 'portal_one_time_setup'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Félicitations ! Le rôle Super Admin a été activé avec succès.',
    'userId', v_target,
    'email', v_target_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 4. UPDATE ROLE ESCALATION PROTECTION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_user_role_escalation()
RETURNS trigger AS $$
DECLARE
  v_caller_role VARCHAR(50);
BEGIN
  -- If role is changing
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Fetch caller role if authenticated
    SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();

    -- Protect existing super_admin from demotion by non-super_admins
    IF OLD.role = 'super_admin' AND (v_caller_role IS NULL OR v_caller_role <> 'super_admin') THEN
      RAISE EXCEPTION 'Accès Refusé : Seul un Super Admin peut modifier le compte d''un Super Admin.';
    END IF;

    -- If elevating to super_admin, verify caller is super_admin OR no super_admin exists yet
    IF NEW.role = 'super_admin' THEN
      IF (v_caller_role IS NULL OR v_caller_role <> 'super_admin') AND EXISTS (SELECT 1 FROM public.users WHERE role = 'super_admin') THEN
        RAISE EXCEPTION 'Accès Refusé : Seul un Super Admin peut promouvoir un autre Super Admin.';
      END IF;
    END IF;

    -- If elevating to admin, caller must be admin or super_admin
    IF NEW.role = 'admin' AND (v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'super_admin')) THEN
      RAISE EXCEPTION 'Accès Refusé : Privilèges administratifs requis pour nommer un administrateur.';
    END IF;

    -- Regular users cannot modify roles
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Accès Refusé : Vous ne pouvez pas modifier votre propre rôle ou celui d''autrui.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trg_protect_user_role ON public.users;
CREATE TRIGGER trg_protect_user_role
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_role_escalation();
