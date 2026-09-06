const db = require('../config/db.js');

class PharmacistService {
    /**
     * Retrieve full medicine inventory
     * Maps to EER Diagram: MEDICINE entity (name, stock_quantity, dosage)
     */
    static async getInventory() {
        try {
            const result = await db.query(
                `SELECT medicine_id, name, stock_quantity, dosage 
                 FROM MEDICINE 
                 ORDER BY name ASC;`
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching medicine inventory:', error);
            throw new Error('Failed to retrieve medicine inventory');
        }
    }

    /**
     * Update stock quantity for a specific medicine
     * Maps to EER Diagram: MEDICINE entity (stock_quantity attribute)
     */
    static async updateMedicineStock(medicineId, newStockQuantity) {
        try {
            const result = await db.query(
                `UPDATE MEDICINE 
                 SET stock_quantity = $1 
                 WHERE medicine_id = $2 
                 RETURNING medicine_id, name, stock_quantity, dosage;`,
                [newStockQuantity, medicineId]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Medicine not found');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating medicine stock:', error);
            throw new Error('Failed to update stock');
        }
    }

    /**
     * Retrieve all prescriptions and their associated items/medicines
     * Maps to EER Diagram: PRESCRIPTION, PRESCRIPTION_ITEM, and MEDICINE entities
     */
    static async getPrescriptions() {
        try {
            const result = await db.query(
                `SELECT 
                    p.prescription_id, 
                    p.date AS prescription_date,
                    pi.item_id,
                    pi.dosage AS prescribed_dosage,
                    m.medicine_id,
                    m.name AS medicine_name,
                    m.stock_quantity
                 FROM PRESCRIPTION p
                 JOIN PRESCRIPTION_ITEM pi ON p.prescription_id = pi.prescription_id
                 JOIN MEDICINE m ON pi.medicine_id = m.medicine_id
                 ORDER BY p.date DESC;`
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            throw new Error('Failed to retrieve prescriptions');
        }
    }
}

module.exports = PharmacistService;
