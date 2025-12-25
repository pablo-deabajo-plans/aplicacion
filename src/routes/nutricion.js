const express = require('express');
const verifyToken = require('../middleware/auth');
const nutricionController = require('../controllers/nutricionController');

const router = express.Router();

router.get('/dia', verifyToken, nutricionController.obtenerRegistroDia);
router.post('/comida', verifyToken, nutricionController.agregarComida);
router.delete('/comida/:id', verifyToken, nutricionController.eliminarComida);
router.get('/historico', verifyToken, nutricionController.obtenerHistorico);

module.exports = router;
