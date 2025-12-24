const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { nombre_usuario, email, password, passwordConfirm } = req.body;

    // Validación básica
    if (!nombre_usuario || !email || !password || !passwordConfirm) {
      return res.status(400).json({ error: 'Por favor completa todos los campos' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Verificar si el usuario o email ya existen
    const usuarioExistente = await pool.query(
      'SELECT email FROM usuarios WHERE email = $1 OR nombre_usuario = $2',
      [email, nombre_usuario]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ error: 'El email o nombre de usuario ya están registrados' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insertar usuario en la base de datos
    await pool.query(
      'INSERT INTO usuarios (nombre_usuario, email, password) VALUES ($1, $2, $3)',
      [nombre_usuario, email, hashedPassword]
    );

    return res.status(201).json({ success: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario por email
    const usuario = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuario.rows.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const user = usuario.rows[0];

    // Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Generar JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    return res.status(200).json({
      success: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};
