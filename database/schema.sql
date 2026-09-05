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

CREATE DATABASE IF NOT EXISTS hospital_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- IMPORTANT (MySQL/MariaDB on Linux): the default root account typically
-- uses socket auth and CANNOT log in over TCP, which is what Node's mysql2
-- driver uses. Create a dedicated app user before running the backend:
--
--   CREATE USER 'hospital_app'@'%' IDENTIFIED BY 'choose_a_password';
--   GRANT ALL PRIVILEGES ON hospital_db.* TO 'hospital_app'@'%';
--   FLUSH PRIVILEGES;
--
-- Then set DB_USER / DB_PASSWORD in backend/.env to match.

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. SUPERCLASS: PERSON  (strong entity)
-- ----------------------------------------------------------------------------
CREATE TABLE persons (
    person_id       CHAR(36)     NOT NULL DEFAULT (UUID()),
    first_name      VARCHAR(60)  NOT NULL,
    last_name       VARCHAR(60)  NOT NULL,
    date_of_birth   DATE         NOT NULL,
    gender          ENUM('MALE','FEMALE','OTHER') NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    email           VARCHAR(120) NULL,
    -- composite attribute (address) decomposed into atomic columns -> 1NF
    address_line    VARCHAR(150) NULL,
    city            VARCHAR(60)  NULL,
    state           VARCHAR(60)  NULL,
    pincode         VARCHAR(10)  NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (person_id),
    UNIQUE KEY uq_persons_phone (phone)
    -- Note: "date_of_birth not in the future" is enforced in the app layer
    -- (backend/utils/validators.js) rather than as a CHECK constraint, since
    -- MariaDB rejects non-deterministic functions like CURDATE() in CHECK clauses.
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS (strong entity, referenced by staff & appointments)
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(80)  NOT NULL UNIQUE,
    description     VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. SUBCLASS: PATIENT  (1:1 identifying relationship with PERSON)
-- ----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id      CHAR(36)     NOT NULL,
    blood_group     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
    emergency_contact_name  VARCHAR(120) NULL,
    emergency_contact_phone VARCHAR(15)  NULL,
    -- derived attribute: current_status is derivable from admissions,
    -- but cached here for cheap dashboard reads; kept in sync by trigger.
    current_status  ENUM('OUTPATIENT','ADMITTED','DISCHARGED') NOT NULL DEFAULT 'OUTPATIENT',
    registered_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id),
    CONSTRAINT fk_patients_person FOREIGN KEY (patient_id)
        REFERENCES persons(person_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- multivalued attribute: patient allergies -> own table (1NF)
CREATE TABLE patient_allergies (
    allergy_id      INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36)    NOT NULL,
    allergy         VARCHAR(100) NOT NULL,
    CONSTRAINT fk_allergy_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    UNIQUE KEY uq_patient_allergy (patient_id, allergy)
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

-- 4a-4f. Further specialization of STAFF (disjoint, total within role tables)
CREATE TABLE doctors (
    doctor_id       CHAR(36)     NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    license_no      VARCHAR(50)  NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (doctor_id),
    CONSTRAINT fk_doctors_staff FOREIGN KEY (doctor_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE nurses (
    nurse_id        CHAR(36)     NOT NULL,
    shift           ENUM('MORNING','EVENING','NIGHT') NOT NULL DEFAULT 'MORNING',
    ward_id         INT          NULL,
    PRIMARY KEY (nurse_id),
    CONSTRAINT fk_nurses_staff FOREIGN KEY (nurse_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE receptionists (
    receptionist_id CHAR(36)     NOT NULL,
    desk_no         VARCHAR(20)  NULL,
    PRIMARY KEY (receptionist_id),
    CONSTRAINT fk_receptionists_staff FOREIGN KEY (receptionist_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ward_boys (
    ward_boy_id     CHAR(36)     NOT NULL,
    assigned_ward_id INT         NULL,
    PRIMARY KEY (ward_boy_id),
    CONSTRAINT fk_wardboys_staff FOREIGN KEY (ward_boy_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pharmacists (
    pharmacist_id   CHAR(36)     NOT NULL,
    pharmacy_counter VARCHAR(20) NULL,
    PRIMARY KEY (pharmacist_id),
    CONSTRAINT fk_pharmacists_staff FOREIGN KEY (pharmacist_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lab_technicians (
    lab_technician_id CHAR(36)   NOT NULL,
    lab_section     VARCHAR(60)  NULL,
    PRIMARY KEY (lab_technician_id),
    CONSTRAINT fk_labtechs_staff FOREIGN KEY (lab_technician_id)
        REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. USER ACCOUNTS & ROLES (auth layer, decoupled from PERSON for security)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id     INT AUTO_INCREMENT PRIMARY KEY,
    role_name   ENUM('PATIENT','DOCTOR','NURSE','RECEPTIONIST','WARD_BOY',
                      'PHARMACIST','LAB_TECHNICIAN','ADMIN') NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE user_accounts (
    user_id         CHAR(36)     NOT NULL DEFAULT (UUID()),
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
    UNIQUE KEY uq_person_role (person_id, role_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. WARD -> ROOM -> BED  (1:N chain)
-- ----------------------------------------------------------------------------
CREATE TABLE wards (
    ward_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(60) NOT NULL,
    ward_type   ENUM('GENERAL','ICU','EMERGENCY','MATERNITY','PEDIATRIC') NOT NULL,
    department_id INT NULL,
    CONSTRAINT fk_ward_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE rooms (
    room_id     INT AUTO_INCREMENT PRIMARY KEY,
    ward_id     INT NOT NULL,
    room_no     VARCHAR(20) NOT NULL,
    CONSTRAINT fk_room_ward FOREIGN KEY (ward_id)
        REFERENCES wards(ward_id) ON DELETE CASCADE,
    UNIQUE KEY uq_room_per_ward (ward_id, room_no)
) ENGINE=InnoDB;

CREATE TABLE beds (
    bed_id      INT AUTO_INCREMENT PRIMARY KEY,
    room_id     INT NOT NULL,
    bed_no      VARCHAR(20) NOT NULL,
    -- derived/cached attribute, synced by trigger on admissions insert/discharge
    status      ENUM('AVAILABLE','OCCUPIED','CLEANING','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_bed_room FOREIGN KEY (room_id)
        REFERENCES rooms(room_id) ON DELETE CASCADE,
    UNIQUE KEY uq_bed_per_room (room_id, bed_no)
) ENGINE=InnoDB;

-- add FK from nurses/ward_boys to wards now that wards exists
ALTER TABLE nurses ADD CONSTRAINT fk_nurse_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL;
ALTER TABLE ward_boys ADD CONSTRAINT fk_wardboy_ward FOREIGN KEY (assigned_ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 7. APPOINTMENTS  (associative entity resolving PATIENT M:N DOCTOR over time)
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id  INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    department_id   INT NULL,
    scheduled_at    DATETIME NOT NULL,
    status          ENUM('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    reason          VARCHAR(255) NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE CASCADE,
    CONSTRAINT fk_appt_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. ADMISSIONS  (PATIENT 1:N, resolves to exactly one BED at a time)
-- ----------------------------------------------------------------------------
CREATE TABLE admissions (
    admission_id    INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    bed_id          INT NOT NULL,
    admitting_doctor_id CHAR(36) NOT NULL,
    admitted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at   DATETIME NULL,
    reason          VARCHAR(255) NULL,
    status          ENUM('ACTIVE','DISCHARGED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_admission_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_admission_bed     FOREIGN KEY (bed_id)     REFERENCES beds(bed_id),
    CONSTRAINT fk_admission_doctor  FOREIGN KEY (admitting_doctor_id) REFERENCES doctors(doctor_id),
    CONSTRAINT chk_discharge_after_admit CHECK (discharged_at IS NULL OR discharged_at >= admitted_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. VITAL RECORDS  (weak w.r.t. patient/admission — always read in that context)
-- ----------------------------------------------------------------------------
CREATE TABLE vital_records (
    vital_id        INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    admission_id    INT NULL,               -- NULL for outpatient vitals
    recorded_by     CHAR(36) NOT NULL,      -- staff_id (nurse/doctor)
    recorded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    heart_rate          SMALLINT NULL,
    systolic_bp         SMALLINT NULL,
    diastolic_bp         SMALLINT NULL,
    spo2                 TINYINT NULL,
    temperature_celsius  DECIMAL(4,1) NULL,
    respiratory_rate      TINYINT NULL,
    blood_glucose        SMALLINT NULL,
    -- risk fields populated by the analysis layer at insert time (explainable, not AI-only)
    risk_score      TINYINT NULL,
    risk_level      ENUM('NORMAL','MONITOR','HIGH','CRITICAL') NULL,
    CONSTRAINT fk_vital_patient  FOREIGN KEY (patient_id)  REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_vital_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL,
    CONSTRAINT fk_vital_staff    FOREIGN KEY (recorded_by) REFERENCES staff(staff_id),
    CONSTRAINT chk_spo2_range CHECK (spo2 IS NULL OR (spo2 BETWEEN 0 AND 100))
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. CRITICAL ALERTS  (generated from vital analysis, workflow entity)
-- ----------------------------------------------------------------------------
CREATE TABLE critical_alerts (
    alert_id        INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    vital_id        INT NOT NULL,
    severity        ENUM('MONITOR','HIGH','CRITICAL') NOT NULL,
    message         VARCHAR(500) NOT NULL,
    generated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('OPEN','ACKNOWLEDGED') NOT NULL DEFAULT 'OPEN',
    acknowledged_by CHAR(36) NULL,
    acknowledged_at TIMESTAMP NULL,
    CONSTRAINT fk_alert_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_vital   FOREIGN KEY (vital_id)   REFERENCES vital_records(vital_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_ackby   FOREIGN KEY (acknowledged_by) REFERENCES staff(staff_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. DIAGNOSES, PRESCRIPTIONS, MEDICINES
-- ----------------------------------------------------------------------------
CREATE TABLE diagnoses (
    diagnosis_id    INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    admission_id    INT NULL,
    diagnosis_text  VARCHAR(500) NOT NULL,
    diagnosed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diag_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_diag_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id),
    CONSTRAINT fk_diag_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE medicines (
    medicine_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    unit            VARCHAR(30)  NOT NULL DEFAULT 'tablet',
    stock_quantity  INT NOT NULL DEFAULT 0,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_medicine_stock CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;

CREATE TABLE prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    doctor_id       CHAR(36) NOT NULL,
    diagnosis_id    INT NULL,
    prescribed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes           VARCHAR(500) NULL,
    CONSTRAINT fk_presc_patient  FOREIGN KEY (patient_id)  REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctors(doctor_id),
    CONSTRAINT fk_presc_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(diagnosis_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- associative entity resolving PRESCRIPTION M:N MEDICINE (weak entity: depends on prescription)
CREATE TABLE prescription_items (
    item_id         INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_id     INT NOT NULL,
    dosage          VARCHAR(60) NOT NULL,       -- e.g. "1-0-1"
    duration_days   SMALLINT NOT NULL DEFAULT 1,
    dispensed_status ENUM('PENDING','PARTIAL','DISPENSED','UNAVAILABLE') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_pitem_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_pitem_medicine     FOREIGN KEY (medicine_id)     REFERENCES medicines(medicine_id),
    CONSTRAINT chk_duration_positive CHECK (duration_days > 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. LAB TESTS & REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE lab_tests (
    lab_test_id     INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    ordered_by      CHAR(36) NOT NULL,   -- doctor_id
    test_name       VARCHAR(120) NOT NULL,
    ordered_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('PENDING','COMPLETED') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_labtest_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_labtest_doctor  FOREIGN KEY (ordered_by) REFERENCES doctors(doctor_id)
) ENGINE=InnoDB;

CREATE TABLE lab_reports (
    lab_report_id   INT AUTO_INCREMENT PRIMARY KEY,
    lab_test_id     INT NOT NULL UNIQUE,     -- 1:1 with lab_tests
    performed_by    CHAR(36) NOT NULL,       -- lab_technician_id
    result_summary  VARCHAR(1000) NOT NULL,
    file_url        VARCHAR(255) NULL,
    completed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(lab_test_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_tech FOREIGN KEY (performed_by) REFERENCES lab_technicians(lab_technician_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. BILLING
-- ----------------------------------------------------------------------------
CREATE TABLE bills (
    bill_id         INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36) NOT NULL,
    admission_id    INT NULL,
    generated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('PENDING','PARTIAL','PAID') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_bill_patient   FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- weak entity: identity depends on owning bill
CREATE TABLE bill_items (
    bill_item_id    INT AUTO_INCREMENT PRIMARY KEY,
    bill_id         INT NOT NULL,
    category        ENUM('CONSULTATION','ROOM_CHARGE','LAB_TEST','MEDICINE','PROCEDURE','OTHER') NOT NULL,
    description     VARCHAR(255) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_billitem_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    CONSTRAINT chk_amount_nonneg CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    bill_id         INT NOT NULL,
    amount_paid     DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('CASH','CARD','UPI','INSURANCE') NOT NULL,
    paid_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    CONSTRAINT chk_amount_paid_positive CHECK (amount_paid > 0)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS & AUDIT LOG
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         CHAR(36) NOT NULL,
    type            VARCHAR(40) NOT NULL,     -- e.g. CRITICAL_ALERT, LAB_REPORT, APPOINTMENT
    message         VARCHAR(500) NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    audit_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         CHAR(36) NULL,
    role_name       VARCHAR(30) NULL,
    action          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    table_name      VARCHAR(60) NOT NULL,
    record_id       VARCHAR(60) NOT NULL,
    field_name      VARCHAR(60) NULL,
    old_value       VARCHAR(255) NULL,
    new_value       VARCHAR(255) NULL,
    logged_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
