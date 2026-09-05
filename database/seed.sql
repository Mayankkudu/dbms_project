-- ============================================================================
-- SEED DATA
-- All demo accounts use password: password123
-- (bcrypt hash below was generated with cost factor 10 — same hash reused
-- across demo users purely for seed convenience; real signups get unique salts)
-- ============================================================================
USE hospital_db;
SET @pwd := '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.';

-- ---- Roles ----
INSERT INTO roles (role_name) VALUES
('PATIENT'),('DOCTOR'),('NURSE'),('RECEPTIONIST'),
('WARD_BOY'),('PHARMACIST'),('LAB_TECHNICIAN'),('ADMIN');

-- ---- Departments ----
INSERT INTO departments (name, description) VALUES
('Cardiology','Heart and cardiovascular care'),
('General Medicine','General outpatient and inpatient care'),
('Emergency','Emergency and trauma care'),
('Orthopedics','Bone and joint care'),
('Pediatrics','Child healthcare');

-- ---- Wards / Rooms / Beds ----
INSERT INTO wards (name, ward_type, department_id) VALUES
('ICU Ward', 'ICU', 3),
('General Ward A', 'GENERAL', 2),
('Cardiology Ward', 'GENERAL', 1);

INSERT INTO rooms (ward_id, room_no) VALUES
(1,'101'),(1,'102'),(2,'201'),(2,'202'),(3,'301');

INSERT INTO beds (room_id, bed_no, status) VALUES
(1,'A', 'AVAILABLE'),(1,'B','AVAILABLE'),
(2,'A','AVAILABLE'),(2,'B','AVAILABLE'),
(3,'A','AVAILABLE'),(3,'B','AVAILABLE'),
(4,'A','AVAILABLE'),(4,'B','AVAILABLE'),
(5,'A','AVAILABLE');

-- ---- Admin ----
SET @admin_person := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@admin_person,'Asha','Verma','1985-04-12','FEMALE','9800000001','admin@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@admin_person, NULL, 'System Administrator');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@admin_person, (SELECT role_id FROM roles WHERE role_name='ADMIN'), 'admin', @pwd);

-- ---- Doctors ----
SET @doc1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@doc1,'Rohan','Mehta','1980-01-15','MALE','9800000002','rohan.mehta@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@doc1, 1, 'Senior Cardiologist');
INSERT INTO doctors (doctor_id, specialization, license_no, consultation_fee)
VALUES (@doc1, 'Cardiology', 'LIC-CARD-001', 800.00);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@doc1, (SELECT role_id FROM roles WHERE role_name='DOCTOR'), 'dr.mehta', @pwd);

SET @doc2 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@doc2,'Kavita','Rao','1982-06-22','FEMALE','9800000003','kavita.rao@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@doc2, 2, 'General Physician');
INSERT INTO doctors (doctor_id, specialization, license_no, consultation_fee)
VALUES (@doc2, 'General Medicine', 'LIC-GEN-002', 500.00);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@doc2, (SELECT role_id FROM roles WHERE role_name='DOCTOR'), 'dr.rao', @pwd);

-- ---- Nurse ----
SET @nurse1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@nurse1,'Priya','Nair','1992-09-05','FEMALE','9800000004','priya.nair@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@nurse1, 3, 'Staff Nurse');
INSERT INTO nurses (nurse_id, shift, ward_id) VALUES (@nurse1, 'MORNING', 1);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@nurse1, (SELECT role_id FROM roles WHERE role_name='NURSE'), 'nurse.priya', @pwd);

-- ---- Receptionist ----
SET @recep1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@recep1,'Sunil','Kadam','1990-03-18','MALE','9800000005','sunil.kadam@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@recep1, NULL, 'Front Desk');
INSERT INTO receptionists (receptionist_id, desk_no) VALUES (@recep1, 'D1');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@recep1, (SELECT role_id FROM roles WHERE role_name='RECEPTIONIST'), 'reception1', @pwd);

-- ---- Ward Boy ----
SET @wardboy1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@wardboy1,'Mahesh','Jadhav','1995-11-02','MALE','9800000006','mahesh.jadhav@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@wardboy1, NULL, 'Ward Assistant');
INSERT INTO ward_boys (ward_boy_id, assigned_ward_id) VALUES (@wardboy1, 1);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@wardboy1, (SELECT role_id FROM roles WHERE role_name='WARD_BOY'), 'wardboy1', @pwd);

-- ---- Pharmacist ----
SET @pharm1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@pharm1,'Neha','Joshi','1991-07-25','FEMALE','9800000007','neha.joshi@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@pharm1, NULL, 'Pharmacist');
INSERT INTO pharmacists (pharmacist_id, pharmacy_counter) VALUES (@pharm1, 'P1');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@pharm1, (SELECT role_id FROM roles WHERE role_name='PHARMACIST'), 'pharmacist1', @pwd);

-- ---- Lab Technician ----
SET @labtech1 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES (@labtech1,'Arjun','Singh','1993-02-14','MALE','9800000008','arjun.singh@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES (@labtech1, NULL, 'Lab Technician');
INSERT INTO lab_technicians (lab_technician_id, lab_section) VALUES (@labtech1, 'Pathology');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@labtech1, (SELECT role_id FROM roles WHERE role_name='LAB_TECHNICIAN'), 'labtech1', @pwd);

