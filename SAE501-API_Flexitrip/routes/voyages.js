const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyageController');

/**
 * @swagger
 * tags:
 *   name: Voyage
 *   description: Gestion des voyages optimisée Supabase
 */

// ==========================================
// ROUTES REST (Standard)
// ==========================================

/**
 * GET /api/voyages
 * Liste des voyages de l'utilisateur
 */
router.get('/', (req, res) => voyageController.getUserVoyages(req, res));

/**
 * POST /api/voyages
 * Créer un nouveau voyage
 */
router.post('/', (req, res) => voyageController.createVoyage(req, res));

/**
 * GET /api/voyages/:id
 * Détails d'un voyage
 */
router.get('/:id', (req, res) => voyageController.getVoyage(req, res));

/**
 * PUT /api/voyages/:id
 * Modifier un voyage
 */
router.put('/:id', (req, res) => voyageController.updateVoyage(req, res));

/**
 * DELETE /api/voyages/:id
 * Supprimer un voyage
 */
router.delete('/:id', (req, res) => voyageController.deleteVoyage(req, res));


// ==========================================
// ALIAS ROUTES (Support Legacy Frontend)
// ==========================================

// Supporte POST /api/voyages/insert
router.post('/insert', (req, res) => voyageController.createVoyage(req, res));

// Supporte GET /api/voyages/getAll
router.get('/getAll', (req, res) => voyageController.getUserVoyages(req, res));

// Supporte GET /api/voyages/get/:id
router.get('/get/:id', (req, res) => voyageController.getVoyage(req, res));

// Supporte PUT /api/voyages/update/:id
router.put('/update/:id', (req, res) => voyageController.updateVoyage(req, res));

// Supporte DELETE /api/voyages/delete/:id
router.delete('/delete/:id', (req, res) => voyageController.deleteVoyage(req, res));

module.exports = router;
