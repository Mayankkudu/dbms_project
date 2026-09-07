const express = require('express');
const router = express.Router();
const PharmacistController = require('../controllers/pharmacist.controller.js');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Route to get full medicine inventory
router.get('/inventory', authorize('PHARMACIST', 'ADMIN'), PharmacistController.getInventory);

// Route to update a specific medicine's stock quantity
router.put('/inventory/:id', authorize('PHARMACIST', 'ADMIN'), PharmacistController.updateMedicineStock);

// Route to get all prescriptions and associated items
router.get('/prescriptions', authorize('PHARMACIST', 'ADMIN', 'DOCTOR'), PharmacistController.getPrescriptions);

// Route to get a specific prescription by its ID
router.get('/prescriptions/:id', authorize('PHARMACIST', 'ADMIN', 'DOCTOR'), PharmacistController.getPrescriptionById);

module.exports = router;
