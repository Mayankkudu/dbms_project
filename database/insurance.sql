-- ============================================================================
-- INSURANCE POLICIES
-- Extends the PATIENT entity with insurance coverage details.
-- Run this AFTER schema.sql (depends on patients, staff) and BEFORE seed.sql
-- if you want to seed sample policies.
-- ============================================================================
USE hospital_db;

-- ----------------------------------------------------------------------------
-- 16. INSURANCE POLICIES  (PATIENT 1:N INSURANCE_POLICY — a patient may hold
--     more than one policy over time, but typically has one active policy)
-- ----------------------------------------------------------------------------
CREATE TABLE insurance_policies (
    policy_id       INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36)     NOT NULL,
    provider_name   VARCHAR(120) NOT NULL,
    policy_number   VARCHAR(60)  NOT NULL,
    policy_type     ENUM('INDIVIDUAL','FAMILY','CORPORATE','GOVERNMENT') NOT NULL DEFAULT 'INDIVIDUAL',
    coverage_amount DECIMAL(12,2) NOT NULL,
    coverage_percent TINYINT NOT NULL DEFAULT 80,
    valid_from      DATE NOT NULL,
    valid_till      DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_policy_patient FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT chk_policy_dates CHECK (valid_till >= valid_from),
    CONSTRAINT chk_coverage_percent CHECK (coverage_percent BETWEEN 0 AND 100),
    UNIQUE KEY uq_policy_number (policy_number)
) ENGINE=InnoDB;

-- Helpful index for the common lookup pattern: "does this patient have an
-- active, unexpired policy right now?"
CREATE INDEX idx_policy_patient_active ON insurance_policies (patient_id, is_active, valid_till);
