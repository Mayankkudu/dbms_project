-- ============================================================================
-- ADDITIONAL CONSTRAINTS & INDEXES
-- (Primary/Foreign/basic CHECK/UNIQUE/DEFAULT already declared in schema.sql;
--  this file adds constraints that are clearer to express post-creation,
--  plus indexes that matter for the dashboard queries this app runs a lot.)
-- ============================================================================
USE hospital_db;

-- A patient can only have ONE active admission at a time.
-- Enforced via a generated column + unique index (MySQL has no partial
-- unique index, so we use a NULL-when-not-active trick).
ALTER TABLE admissions
  ADD COLUMN active_flag TINYINT
  GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE NULL END) STORED;

ALTER TABLE admissions
  ADD UNIQUE KEY uq_one_active_admission_per_patient (patient_id, active_flag);

-- A bed can only be the target of ONE active admission at a time.
ALTER TABLE admissions
  ADD UNIQUE KEY uq_one_active_admission_per_bed (bed_id, active_flag);

-- Frequently filtered/joined columns
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_vitals_patient_time ON vital_records(patient_id, recorded_at);
CREATE INDEX idx_alerts_status_severity ON critical_alerts(status, severity);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_labtests_status ON lab_tests(status);
CREATE INDEX idx_bills_patient_status ON bills(patient_id, status);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Doctors can only be assigned appointments within their own department
-- (soft rule — enforced in application layer + documented here, since
-- cross-column-table CHECK constraints referencing another table aren't
-- portable in MySQL; the real enforcement is in appointment.service.js).
