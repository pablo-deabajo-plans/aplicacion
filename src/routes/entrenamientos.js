const express = require('express');
const entrenamientosController = require('../controllers/entrenamientosController');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas (requieren token)
router.post('/', verifyToken, entrenamientosController.crearEntrenamiento);
router.get('/', verifyToken, entrenamientosController.obtenerEntrenamientos);
router.delete('/:id', verifyToken, entrenamientosController.eliminarEntrenamiento);
router.put('/:id', verifyToken, entrenamientosController.actualizarEntrenamiento);

module.exports = router;
