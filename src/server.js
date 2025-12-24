const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const entrenamientosRoutes = require('./routes/entrenamientos');
const rutinaRoutes = require('./routes/rutina');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/entrenamientos', entrenamientosRoutes);
app.use('/api/rutina-semanal', rutinaRoutes);

// Ruta raíz (index)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all para servir index.html (importante para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
