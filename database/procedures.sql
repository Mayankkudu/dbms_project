-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================
USE hospital_db;
DELIMITER $$

-- ----------------------------------------------------------------------------
-- register_patient: creates the PERSON row, the PATIENT row, and the login
-- account in one transaction. Returns nothing; app reads back by phone/email.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE register_patient(
    IN p_first_name VARCHAR(60), IN p_last_name VARCHAR(60), IN p_dob DATE,
    IN p_gender VARCHAR(10), IN p_phone VARCHAR(15), IN p_email VARCHAR(120),
    IN p_username VARCHAR(60), IN p_password_hash VARCHAR(255),
    OUT out_patient_id CHAR(36)
)
BEGIN
    DECLARE v_person_id CHAR(36);
    DECLARE v_role_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_person_id = UUID();
    INSERT INTO persons (person_id, first_name, last_name, date_of_birth, gender, phone, email)
    VALUES (v_person_id, p_first_name, p_last_name, p_dob, p_gender, p_phone, p_email);

    INSERT INTO patients (patient_id) VALUES (v_person_id);

    SELECT role_id INTO v_role_id FROM roles WHERE role_name = 'PATIENT';
    INSERT INTO user_accounts (person_id, role_id, username, password_hash)
    VALUES (v_person_id, v_role_id, p_username, p_password_hash);

    SET out_patient_id = v_person_id;
    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- book_appointment
-- ----------------------------------------------------------------------------
CREATE PROCEDURE book_appointment(
    IN p_patient_id CHAR(36), IN p_doctor_id CHAR(36), IN p_department_id INT,
    IN p_scheduled_at DATETIME, IN p_reason VARCHAR(255),
    OUT out_appointment_id INT
)
BEGIN
    INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, reason)
    VALUES (p_patient_id, p_doctor_id, p_department_id, p_scheduled_at, p_reason);
    SET out_appointment_id = LAST_INSERT_ID();
END$$

-- ----------------------------------------------------------------------------
-- admit_patient: create admission + assign bed atomically (Section 7 example)
-- ----------------------------------------------------------------------------
CREATE PROCEDURE admit_patient(
    IN p_patient_id CHAR(36), IN p_bed_id INT, IN p_doctor_id CHAR(36),
    IN p_reason VARCHAR(255), OUT out_admission_id INT
)
BEGIN
    DECLARE v_bed_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT status INTO v_bed_status FROM beds WHERE bed_id = p_bed_id FOR UPDATE;

    IF v_bed_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bed does not exist';
    ELSEIF v_bed_status <> 'AVAILABLE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bed is not available';
    END IF;

    INSERT INTO admissions (patient_id, bed_id, admitting_doctor_id, reason)
    VALUES (p_patient_id, p_bed_id, p_doctor_id, p_reason);
    -- bed status + patient status flip via trg_admission_after_insert

    SET out_admission_id = LAST_INSERT_ID();
    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- discharge_patient
-- ----------------------------------------------------------------------------
CREATE PROCEDURE discharge_patient(IN p_admission_id INT)
BEGIN
    UPDATE admissions
    SET status = 'DISCHARGED', discharged_at = NOW()
    WHERE admission_id = p_admission_id AND status = 'ACTIVE';
    -- bed + patient status flip via trg_admission_after_update
END$$

-- ----------------------------------------------------------------------------
-- assign_bed: move a patient to a different bed mid-admission
-- ----------------------------------------------------------------------------
CREATE PROCEDURE assign_bed(IN p_admission_id INT, IN p_new_bed_id INT)
BEGIN
    DECLARE v_old_bed_id INT;
    DECLARE v_bed_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT status INTO v_bed_status FROM beds WHERE bed_id = p_new_bed_id FOR UPDATE;
    IF v_bed_status <> 'AVAILABLE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Target bed is not available';
    END IF;

    SELECT bed_id INTO v_old_bed_id FROM admissions WHERE admission_id = p_admission_id;

    UPDATE admissions SET bed_id = p_new_bed_id WHERE admission_id = p_admission_id;
    UPDATE beds SET status = 'AVAILABLE' WHERE bed_id = v_old_bed_id;
    UPDATE beds SET status = 'OCCUPIED' WHERE bed_id = p_new_bed_id;
    COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- generate_bill: aggregate bill_items into a bill total (used by app layer
-- for display; the source-of-truth total is always SUM(bill_items.amount))
-- ----------------------------------------------------------------------------
CREATE PROCEDURE generate_bill(IN p_patient_id CHAR(36), IN p_admission_id INT, OUT out_bill_id INT)
BEGIN
    INSERT INTO bills (patient_id, admission_id) VALUES (p_patient_id, p_admission_id);
    SET out_bill_id = LAST_INSERT_ID();
END$$

-- ----------------------------------------------------------------------------
-- CheckSLAEscalations: sweep alerts and escalate
-- ----------------------------------------------------------------------------
CREATE PROCEDURE CheckSLAEscalations()
BEGIN
    UPDATE critical_alerts 
    SET escalation_level = escalation_level + 1 
    WHERE status = 'OPEN' AND sla_deadline < NOW() AND escalation_level < 3;
END$$

-- ----------------------------------------------------------------------------
-- MarkBedAvailable: finish cleaning
-- ----------------------------------------------------------------------------
CREATE PROCEDURE MarkBedAvailable(IN p_bed_id INT)
BEGIN
    UPDATE beds 
    SET status = 'AVAILABLE', available_at = NOW() 
    WHERE bed_id = p_bed_id AND status = 'CLEANING';
END$$

DELIMITER ;
