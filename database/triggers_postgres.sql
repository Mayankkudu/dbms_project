-- ============================================================================
-- TRIGGERS (PostgreSQL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TRIGGER 1a: On admission INSERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_admission_after_insert() RETURNS trigger AS $$
BEGIN
    UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = NEW.bed_id;
    UPDATE patients SET current_status = 'ADMITTED' WHERE patient_id = NEW.patient_id;

    INSERT INTO audit_logs (user_id, role_name, action, table_name, record_id, field_name, old_value, new_value)
    VALUES (NULL, NULL, 'INSERT', 'admissions', NEW.admission_id, 'status', NULL, 'ACTIVE');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admission_after_insert
AFTER INSERT ON admissions
FOR EACH ROW
EXECUTE FUNCTION fn_trg_admission_after_insert();

-- ----------------------------------------------------------------------------
-- TRIGGER 1b: On discharge 
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_admission_after_update() RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'ACTIVE' AND NEW.status = 'DISCHARGED' THEN
        UPDATE beds SET status = 'AVAILABLE' WHERE bed_id = NEW.bed_id;
        UPDATE patients SET current_status = 'DISCHARGED' WHERE patient_id = NEW.patient_id;

        INSERT INTO audit_logs (user_id, role_name, action, table_name, record_id, field_name, old_value, new_value)
        VALUES (NULL, NULL, 'UPDATE', 'admissions', NEW.admission_id, 'status', 'ACTIVE', 'DISCHARGED');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admission_after_update
AFTER UPDATE ON admissions
FOR EACH ROW
EXECUTE FUNCTION fn_trg_admission_after_update();

-- ----------------------------------------------------------------------------
-- TRIGGER 2: Critical vital alert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_vital_before_insert() RETURNS trigger AS $$
DECLARE 
    v_score INT := 0;
BEGIN
    IF NEW.spo2 IS NOT NULL AND NEW.spo2 < 92 THEN
        v_score := v_score + 3;
    END IF;
    IF NEW.heart_rate IS NOT NULL AND (NEW.heart_rate > 110 OR NEW.heart_rate < 50) THEN
        v_score := v_score + 2;
    END IF;
    IF NEW.systolic_bp IS NOT NULL AND (NEW.systolic_bp > 160 OR NEW.systolic_bp < 90) THEN
        v_score := v_score + 2;
    END IF;
    IF NEW.temperature_celsius IS NOT NULL AND (NEW.temperature_celsius > 38.5 OR NEW.temperature_celsius < 35.0) THEN
        v_score := v_score + 1;
    END IF;
    IF NEW.respiratory_rate IS NOT NULL AND (NEW.respiratory_rate > 24 OR NEW.respiratory_rate < 10) THEN
        v_score := v_score + 2;
    END IF;

    NEW.risk_score := v_score;
    NEW.risk_level := CASE
        WHEN v_score >= 7 THEN 'CRITICAL'
        WHEN v_score >= 5 THEN 'HIGH'
        WHEN v_score >= 3 THEN 'MONITOR'
        ELSE 'NORMAL'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vital_before_insert
BEFORE INSERT ON vital_records
FOR EACH ROW
EXECUTE FUNCTION fn_trg_vital_before_insert();

CREATE OR REPLACE FUNCTION fn_trg_vital_after_insert() RETURNS trigger AS $$
DECLARE 
    v_reason VARCHAR(500) := '';
BEGIN
    IF NEW.risk_level IN ('HIGH','CRITICAL') THEN
        IF NEW.spo2 IS NOT NULL AND NEW.spo2 < 92 THEN
            v_reason := v_reason || 'SpO2 below 92% (demo threshold). ';
        END IF;
        IF NEW.heart_rate IS NOT NULL AND (NEW.heart_rate > 110 OR NEW.heart_rate < 50) THEN
            v_reason := v_reason || 'Heart rate outside 50-110 bpm (demo threshold). ';
        END IF;
        IF NEW.systolic_bp IS NOT NULL AND (NEW.systolic_bp > 160 OR NEW.systolic_bp < 90) THEN
            v_reason := v_reason || 'Systolic BP outside 90-160 mmHg (demo threshold). ';
        END IF;
        IF NEW.temperature_celsius IS NOT NULL AND (NEW.temperature_celsius > 38.5 OR NEW.temperature_celsius < 35.0) THEN
            v_reason := v_reason || 'Temperature outside 35.0-38.5C (demo threshold). ';
        END IF;
        IF NEW.respiratory_rate IS NOT NULL AND (NEW.respiratory_rate > 24 OR NEW.respiratory_rate < 10) THEN
            v_reason := v_reason || 'Respiratory rate outside 10-24/min (demo threshold). ';
        END IF;

        INSERT INTO critical_alerts (patient_id, vital_id, severity, message)
        VALUES (
            NEW.patient_id,
            NEW.vital_id,
            NEW.risk_level,
            'Risk score ' || NEW.risk_score || ' (' || NEW.risk_level || '). Reasons: ' || v_reason || 'Demo/educational thresholds only — not a medical diagnosis.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vital_after_insert
AFTER INSERT ON vital_records
FOR EACH ROW
EXECUTE FUNCTION fn_trg_vital_after_insert();

-- ----------------------------------------------------------------------------
-- TRIGGER 3: Generic audit trail
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_vital_audit_update() RETURNS trigger AS $$
BEGIN
    IF OLD.spo2 IS DISTINCT FROM NEW.spo2 THEN
        INSERT INTO audit_logs (action, table_name, record_id, field_name, old_value, new_value)
        VALUES ('UPDATE', 'vital_records', NEW.vital_id, 'spo2', OLD.spo2::text, NEW.spo2::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vital_audit_update
AFTER UPDATE ON vital_records
FOR EACH ROW
EXECUTE FUNCTION fn_trg_vital_audit_update();

CREATE OR REPLACE FUNCTION fn_trg_prescription_audit_insert() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (action, table_name, record_id, field_name, old_value, new_value)
    VALUES ('INSERT', 'prescriptions', NEW.prescription_id, 'doctor_id', NULL, NEW.doctor_id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prescription_audit_insert
AFTER INSERT ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION fn_trg_prescription_audit_insert();
