const pool = require('../db');

// Guardar / actualizar rutina semanal
exports.guardarRutinaSemanal = async (req, res) => {
    try {
        const user_id = req.user.id;
        const {
            Lunes,
            Martes,
            Miércoles,
            Jueves,
            Viernes,
            Sábado,
            Domingo
        } = req.body;

        // Normalizar claves (por si vienen undefined)
        const lunes = Lunes || null;
        const martes = Martes || null;
        const miercoles = Miércoles || null;
        const jueves = Jueves || null;
        const viernes = Viernes || null;
        const sabado = Sábado || null;
        const domingo = Domingo || null;

        // ¿Existe ya rutina para este usuario?
        const existe = await pool.query(
            'SELECT id FROM rutina_semanal WHERE user_id = $1',
            [user_id]
        );

        if (existe.rows.length > 0) {
            // UPDATE
            await pool.query(
                `UPDATE rutina_semanal
                 SET lunes = $1, martes = $2, miercoles = $3,
                     jueves = $4, viernes = $5, sabado = $6, domingo = $7,
                     updated_at = NOW()
                 WHERE user_id = $8`,
                [lunes, martes, miercoles, jueves, viernes, sabado, domingo, user_id]
            );
        } else {
            // INSERT
            await pool.query(
                `INSERT INTO rutina_semanal
                 (user_id, lunes, martes, miercoles, jueves, viernes, sabado, domingo)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [user_id, lunes, martes, miercoles, jueves, viernes, sabado, domingo]
            );
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error guardarRutinaSemanal:', error);
        return res.status(500).json({ success: false, error: 'Error en el servidor' });
    }
};

// Obtener rutina semanal del usuario
exports.obtenerRutinaSemanal = async (req, res) => {
    try {
        const user_id = req.user.id;

        const resultado = await pool.query(
            `SELECT lunes, martes, miercoles, jueves, viernes, sabado, domingo
             FROM rutina_semanal
             WHERE user_id = $1
             LIMIT 1`,
            [user_id]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({ rutina: null });
        }

        return res.status(200).json({ rutina: resultado.rows[0] });
    } catch (error) {
        console.error('Error obtenerRutinaSemanal:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
