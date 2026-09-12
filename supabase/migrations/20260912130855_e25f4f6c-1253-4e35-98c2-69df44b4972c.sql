-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('administrator','principal','teacher','front_office','librarian');
CREATE TYPE public.gender_type AS ENUM ('male','female','other');
CREATE TYPE public.student_status AS ENUM ('active','graduated','transferred','withdrawn','alumni');
CREATE TYPE public.admission_stage AS ENUM ('enquiry','applied','document_verification','test_scheduled','interviewed','principal_approval','offered','admitted','rejected','withdrawn');
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','leave','half_day');
CREATE TYPE public.submission_status AS ENUM ('pending','submitted','late','graded');
CREATE TYPE public.exam_type AS ENUM ('periodic_test','half_yearly','annual','pre_board','board');
CREATE TYPE public.borrower_type AS ENUM ('student','staff');
CREATE TYPE public.election_status AS ENUM ('draft','open','closed','archived');
CREATE TYPE public.file_category AS ENUM ('circular','policy','syllabus','question_paper','lesson_plan','report','certificate','admission_doc','student_doc','resource','other');
CREATE TYPE public.timetable_status AS ENUM ('draft','published','archived');
CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.event_type AS ENUM ('holiday','exam','event','meeting','activity','ptm','other');

-- ===== Departments =====
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  head_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Profiles & roles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  designation TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  qualification TEXT,
  joining_date DATE,
  avatar_url TEXT,
  max_periods_per_day INT NOT NULL DEFAULT 6,
  max_periods_per_week INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ADD CONSTRAINT departments_head_fk FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, employee_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'employee_id','')
  ) ON CONFLICT (id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrator');
  ELSIF NEW.raw_user_meta_data ? 'initial_role' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'initial_role')::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'administrator')) WITH CHECK (public.has_role(auth.uid(),'administrator'));
CREATE POLICY "read roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'administrator')) WITH CHECK (public.has_role(auth.uid(),'administrator'));

-- ===== Security / audit =====
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  device TEXT
);
CREATE TABLE public.school_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Academic setup =====
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level INT NOT NULL UNIQUE,
  stream TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  building TEXT,
  floor TEXT,
  capacity INT NOT NULL DEFAULT 40,
  room_type TEXT NOT NULL DEFAULT 'classroom',
  equipment TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#4B5563',
  motto TEXT,
  house_master_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_teacher_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  capacity INT NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grade_id, name)
);
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_scholastic BOOLEAN NOT NULL DEFAULT true,
  requires_lab BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  periods_per_week INT NOT NULL DEFAULT 5,
  max_per_day INT NOT NULL DEFAULT 2,
  UNIQUE (grade_id, subject_id)
);
CREATE TABLE public.periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_no INT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id, subject_id)
);
CREATE TABLE public.syllabus_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_no INT NOT NULL DEFAULT 1,
  chapter_name TEXT NOT NULL,
  start_date DATE,
  completion_date DATE,
  completion_pct INT NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Students =====
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  gender public.gender_type,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  roll_no INT,
  father_name TEXT,
  mother_name TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  alternate_phone TEXT,
  guardian_email TEXT,
  address TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_notes TEXT,
  aadhaar_last4 TEXT,
  photo_url TEXT,
  status public.student_status NOT NULL DEFAULT 'active',
  admitted_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX students_section_idx ON public.students(section_id);
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.student_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  serial_no TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || to_char(now(),'YYYYMMDD') || '-' || lpad((floor(random()*9999))::int::text, 4, '0')),
  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  issued_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Admissions & Front office =====
