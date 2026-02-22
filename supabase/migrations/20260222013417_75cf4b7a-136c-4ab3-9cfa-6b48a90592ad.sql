
-- Project status enum
CREATE TYPE public.project_status AS ENUM ('onboarding', 'in_progress', 'review', 'completed', 'archived');

-- Task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- Outreach method enum
CREATE TYPE public.outreach_method AS ENUM ('email', 'whatsapp', 'phone', 'linkedin', 'other');

-- Follow-up status enum
CREATE TYPE public.follow_up_status AS ENUM ('pending', 'followed_up', 'converted', 'lost');

-- Calendar event type enum
CREATE TYPE public.event_type AS ENUM ('appointment', 'goal', 'milestone');

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'onboarding',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROJECT MEMBERS ============
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project members" ON public.project_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage project members" ON public.project_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can remove project members" ON public.project_members FOR DELETE USING (auth.role() = 'authenticated');

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  notes TEXT,
  public_token UUID DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Public invoice access via token" ON public.invoices FOR SELECT USING (public_token IS NOT NULL);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices;
  NEW.invoice_number := 'INV-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_invoice_number();

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update documents" ON public.documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete documents" ON public.documents FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CALENDAR EVENTS ============
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  event_type event_type NOT NULL DEFAULT 'appointment',
  is_quarterly_goal BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events" ON public.calendar_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update events" ON public.calendar_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete events" ON public.calendar_events FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROSPECTS ============
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  outreach_method outreach_method NOT NULL DEFAULT 'email',
  date_contacted DATE,
  response_received BOOLEAN NOT NULL DEFAULT false,
  follow_up_status follow_up_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospects" ON public.prospects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert prospects" ON public.prospects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update prospects" ON public.prospects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete prospects" ON public.prospects FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FIX ONBOARDING FORMS FOR PUBLIC ACCESS ============
-- Drop the restrictive SELECT policy and replace with a permissive one
DROP POLICY IF EXISTS "Authenticated users can manage forms" ON public.onboarding_forms;

-- Permissive policy for authenticated users
CREATE POLICY "Authenticated users can view forms" ON public.onboarding_forms FOR SELECT TO authenticated USING (true);

-- Permissive policy for anonymous access to active forms
CREATE POLICY "Anyone can view active forms" ON public.onboarding_forms FOR SELECT TO anon USING (is_active = true);

-- Fix form_submissions INSERT for anon
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.form_submissions;
CREATE POLICY "Anyone can insert submissions" ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============ STORAGE BUCKET FOR AVATARS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
