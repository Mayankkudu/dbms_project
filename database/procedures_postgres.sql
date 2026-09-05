-- ============================================================================
-- STORED PROCEDURES (PostgreSQL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- register_patient: creates the PERSON row, the PATIENT row, and the login
-- account in one transaction.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION register_patient(
    p_first_name VARCHAR(60), p_last_name VARCHAR(60), p_dob DATE,
    p_gender VARCHAR(10), p_phone VARCHAR(15), p_email VARCHAR(120),
    p_username VARCHAR(60), p_password_hash VARCHAR(255)
) RETURNS UUID AS $$
DECLARE 
    v_person_id UUID;
    v_role_id INT;
BEGIN
    v_person_id := gen_random_uuid();
    
    INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
    VALUES (v_person_id, p_first_name, p_last_name, p_dob, p_gender, p_phone, p_email);

    INSERT INTO patients (patient_id) VALUES (v_person_id);

    SELECT role_id INTO v_role_id FROM roles WHERE role_name = 'PATIENT';
    
    INSERT INTO user_accounts (person_id, role_id, username, password_hash)
    VALUES (v_person_id, v_role_id, p_username, p_password_hash);

    RETURN v_person_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- book_appointment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION book_appointment(
    p_patient_id UUID, p_doctor_id UUID, p_department_id INT,
    p_scheduled_at TIMESTAMP, p_reason VARCHAR(255)
) RETURNS INT AS $$
DECLARE 
    out_appointment_id INT;
BEGIN
    INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, reason)
    VALUES (p_patient_id, p_doctor_id, p_department_id, p_scheduled_at, p_reason)
    RETURNING appointment_id INTO out_appointment_id;
    
    RETURN out_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- admit_patient: create admission + assign bed atomically
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admit_patient(
    p_patient_id UUID, p_bed_id INT, p_doctor_id UUID, p_reason VARCHAR(255)
) RETURNS INT AS $$
DECLARE 
    v_bed_status VARCHAR(20);
    out_admission_id INT;
BEGIN
    SELECT status INTO v_bed_status FROM beds WHERE bed_id = p_bed_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bed does not exist';
    ELSIF v_bed_status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'Bed is not available';
    END IF;

    INSERT INTO admissions (patient_id, bed_id, admitting_doctor_id, reason)
    VALUES (p_patient_id, p_bed_id, p_doctor_id, p_reason)
    RETURNING admission_id INTO out_admission_id;

    RETURN out_admission_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- discharge_patient
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE discharge_patient(p_admission_id INT)
AS $$
BEGIN
    UPDATE admissions
    SET status = 'DISCHARGED', discharged_at = NOW()
    WHERE admission_id = p_admission_id AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- assign_bed: move a patient to a different bed mid-admission
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE assign_bed(p_admission_id INT, p_new_bed_id INT)
AS $$
DECLARE 
    v_old_bed_id INT;
    v_bed_status VARCHAR(20);
BEGIN
    SELECT status INTO v_bed_status FROM beds WHERE bed_id = p_new_bed_id FOR UPDATE;
    
    IF v_bed_status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'Target bed is not available';
    END IF;

    SELECT bed_id INTO v_old_bed_id FROM admissions WHERE admission_id = p_admission_id;

    UPDATE admissions SET bed_id = p_new_bed_id WHERE admission_id = p_admission_id;
    UPDATE beds SET status = 'AVAILABLE' WHERE bed_id = v_old_bed_id;
    UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = p_new_bed_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- generate_bill: aggregate bill_items into a bill total
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_bill(p_patient_id UUID, p_admission_id INT)
RETURNS INT AS $$
DECLARE 
    out_bill_id INT;
BEGIN
    INSERT INTO bills (patient_id, admission_id) VALUES (p_patient_id, p_admission_id)
    RETURNING bill_id INTO out_bill_id;
    
    RETURN out_bill_id;
END;
$$ LANGUAGE plpgsql;
