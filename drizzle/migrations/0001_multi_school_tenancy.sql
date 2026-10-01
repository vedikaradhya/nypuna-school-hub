
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND lower(email) = 'vedikaradhya1234@gmail.com' AND email_confirmed_at IS NOT NULL)
$$;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

CREATE POLICY "anyone reads active schools" ON public.schools FOR SELECT TO anon, authenticated USING (is_active OR public.is_owner());
CREATE POLICY "owner manages schools" ON public.schools FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE TABLE public.school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_role public.app_role NOT NULL DEFAULT 'teacher',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_memberships TO authenticated;
GRANT ALL ON public.school_memberships TO service_role;
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN active_school_id uuid REFERENCES public.schools(id);

CREATE OR REPLACE FUNCTION public.current_school_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.active_school_id FROM public.profiles p
  JOIN public.school_memberships m ON m.user_id = p.id AND m.school_id = p.active_school_id AND m.status = 'approved'
  WHERE p.id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.current_school_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated;

INSERT INTO public.schools (name, code) VALUES ('Nypuna School', 'NYPUNA');

ALTER TABLE public.user_roles ADD COLUMN school_id uuid REFERENCES public.schools(id);
UPDATE public.user_roles SET school_id = (SELECT id FROM public.schools WHERE code = 'NYPUNA') WHERE school_id IS NULL;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_school_key UNIQUE (user_id, role, school_id);

CREATE OR REPLACE FUNCTION public.is_school_admin(_school uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND school_id = _school AND role = 'administrator')
$$;
REVOKE EXECUTE ON FUNCTION public.is_school_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_school_admin(uuid) TO authenticated;

INSERT INTO public.school_memberships (user_id, school_id, status, requested_role)
SELECT DISTINCT ON (user_id) user_id, school_id, 'approved', role FROM public.user_roles ORDER BY user_id;
UPDATE public.profiles p SET active_school_id = (SELECT id FROM public.schools WHERE code = 'NYPUNA')
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role AND school_id = public.current_school_id())
$$;
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles) AND school_id = public.current_school_id())
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND school_id = public.current_school_id())
$$;
CREATE OR REPLACE FUNCTION public.get_my_roles() RETURNS SETOF public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND school_id = public.current_school_id()
$$;

CREATE POLICY "read memberships" ON public.school_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_admin(school_id) OR public.is_owner());
CREATE POLICY "request membership" ON public.school_memberships FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND status = 'pending') OR public.is_owner());
CREATE POLICY "admin reviews memberships" ON public.school_memberships FOR UPDATE TO authenticated
  USING (public.is_school_admin(school_id) OR public.is_owner()) WITH CHECK (public.is_school_admin(school_id) OR public.is_owner());

DROP POLICY IF EXISTS "staff read profiles" ON public.profiles;
CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (
  auth.uid() = id OR public.is_owner() OR EXISTS (
    SELECT 1 FROM public.school_memberships m WHERE m.user_id = profiles.id AND m.school_id = public.current_school_id()
  ) OR EXISTS (
    SELECT 1 FROM public.school_memberships m WHERE m.user_id = profiles.id AND public.is_school_admin(m.school_id)
  ));
DROP POLICY IF EXISTS "admin manage profiles" ON public.profiles;
CREATE POLICY "admin manage profiles" ON public.profiles FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'administrator') AND EXISTS (
    SELECT 1 FROM public.school_memberships m WHERE m.user_id = profiles.id AND m.school_id = public.current_school_id()))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));

DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "read roles" ON public.user_roles;
CREATE POLICY "read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR school_id = public.current_school_id() OR public.is_owner());
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_school_admin(school_id) OR public.is_owner())
  WITH CHECK (public.is_school_admin(school_id) OR public.is_owner());

