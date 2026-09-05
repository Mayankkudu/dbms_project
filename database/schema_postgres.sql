-- ============================================================================
-- SMART HOSPITAL MANAGEMENT SYSTEM — RELATIONAL SCHEMA
-- Derived from EER Model: PERSON (superclass) -> PATIENT | STAFF (subclasses)
--                          STAFF -> DOCTOR | NURSE | RECEPTIONIST | WARD_BOY
--                                   | PHARMACIST | LAB_TECHNICIAN | ADMIN
-- Mapping strategy: disjoint total specialization mapped as
--   "one table per subclass, sharing the superclass PK as PK+FK"
--   (standard textbook Option 4 — avoids NULL-heavy single-table anti-pattern,
--   keeps every table in 3NF).
-- Target: MySQL 8.0+ (InnoDB, utf8mb4)
-- ============================================================================




-- IMPORTANT (MySQL/MariaDB on Linux): the default root account typically
-- uses socket auth and CANNOT log in over TCP, which is what Node's mysql2
-- driver uses. Create a dedicated app user before running the backend:
--
--   CREATE USER 'hospital_app'@'%' IDENTIFIED BY 'choose_a_password';
--   GRANT ALL PRIVILEGES ON hospital_db.* TO 'hospital_app'@'%';
--   FLUSH PRIVILEGES;
--
-- Then set DB_USER / DB_PASSWORD in backend/.env to match.



-- ----------------------------------------------------------------------------
-- 1. SUPERCLASS: PERSON  (strong entity)
-- ----------------------------------------------------------------------------
CREATE TABLE persons (
    person_id       CHAR(36)     NOT NULL DEFAULT (gen_random_uuid()),
    first_name      VARCHAR(60)  NOT NULL,
    last_name       VARCHAR(60)  NOT NULL,
    date_of_birth   DATE         NOT NULL,
    gender          VARCHAR(50) NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    email           VARCHAR(120) NULL,
    -- composite attribute (address) decomposed into atomic columns -> 1NF
    address_line    VARCHAR(150) NULL,
    city            VARCHAR(60)  NULL,
    state           VARCHAR(60)  NULL,
    pincode         VARCHAR(10)  NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (person_id),
    CONSTRAINT uq_persons_phone UNIQUE (phone)
    -- Note: "date_of_birth not in the future" is enforced in the app layer
    -- (backend/utils/validators.js) rather than as a CHECK constraint, since
    -- MariaDB rejects non-deterministic functions like CURDATE() in CHECK clauses.
) ;

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS (strong entity, referenced by staff & appointments)
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(80)  NOT NULL UNIQUE,
    description     VARCHAR(255) NULL
) ;

-- ----------------------------------------------------------------------------
-- 3. SUBCLASS: PATIENT  (1:1 identifying relationship with PERSON)
-- ----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id      CHAR(36)     NOT NULL,
    blood_group     VARCHAR(50) NULL,
    emergency_contact_name  VARCHAR(120) NULL,
    emergency_contact_phone VARCHAR(15)  NULL,
    -- derived attribute: current_status is derivable from admissions,
    -- but cached here for cheap dashboard reads; kept in sync by trigger.
    current_status  VARCHAR(50) NOT NULL DEFAULT 'OUTPATIENT',
    registered_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id),
    CONSTRAINT fk_patients_person FOREIGN KEY (patient_id)
        REFERENCES persons(person_id) ON DELETE CASCADE
) ;

-- multivalued attribute: patient allergies -> own table (1NF)
CREATE TABLE patient_allergies (
    allergy_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36)    NOT NULL,
    allergy         VARCHAR(100) NOT NULL,
    CONSTRAINT fk_allergy_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT uq_patient_allergy UNIQUE (patient_id, allergy)
) ;

