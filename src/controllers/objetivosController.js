const pool = require('../db');

// Crear objetivo
exports.crearObjetivo = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { nombre_objetivo, descripcion, fecha_inicio, fecha_fin } = req.body;

        if (!nombre_objetivo || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const resultado = await pool.query(
            `INSERT INTO objetivos (user_id, nombre_objetivo, descripcion, fecha_inicio, fecha_fin)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nombre_objetivo, descripcion, fecha_inicio, fecha_fin, progreso, estado`,
            [user_id, nombre_objetivo, descripcion || null, fecha_inicio, fecha_fin]
        );

        return res.status(201).json({ 
            success: true, 
            objetivo: resultado.rows[0] 
        });
    } catch (err) {
        console.error('Error crearObjetivo:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener objetivos del usuario
exports.obtenerObjetivos = async (req, res) => {
    try {
        const user_id = req.user.id;

        const resultado = await pool.query(
            `SELECT id, nombre_objetivo, descripcion, fecha_inicio, fecha_fin, progreso, estado, created_at
             FROM objetivos
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [user_id]
        );

        return res.status(200).json({ objetivos: resultado.rows });
    } catch (err) {
        console.error('Error obtenerObjetivos:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar progreso de objetivo
exports.actualizarProgreso = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { progreso, estado } = req.body;

        if (progreso === undefined || progreso < 0 || progreso > 100) {
            return res.status(400).json({ error: 'Progreso debe ser entre 0 y 100' });
        }

        const verificar = await pool.query(
            'SELECT id FROM objetivos WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (verificar.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const nuevoEstado = estado || (progreso === 100 ? 'Completado' : 'En Progreso');

        await pool.query(
            `UPDATE objetivos 
             SET progreso = $1, estado = $2, updated_at = NOW()
             WHERE id = $3`,
            [progreso, nuevoEstado, id]
        );

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error actualizarProgreso:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar objetivo
exports.eliminarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const verificar = await pool.query(
            'SELECT id FROM objetivos WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (verificar.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        await pool.query('DELETE FROM objetivos WHERE id = $1', [id]);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error eliminarObjetivo:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