CREATE TABLE public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  child_name TEXT,
  grade_interested_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  follow_up_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no TEXT NOT NULL UNIQUE DEFAULT ('APP-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*99999))::int::text, 5, '0')),
  applicant_name TEXT NOT NULL,
  date_of_birth DATE,
  gender public.gender_type,
  applying_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  previous_school TEXT,
  stage public.admission_stage NOT NULL DEFAULT 'enquiry',
  documents_verified BOOLEAN NOT NULL DEFAULT false,
  test_date DATE,
  test_score NUMERIC(5,2),
  interview_date DATE,
  approved_by UUID,
  notes TEXT,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER admissions_updated_at BEFORE UPDATE ON public.admission_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  phone TEXT,
  id_proof TEXT,
  purpose TEXT NOT NULL,
  host_name TEXT,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  badge_no TEXT,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  logged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Timetable =====
CREATE TABLE public.timetable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  status public.timetable_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (version_id, section_id, day_of_week, period_id),
  UNIQUE (version_id, teacher_id, day_of_week, period_id)
);
CREATE UNIQUE INDEX timetable_classroom_slot ON public.timetable_entries(version_id, classroom_id, day_of_week, period_id) WHERE classroom_id IS NOT NULL;
CREATE TABLE public.staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'casual',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  substitution_date DATE NOT NULL,
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  absent_teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  substitute_teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (substitution_date, timetable_entry_id)
);
CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  remarks TEXT,
  marked_by UUID,
  UNIQUE (staff_id, attendance_date)
);

-- ===== Attendance =====
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  remarks TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);
CREATE INDEX attendance_date_idx ON public.attendance(attendance_date, section_id);

-- ===== Assignments =====
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_on DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  max_marks INT NOT NULL DEFAULT 10,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.submission_status NOT NULL DEFAULT 'pending',
  submitted_on DATE,
  marks NUMERIC(5,2),
  feedback TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

-- ===== Examinations =====
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_type public.exam_type NOT NULL DEFAULT 'periodic_test',
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term INT NOT NULL DEFAULT 1,
  start_date DATE,
  end_date DATE,
  weightage NUMERIC(5,2) NOT NULL DEFAULT 100,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE,
  start_time TIME,
  duration_minutes INT NOT NULL DEFAULT 180,
  max_marks NUMERIC(6,2) NOT NULL DEFAULT 100,
  pass_marks NUMERIC(6,2) NOT NULL DEFAULT 33,
  UNIQUE (exam_id, grade_id, subject_id)
);
CREATE TABLE public.exam_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(6,2),
  is_absent BOOLEAN NOT NULL DEFAULT false,
  remarks TEXT,
  entered_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_schedule_id, student_id)
);
CREATE OR REPLACE FUNCTION public.cbse_grade(_pct NUMERIC)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _pct IS NULL THEN 'AB'
    WHEN _pct >= 91 THEN 'A1' WHEN _pct >= 81 THEN 'A2'
    WHEN _pct >= 71 THEN 'B1' WHEN _pct >= 61 THEN 'B2'
    WHEN _pct >= 51 THEN 'C1' WHEN _pct >= 41 THEN 'C2'
    WHEN _pct >= 33 THEN 'D' ELSE 'E' END
$$;

