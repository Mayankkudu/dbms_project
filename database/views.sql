-- ============================================================================
-- VIEWS
-- ============================================================================
USE hospital_db;

CREATE OR REPLACE VIEW critical_patients_view AS
SELECT
    ca.alert_id, p.patient_id AS patient_id,
    CONCAT(pe.first_name, ' ', pe.last_name) AS patient_name,
    ca.severity, ca.message, ca.generated_at, ca.status,
    vr.spo2, vr.heart_rate, vr.systolic_bp, vr.diastolic_bp, vr.risk_score
FROM critical_alerts ca
JOIN patients p ON p.patient_id = ca.patient_id
JOIN persons pe ON pe.person_id = p.patient_id
JOIN vital_records vr ON vr.vital_id = ca.vital_id
WHERE ca.status = 'OPEN'
ORDER BY FIELD(ca.severity,'CRITICAL','HIGH','MONITOR'), ca.generated_at DESC;

CREATE OR REPLACE VIEW doctor_patient_view AS
SELECT DISTINCT
    d.doctor_id, CONCAT(dp.first_name,' ',dp.last_name) AS doctor_name,
    pt.patient_id, CONCAT(pp.first_name,' ',pp.last_name) AS patient_name,
    pt.current_status
FROM doctors d
JOIN persons dp ON dp.person_id = d.doctor_id
JOIN appointments a ON a.doctor_id = d.doctor_id
JOIN patients pt ON pt.patient_id = a.patient_id
JOIN persons pp ON pp.person_id = pt.patient_id;

CREATE OR REPLACE VIEW available_beds_view AS
SELECT
    b.bed_id, b.bed_no, r.room_no, w.ward_id, w.name AS ward_name, w.ward_type
FROM beds b
JOIN rooms r ON r.room_id = b.room_id
JOIN wards w ON w.ward_id = r.ward_id
WHERE b.status = 'AVAILABLE';

CREATE OR REPLACE VIEW patient_medical_history_view AS
SELECT
    pt.patient_id,
    CONCAT(pe.first_name,' ',pe.last_name) AS patient_name,
    dg.diagnosis_id, dg.diagnosis_text, dg.diagnosed_at,
    pr.prescription_id, pr.prescribed_at,
    lt.lab_test_id, lt.test_name, lt.status AS lab_status
FROM patients pt
JOIN persons pe ON pe.person_id = pt.patient_id
LEFT JOIN diagnoses dg ON dg.patient_id = pt.patient_id
LEFT JOIN prescriptions pr ON pr.patient_id = pt.patient_id
LEFT JOIN lab_tests lt ON lt.patient_id = pt.patient_id;

CREATE OR REPLACE VIEW bed_occupancy_summary_view AS
SELECT
    w.ward_id, w.name AS ward_name,
    COUNT(b.bed_id) AS total_beds,
    SUM(b.status = 'OCCUPIED') AS occupied_beds,
    SUM(b.status = 'AVAILABLE') AS available_beds
FROM wards w
JOIN rooms r ON r.ward_id = w.ward_id
JOIN beds b ON b.room_id = r.room_id
GROUP BY w.ward_id, w.name;
