
-- Fix ALL RLS policies: Drop RESTRICTIVE policies and recreate as PERMISSIVE

-- ============ PROJECTS ============
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

CREATE POLICY "Users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ TASKS ============
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ INVOICES ============
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public invoice access via token" ON public.invoices;

CREATE POLICY "Users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Public invoice access" ON public.invoices FOR SELECT TO anon USING (public_token IS NOT NULL);

-- ============ CLIENTS ============
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ DOCUMENTS ============
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

CREATE POLICY "Users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete documents" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ CALENDAR EVENTS ============
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.calendar_events;

CREATE POLICY "Users can view events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update events" ON public.calendar_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete events" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ PROSPECTS ============
DROP POLICY IF EXISTS "Authenticated users can view prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can delete prospects" ON public.prospects;

CREATE POLICY "Users can view prospects" ON public.prospects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert prospects" ON public.prospects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update prospects" ON public.prospects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete prospects" ON public.prospects FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ USER ROLES ============
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ MESSAGES ============
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

CREATE POLICY "Users can view messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- ============ PROJECT MEMBERS ============
DROP POLICY IF EXISTS "Authenticated users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can remove project members" ON public.project_members;

CREATE POLICY "Users can view project members" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage project members" ON public.project_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can remove project members" ON public.project_members FOR DELETE TO authenticated USING (true);

-- ============ ONBOARDING FORMS ============
DROP POLICY IF EXISTS "Authenticated users can view forms" ON public.onboarding_forms;
DROP POLICY IF EXISTS "Authenticated users can insert forms" ON public.onboarding_forms;
DROP POLICY IF EXISTS "Authenticated users can update forms" ON public.onboarding_forms;
DROP POLICY IF EXISTS "Anyone can view active forms" ON public.onboarding_forms;

CREATE POLICY "Users can view forms" ON public.onboarding_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert forms" ON public.onboarding_forms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update forms" ON public.onboarding_forms FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Anon can view active forms" ON public.onboarding_forms FOR SELECT TO anon USING (is_active = true);

-- ============ FORM SUBMISSIONS ============
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.form_submissions;

CREATE POLICY "Users can view submissions" ON public.form_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can submit" ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
