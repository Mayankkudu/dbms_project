const pool = require('../config/db.js');

class PharmacistService {
    static async getInventory() {
        try {
            const [rows] = await pool.query(
                `SELECT medicine_id, name, stock_quantity, unit, unit_price 
                 FROM medicines 
                 ORDER BY name ASC;`
            );
            return rows;
        } catch (error) {
            console.error('Error fetching medicine inventory:', error);
            throw new Error('Failed to retrieve medicine inventory');
        }
    }

    static async updateMedicineStock(medicineId, newStockQuantity) {
        try {
            const [rows] = await pool.query(
                `UPDATE medicines 
                 SET stock_quantity = $1 
                 WHERE medicine_id = $2 
                 RETURNING medicine_id, name, stock_quantity, unit;`,
                [newStockQuantity, medicineId]
            );
            
            if (rows.length === 0) {
                throw new Error('Medicine not found');
            }
            
            return rows[0];
        } catch (error) {
            console.error('Error updating medicine stock:', error);
            throw new Error('Failed to update stock');
        }
    }

    static async getPrescriptions() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    p.prescription_id, 
                    p.prescribed_at AS prescription_date,
                    pi.item_id,
                    pi.dosage AS prescribed_dosage,
                    m.medicine_id,
                    m.name AS medicine_name,
                    m.stock_quantity
                 FROM prescriptions p
                 JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
                 JOIN medicines m ON pi.medicine_id = m.medicine_id
                 ORDER BY p.prescribed_at DESC;`
            );
            return rows;
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            throw new Error('Failed to retrieve prescriptions');
        }
    }

    static async getPrescriptionById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    p.prescription_id, 
                    p.prescribed_at AS prescription_date,
                    pi.item_id,
                    pi.dosage AS prescribed_dosage,
                    m.medicine_id,
                    m.name AS medicine_name,
                    m.stock_quantity
                 FROM prescriptions p
                 JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
                 JOIN medicines m ON pi.medicine_id = m.medicine_id
                 WHERE p.prescription_id = $1
                 ORDER BY p.prescribed_at DESC;`,
                [id]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching prescription by ID:', error);
            throw new Error('Failed to retrieve prescription details');
        }
    }
}

module.exports = PharmacistService;
