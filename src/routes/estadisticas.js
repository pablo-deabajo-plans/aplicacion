const express = require('express');
const verifyToken = require('../middleware/auth');
const estadisticasController = require('../controllers/estadisticasController');

const router = express.Router();

// GET /api/estadisticas/ejercicio?nombre=Press%20Banca
router.get('/ejercicio', verifyToken, estadisticasController.getStatsEjercicio);

module.exports = router;
