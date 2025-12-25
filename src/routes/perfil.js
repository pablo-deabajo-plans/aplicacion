const express = require('express');
const verifyToken = require('../middleware/auth');
const perfilController = require('../controllers/perfilController');

const router = express.Router();

router.get('/', verifyToken, perfilController.obtenerPerfil);
router.post('/foto', verifyToken, perfilController.actualizarFoto);
router.put('/username', verifyToken, perfilController.actualizarUsername);
router.put('/password', verifyToken, perfilController.actualizarPassword);

module.exports = router;
