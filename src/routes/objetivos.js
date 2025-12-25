const express = require('express');
const verifyToken = require('../middleware/auth');
const objetivosController = require('../controllers/objetivosController');

const router = express.Router();

router.post('/', verifyToken, objetivosController.crearObjetivo);
router.get('/', verifyToken, objetivosController.obtenerObjetivos);
router.put('/:id', verifyToken, objetivosController.actualizarProgreso);
router.delete('/:id', verifyToken, objetivosController.eliminarObjetivo);

module.exports = router;
