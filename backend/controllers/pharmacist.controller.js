const PharmacistService = require('../services/pharmacist.service.js');

class PharmacistController {
    /**
     * Handles requests to get the full medicine inventory
     */
    static async getInventory(req, res) {
        try {
            const inventory = await PharmacistService.getInventory();
            res.status(200).json({ success: true, data: inventory });
        } catch (error) {
            console.error('Controller Error - getInventory:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve inventory' });
        }
    }

    /**
     * Handles requests to update the stock of a specific medicine
     */
    static async updateMedicineStock(req, res) {
        try {
            const { id } = req.params;
            const { stock_quantity } = req.body;

            if (stock_quantity === undefined || stock_quantity === null) {
                return res.status(400).json({ success: false, message: 'Stock quantity is required' });
            }

            const updatedMedicine = await PharmacistService.updateMedicineStock(id, stock_quantity);
            res.status(200).json({ success: true, data: updatedMedicine });
        } catch (error) {
            console.error('Controller Error - updateMedicineStock:', error);
            if (error.message === 'Medicine not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Failed to update medicine stock' });
        }
    }

    /**
     * Handles requests to get all prescriptions
     */
    static async getPrescriptions(req, res) {
        try {
            const prescriptions = await PharmacistService.getPrescriptions();
            res.status(200).json({ success: true, data: prescriptions });
        } catch (error) {
            console.error('Controller Error - getPrescriptions:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve prescriptions' });
        }
    }

    /**
     * Handles requests to get a single prescription by its ID
     */
    static async getPrescriptionById(req, res) {
        try {
            const { id } = req.params;
            const prescription = await PharmacistService.getPrescriptionById(id);
            
            if (!prescription || prescription.length === 0) {
                 return res.status(404).json({ success: false, message: 'Prescription not found' });
            }

            res.status(200).json({ success: true, data: prescription });
        } catch (error) {
            console.error('Controller Error - getPrescriptionById:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve prescription details' });
        }
    }
}

module.exports = PharmacistController;
