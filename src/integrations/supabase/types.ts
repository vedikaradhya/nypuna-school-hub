export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_applications: {
        Row: {
          academic_year_id: string | null
          applicant_name: string
          application_no: string
          applying_grade_id: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          documents_verified: boolean
          fee_verified: boolean
          gender: Database["public"]["Enums"]["gender_type"] | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          id: string
          interview_date: string | null
          notes: string | null
          previous_school: string | null
          school_id: string | null
          stage: Database["public"]["Enums"]["admission_stage"]
          student_id: string | null
          test_date: string | null
          test_score: number | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          applicant_name: string
          application_no?: string
          applying_grade_id?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          documents_verified?: boolean
          fee_verified?: boolean
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          id?: string
          interview_date?: string | null
          notes?: string | null
          previous_school?: string | null
          school_id?: string | null
          stage?: Database["public"]["Enums"]["admission_stage"]
          student_id?: string | null
          test_date?: string | null
          test_score?: number | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          applicant_name?: string
          application_no?: string
          applying_grade_id?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          documents_verified?: boolean
          fee_verified?: boolean
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          id?: string
          interview_date?: string | null
          notes?: string | null
          previous_school?: string | null
          school_id?: string | null
          stage?: Database["public"]["Enums"]["admission_stage"]
          student_id?: string | null
          test_date?: string | null
          test_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_applications_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_applying_grade_id_fkey"
            columns: ["applying_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"][]
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_approved: boolean
          is_pinned: boolean
          school_id: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"][]
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean
          is_pinned?: boolean
          school_id?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"][]
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean
          is_pinned?: boolean
          school_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          id: string
          marks: number | null
          school_id: string | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_on: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          id?: string
          marks?: number | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_on?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          id?: string
          marks?: number | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_on: string
          created_at: string
          description: string | null
          due_date: string
          file_path: string | null
          id: string
          max_marks: number
          school_id: string | null
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
        }
        Insert: {
          assigned_on?: string
          created_at?: string
          description?: string | null
          due_date: string
          file_path?: string | null
          id?: string
          max_marks?: number
          school_id?: string | null
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
        }
        Update: {
          assigned_on?: string
          created_at?: string
          description?: string | null
          due_date?: string
          file_path?: string | null
          id?: string
          max_marks?: number
          school_id?: string | null
          section_id?: string
          subject_id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string | null
          section_id: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          school_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      book_issues: {
        Row: {
          book_id: string
          borrower_type: Database["public"]["Enums"]["borrower_type"]
          condition_on_return: string | null
          created_at: string
          due_on: string
          fine_amount: number
          id: string
          issued_by: string | null
          issued_on: string
          returned_on: string | null
          school_id: string | null
          staff_id: string | null
          student_id: string | null
        }
        Insert: {
          book_id: string
          borrower_type?: Database["public"]["Enums"]["borrower_type"]
          condition_on_return?: string | null
          created_at?: string
          due_on?: string
          fine_amount?: number
          id?: string
          issued_by?: string | null
          issued_on?: string
          returned_on?: string | null
          school_id?: string | null
          staff_id?: string | null
          student_id?: string | null
        }
        Update: {
          book_id?: string
          borrower_type?: Database["public"]["Enums"]["borrower_type"]
          condition_on_return?: string | null
          created_at?: string
          due_on?: string
          fine_amount?: number
          id?: string
          issued_by?: string | null
          issued_on?: string
          returned_on?: string | null
          school_id?: string | null
          staff_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reservations: {
        Row: {
          book_id: string
          created_at: string
          id: string
          reserved_on: string
          school_id: string | null
          staff_id: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          reserved_on?: string
          school_id?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          reserved_on?: string
          school_id?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_reservations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reservations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reservations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reservations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          accession_no: string | null
          author: string | null
          available_copies: number
          category: string
          created_at: string
          damaged_copies: number
          id: string
          isbn: string | null
          language: string
          lost_copies: number
          price: number | null
          publisher: string | null
          school_id: string | null
          shelf_location: string | null
          title: string
          total_copies: number
        }
        Insert: {
          accession_no?: string | null
          author?: string | null
          available_copies?: number
          category?: string
          created_at?: string
          damaged_copies?: number
          id?: string
          isbn?: string | null
          language?: string
          lost_copies?: number
          price?: number | null
          publisher?: string | null
          school_id?: string | null
          shelf_location?: string | null
          title: string
          total_copies?: number
        }
        Update: {
          accession_no?: string | null
          author?: string | null
          available_copies?: number
          category?: string
          created_at?: string
          damaged_copies?: number
          id?: string
          isbn?: string | null
          language?: string
          lost_copies?: number
          price?: number | null
          publisher?: string | null
          school_id?: string | null
          shelf_location?: string | null
          title?: string
          total_copies?: number
        }
        Relationships: [
          {
            foreignKeyName: "books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"][]
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          ends_on: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          school_id: string | null
          start_time: string | null
          starts_on: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          ends_on?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          school_id?: string | null
          start_time?: string | null
          starts_on: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          ends_on?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          school_id?: string | null
          start_time?: string | null
          starts_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_type: string
          created_at: string
          id: string
          issued_by: string | null
          issued_on: string
          remarks: string | null
          school_id: string | null
          serial_no: string
          student_id: string
        }
        Insert: {
          certificate_type: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          remarks?: string | null
          school_id?: string | null
          serial_no?: string
          student_id: string
        }
        Update: {
          certificate_type?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          remarks?: string | null
          school_id?: string | null
          serial_no?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          building: string | null
          capacity: number
          created_at: string
          equipment: string | null
          floor: string | null
          id: string
          is_active: boolean
          name: string
          room_type: string
          school_id: string | null
        }
        Insert: {
          building?: string | null
          capacity?: number
          created_at?: string
          equipment?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name: string
          room_type?: string
          school_id?: string | null
        }
        Update: {
          building?: string | null
          capacity?: number
          created_at?: string
          equipment?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name?: string
          room_type?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      council_members: {
        Row: {
          academic_year_id: string | null
          appointed_on: string
          election_id: string | null
          id: string
          is_active: boolean
          position_id: string
          school_id: string | null
          student_id: string
        }
        Insert: {
          academic_year_id?: string | null
          appointed_on?: string
          election_id?: string | null
          id?: string
          is_active?: boolean
          position_id: string
          school_id?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string | null
          appointed_on?: string
          election_id?: string | null
          id?: string
          is_active?: boolean
          position_id?: string
          school_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_members_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_members_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_members_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "council_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      council_positions: {
        Row: {
          description: string | null
          house_id: string | null
          id: string
          name: string
          school_id: string | null
          sort_order: number
        }
        Insert: {
          description?: string | null
          house_id?: string | null
          id?: string
          name: string
          school_id?: string | null
          sort_order?: number
        }
        Update: {
          description?: string | null
          house_id?: string | null
          id?: string
          name?: string
          school_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "council_positions_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_positions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          head_id: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          head_id?: string | null
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          head_id?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_fk"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      election_candidates: {
        Row: {
          election_id: string
          id: string
          is_approved: boolean
          manifesto: string | null
          school_id: string | null
          student_id: string
          symbol: string | null
        }
        Insert: {
          election_id: string
          id?: string
          is_approved?: boolean
          manifesto?: string | null
          school_id?: string | null
          student_id: string
          symbol?: string | null
        }
        Update: {
          election_id?: string
          id?: string
          is_approved?: boolean
          manifesto?: string | null
          school_id?: string | null
          student_id?: string
          symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "election_candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_candidates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_candidates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      election_votes: {
        Row: {
          candidate_id: string
          cast_at: string
          election_id: string
          id: string
          recorded_by: string | null
          school_id: string | null
          voter_student_id: string
        }
        Insert: {
          candidate_id: string
          cast_at?: string
          election_id: string
          id?: string
          recorded_by?: string | null
          school_id?: string | null
          voter_student_id: string
        }
        Update: {
          candidate_id?: string
          cast_at?: string
          election_id?: string
          id?: string
          recorded_by?: string | null
          school_id?: string | null
          voter_student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "election_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_votes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_votes_voter_student_id_fkey"
            columns: ["voter_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          academic_year_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          eligible_grade_ids: string[]
          ends_at: string | null
          id: string
          position_id: string | null
          school_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["election_status"]
          title: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligible_grade_ids?: string[]
          ends_at?: string | null
          id?: string
          position_id?: string | null
          school_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["election_status"]
          title: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligible_grade_ids?: string[]
          ends_at?: string | null
          id?: string
          position_id?: string | null
          school_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["election_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "elections_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elections_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "council_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          child_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          follow_up_date: string | null
          grade_interested_id: string | null
          id: string
          notes: string | null
          parent_name: string
          phone: string
          school_id: string | null
          source: string | null
          status: string
        }
        Insert: {
          child_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          grade_interested_id?: string | null
          id?: string
          notes?: string | null
          parent_name: string
          phone: string
          school_id?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          child_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          follow_up_date?: string | null
          grade_interested_id?: string | null
          id?: string
          notes?: string | null
          parent_name?: string
          phone?: string
          school_id?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_grade_interested_id_fkey"
            columns: ["grade_interested_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_marks: {
        Row: {
          entered_by: string | null
          exam_schedule_id: string
          id: string
          is_absent: boolean
          marks_obtained: number | null
          remarks: string | null
          school_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          entered_by?: string | null
          exam_schedule_id: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number | null
          remarks?: string | null
          school_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          entered_by?: string | null
          exam_schedule_id?: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number | null
          remarks?: string | null
          school_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_marks_exam_schedule_id_fkey"
            columns: ["exam_schedule_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          duration_minutes: number
          exam_date: string | null
          exam_id: string
          grade_id: string
          id: string
          max_marks: number
          pass_marks: number
          school_id: string | null
          start_time: string | null
          subject_id: string
        }
        Insert: {
          duration_minutes?: number
          exam_date?: string | null
          exam_id: string
          grade_id: string
          id?: string
          max_marks?: number
          pass_marks?: number
          school_id?: string | null
          start_time?: string | null
          subject_id: string
        }
        Update: {
          duration_minutes?: number
          exam_date?: string | null
          exam_id?: string
          grade_id?: string
          id?: string
          max_marks?: number
          pass_marks?: number
          school_id?: string | null
          start_time?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year_id: string | null
          created_at: string
          end_date: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          is_published: boolean
          name: string
          school_id: string | null
          start_date: string | null
          term: number
          weightage: number
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          end_date?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          name: string
          school_id?: string | null
          start_date?: string | null
          term?: number
          weightage?: number
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          end_date?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          name?: string
          school_id?: string | null
          start_date?: string | null
          term?: number
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_subjects: {
        Row: {
          grade_id: string
          id: string
          max_per_day: number
          periods_per_week: number
          school_id: string | null
          subject_id: string
        }
        Insert: {
          grade_id: string
          id?: string
          max_per_day?: number
          periods_per_week?: number
          school_id?: string | null
          subject_id: string
        }
        Update: {
          grade_id?: string
          id?: string
          max_per_day?: number
          periods_per_week?: number
          school_id?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_subjects_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          school_id: string | null
          stream: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level: number
          name: string
          school_id?: string | null
          stream?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          school_id?: string | null
          stream?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      house_points: {
        Row: {
          awarded_by: string | null
          awarded_on: string
          category: string
          created_at: string
          house_id: string
          id: string
          points: number
          reason: string
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          awarded_by?: string | null
          awarded_on?: string
          category?: string
          created_at?: string
          house_id: string
          id?: string
          points: number
          reason: string
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          awarded_by?: string | null
          awarded_on?: string
          category?: string
          created_at?: string
          house_id?: string
          id?: string
          points?: number
          reason?: string
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_points_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_points_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          color: string
          created_at: string
          house_master_id: string | null
          id: string
          motto: string | null
          name: string
          school_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          house_master_id?: string | null
          id?: string
          motto?: string | null
          name: string
          school_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          house_master_id?: string | null
          id?: string
          motto?: string | null
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "houses_house_master_id_fkey"
            columns: ["house_master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "houses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          chapter: string | null
          content: string | null
          created_at: string
          file_path: string | null
          grade_id: string | null
          id: string
          school_id: string | null
          status: string
          subject_id: string
          teacher_id: string
          title: string
          unit: string | null
          updated_at: string
          version: number
        }
        Insert: {
          chapter?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          grade_id?: string | null
          id?: string
          school_id?: string | null
          status?: string
          subject_id: string
          teacher_id: string
          title: string
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          chapter?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          grade_id?: string | null
          id?: string
          school_id?: string | null
          status?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          unit?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          device: string | null
          id: string
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device?: string | null
          id?: string
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device?: string | null
          id?: string
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          school_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          school_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          school_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          end_time: string
          id: string
          is_break: boolean
          label: string
          period_no: number
          school_id: string | null
          start_time: string
        }
        Insert: {
          end_time: string
          id?: string
          is_break?: boolean
          label: string
          period_no: number
          school_id?: string | null
          start_time: string
        }
        Update: {
          end_time?: string
          id?: string
          is_break?: boolean
          label?: string
          period_no?: number
          school_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "periods_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_school_id: string | null
          avatar_url: string | null
          created_at: string
          department_id: string | null
          designation: string | null
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          joining_date: string | null
          max_periods_per_day: number
          max_periods_per_week: number
          phone: string | null
          qualification: string | null
          updated_at: string
        }
        Insert: {
          active_school_id?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          joining_date?: string | null
          max_periods_per_day?: number
          max_periods_per_week?: number
          phone?: string | null
          qualification?: string | null
          updated_at?: string
        }
        Update: {
          active_school_id?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          joining_date?: string | null
          max_periods_per_day?: number
          max_periods_per_week?: number
          phone?: string | null
          qualification?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_school_id_fkey"
            columns: ["active_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          answer: string | null
          chapter: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          grade_id: string | null
          id: string
          is_archived: boolean
          is_previous_year: boolean
          learning_outcome: string | null
          marks: number
          question: string
          question_type: string
          school_id: string | null
          subject_id: string
          topic: string | null
        }
        Insert: {
          answer?: string | null
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          grade_id?: string | null
          id?: string
          is_archived?: boolean
          is_previous_year?: boolean
          learning_outcome?: string | null
          marks?: number
          question: string
          question_type?: string
          school_id?: string | null
          subject_id: string
          topic?: string | null
        }
        Update: {
          answer?: string | null
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          grade_id?: string | null
          id?: string
          is_archived?: boolean
          is_previous_year?: boolean
          learning_outcome?: string | null
          marks?: number
          question?: string
          question_type?: string
          school_id?: string | null
          subject_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      school_files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          mime_type: string | null
          name: string
          school_id: string | null
          size_bytes: number
          storage_path: string
          tags: string[]
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          mime_type?: string | null
          name: string
          school_id?: string | null
          size_bytes?: number
          storage_path: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          school_id?: string | null
          size_bytes?: number
          storage_path?: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_files_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_memberships: {
        Row: {
          created_at: string
          id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_by: string | null
          school_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_by?: string | null
          school_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_by?: string | null
          school_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          capacity: number
          class_teacher_id: string | null
          classroom_id: string | null
          created_at: string
          grade_id: string
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          capacity?: number
          class_teacher_id?: string | null
          classroom_id?: string | null
          created_at?: string
          grade_id: string
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          capacity?: number
          class_teacher_id?: string | null
          classroom_id?: string | null
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          attendance_date: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string | null
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          attendance_date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          attendance_date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leaves: {
        Row: {
          created_at: string
          from_date: string
          id: string
          leave_type: string
          reason: string | null
          reviewed_by: string | null
          school_id: string | null
          staff_id: string
          status: Database["public"]["Enums"]["leave_status"]
          to_date: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leaves_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leaves_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_history: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          event_type: string
          id: string
          occurred_on: string
          school_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          event_type: string
          id?: string
          occurred_on?: string
          school_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          event_type?: string
          id?: string
          occurred_on?: string
          school_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_last4: string | null
          academic_year_id: string | null
          address: string | null
          admission_no: string
          admitted_on: string
          allergies: string | null
          alternate_phone: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string | null
          father_name: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          house_id: string | null
          id: string
          last_name: string
          medical_notes: string | null
          middle_name: string | null
          mother_name: string | null
          notes: string | null
          photo_url: string | null
          roll_no: number | null
          school_id: string | null
          section_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          aadhaar_last4?: string | null
          academic_year_id?: string | null
          address?: string | null
          admission_no: string
          admitted_on?: string
          allergies?: string | null
          alternate_phone?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          house_id?: string | null
          id?: string
          last_name?: string
          medical_notes?: string | null
          middle_name?: string | null
          mother_name?: string | null
          notes?: string | null
          photo_url?: string | null
          roll_no?: number | null
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          aadhaar_last4?: string | null
          academic_year_id?: string | null
          address?: string | null
          admission_no?: string
          admitted_on?: string
          allergies?: string | null
          alternate_phone?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          house_id?: string | null
          id?: string
          last_name?: string
          medical_notes?: string | null
          middle_name?: string | null
          mother_name?: string | null
          notes?: string | null
          photo_url?: string | null
          roll_no?: number | null
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          is_scholastic: boolean
          name: string
          requires_lab: boolean
          school_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          is_scholastic?: boolean
          name: string
          requires_lab?: boolean
          school_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          is_scholastic?: boolean
          name?: string
          requires_lab?: boolean
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      substitutions: {
        Row: {
          absent_teacher_id: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          school_id: string | null
          substitute_teacher_id: string
          substitution_date: string
          timetable_entry_id: string
        }
        Insert: {
          absent_teacher_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          school_id?: string | null
          substitute_teacher_id: string
          substitution_date: string
          timetable_entry_id: string
        }
        Update: {
          absent_teacher_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          school_id?: string | null
          substitute_teacher_id?: string
          substitution_date?: string
          timetable_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_absent_teacher_id_fkey"
            columns: ["absent_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_substitute_teacher_id_fkey"
            columns: ["substitute_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "timetable_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_progress: {
        Row: {
          chapter_name: string
          chapter_no: number
          completion_date: string | null
          completion_pct: number
          id: string
          school_id: string | null
          section_id: string
          start_date: string | null
          subject_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chapter_name: string
          chapter_no?: number
          completion_date?: string | null
          completion_pct?: number
          id?: string
          school_id?: string | null
          section_id: string
          start_date?: string | null
          subject_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chapter_name?: string
          chapter_no?: number
          completion_date?: string | null
          completion_pct?: number
          id?: string
          school_id?: string | null
          section_id?: string
          start_date?: string | null
          subject_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          created_at: string
          id: string
          school_id: string | null
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_id?: string | null
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_id?: string | null
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          classroom_id: string | null
          created_at: string
          day_of_week: number
          id: string
          period_id: string
          school_id: string | null
          section_id: string
          subject_id: string
          teacher_id: string
          version_id: string
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          period_id: string
          school_id?: string | null
          section_id: string
          subject_id: string
          teacher_id: string
          version_id: string
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          period_id?: string
          school_id?: string | null
          section_id?: string
          subject_id?: string
          teacher_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "timetable_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_versions: {
        Row: {
          academic_year_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          published_at: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["timetable_status"]
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          published_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["timetable_status"]
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          published_at?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["timetable_status"]
        }
        Relationships: [
          {
            foreignKeyName: "timetable_versions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_logs: {
        Row: {
          badge_no: string | null
          check_in: string
          check_out: string | null
          created_at: string
          host_id: string | null
          host_name: string | null
          id: string
          id_proof: string | null
          logged_by: string | null
          phone: string | null
          purpose: string
          school_id: string | null
          visitor_name: string
        }
        Insert: {
          badge_no?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          id_proof?: string | null
          logged_by?: string | null
          phone?: string | null
          purpose: string
          school_id?: string | null
          visitor_name: string
        }
        Update: {
          badge_no?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          id_proof?: string | null
          logged_by?: string | null
          phone?: string | null
          purpose?: string
          school_id?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_logs_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cbse_grade: { Args: { _pct: number }; Returns: string }
      current_school_id: { Args: never; Returns: string }
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: never; Returns: boolean }
      is_school_admin: { Args: { _school: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      review_membership: {
        Args: {
          _approve: boolean
          _membership: string
          _roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: undefined
      }
      set_active_school: { Args: { _school: string }; Returns: undefined }
    }
    Enums: {
      admission_stage:
        | "enquiry"
        | "applied"
        | "document_verification"
        | "test_scheduled"
        | "interviewed"
        | "principal_approval"
        | "offered"
        | "admitted"
        | "rejected"
        | "withdrawn"
      app_role:
        | "administrator"
        | "principal"
        | "teacher"
        | "front_office"
        | "librarian"
      attendance_status: "present" | "absent" | "late" | "leave" | "half_day"
      borrower_type: "student" | "staff"
      election_status: "draft" | "open" | "closed" | "archived"
      event_type:
        | "holiday"
        | "exam"
        | "event"
        | "meeting"
        | "activity"
        | "ptm"
        | "other"
      exam_type:
        | "periodic_test"
        | "half_yearly"
        | "annual"
        | "pre_board"
        | "board"
      file_category:
        | "circular"
        | "policy"
        | "syllabus"
        | "question_paper"
        | "lesson_plan"
        | "report"
        | "certificate"
        | "admission_doc"
        | "student_doc"
        | "resource"
        | "other"
      gender_type: "male" | "female" | "other"
      leave_status: "pending" | "approved" | "rejected"
      student_status:
        | "active"
        | "graduated"
        | "transferred"
        | "withdrawn"
        | "alumni"
      submission_status: "pending" | "submitted" | "late" | "graded"
      timetable_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_stage: [
        "enquiry",
        "applied",
        "document_verification",
        "test_scheduled",
        "interviewed",
        "principal_approval",
        "offered",
        "admitted",
        "rejected",
        "withdrawn",
      ],
      app_role: [
        "administrator",
        "principal",
        "teacher",
        "front_office",
        "librarian",
      ],
      attendance_status: ["present", "absent", "late", "leave", "half_day"],
      borrower_type: ["student", "staff"],
      election_status: ["draft", "open", "closed", "archived"],
      event_type: [
        "holiday",
        "exam",
        "event",
        "meeting",
        "activity",
        "ptm",
        "other",
      ],
      exam_type: [
        "periodic_test",
        "half_yearly",
        "annual",
        "pre_board",
        "board",
      ],
      file_category: [
        "circular",
        "policy",
        "syllabus",
        "question_paper",
        "lesson_plan",
        "report",
        "certificate",
        "admission_doc",
        "student_doc",
        "resource",
        "other",
      ],
      gender_type: ["male", "female", "other"],
      leave_status: ["pending", "approved", "rejected"],
      student_status: [
        "active",
        "graduated",
        "transferred",
        "withdrawn",
        "alumni",
      ],
      submission_status: ["pending", "submitted", "late", "graded"],
      timetable_status: ["draft", "published", "archived"],
    },
  },
} as const
