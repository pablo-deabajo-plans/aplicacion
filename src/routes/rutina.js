const express = require('express');
const verifyToken = require('../middleware/auth');
const rutinaController = require('../controllers/rutinaController');

const router = express.Router();

router.post('/', verifyToken, rutinaController.guardarRutinaSemanal);
router.get('/', verifyToken, rutinaController.obtenerRutinaSemanal);

module.exports = router;
