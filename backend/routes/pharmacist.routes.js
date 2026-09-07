const express = require('express');
const router = express.Router();
const PharmacistController = require('../controllers/pharmacist.controller.js');

// Route to get full medicine inventory
router.get('/inventory', PharmacistController.getInventory);

// Route to update a specific medicine's stock quantity
router.put('/inventory/:id', PharmacistController.updateMedicineStock);

// Route to get all prescriptions and associated items
router.get('/prescriptions', PharmacistController.getPrescriptions);

// Route to get a specific prescription by its ID
router.get('/prescriptions/:id', PharmacistController.getPrescriptionById);

module.exports = router;
