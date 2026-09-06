-- ============================================================================
-- TRIGGERS
-- ============================================================================
USE hospital_db;
DELIMITER $$

-- ----------------------------------------------------------------------------
-- TRIGGER 1a: On admission INSERT -> bed becomes OCCUPIED, patient ADMITTED
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_admission_after_insert
AFTER INSERT ON admissions
FOR EACH ROW
BEGIN
    UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = NEW.bed_id;
    UPDATE patients SET current_status = 'ADMITTED' WHERE patient_id = NEW.patient_id;

    INSERT INTO audit_logs (user_id, role_name, action, table_name, record_id, field_name, old_value, new_value)
    VALUES (NULL, NULL, 'INSERT', 'admissions', NEW.admission_id, 'status', NULL, 'ACTIVE');
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 1b: On discharge (status ACTIVE -> DISCHARGED) -> bed AVAILABLE
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_admission_after_update
AFTER UPDATE ON admissions
FOR EACH ROW
BEGIN
    IF OLD.status = 'ACTIVE' AND NEW.status = 'DISCHARGED' THEN
        UPDATE beds SET status = 'CLEANING', cleaning_started_at = NOW() WHERE bed_id = NEW.bed_id;
        UPDATE patients SET current_status = 'DISCHARGED' WHERE patient_id = NEW.patient_id;

        INSERT INTO audit_logs (user_id, role_name, action, table_name, record_id, field_name, old_value, new_value)
        VALUES (NULL, NULL, 'UPDATE', 'admissions', NEW.admission_id, 'status', 'ACTIVE', 'DISCHARGED');
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 2: Critical vital alert
-- Rule-based, explainable risk scoring (documented as DEMO thresholds,
-- not real medical standards). Runs on every new vital_record insert.
-- Score: SpO2 abnormal +3, HR abnormal +2, BP abnormal +2,
--        Temp abnormal +1, RR abnormal +2
-- 0-2 LOW(NORMAL) 3-4 MODERATE(MONITOR) 5-6 HIGH 7+ CRITICAL
-- ----------------------------------------------------------------------------
-- BEFORE INSERT: compute risk_score/risk_level directly onto NEW row.
-- (Must be BEFORE, not AFTER — a trigger cannot UPDATE the same table
-- that invoked it while that statement is still in flight; setting NEW.*
-- fields in a BEFORE trigger is the correct MySQL/MariaDB pattern.)
CREATE TRIGGER trg_vital_before_insert
BEFORE INSERT ON vital_records
FOR EACH ROW
BEGIN
    DECLARE v_score INT DEFAULT 0;

    IF NEW.spo2 IS NOT NULL AND NEW.spo2 < 92 THEN
        SET v_score = v_score + 3;
    END IF;
    IF NEW.heart_rate IS NOT NULL AND (NEW.heart_rate > 110 OR NEW.heart_rate < 50) THEN
        SET v_score = v_score + 2;
    END IF;
    IF NEW.systolic_bp IS NOT NULL AND (NEW.systolic_bp > 160 OR NEW.systolic_bp < 90) THEN
        SET v_score = v_score + 2;
    END IF;
    IF NEW.temperature_celsius IS NOT NULL AND (NEW.temperature_celsius > 38.5 OR NEW.temperature_celsius < 35.0) THEN
        SET v_score = v_score + 1;
    END IF;
    IF NEW.respiratory_rate IS NOT NULL AND (NEW.respiratory_rate > 24 OR NEW.respiratory_rate < 10) THEN
        SET v_score = v_score + 2;
    END IF;

    SET NEW.early_warning_score = v_score;
    SET NEW.risk_score = v_score;
    SET NEW.risk_level = CASE
        WHEN v_score >= 7 THEN 'CRITICAL'
        WHEN v_score >= 5 THEN 'HIGH'
        WHEN v_score >= 3 THEN 'MONITOR'
        ELSE 'NORMAL'
    END;
END$$

-- AFTER INSERT: NEW.risk_level is already final at this point, so build
-- the human-readable reason string and raise a critical_alerts row
-- (a different table — safe to write to from an AFTER trigger).
CREATE TRIGGER trg_vital_after_insert
AFTER INSERT ON vital_records
FOR EACH ROW
BEGIN
    DECLARE v_reason VARCHAR(500) DEFAULT '';

    IF NEW.risk_level IN ('HIGH','CRITICAL') THEN
        IF NEW.spo2 IS NOT NULL AND NEW.spo2 < 92 THEN
            SET v_reason = CONCAT(v_reason, 'SpO2 below 92% (demo threshold). ');
        END IF;
        IF NEW.heart_rate IS NOT NULL AND (NEW.heart_rate > 110 OR NEW.heart_rate < 50) THEN
            SET v_reason = CONCAT(v_reason, 'Heart rate outside 50-110 bpm (demo threshold). ');
        END IF;
        IF NEW.systolic_bp IS NOT NULL AND (NEW.systolic_bp > 160 OR NEW.systolic_bp < 90) THEN
            SET v_reason = CONCAT(v_reason, 'Systolic BP outside 90-160 mmHg (demo threshold). ');
        END IF;
        IF NEW.temperature_celsius IS NOT NULL AND (NEW.temperature_celsius > 38.5 OR NEW.temperature_celsius < 35.0) THEN
            SET v_reason = CONCAT(v_reason, 'Temperature outside 35.0-38.5C (demo threshold). ');
        END IF;
        IF NEW.respiratory_rate IS NOT NULL AND (NEW.respiratory_rate > 24 OR NEW.respiratory_rate < 10) THEN
            SET v_reason = CONCAT(v_reason, 'Respiratory rate outside 10-24/min (demo threshold). ');
        END IF;

        INSERT INTO critical_alerts (patient_id, vital_id, severity, message, sla_deadline)
        VALUES (
            NEW.patient_id,
            NEW.vital_id,
            NEW.risk_level,
            CONCAT('Risk score ', NEW.risk_score, ' (', NEW.risk_level, '). Reasons: ', v_reason,
                   'Demo/educational thresholds only — not a medical diagnosis.'),
            DATE_ADD(NOW(), INTERVAL 15 MINUTE)
        );
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 3: Generic audit trail for the two most safety-critical tables
-- (vital_records value changes, prescription changes). Additional tables can
-- be audited the same way; kept scoped so triggers stay meaningful (Section 6).
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_vital_audit_update
AFTER UPDATE ON vital_records
FOR EACH ROW
BEGIN
    IF NOT (OLD.spo2 <=> NEW.spo2) THEN
        INSERT INTO audit_logs (action, table_name, record_id, field_name, old_value, new_value)
        VALUES ('UPDATE', 'vital_records', NEW.vital_id, 'spo2', OLD.spo2, NEW.spo2);
    END IF;
END$$

CREATE TRIGGER trg_prescription_audit_insert
AFTER INSERT ON prescriptions
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action, table_name, record_id, field_name, old_value, new_value)
    VALUES ('INSERT', 'prescriptions', NEW.prescription_id, 'doctor_id', NULL, NEW.doctor_id);
END$$

DELIMITER ;