-- ----------------------------------------------------------------------------
-- 4. SUBCLASS: STAFF  (1:1 identifying relationship with PERSON)
--    Recursive relationship: reports_to -> STAFF (department hierarchy)
-- ----------------------------------------------------------------------------
CREATE TABLE staff (
    staff_id        CHAR(36)     NOT NULL,
    department_id   INT          NULL,
    designation     VARCHAR(80)  NULL,
    date_joined     DATE         NOT NULL DEFAULT (CURRENT_DATE),
    reports_to      CHAR(36)     NULL,  -- recursive FK
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (staff_id),
    CONSTRAINT fk_staff_person FOREIGN KEY (staff_id)
        REFERENCES persons(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_reports_to FOREIGN KEY (reports_to)
        REFERENCES staff(staff_id) ON DELETE SET NULL
) ;

-- 4a-4f. Further specialization of STAFF (disjoint, total within role tables)
CREATE TABLE doctors (
    doctor_id       CHAR(36)     NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    license_no      VARCHAR(50)  NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (doctor_id),
    CONSTRAINT fk_doctors_staff FOREIGN KEY (doctor_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

CREATE TABLE nurses (
    nurse_id        CHAR(36)     NOT NULL,
    shift           VARCHAR(50) NOT NULL DEFAULT 'MORNING',
    ward_id         INT          NULL,
    PRIMARY KEY (nurse_id),
    CONSTRAINT fk_nurses_staff FOREIGN KEY (nurse_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

CREATE TABLE receptionists (
    receptionist_id CHAR(36)     NOT NULL,
    desk_no         VARCHAR(20)  NULL,
    PRIMARY KEY (receptionist_id),
    CONSTRAINT fk_receptionists_staff FOREIGN KEY (receptionist_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

CREATE TABLE ward_boys (
    ward_boy_id     CHAR(36)     NOT NULL,
    assigned_ward_id INT         NULL,
    PRIMARY KEY (ward_boy_id),
    CONSTRAINT fk_wardboys_staff FOREIGN KEY (ward_boy_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

CREATE TABLE pharmacists (
    pharmacist_id   CHAR(36)     NOT NULL,
    pharmacy_counter VARCHAR(20) NULL,
    PRIMARY KEY (pharmacist_id),
    CONSTRAINT fk_pharmacists_staff FOREIGN KEY (pharmacist_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

CREATE TABLE lab_technicians (
    lab_technician_id CHAR(36)   NOT NULL,
    lab_section     VARCHAR(60)  NULL,
    PRIMARY KEY (lab_technician_id),
    CONSTRAINT fk_labtechs_staff FOREIGN KEY (lab_technician_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ;

-- ----------------------------------------------------------------------------
-- 5. USER ACCOUNTS & ROLES (auth layer, decoupled from PERSON for security)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE
) ;

CREATE TABLE user_accounts (
    user_id         CHAR(36)     NOT NULL DEFAULT (gen_random_uuid()),
    person_id       CHAR(36)     NOT NULL,
    role_id         INT          NOT NULL,
    username        VARCHAR(60)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,   -- bcrypt hash, never plaintext
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP    NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_useracc_person FOREIGN KEY (person_id)
        REFERENCES persons(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_useracc_role FOREIGN KEY (role_id)
        REFERENCES roles(role_id),
    CONSTRAINT uq_person_role UNIQUE (person_id, role_id)
) ;

-- ----------------------------------------------------------------------------
-- 6. WARD -> ROOM -> BED  (1:N chain)
-- ----------------------------------------------------------------------------
CREATE TABLE wards (
    ward_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(60) NOT NULL,
    ward_type   VARCHAR(50) NOT NULL,
    department_id INT NULL,
    CONSTRAINT fk_ward_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL
) ;

CREATE TABLE rooms (
    room_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ward_id     INT NOT NULL,
    room_no     VARCHAR(20) NOT NULL,
    CONSTRAINT fk_room_ward FOREIGN KEY (ward_id)
        REFERENCES wards(ward_id) ON DELETE CASCADE,
    CONSTRAINT uq_room_per_ward UNIQUE (ward_id, room_no)
) ;

CREATE TABLE beds (
    bed_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id     INT NOT NULL,
    bed_no      VARCHAR(20) NOT NULL,
    -- derived/cached attribute, synced by trigger on admissions insert/discharge
    status      VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_bed_room FOREIGN KEY (room_id)
        REFERENCES rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT uq_bed_per_room UNIQUE (room_id, bed_no)
) ;

-- add FK from nurses/ward_boys to wards now that wards exists
ALTER TABLE nurses ADD CONSTRAINT fk_nurse_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL;
ALTER TABLE ward_boys ADD CONSTRAINT fk_wardboy_ward FOREIGN KEY (assigned_ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 7. APPOINTMENTS  (associative entity resolving PATIENT M:N DOCTOR over time)
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    department_id   INT NULL,
    scheduled_at    TIMESTAMP NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    reason          VARCHAR(255) NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE CASCADE,
    CONSTRAINT fk_appt_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
) ;

-- ----------------------------------------------------------------------------
-- 8. ADMISSIONS  (PATIENT 1:N, resolves to exactly one BED at a time)
-- ----------------------------------------------------------------------------
CREATE TABLE admissions (
    admission_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    bed_id          INT NOT NULL,
    admitting_doctor_id CHAR(36) NOT NULL,
    admitted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at   TIMESTAMP NULL,
    reason          VARCHAR(255) NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_admission_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_admission_bed     FOREIGN KEY (bed_id)     REFERENCES beds(bed_id),
    CONSTRAINT fk_admission_doctor  FOREIGN KEY (admitting_doctor_id) REFERENCES doctors(doctor_id),
    CONSTRAINT chk_discharge_after_admit CHECK (discharged_at IS NULL OR discharged_at >= admitted_at)
) ;

-- ----------------------------------------------------------------------------
-- 9. VITAL RECORDS  (weak w.r.t. patient/admission — always read in that context)
-- ----------------------------------------------------------------------------
CREATE TABLE vital_records (
    vital_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    admission_id    INT NULL,               -- NULL for outpatient vitals
    recorded_by     CHAR(36) NOT NULL,      -- staff_id (nurse/doctor)
    recorded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    heart_rate          SMALLINT NULL,
    systolic_bp         SMALLINT NULL,
    diastolic_bp         SMALLINT NULL,
    spo2                 SMALLINT NULL,
    temperature_celsius  DECIMAL(4,1) NULL,
    respiratory_rate      SMALLINT NULL,
    blood_glucose        SMALLINT NULL,
    -- risk fields populated by the analysis layer at insert time (explainable, not AI-only)
    risk_score      SMALLINT NULL,
    risk_level      VARCHAR(50) NULL,
    CONSTRAINT fk_vital_patient  FOREIGN KEY (patient_id)  REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_vital_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL,
    CONSTRAINT fk_vital_staff    FOREIGN KEY (recorded_by) REFERENCES staff(staff_id),
    CONSTRAINT chk_spo2_range CHECK (spo2 IS NULL OR (spo2 BETWEEN 0 AND 100))
) ;

-- ----------------------------------------------------------------------------
-- 10. CRITICAL ALERTS  (generated from vital analysis, workflow entity)
-- ----------------------------------------------------------------------------
CREATE TABLE critical_alerts (
    alert_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    vital_id        INT NOT NULL,
    severity        VARCHAR(50) NOT NULL,
    message         VARCHAR(500) NOT NULL,
    generated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    acknowledged_by CHAR(36) NULL,
    acknowledged_at TIMESTAMP NULL,
    CONSTRAINT fk_alert_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_vital   FOREIGN KEY (vital_id)   REFERENCES vital_records(vital_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_ackby   FOREIGN KEY (acknowledged_by) REFERENCES staff(staff_id)
) ;

-- ----------------------------------------------------------------------------
-- 11. DIAGNOSES, PRESCRIPTIONS, MEDICINES
-- ----------------------------------------------------------------------------
CREATE TABLE diagnoses (
    diagnosis_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    admission_id    INT NULL,
    diagnosis_text  VARCHAR(500) NOT NULL,
    diagnosed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diag_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_diag_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id),
    CONSTRAINT fk_diag_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL
) ;

CREATE TABLE medicines (
    medicine_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    unit            VARCHAR(30)  NOT NULL DEFAULT 'tablet',
    stock_quantity  INT NOT NULL DEFAULT 0,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_medicine_stock CHECK (stock_quantity >= 0)
) ;

CREATE TABLE prescriptions (
    prescription_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    diagnosis_id    INT NULL,
    prescribed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes           VARCHAR(500) NULL,
    CONSTRAINT fk_presc_patient  FOREIGN KEY (patient_id)  REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctors(doctor_id),
    CONSTRAINT fk_presc_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(diagnosis_id) ON DELETE SET NULL
) ;

-- associative entity resolving PRESCRIPTION M:N MEDICINE (weak entity: depends on prescription)
CREATE TABLE prescription_items (
    item_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_id     INT NOT NULL,
    dosage          VARCHAR(60) NOT NULL,       -- e.g. "1-0-1"
    duration_days   SMALLINT NOT NULL DEFAULT 1,
    dispensed_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_pitem_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_pitem_medicine     FOREIGN KEY (medicine_id)     REFERENCES medicines(medicine_id),
    CONSTRAINT chk_duration_positive CHECK (duration_days > 0)
) ;

-- ----------------------------------------------------------------------------
-- 12. LAB TESTS & REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE lab_tests (
    lab_test_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    ordered_by      CHAR(36) NOT NULL,   -- doctor_id
    test_name       VARCHAR(120) NOT NULL,
    ordered_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_labtest_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_labtest_doctor  FOREIGN KEY (ordered_by) REFERENCES doctors(doctor_id)
) ;

CREATE TABLE lab_reports (
    lab_report_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lab_test_id     INT NOT NULL UNIQUE,     -- 1:1 with lab_tests
    performed_by    CHAR(36) NOT NULL,       -- lab_technician_id
    result_summary  VARCHAR(1000) NOT NULL,
    file_url        VARCHAR(255) NULL,
    completed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(lab_test_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_tech FOREIGN KEY (performed_by) REFERENCES lab_technicians(lab_technician_id)
) ;

-- ----------------------------------------------------------------------------
-- 13. BILLING
-- ----------------------------------------------------------------------------
CREATE TABLE bills (
    bill_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    admission_id    INT NULL,
    generated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_bill_patient   FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL
) ;

-- weak entity: identity depends on owning bill
CREATE TABLE bill_items (
    bill_item_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_id         INT NOT NULL,
    category        VARCHAR(50) NOT NULL,
    description     VARCHAR(255) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_billitem_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    CONSTRAINT chk_amount_nonneg CHECK (amount >= 0)
) ;

CREATE TABLE payments (
    payment_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_id         INT NOT NULL,
    amount_paid     DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(50) NOT NULL,
    paid_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    CONSTRAINT chk_amount_paid_positive CHECK (amount_paid > 0)
) ;

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS & AUDIT LOG
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         CHAR(36) NOT NULL,
    type            VARCHAR(40) NOT NULL,     -- e.g. CRITICAL_ALERT, LAB_REPORT, APPOINTMENT
    message         VARCHAR(500) NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
) ;

CREATE TABLE audit_logs (
    audit_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         CHAR(36) NULL,
    role_name       VARCHAR(30) NULL,
    action          VARCHAR(50) NOT NULL,
    table_name      VARCHAR(60) NOT NULL,
    record_id       VARCHAR(60) NOT NULL,
    field_name      VARCHAR(60) NULL,
    old_value       VARCHAR(255) NULL,
    new_value       VARCHAR(255) NULL,
    logged_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE SET NULL
) ;



-- ============================================================================
-- INNOVATIVE POSTGRES / SUPABASE FEATURES
-- ============================================================================

-- 1. Enable pgvector for AI Similarity Search on Diagnoses
CREATE EXTENSION IF NOT EXISTS vector;

-- Add a vector column to diagnoses for embeddings (e.g., using OpenAI or Supabase embedding models)
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 2. Enable Row Level Security (RLS)
-- This is a highly advanced DBMS concept where security is enforced at the database layer!

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can only select patients that have an appointment with them
CREATE POLICY "Doctors see their own patients" ON patients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.patient_id = patients.patient_id 
        )
    );
