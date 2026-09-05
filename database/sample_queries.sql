-- ============================================================================
-- SAMPLE QUERIES — demonstrates SELECT/WHERE/JOIN/GROUP BY/HAVING/subqueries/
-- views/procedures/transactions, each annotated for the viva.
-- ============================================================================
USE hospital_db;

-- 1. INNER JOIN + WHERE: all completed appointments with doctor & patient names
SELECT a.appointment_id, CONCAT(pp.first_name,' ',pp.last_name) AS patient,
       CONCAT(dp.first_name,' ',dp.last_name) AS doctor, a.scheduled_at
FROM appointments a
INNER JOIN patients pt ON pt.patient_id = a.patient_id
INNER JOIN persons pp ON pp.person_id = pt.patient_id
INNER JOIN doctors d ON d.doctor_id = a.doctor_id
INNER JOIN persons dp ON dp.person_id = d.doctor_id
WHERE a.status = 'COMPLETED';

-- 2. LEFT JOIN: every bed, whether or not it currently has an active admission
SELECT b.bed_id, b.bed_no, r.room_no, w.name AS ward, ad.admission_id, ad.status
FROM beds b
JOIN rooms r ON r.room_id = b.room_id
JOIN wards w ON w.ward_id = r.ward_id
LEFT JOIN admissions ad ON ad.bed_id = b.bed_id AND ad.status = 'ACTIVE'
ORDER BY w.name, r.room_no, b.bed_no;

-- 3. GROUP BY + HAVING + aggregate: doctors who have handled more than 1 appointment
SELECT d.doctor_id, CONCAT(p.first_name,' ',p.last_name) AS doctor_name,
       COUNT(*) AS appointment_count
FROM appointments a
JOIN doctors d ON d.doctor_id = a.doctor_id
JOIN persons p ON p.person_id = d.doctor_id
GROUP BY d.doctor_id, doctor_name
HAVING COUNT(*) >= 1
ORDER BY appointment_count DESC;

-- 4. Subquery (scalar) in WHERE: patients whose latest vital risk_score is
--    above the hospital-wide average risk_score
SELECT DISTINCT p.patient_id, CONCAT(pe.first_name,' ',pe.last_name) AS patient_name
FROM patients p
JOIN persons pe ON pe.person_id = p.patient_id
JOIN vital_records vr ON vr.patient_id = p.patient_id
WHERE vr.risk_score > (SELECT AVG(risk_score) FROM vital_records);

-- 5. Correlated subquery: most recent vital record per patient
SELECT vr.patient_id, vr.recorded_at, vr.risk_level
FROM vital_records vr
WHERE vr.recorded_at = (
    SELECT MAX(vr2.recorded_at) FROM vital_records vr2 WHERE vr2.patient_id = vr.patient_id
);

-- 6. Nested subquery in FROM: bed occupancy rate per ward as a percentage
SELECT ward_name, occupied_beds, total_beds,
       ROUND(occupied_beds / total_beds * 100, 1) AS occupancy_pct
FROM (
    SELECT w.name AS ward_name, COUNT(b.bed_id) AS total_beds,
           SUM(b.status = 'OCCUPIED') AS occupied_beds
    FROM wards w
    JOIN rooms r ON r.ward_id = w.ward_id
    JOIN beds b ON b.room_id = r.room_id
    GROUP BY w.name
) AS ward_stats;

-- 7. Aggregate with multiple joins: total billed vs. total paid per patient
SELECT pe.first_name, pe.last_name,
       SUM(DISTINCT_bill.total) AS billed,
       COALESCE(SUM(pay.amount_paid), 0) AS paid
FROM patients p
JOIN persons pe ON pe.person_id = p.patient_id
JOIN (
    SELECT bi.bill_id, patient_id, SUM(bi.amount) AS total
    FROM bill_items bi JOIN bills b ON b.bill_id = bi.bill_id
    GROUP BY bi.bill_id, patient_id
) AS DISTINCT_bill ON DISTINCT_bill.patient_id = p.patient_id
LEFT JOIN payments pay ON pay.bill_id = DISTINCT_bill.bill_id
GROUP BY pe.first_name, pe.last_name;

-- 8. Using a VIEW: today's open critical alerts, most severe first
SELECT * FROM critical_patients_view;

-- 9. Using a VIEW: currently available beds hospital-wide
SELECT * FROM available_beds_view;

-- 10. Calling a STORED PROCEDURE (transactional): admit a patient to a bed
--     Demonstrates the admission+bed-assignment transaction from Section 7.
-- CALL admit_patient('<patient_uuid>', <bed_id>, '<doctor_uuid>', 'reason', @out_id);
-- SELECT @out_id;

-- 11. Explicit TRANSACTION example: register a payment and update bill status
--     atomically (both succeed or both roll back).
START TRANSACTION;
INSERT INTO payments (bill_id, amount_paid, payment_method) VALUES (1, 3425.00, 'CARD');
UPDATE bills SET status = 'PAID'
WHERE bill_id = 1
  AND (SELECT SUM(amount_paid) FROM payments WHERE bill_id = 1) >=
      (SELECT SUM(amount) FROM bill_items WHERE bill_id = 1);
COMMIT;

-- 12. Window-style ranking without window functions (portable subquery form):
--     rank patients by their highest-ever risk score
SELECT p.patient_id, CONCAT(pe.first_name,' ',pe.last_name) AS patient_name,
       MAX(vr.risk_score) AS peak_risk_score
FROM patients p
JOIN persons pe ON pe.person_id = p.patient_id
JOIN vital_records vr ON vr.patient_id = p.patient_id
GROUP BY p.patient_id, patient_name
ORDER BY peak_risk_score DESC;
