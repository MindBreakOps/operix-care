let me give all the tables schema , so you fill all the table workspace_id column with operas-solutions id , all those data is related to operis-solutions 
create table public.appointments (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  doctor_id uuid not null,
  appointment_date date not null,
  time_slot text not null,
  status text null default 'scheduled'::text,
  reason text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint appointments_pkey primary key (id),
  constraint appointments_doctor_id_fkey foreign KEY (doctor_id) references profiles (id) on delete CASCADE,
  constraint appointments_patient_id_fkey foreign KEY (patient_id) references patient_files (id) on delete CASCADE,
  constraint appointments_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create trigger ensure_workspace_appointments BEFORE INSERT on appointments for EACH row
execute FUNCTION auto_assign_workspace_id ();

create trigger ensure_workspace_appts BEFORE INSERT on appointments for EACH row
execute FUNCTION auto_assign_workspace_id ();
create table public.assets (
  id bigserial not null,
  asset_name text not null,
  category text not null,
  purchase_value numeric not null,
  status text null default 'active'::text,
  purchase_date date null default CURRENT_DATE,
  created_at timestamp with time zone null default now(),
  workspace_id uuid null,
  constraint assets_pkey primary key (id),
  constraint assets_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.attendance (
  id bigserial not null,
  staff_id uuid null,
  shift_date date null default CURRENT_DATE,
  shift_type text null,
  clock_in timestamp with time zone null,
  clock_out timestamp with time zone null,
  status text null default 'present'::text,
  workspace_id uuid null,
  constraint attendance_pkey primary key (id),
  constraint unique_staff_date unique (staff_id, shift_date),
  constraint attendance_staff_id_fkey foreign KEY (staff_id) references profiles (id) on delete CASCADE,
  constraint attendance_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.blood_bank (
  blood_group text not null,
  units_available integer null default 0,
  workspace_id uuid null,
  constraint blood_bank_pkey primary key (blood_group),
  constraint blood_bank_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.blood_inventory (
  id uuid not null default gen_random_uuid (),
  blood_type text not null,
  units integer null default 0,
  last_updated timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint blood_inventory_pkey primary key (id),
  constraint blood_inventory_blood_type_key unique (blood_type),
  constraint blood_inventory_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.clinics (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  address text null,
  license_number text not null,
  created_at timestamp with time zone null default now(),
  workspace_id uuid null,
  constraint clinics_pkey primary key (id),
  constraint clinics_license_number_key unique (license_number),
  constraint clinics_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.employee_records (
  staff_id uuid not null,
  education_level text null,
  contract_status text null default 'Active'::text,
  bank_account text null,
  total_leave_days integer null default 30,
  used_leave_days integer null default 0,
  id_number text null,
  id_expiry date null,
  medical_license_no text null,
  license_expiry date null,
  updated_at timestamp with time zone null default now(),
  pro_id text null,
  hourly_rate numeric null default 0,
  base_salary numeric null default 0,
  housing_allowance numeric null default 0,
  transport_allowance numeric null default 0,
  gross_salary numeric null default 0,
  salary_currency text null default 'SAR'::text,
  contract_file_url text null,
  job_offer_file_url text null,
  workspace_id uuid null,
  constraint employee_records_pkey primary key (staff_id),
  constraint employee_records_staff_id_fkey foreign KEY (staff_id) references profiles (id) on delete CASCADE,
  constraint employee_records_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create trigger ensure_workspace_emp BEFORE INSERT on employee_records for EACH row
execute FUNCTION auto_assign_workspace_id ();

create trigger ensure_workspace_employee_records BEFORE INSERT on employee_records for EACH row
execute FUNCTION auto_assign_workspace_id ();

create trigger trg_generate_pro_id BEFORE INSERT on employee_records for EACH row when (new.pro_id is null)
execute FUNCTION generate_pro_id ();

create table public.expenses (
  id bigserial not null,
  department text not null,
  amount numeric not null,
  description text null,
  created_at timestamp with time zone null default now(),
  workspace_id uuid null,
  constraint expenses_pkey primary key (id),
  constraint expenses_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.lab_requests (
  id uuid not null default gen_random_uuid (),
  ticket_id bigint null,
  patient_id uuid null,
  patient_name text not null,
  lab_type text not null,
  test_name text not null,
  status text null default 'pending'::text,
  result_notes text null,
  result_file_url text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  completed_at timestamp with time zone null,
  workspace_id uuid null,
  constraint lab_requests_pkey primary key (id),
  constraint lab_requests_patient_id_fkey foreign KEY (patient_id) references patient_files (id) on delete CASCADE,
  constraint lab_requests_ticket_id_fkey foreign KEY (ticket_id) references tickets (id),
  constraint lab_requests_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.lab_tests (
  id uuid not null default gen_random_uuid (),
  visit_id uuid null,
  patient_id uuid not null,
  doctor_id uuid not null,
  lab_tech_id uuid null,
  test_type text not null,
  result_data text null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint lab_tests_pkey primary key (id),
  constraint lab_tests_doctor_id_fkey foreign KEY (doctor_id) references profiles (id),
  constraint lab_tests_lab_tech_id_fkey foreign KEY (lab_tech_id) references profiles (id),
  constraint lab_tests_patient_id_fkey foreign KEY (patient_id) references profiles (id),
  constraint lab_tests_visit_id_fkey foreign KEY (visit_id) references visits (id) on delete CASCADE,
  constraint lab_tests_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.medical_records (
  id uuid not null default extensions.uuid_generate_v4 (),
  patient_id uuid not null,
  doctor_id uuid not null,
  clinic_id uuid null,
  diagnosis text not null,
  treatment_plan text null,
  confidential_notes text null,
  created_at timestamp with time zone null default now(),
  workspace_id uuid null,
  constraint medical_records_pkey primary key (id),
  constraint medical_records_clinic_id_fkey foreign KEY (clinic_id) references clinics (id),
  constraint medical_records_doctor_id_fkey foreign KEY (doctor_id) references profiles (id),
  constraint medical_records_patient_id_fkey foreign KEY (patient_id) references profiles (id) on delete CASCADE,
  constraint medical_records_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_medical_records_patient on public.medical_records using btree (patient_id) TABLESPACE pg_default;

create table public.medicines (
  id uuid not null default gen_random_uuid (),
  generic_name text not null,
  trading_name text null,
  type text null,
  formula text null,
  manufacturer text null,
  country text null,
  production_date date null,
  expiry_date date null,
  price_sdg numeric null default 0,
  price_sar numeric null default 0,
  price_usd numeric null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint medicines_pkey primary key (id),
  constraint medicines_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.operations (
  id uuid not null default gen_random_uuid (),
  visit_id uuid null,
  patient_id uuid not null,
  surgeon_id uuid not null,
  operation_name text not null,
  blood_units_required integer null default 0,
  status text null default 'scheduled'::text,
  notes text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint operations_pkey primary key (id),
  constraint operations_patient_id_fkey foreign KEY (patient_id) references patient_files (id) on delete CASCADE,
  constraint operations_surgeon_id_fkey foreign KEY (surgeon_id) references profiles (id),
  constraint operations_visit_id_fkey foreign KEY (visit_id) references visits (id),
  constraint operations_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.patient_files (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  uploaded_by uuid null,
  file_name text null,
  file_url text null,
  file_type text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  full_name text null,
  email text null,
  phone text null,
  date_of_birth date null,
  sex text null,
  address text null,
  blood_group text null,
  medical_history text null,
  workspace_id uuid null,
  constraint patient_files_pkey primary key (id),
  constraint patient_files_uploaded_by_fkey foreign KEY (uploaded_by) references profiles (id),
  constraint patient_files_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.patients (
  id uuid not null,
  date_of_birth date not null,
  blood_type text null,
  insurance_provider text null,
  insurance_policy_number text null,
  workspace_id uuid null,
  constraint patients_pkey primary key (id),
  constraint patients_id_fkey foreign KEY (id) references profiles (id) on delete CASCADE,
  constraint patients_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create trigger ensure_workspace_patients BEFORE INSERT on patients for EACH row
execute FUNCTION auto_assign_workspace_id ();

create table public.payroll (
  id bigserial not null,
  staff_id uuid null,
  base_salary numeric null default 0,
  status text null default 'unpaid'::text,
  last_paid timestamp with time zone null,
  workspace_id uuid null,
  constraint payroll_pkey primary key (id),
  constraint payroll_staff_id_fkey foreign KEY (staff_id) references profiles (id) on delete CASCADE,
  constraint payroll_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.pharmacies (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  address text null,
  license_number text not null,
  created_at timestamp with time zone null default now(),
  workspace_id uuid null,
  constraint pharmacies_pkey primary key (id),
  constraint pharmacies_license_number_key unique (license_number),
  constraint pharmacies_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.prescriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  record_id uuid not null,
  patient_id uuid not null,
  medication_name text not null,
  dosage text not null,
  instructions text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  status text null default 'pending'::text,
  dispensed_by uuid null,
  dispensed_at timestamp with time zone null,
  pharmacy_id uuid null,
  workspace_id uuid null,
  constraint prescriptions_pkey primary key (id),
  constraint prescriptions_patient_id_fkey foreign KEY (patient_id) references profiles (id),
  constraint prescriptions_pharmacy_id_fkey foreign KEY (pharmacy_id) references pharmacies (id),
  constraint prescriptions_dispensed_by_fkey foreign KEY (dispensed_by) references profiles (id),
  constraint prescriptions_record_id_fkey foreign KEY (record_id) references medical_records (id),
  constraint prescriptions_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id),
  constraint prescriptions_status_check check (
	(
	  status = any (
		array[
		  'pending'::text,
		  'dispensed'::text,
		  'cancelled'::text
		]
	  )
	)
  )
) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null default gen_random_uuid (),
  email text not null,
  full_name text not null,
  role text not null,
  clinic_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'pending'::text,
  pro_id text null,
  date_of_birth date null,
  gender text null,
  blood_group text null,
  phone_number text null,
  emergency_contact text null,
  allergies text null,
  workspace_id uuid null,
  constraint profiles_pkey primary key (id),
  constraint profiles_pro_id_key unique (pro_id),
  constraint profiles_email_key unique (email),
  constraint profiles_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id),
  constraint fk_clinic foreign KEY (clinic_id) references clinics (id),
  constraint profiles_blood_group_check check (
	(
	  blood_group = any (
		array[
		  'A+'::text,
		  'A-'::text,
		  'B+'::text,
		  'B-'::text,
		  'AB+'::text,
		  'AB-'::text,
		  'O+'::text,
		  'O-'::text
		]
	  )
	)
  ),
  constraint profiles_role_check check (
	(
	  role = any (
		array[
		  'admin'::text,
		  'super_admin'::text,
		  'nurse'::text,
		  'receptionist'::text,
		  'chemist'::text,
		  'patient'::text,
		  'doctor'::text,
		  'radiologist'::text,
		  'pathologist'::text
		]
	  )
	)
  ),
  constraint profiles_gender_check check (
	(
	  gender = any (
		array['Male'::text, 'Female'::text, 'Other'::text]
	  )
	)
  )
) TABLESPACE pg_default;

create trigger trigger_auto_pro_id BEFORE INSERT on profiles for EACH row
execute FUNCTION auto_generate_pro_id ();

create table public.tickets (
  id bigserial not null,
  patient_name text not null,
  patient_phone text null,
  date_of_birth date null,
  assigned_doctor_id uuid null,
  doctor_name text null,
  status text null default 'waiting_for_vitals'::text,
  blood_pressure text null,
  temperature numeric null,
  heart_rate integer null,
  weight_kg numeric null,
  nurse_notes text null,
  diagnosis text null,
  symptoms text null,
  treatment_plan text null,
  consultation_fee numeric null default 50.00,
  payment_status text null default 'unpaid'::text,
  created_at timestamp with time zone null default now(),
  prescribed_meds text null,
  pharmacy_notes text null,
  notes text null,
  patient_id uuid null,
  services_requested text null,
  total_bill numeric null,
  visit_type text null default 'check'::text,
  payment_method text null,
  currency text null default 'USD'::text,
  height_cm numeric null default 0,
  workspace_id uuid null,
  constraint tickets_pkey primary key (id),
  constraint tickets_assigned_doctor_id_fkey foreign KEY (assigned_doctor_id) references profiles (id) on delete set null,
  constraint tickets_patient_id_fkey foreign KEY (patient_id) references patient_files (id) on delete CASCADE,
  constraint tickets_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create index IF not exists idx_tickets_id on public.tickets using btree (id) TABLESPACE pg_default;

create table public.transactions (
  id uuid not null default gen_random_uuid (),
  type text not null,
  category text not null,
  amount numeric not null default 0,
  description text null,
  transaction_date timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint transactions_pkey primary key (id),
  constraint transactions_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.user_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  device_fingerprint text not null,
  last_login timestamp with time zone null default now(),
  is_trusted boolean null default false,
  workspace_id uuid null,
  constraint user_sessions_pkey primary key (id),
  constraint user_sessions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint user_sessions_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;

create table public.visits (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  doctor_id uuid null,
  nurse_id uuid null,
  status text null default 'waiting_triage'::text,
  vitals_bp text null,
  vitals_hr integer null,
  vitals_temp numeric null,
  triage_notes text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  workspace_id uuid null,
  constraint visits_pkey primary key (id),
  constraint visits_doctor_id_fkey foreign KEY (doctor_id) references profiles (id),
  constraint visits_nurse_id_fkey foreign KEY (nurse_id) references profiles (id),
  constraint visits_patient_id_fkey foreign KEY (patient_id) references profiles (id),
  constraint visits_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id)
) TABLESPACE pg_default;