-- ---- Patients ----
-- Demo patient whose vitals progress NORMAL -> MONITOR -> CRITICAL
SET @pat_demo := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, address_line, city, state, pincode)
VALUES (@pat_demo,'Rahul','Sharma','1988-05-20','MALE','9811111111','rahul.sharma@example.demo','12 MG Road','Mumbai','Maharashtra','400001');
INSERT INTO patients (patient_id, blood_group, emergency_contact_name, emergency_contact_phone)
VALUES (@pat_demo, 'O+', 'Meena Sharma', '9822222222');
INSERT INTO patient_allergies (patient_id, allergy) VALUES (@pat_demo, 'Penicillin');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@pat_demo, (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'rahul.sharma', @pwd);

SET @pat2 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, city, state)
VALUES (@pat2,'Anita','Deshmukh','1995-08-11','FEMALE','9833333333','anita.d@example.demo','Pune','Maharashtra');
INSERT INTO patients (patient_id, blood_group) VALUES (@pat2, 'B+');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@pat2, (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'anita.deshmukh', @pwd);

SET @pat3 := UUID();
INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, city, state)
VALUES (@pat3,'Vikram','Patil','1975-12-30','MALE','9844444444','vikram.p@example.demo','Nashik','Maharashtra');
INSERT INTO patients (patient_id, blood_group) VALUES (@pat3, 'A-');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES (@pat3, (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'vikram.patil', @pwd);

-- ---- Appointments ----
INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, status, reason)
VALUES
(@pat_demo, @doc1, 1, '2026-08-18 10:00:00', 'COMPLETED', 'Chest discomfort, follow-up'),
(@pat2, @doc2, 2, '2026-08-20 11:30:00', 'SCHEDULED', 'Routine checkup'),
(@pat3, @doc1, 1, '2026-08-21 09:00:00', 'SCHEDULED', 'Hypertension review');

-- ---- Admission for demo patient (drives the vitals/alert demo) ----
CALL admit_patient(@pat_demo, 1, @doc1, 'Observation for chest discomfort and dropping SpO2', @adm_demo);

-- ---- Vitals progression: NORMAL -> MONITOR -> CRITICAL ----
-- Each insert fires trg_vital_after_insert, which scores risk and raises
-- a critical_alerts row automatically once the score crosses threshold.
INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES (@pat_demo, @adm_demo, @nurse1, '2026-08-19 10:00:00', 78, 118, 76, 98, 37.0, 16, 92);

INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES (@pat_demo, @adm_demo, @nurse1, '2026-08-19 14:00:00', 95, 130, 84, 94, 37.6, 20, 96);

INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES (@pat_demo, @adm_demo, @nurse1, '2026-08-19 18:00:00', 118, 88, 58, 86, 38.9, 26, 101);

-- ---- Diagnosis / Prescription / Medicines for demo patient ----
INSERT INTO diagnoses (patient_id, doctor_id, admission_id, diagnosis_text)
VALUES (@pat_demo, @doc1, @adm_demo, 'Suspected acute coronary event; hypoxia observed. Further cardiac workup ordered.');
SET @diag_demo := LAST_INSERT_ID();

INSERT INTO medicines (name, unit, stock_quantity, unit_price) VALUES
('Aspirin 75mg','tablet',500,2.50),
('Atorvastatin 20mg','tablet',300,5.00),
('Amoxicillin 500mg','capsule',200,8.00),
('Paracetamol 650mg','tablet',1000,1.50),
('Metformin 500mg','tablet',400,3.00);

INSERT INTO prescriptions (patient_id, doctor_id, diagnosis_id, notes)
VALUES (@pat_demo, @doc1, @diag_demo, 'Start cardiac protocol, monitor SpO2 closely');
SET @presc_demo := LAST_INSERT_ID();

INSERT INTO prescription_items (prescription_id, medicine_id, dosage, duration_days)
VALUES (@presc_demo, 1, '1-0-0', 30), (@presc_demo, 2, '0-0-1', 30);

-- ---- Lab test + report ----
INSERT INTO lab_tests (patient_id, ordered_by, test_name, status)
VALUES (@pat_demo, @doc1, 'Troponin-I Level', 'COMPLETED');
SET @labtest_demo := LAST_INSERT_ID();

INSERT INTO lab_reports (lab_test_id, performed_by, result_summary)
VALUES (@labtest_demo, @labtech1, 'Troponin-I: 0.8 ng/mL (elevated). Correlate clinically with cardiac symptoms.');

-- pending lab test example for lab dashboard
INSERT INTO lab_tests (patient_id, ordered_by, test_name, status)
VALUES (@pat2, @doc2, 'Complete Blood Count', 'PENDING');

-- ---- Billing ----
CALL generate_bill(@pat_demo, @adm_demo, @bill_demo);
INSERT INTO bill_items (bill_id, category, description, amount) VALUES
(@bill_demo, 'CONSULTATION', 'Cardiology consultation', 800.00),
(@bill_demo, 'ROOM_CHARGE', 'ICU bed - 1 day', 3500.00),
(@bill_demo, 'LAB_TEST', 'Troponin-I test', 900.00),
(@bill_demo, 'MEDICINE', 'Aspirin + Atorvastatin (30 days)', 225.00);

INSERT INTO payments (bill_id, amount_paid, payment_method)
VALUES (@bill_demo, 2000.00, 'UPI');

-- ---- Notifications ----
INSERT INTO notifications (user_id, type, message)
SELECT ua.user_id, 'CRITICAL_ALERT', 'Critical alert raised for patient Rahul Sharma'
FROM user_accounts ua WHERE ua.username = 'dr.mehta';

INSERT INTO notifications (user_id, type, message)
SELECT ua.user_id, 'LAB_REPORT', 'New lab report available: Troponin-I Level'
FROM user_accounts ua WHERE ua.username = 'dr.mehta';
