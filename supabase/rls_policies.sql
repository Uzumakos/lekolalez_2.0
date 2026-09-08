-- Supabase Row Level Security (RLS) Policies for Lekol Alèz

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 1. USERS
-- Anyone can read basic user info (needed for instructor profiles)
CREATE POLICY "Public profiles are viewable by everyone." 
  ON users FOR SELECT USING (true);

-- Users can update their own profile. Admins can update any profile.
CREATE POLICY "Users can update own profile." 
  ON users FOR UPDATE 
  USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Only admins can delete users
CREATE POLICY "Only admins can delete users." 
  ON users FOR DELETE 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Allow authenticated user to insert their own profile, or allow anon during registration
DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
CREATE POLICY "Users can insert their own profile." 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.role() = 'anon');

-- Automatic trigger to create profile in public.users when an auth.users record is created
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
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
    '**managed_by_supabase_auth**'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. COURSES
-- Anyone can read published courses.
CREATE POLICY "Published courses are viewable by everyone." 
  ON courses FOR SELECT 
  USING (is_published = true OR status = 'published' OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instructor'));

-- Instructors can create courses
CREATE POLICY "Instructors can create courses." 
  ON courses FOR INSERT 
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('instructor', 'admin'));

-- Instructors can update their own courses. Admins can update any.
CREATE POLICY "Instructors can update own courses." 
  ON courses FOR UPDATE 
  USING (instructor_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Instructors can delete their own courses. Admins can delete any.
CREATE POLICY "Instructors can delete own courses." 
  ON courses FOR DELETE 
  USING (instructor_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 3. ENROLLMENTS
-- Users can see their own enrollments
CREATE POLICY "Users can view own enrollments." 
  ON enrollments FOR SELECT 
  USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can insert their own enrollments
CREATE POLICY "Users can create own enrollments." 
  ON enrollments FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollments (e.g., progress)
CREATE POLICY "Users can update own enrollments." 
  ON enrollments FOR UPDATE 
  USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 4. LESSON PROGRESS
-- Users can view their own progress via enrollment join
CREATE POLICY "Users can view own lesson progress." 
  ON lesson_progress FOR SELECT 
  USING (enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid()));

-- Users can insert their own progress
CREATE POLICY "Users can insert own lesson progress." 
  ON lesson_progress FOR INSERT 
  WITH CHECK (enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid()));

-- Users can update their own progress
CREATE POLICY "Users can update own lesson progress." 
  ON lesson_progress FOR UPDATE 
  USING (enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid()));

-- 5. NOTIFICATIONS
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications." 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update own notifications." 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- System inserts notifications (we'll allow users to insert for now since frontend creates them)
CREATE POLICY "Users can insert notifications." 
  ON notifications FOR INSERT 
  WITH CHECK (true);

-- 6. SITE CONTENT
-- Anyone can view site content
CREATE POLICY "Site content viewable by everyone." 
  ON site_content FOR SELECT USING (true);

-- Only admins can modify site content
DROP POLICY IF EXISTS "Only admins can modify site content." ON site_content;
CREATE POLICY "Only admins can modify site content." 
  ON site_content FOR ALL 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 7. CERTIFICATES
-- Users can view their own certificates
CREATE POLICY "Users can view own certificates." 
  ON certificates FOR SELECT 
  USING (enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid()));

-- Allow insert of certificates (done via frontend on course complete for now)
CREATE POLICY "Users can insert own certificates." 
  ON certificates FOR INSERT 
  WITH CHECK (enrollment_id IN (SELECT id FROM enrollments WHERE user_id = auth.uid()));

-- Function to increment enrollment safely (RPC)
CREATE OR REPLACE FUNCTION increment_enrollment_count(cid uuid)
RETURNS void AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = COALESCE(enrollment_count, 0) + 1
  WHERE id = cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SUBSCRIPTIONS
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions." ON subscriptions;
CREATE POLICY "Users can view own subscriptions." 
  ON subscriptions FOR SELECT 
  USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can insert own subscriptions or registration." ON subscriptions;
CREATE POLICY "Users can insert own subscriptions or registration." 
  ON subscriptions FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'anon' OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update subscriptions." ON subscriptions;
CREATE POLICY "Admins can update subscriptions." 
  ON subscriptions FOR UPDATE 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