-- ===== Teacher workspace =====
CREATE TABLE public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  chapter TEXT,
  unit TEXT,
  content TEXT,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  chapter TEXT,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  marks INT NOT NULL DEFAULT 1,
  question_type TEXT NOT NULL DEFAULT 'short_answer',
  question TEXT NOT NULL,
  answer TEXT,
  learning_outcome TEXT,
  is_previous_year BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Library =====
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT,
  accession_no TEXT,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  language TEXT NOT NULL DEFAULT 'English',
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  damaged_copies INT NOT NULL DEFAULT 0,
  lost_copies INT NOT NULL DEFAULT 0,
  shelf_location TEXT,
  price NUMERIC(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrower_type public.borrower_type NOT NULL DEFAULT 'student',
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  due_on DATE NOT NULL DEFAULT (CURRENT_DATE + 14),
  returned_on DATE,
  fine_amount NUMERIC(8,2) NOT NULL DEFAULT 0,
  condition_on_return TEXT,
  issued_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.sync_book_availability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books SET available_copies = available_copies - 1 WHERE id = NEW.book_id AND available_copies > 0;
    IF NOT FOUND THEN RAISE EXCEPTION 'No copies available'; END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.returned_on IS NULL AND NEW.returned_on IS NOT NULL THEN
    UPDATE public.books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = NEW.book_id;
    NEW.fine_amount := GREATEST(0, (NEW.returned_on - NEW.due_on)) * 2;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER book_issue_sync BEFORE INSERT OR UPDATE ON public.book_issues FOR EACH ROW EXECUTE FUNCTION public.sync_book_availability();
CREATE TABLE public.book_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reserved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Council & elections =====
CREATE TABLE public.council_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  position_id UUID REFERENCES public.council_positions(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  description TEXT,
  status public.election_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  eligible_grade_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.election_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  manifesto TEXT,
  symbol TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (election_id, student_id)
);
CREATE TABLE public.election_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.election_candidates(id) ON DELETE CASCADE,
  voter_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recorded_by UUID,
  cast_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (election_id, voter_student_id)
);
CREATE OR REPLACE FUNCTION public.check_election_open()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.elections WHERE id = NEW.election_id AND status = 'open') THEN
    RAISE EXCEPTION 'Election is not open for voting';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER election_vote_guard BEFORE INSERT ON public.election_votes FOR EACH ROW EXECUTE FUNCTION public.check_election_open();
CREATE TABLE public.council_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.council_positions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  election_id UUID REFERENCES public.elections(id) ON DELETE SET NULL,
  appointed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (position_id, academic_year_id)
);

-- ===== House points =====
CREATE TABLE public.house_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  awarded_by UUID,
  awarded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Communication & calendar =====
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience public.app_role[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type public.event_type NOT NULL DEFAULT 'event',
  starts_on DATE NOT NULL,
  ends_on DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  audience public.app_role[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Files =====
CREATE TABLE public.school_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  category public.file_category NOT NULL DEFAULT 'other',
  tags TEXT[] NOT NULL DEFAULT '{}',
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Grants + base RLS =====
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'departments','audit_logs','login_history','school_settings',
    'academic_years','grades','classrooms','houses','sections','subjects','grade_subjects','periods','teacher_assignments','syllabus_progress',
    'students','student_history','certificates','enquiries','admission_applications','visitor_logs',
    'timetable_versions','timetable_entries','staff_leaves','substitutions','staff_attendance',
    'attendance','assignments','assignment_submissions','exams','exam_schedules','exam_marks',
    'lesson_plans','question_bank','books','book_issues','book_reservations',
    'council_positions','elections','election_candidates','election_votes','council_members',
    'house_points','announcements','messages','calendar_events','school_files']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "admin all" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''administrator'')) WITH CHECK (public.has_role(auth.uid(),''administrator''))', t);
    IF t NOT IN ('messages','audit_logs','login_history') THEN
      EXECUTE format('CREATE POLICY "staff read" ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', t);
    END IF;
  END LOOP;
END $$;

-- audit/login: anyone signed in can write their own; admins & principals read
CREATE POLICY "insert own audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "leaders read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['administrator','principal']::public.app_role[]));
CREATE POLICY "insert own login" ON public.login_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read own login" ON public.login_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'administrator'));
-- messages: private
CREATE POLICY "read own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_staff(auth.uid()));
CREATE POLICY "mark read" ON public.messages FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
-- staff self-service
CREATE POLICY "own leave requests" ON public.staff_leaves FOR INSERT TO authenticated WITH CHECK (staff_id = auth.uid());

