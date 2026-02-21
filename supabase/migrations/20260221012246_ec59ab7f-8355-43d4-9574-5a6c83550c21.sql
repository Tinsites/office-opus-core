
DROP POLICY "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY "Authenticated users can insert forms" ON public.onboarding_forms;
CREATE POLICY "Authenticated users can insert forms" ON public.onboarding_forms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY "Authenticated users can update forms" ON public.onboarding_forms;
CREATE POLICY "Authenticated users can update forms" ON public.onboarding_forms FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
