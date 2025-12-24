const pool = require('../db');

// Crear entrenamiento
exports.crearEntrenamiento = async (req, res) => {
    try {
        const { nombre_entrenamiento, dia_entrenamiento, descripcion, ejercicios } = req.body;
        const user_id = req.user.id;

        if (!nombre_entrenamiento || !dia_entrenamiento || !ejercicios || ejercicios.length === 0) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Insertar entrenamiento
        const resultado = await pool.query(
            'INSERT INTO entrenamientos (user_id, nombre_entrenamiento, dia_entrenamiento, descripcion) VALUES ($1, $2, $3, $4) RETURNING id',
            [user_id, nombre_entrenamiento, dia_entrenamiento, descripcion || null]
        );

        const entrenamiento_id = resultado.rows[0].id;

        // Insertar ejercicios
        for (const ejercicio of ejercicios) {
            await pool.query(
                'INSERT INTO ejercicios (entrenamiento_id, nombre, series, reps, peso) VALUES ($1, $2, $3, $4, $5)',
                [entrenamiento_id, ejercicio.nombre, ejercicio.series, ejercicio.reps, ejercicio.peso]
            );
        }

        return res.status(201).json({ success: 'Entrenamiento creado correctamente', id: entrenamiento_id });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener entrenamientos del usuario
exports.obtenerEntrenamientos = async (req, res) => {
    try {
        const user_id = req.user.id;

        const resultado = await pool.query(
            `SELECT e.id, e.nombre_entrenamiento, e.dia_entrenamiento, e.descripcion, 
                    json_agg(json_build_object('nombre', ex.nombre, 'series', ex.series, 'reps', ex.reps, 'peso', ex.peso)) as ejercicios
             FROM entrenamientos e
             LEFT JOIN ejercicios ex ON e.id = ex.entrenamiento_id
             WHERE e.user_id = $1
             GROUP BY e.id
             ORDER BY e.created_at DESC`,
            [user_id]
        );

        return res.status(200).json({ entrenamientos: resultado.rows });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar entrenamiento
exports.eliminarEntrenamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Verificar que el entrenamiento pertenece al usuario
        const verificar = await pool.query(
            'SELECT id FROM entrenamientos WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (verificar.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este entrenamiento' });
        }

        // Eliminar ejercicios asociados
        await pool.query('DELETE FROM ejercicios WHERE entrenamiento_id = $1', [id]);

        // Eliminar entrenamiento
        await pool.query('DELETE FROM entrenamientos WHERE id = $1', [id]);

        return res.status(200).json({ success: 'Entrenamiento eliminado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Actualizar entrenamiento
exports.actualizarEntrenamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_entrenamiento, dia_entrenamiento, descripcion } = req.body;
        const user_id = req.user.id;

        // Verificar que el entrenamiento pertenece al usuario
        const verificar = await pool.query(
            'SELECT id FROM entrenamientos WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (verificar.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar este entrenamiento' });
        }

        await pool.query(
            'UPDATE entrenamientos SET nombre_entrenamiento = $1, dia_entrenamiento = $2, descripcion = $3 WHERE id = $4',
            [nombre_entrenamiento, dia_entrenamiento, descripcion, id]
        );

        return res.status(200).json({ success: 'Entrenamiento actualizado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
