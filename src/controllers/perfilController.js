const pool = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/uploads/perfil');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `${userId}-${Date.now()}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const tipos = ['image/jpeg', 'image/png', 'image/gif'];
        if (tipos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
    try {
        const user_id = req.user.id;

        const resultado = await pool.query(
            'SELECT id, nombre_usuario as username, email, foto_perfil FROM usuarios WHERE id = $1',
            [user_id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({ usuario: resultado.rows[0] });
    } catch (err) {
        console.error('Error obtenerPerfil:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar foto de perfil
exports.actualizarFoto = [upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió archivo' });
        }

        const user_id = req.user.id;
        const foto_url = `/uploads/perfil/${req.file.filename}`;

        // Obtener foto antigua para eliminarla
        const usuarioAnterior = await pool.query(
            'SELECT foto_perfil FROM usuarios WHERE id = $1',
            [user_id]
        );

        if (usuarioAnterior.rows[0] && usuarioAnterior.rows[0].foto_perfil) {
            const fotoAntigua = path.join(__dirname, '../../public', usuarioAnterior.rows[0].foto_perfil);
            if (fs.existsSync(fotoAntigua)) {
                fs.unlinkSync(fotoAntigua);
            }
        }

        // Actualizar BD
        await pool.query(
            'UPDATE usuarios SET foto_perfil = $1 WHERE id = $2',
            [foto_url, user_id]
        );

        return res.status(200).json({ 
            success: true, 
            foto_url: foto_url,
            message: 'Foto de perfil actualizada correctamente'
        });
    } catch (err) {
        console.error('Error actualizarFoto:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
}];

// Actualizar username
exports.actualizarUsername = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username inválido (mín. 3 caracteres)' });
        }

        // Verificar si ya existe
        const existe = await pool.query(
            'SELECT id FROM usuarios WHERE nombre_usuario = $1 AND id != $2',
            [username, user_id]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Este usuario ya existe' });
        }

        await pool.query(
            'UPDATE usuarios SET nombre_usuario = $1 WHERE id = $2',
            [username, user_id]
        );

        return res.status(200).json({ 
            success: true,
            message: 'Nombre de usuario actualizado correctamente'
        });
    } catch (err) {
        console.error('Error actualizarUsername:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar contraseña
exports.actualizarPassword = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva || passwordNueva.length < 6) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        // Obtener usuario actual
        const resultado = await pool.query(
            'SELECT password FROM usuarios WHERE id = $1',
            [user_id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, resultado.rows[0].password);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hash nueva contraseña
        const passwordHasheada = await bcrypt.hash(passwordNueva, 10);

        // Actualizar
        await pool.query(
            'UPDATE usuarios SET password = $1 WHERE id = $2',
            [passwordHasheada, user_id]
        );

        return res.status(200).json({ 
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (err) {
        console.error('Error actualizarPassword:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