-- Principal
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['academic_years','grades','classrooms','houses','sections','subjects','grade_subjects','periods','teacher_assignments','syllabus_progress',
    'timetable_versions','timetable_entries','substitutions','staff_leaves','staff_attendance','exams','exam_schedules','exam_marks',
    'council_positions','elections','election_candidates','election_votes','council_members','house_points','announcements','calendar_events','school_files',
    'students','student_history','assignments','attendance','admission_applications','departments','school_settings']
  LOOP
    EXECUTE format('CREATE POLICY "principal manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''principal'')) WITH CHECK (public.has_role(auth.uid(),''principal''))', t);
  END LOOP;
END $$;

-- Teacher
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['attendance','assignments','assignment_submissions','exam_marks','house_points','school_files','election_votes',
    'lesson_plans','question_bank','syllabus_progress','student_history','announcements','calendar_events']
  LOOP
    EXECUTE format('CREATE POLICY "teacher manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''teacher'')) WITH CHECK (public.has_role(auth.uid(),''teacher''))', t);
  END LOOP;
END $$;

-- Front office
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['enquiries','admission_applications','students','student_history','certificates','visitor_logs','school_files','calendar_events']
  LOOP
    EXECUTE format('CREATE POLICY "front office manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''front_office'')) WITH CHECK (public.has_role(auth.uid(),''front_office''))', t);
  END LOOP;
END $$;

-- Librarian
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['books','book_issues','book_reservations','school_files']
  LOOP
    EXECUTE format('CREATE POLICY "librarian manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''librarian'')) WITH CHECK (public.has_role(auth.uid(),''librarian''))', t);
  END LOOP;
END $$;

-- ===== Storage policies =====
CREATE POLICY "staff read files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'school-files' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'school-files' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'school-files' AND public.is_staff(auth.uid()));
CREATE POLICY "leaders delete files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'school-files' AND public.has_any_role(auth.uid(), ARRAY['administrator','principal']::public.app_role[]));

-- ===== Seed =====
INSERT INTO public.academic_years (name, start_date, end_date, is_current) VALUES ('2026-27','2026-04-01','2027-03-31', true);
INSERT INTO public.departments (name) VALUES ('Languages'),('Mathematics'),('Science'),('Social Science'),('Computer Science'),('Physical Education'),('Arts'),('Administration'),('Library');
INSERT INTO public.houses (name, color, motto) VALUES
 ('Ruby','#B91C1C','Courage and Strength'),('Sapphire','#1D4ED8','Wisdom and Truth'),
 ('Emerald','#047857','Growth and Harmony'),('Topaz','#CA8A04','Light and Excellence');
INSERT INTO public.periods (period_no,label,start_time,end_time,is_break) VALUES
 (1,'Assembly','07:50','08:00',true),(2,'Period 1','08:00','08:40',false),(3,'Period 2','08:40','09:20',false),(4,'Period 3','09:20','10:00',false),
 (5,'Short Break','10:00','10:15',true),(6,'Period 4','10:15','10:55',false),(7,'Period 5','10:55','11:35',false),
 (8,'Lunch','11:35','12:10',true),(9,'Period 6','12:10','12:50',false),(10,'Period 7','12:50','13:30',false),(11,'Period 8','13:30','14:10',false);
INSERT INTO public.grades (name, level) VALUES
 ('LKG',-1),('UKG',0),('Grade 1',1),('Grade 2',2),('Grade 3',3),('Grade 4',4),('Grade 5',5),('Grade 6',6),
 ('Grade 7',7),('Grade 8',8),('Grade 9',9),('Grade 10',10),('Grade 11',11),('Grade 12',12);
