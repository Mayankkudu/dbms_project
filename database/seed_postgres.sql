-- ============================================================================
-- SEED DATA
-- All demo accounts use password: password123
-- (bcrypt hash below was generated with cost factor 10 — same hash reused
-- across demo users purely for seed convenience; real signups get unique salts)
-- ============================================================================



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

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('11111111-1111-1111-1111-111111111111','Asha','Verma','1985-04-12','FEMALE','9800000001','admin@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('11111111-1111-1111-1111-111111111111', NULL, 'System Administrator');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('11111111-1111-1111-1111-111111111111', (SELECT role_id FROM roles WHERE role_name='ADMIN'), 'admin', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Doctors ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('22222222-2222-2222-2222-222222222222','Rohan','Mehta','1980-01-15','MALE','9800000002','rohan.mehta@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('22222222-2222-2222-2222-222222222222', 1, 'Senior Cardiologist');
INSERT INTO doctors (doctor_id, specialization, license_no, consultation_fee)
VALUES ('22222222-2222-2222-2222-222222222222', 'Cardiology', 'LIC-CARD-001', 800.00);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('22222222-2222-2222-2222-222222222222', (SELECT role_id FROM roles WHERE role_name='DOCTOR'), 'dr.mehta', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');


INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('33333333-3333-3333-3333-333333333333','Kavita','Rao','1982-06-22','FEMALE','9800000003','kavita.rao@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('33333333-3333-3333-3333-333333333333', 2, 'General Physician');
INSERT INTO doctors (doctor_id, specialization, license_no, consultation_fee)
VALUES ('33333333-3333-3333-3333-333333333333', 'General Medicine', 'LIC-GEN-002', 500.00);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('33333333-3333-3333-3333-333333333333', (SELECT role_id FROM roles WHERE role_name='DOCTOR'), 'dr.rao', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Nurse ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('44444444-4444-4444-4444-444444444444','Priya','Nair','1992-09-05','FEMALE','9800000004','priya.nair@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('44444444-4444-4444-4444-444444444444', 3, 'Staff Nurse');
INSERT INTO nurses (nurse_id, shift, ward_id) VALUES ('44444444-4444-4444-4444-444444444444', 'MORNING', 1);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('44444444-4444-4444-4444-444444444444', (SELECT role_id FROM roles WHERE role_name='NURSE'), 'nurse.priya', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Receptionist ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('55555555-5555-5555-5555-555555555555','Sunil','Kadam','1990-03-18','MALE','9800000005','sunil.kadam@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('55555555-5555-5555-5555-555555555555', NULL, 'Front Desk');
INSERT INTO receptionists (receptionist_id, desk_no) VALUES ('55555555-5555-5555-5555-555555555555', 'D1');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('55555555-5555-5555-5555-555555555555', (SELECT role_id FROM roles WHERE role_name='RECEPTIONIST'), 'reception1', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Ward Boy ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('66666666-6666-6666-6666-666666666666','Mahesh','Jadhav','1995-11-02','MALE','9800000006','mahesh.jadhav@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('66666666-6666-6666-6666-666666666666', NULL, 'Ward Assistant');
INSERT INTO ward_boys (ward_boy_id, assigned_ward_id) VALUES ('66666666-6666-6666-6666-666666666666', 1);
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('66666666-6666-6666-6666-666666666666', (SELECT role_id FROM roles WHERE role_name='WARD_BOY'), 'wardboy1', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Pharmacist ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('77777777-7777-7777-7777-777777777777','Neha','Joshi','1991-07-25','FEMALE','9800000007','neha.joshi@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('77777777-7777-7777-7777-777777777777', NULL, 'Pharmacist');
INSERT INTO pharmacists (pharmacist_id, pharmacy_counter) VALUES ('77777777-7777-7777-7777-777777777777', 'P1');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('77777777-7777-7777-7777-777777777777', (SELECT role_id FROM roles WHERE role_name='PHARMACIST'), 'pharmacist1', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Lab Technician ----

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('88888888-8888-8888-8888-888888888888','Arjun','Singh','1993-02-14','MALE','9800000008','arjun.singh@hospital.demo');
INSERT INTO staff (staff_id, department_id, designation) VALUES ('88888888-8888-8888-8888-888888888888', NULL, 'Lab Technician');
INSERT INTO lab_technicians (lab_technician_id, lab_section) VALUES ('88888888-8888-8888-8888-888888888888', 'Pathology');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('88888888-8888-8888-8888-888888888888', (SELECT role_id FROM roles WHERE role_name='LAB_TECHNICIAN'), 'labtech1', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Patients ----
-- Demo patient whose vitals progress NORMAL -> MONITOR -> CRITICAL

INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, address_line, city, state, pincode)
VALUES ('99999999-9999-9999-9999-999999999999','Rahul','Sharma','1988-05-20','MALE','9811111111','rahul.sharma@example.demo','12 MG Road','Mumbai','Maharashtra','400001');
INSERT INTO patients (patient_id, blood_group, emergency_contact_name, emergency_contact_phone)
VALUES ('99999999-9999-9999-9999-999999999999', 'O+', 'Meena Sharma', '9822222222');
INSERT INTO patient_allergies (patient_id, allergy) VALUES ('99999999-9999-9999-9999-999999999999', 'Penicillin');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('99999999-9999-9999-9999-999999999999', (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'rahul.sharma', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');


INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, city, state)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Anita','Deshmukh','1995-08-11','FEMALE','9833333333','anita.d@example.demo','Pune','Maharashtra');
INSERT INTO patients (patient_id, blood_group) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B+');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'anita.deshmukh', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');


INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email, city, state)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Vikram','Patil','1975-12-30','MALE','9844444444','vikram.p@example.demo','Nashik','Maharashtra');
INSERT INTO patients (patient_id, blood_group) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'A-');
INSERT INTO user_accounts (person_id, role_id, username, password_hash)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT role_id FROM roles WHERE role_name='PATIENT'), 'vikram.patil', '$2b$10$.nNhAQk7RyJ6ZqhOLWyKH.SVIvl40pCGSbJAXNHKOkWMvrSwuMSx.');

-- ---- Appointments ----
INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, status, reason)
VALUES
('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 1, '2026-08-18 10:00:00', 'COMPLETED', 'Chest discomfort, follow-up'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 2, '2026-08-20 11:30:00', 'SCHEDULED', 'Routine checkup'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 1, '2026-08-21 09:00:00', 'SCHEDULED', 'Hypertension review');

-- ---- Admission for demo patient (drives the vitals/alert demo) ----
SELECT admit_patient('99999999-9999-9999-9999-999999999999', 1, '22222222-2222-2222-2222-222222222222', 'Observation for chest discomfort and dropping SpO2');

-- ---- Vitals progression: NORMAL -> MONITOR -> CRITICAL ----
-- Each insert fires trg_vital_after_insert, which scores risk and raises
-- a critical_alerts row automatically once the score crosses threshold.
INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES ('99999999-9999-9999-9999-999999999999', 1, '44444444-4444-4444-4444-444444444444', '2026-08-19 10:00:00', 78, 118, 76, 98, 37.0, 16, 92);

INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES ('99999999-9999-9999-9999-999999999999', 1, '44444444-4444-4444-4444-444444444444', '2026-08-19 14:00:00', 95, 130, 84, 94, 37.6, 20, 96);

INSERT INTO vital_records (patient_id, admission_id, recorded_by, recorded_at, heart_rate, systolic_bp, diastolic_bp, spo2, temperature_celsius, respiratory_rate, blood_glucose)
VALUES ('99999999-9999-9999-9999-999999999999', 1, '44444444-4444-4444-4444-444444444444', '2026-08-19 18:00:00', 118, 88, 58, 86, 38.9, 26, 101);

-- ---- Diagnosis / Prescription / Medicines for demo patient ----
INSERT INTO diagnoses (patient_id, doctor_id, admission_id, diagnosis_text)
VALUES ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 1, 'Suspected acute coronary event; hypoxia observed. Further cardiac workup ordered.');


INSERT INTO medicines (name, unit, stock_quantity, unit_price) VALUES
('Aspirin 75mg','tablet',500,2.50),
('Atorvastatin 20mg','tablet',300,5.00),
('Amoxicillin 500mg','capsule',200,8.00),
('Paracetamol 650mg','tablet',1000,1.50),
('Metformin 500mg','tablet',400,3.00);

INSERT INTO prescriptions (patient_id, doctor_id, diagnosis_id, notes)
VALUES ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 1, 'Start cardiac protocol, monitor SpO2 closely');


INSERT INTO prescription_items (prescription_id, medicine_id, dosage, duration_days)
VALUES (1, 1, '1-0-0', 30), (1, 2, '0-0-1', 30);

-- ---- Lab test + report ----
INSERT INTO lab_tests (patient_id, ordered_by, test_name, status)
VALUES ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'Troponin-I Level', 'COMPLETED');


INSERT INTO lab_reports (lab_test_id, performed_by, result_summary)
VALUES (1, '88888888-8888-8888-8888-888888888888', 'Troponin-I: 0.8 ng/mL (elevated). Correlate clinically with cardiac symptoms.');

-- pending lab test example for lab dashboard
INSERT INTO lab_tests (patient_id, ordered_by, test_name, status)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Complete Blood Count', 'PENDING');

-- ---- Billing ----
SELECT generate_bill('99999999-9999-9999-9999-999999999999', 1);
INSERT INTO bill_items (bill_id, category, description, amount) VALUES
(1, 'CONSULTATION', 'Cardiology consultation', 800.00),
(1, 'ROOM_CHARGE', 'ICU bed - 1 day', 3500.00),
(1, 'LAB_TEST', 'Troponin-I test', 900.00),
(1, 'MEDICINE', 'Aspirin + Atorvastatin (30 days)', 225.00);

INSERT INTO payments (bill_id, amount_paid, payment_method)
VALUES (1, 2000.00, 'UPI');

-- ---- Notifications ----
INSERT INTO notifications (user_id, type, message)
SELECT ua.user_id, 'CRITICAL_ALERT', 'Critical alert raised for patient Rahul Sharma'
FROM user_accounts ua WHERE ua.username = 'dr.mehta';

INSERT INTO notifications (user_id, type, message)
SELECT ua.user_id, 'LAB_REPORT', 'New lab report available: Troponin-I Level'
FROM user_accounts ua WHERE ua.username = 'dr.mehta';