CREATE OR REPLACE FUNCTION public.review_membership(_membership uuid, _approve boolean, _roles public.app_role[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.school_memberships;
BEGIN
  SELECT * INTO m FROM public.school_memberships WHERE id = _membership;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT (public.is_school_admin(m.school_id) OR public.is_owner()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.school_memberships SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, reviewed_by = auth.uid() WHERE id = _membership;
  DELETE FROM public.user_roles WHERE user_id = m.user_id AND school_id = m.school_id;
  IF _approve THEN
    IF coalesce(array_length(_roles,1),0) = 0 THEN RAISE EXCEPTION 'Pick at least one role'; END IF;
    INSERT INTO public.user_roles (user_id, role, school_id) SELECT m.user_id, r, m.school_id FROM unnest(_roles) r;
    UPDATE public.profiles SET active_school_id = m.school_id WHERE id = m.user_id AND active_school_id IS NULL;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_membership(uuid, boolean, public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_membership(uuid, boolean, public.app_role[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_active_school(_school uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.school_memberships WHERE user_id = auth.uid() AND school_id = _school AND status = 'approved') THEN
    RAISE EXCEPTION 'You are not approved at this school';
  END IF;
  UPDATE public.profiles SET active_school_id = _school WHERE id = auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.set_active_school(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_active_school(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _school uuid; _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, employee_id)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.email, NEW.raw_user_meta_data->>'avatar_url', NULLIF(NEW.raw_user_meta_data->>'employee_id',''))
  ON CONFLICT (id) DO NOTHING;
  BEGIN _school := NULLIF(NEW.raw_user_meta_data->>'school_id','')::uuid; EXCEPTION WHEN others THEN _school := NULL; END;
  BEGIN _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'requested_role',''),'teacher')::public.app_role; EXCEPTION WHEN others THEN _role := 'teacher'; END;
  IF _role = 'administrator' THEN _role := 'teacher'; END IF;
  IF _school IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools WHERE id = _school AND is_active) THEN
    INSERT INTO public.school_memberships (user_id, school_id, status, requested_role) VALUES (NEW.id, _school, 'pending', _role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text; c record; cols text; nyp uuid;
BEGIN
  SELECT id INTO nyp FROM public.schools WHERE code = 'NYPUNA';
  FOREACH t IN ARRAY ARRAY['academic_years','admission_applications','announcements','assignment_submissions','assignments','attendance','audit_logs','book_issues','book_reservations','books','calendar_events','certificates','classrooms','council_members','council_positions','departments','election_candidates','election_votes','elections','enquiries','exam_marks','exam_schedules','exams','grade_subjects','grades','house_points','houses','lesson_plans','messages','periods','question_bank','school_files','sections','staff_attendance','staff_leaves','student_history','students','subjects','substitutions','syllabus_progress','teacher_assignments','timetable_entries','timetable_versions','visitor_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN school_id uuid REFERENCES public.schools(id) DEFAULT public.current_school_id()', t);
    EXECUTE format('UPDATE public.%I SET school_id = %L WHERE school_id IS NULL', t, nyp);
    EXECUTE format('CREATE INDEX ON public.%I (school_id)', t);
    EXECUTE format('CREATE POLICY "school isolation" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (school_id = public.current_school_id()) WITH CHECK (school_id = public.current_school_id())', t);
    FOR c IN SELECT con.conname, con.conkey FROM pg_constraint con WHERE con.conrelid = format('public.%I', t)::regclass AND con.contype = 'u' LOOP
      SELECT string_agg(quote_ident(a.attname), ', ') INTO cols FROM pg_attribute a
        WHERE a.attrelid = format('public.%I', t)::regclass AND a.attnum = ANY(c.conkey);
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', t, c.conname);
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (%s, school_id)', t, c.conname, cols);
    END LOOP;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_school_defaults() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE src uuid;
BEGIN
  SELECT id INTO src FROM public.schools WHERE id <> NEW.id ORDER BY created_at LIMIT 1;
  IF src IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.academic_years (name, start_date, end_date, is_current, school_id) SELECT name, start_date, end_date, is_current, NEW.id FROM public.academic_years WHERE school_id = src;
  INSERT INTO public.grades (name, level, stream, is_active, school_id) SELECT name, level, stream, is_active, NEW.id FROM public.grades WHERE school_id = src;
  INSERT INTO public.periods (period_no, label, start_time, end_time, is_break, school_id) SELECT period_no, label, start_time, end_time, is_break, NEW.id FROM public.periods WHERE school_id = src;
  INSERT INTO public.houses (name, color, motto, school_id) SELECT name, color, motto, NEW.id FROM public.houses WHERE school_id = src;
  INSERT INTO public.subjects (name, code, is_scholastic, requires_lab, is_active, school_id) SELECT name, code, is_scholastic, requires_lab, is_active, NEW.id FROM public.subjects WHERE school_id = src;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_school_defaults() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER seed_school_defaults AFTER INSERT ON public.schools FOR EACH ROW EXECUTE FUNCTION public.seed_school_defaults();