INSERT INTO public.subjects (name, code, is_scholastic, requires_lab, department_id) VALUES
 ('English','ENG',true,false,(SELECT id FROM public.departments WHERE name='Languages')),
 ('Hindi','HIN',true,false,(SELECT id FROM public.departments WHERE name='Languages')),
 ('Kannada','KAN',true,false,(SELECT id FROM public.departments WHERE name='Languages')),
 ('Sanskrit','SAN',true,false,(SELECT id FROM public.departments WHERE name='Languages')),
 ('Mathematics','MAT',true,false,(SELECT id FROM public.departments WHERE name='Mathematics')),
 ('Science','SCI',true,true,(SELECT id FROM public.departments WHERE name='Science')),
 ('Physics','PHY',true,true,(SELECT id FROM public.departments WHERE name='Science')),
 ('Chemistry','CHE',true,true,(SELECT id FROM public.departments WHERE name='Science')),
 ('Biology','BIO',true,true,(SELECT id FROM public.departments WHERE name='Science')),
 ('Social Science','SST',true,false,(SELECT id FROM public.departments WHERE name='Social Science')),
 ('Economics','ECO',true,false,(SELECT id FROM public.departments WHERE name='Social Science')),
 ('Business Studies','BST',true,false,(SELECT id FROM public.departments WHERE name='Social Science')),
 ('Accountancy','ACC',true,false,(SELECT id FROM public.departments WHERE name='Social Science')),
 ('Computer Science','CS',true,true,(SELECT id FROM public.departments WHERE name='Computer Science')),
 ('Physical Education','PE',false,false,(SELECT id FROM public.departments WHERE name='Physical Education')),
 ('Art Education','ART',false,false,(SELECT id FROM public.departments WHERE name='Arts')),
 ('Music','MUS',false,false,(SELECT id FROM public.departments WHERE name='Arts')),
 ('Work Experience','WE',false,false,(SELECT id FROM public.departments WHERE name='Arts'));
INSERT INTO public.classrooms (name, building, floor, capacity, room_type) VALUES
 ('Room 101','Main Block','1',40,'classroom'),('Room 102','Main Block','1',40,'classroom'),('Room 103','Main Block','1',40,'classroom'),
 ('Room 201','Main Block','2',40,'classroom'),('Room 202','Main Block','2',40,'classroom'),('Room 203','Main Block','2',40,'classroom'),
 ('Physics Lab','Science Block','1',30,'lab'),('Chemistry Lab','Science Block','1',30,'lab'),('Biology Lab','Science Block','2',30,'lab'),
 ('Computer Lab','Science Block','2',35,'lab'),('Library Hall','Main Block','G',60,'library'),('Auditorium','Main Block','G',300,'hall');
INSERT INTO public.grade_subjects (grade_id, subject_id, periods_per_week)
SELECT g.id, s.id, CASE s.code WHEN 'ENG' THEN 6 WHEN 'MAT' THEN 6 WHEN 'PE' THEN 2 WHEN 'ART' THEN 2 WHEN 'CS' THEN 3 ELSE 5 END
FROM public.grades g JOIN public.subjects s ON (
  (g.level BETWEEN 1 AND 5 AND s.code IN ('ENG','HIN','KAN','MAT','SCI','SST','PE','ART')) OR
  (g.level BETWEEN 6 AND 10 AND s.code IN ('ENG','HIN','KAN','MAT','SCI','SST','CS','PE','ART')) OR
  (g.level >= 11 AND s.code IN ('ENG','PHY','CHE','MAT','BIO','CS','PE'))
);
INSERT INTO public.council_positions (name, description, sort_order) VALUES
 ('Head Boy','School Head Boy',1),('Head Girl','School Head Girl',2),('Sports Captain','School Sports Captain',3),
 ('Cultural Secretary','Cultural Secretary',4),('Ruby House Captain','Captain of Ruby House',5),('Sapphire House Captain','Captain of Sapphire House',6),
 ('Emerald House Captain','Captain of Emerald House',7),('Topaz House Captain','Captain of Topaz House',8);
INSERT INTO public.school_settings (key, value) VALUES
 ('school', '{"name":"Nypuna Connect Demo School","affiliation_no":"","address":"","phone":"","email":""}'),
 ('timetable_rules', '{"working_days":[1,2,3,4,5,6],"max_consecutive_periods":3,"default_max_periods_per_day":6,"default_max_periods_per_week":30,"workload_variance_warning":4}');