const pool = require('../db');

// Devuelve datos de un ejercicio concreto para el usuario logueado
exports.getStatsEjercicio = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { nombre } = req.query;

        if (!nombre) {
            return res.status(400).json({ error: 'Falta el nombre del ejercicio' });
        }

        // Sacamos los ejercicios de ese nombre para todos los entrenamientos del usuario
        const resultado = await pool.query(
            `
            SELECT 
                e.id AS entrenamiento_id,
                e.nombre_entrenamiento,
                e.dia_entrenamiento,
                e.created_at,
                ej.series,
                ej.reps,
                ej.peso
            FROM ejercicios ej
            JOIN entrenamientos e ON ej.entrenamiento_id = e.id
            WHERE e.user_id = $1
              AND LOWER(ej.nombre) = LOWER($2)
            ORDER BY e.created_at ASC, e.id ASC
            `,
            [user_id, nombre]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({ datos: [] });
        }

        // Opcional: parsear reps/peso si los guardas como "8-8-6-6"
        // Aquí hacemos algo simple: coger la "media" de la serie
        const puntos = resultado.rows.map(row => {
            // reps y peso vienen como texto tipo "8-8-6-6" -> media
            const parseSerie = (cadena) => {
                if (!cadena) return null;
                const nums = String(cadena)
                    .split('-')
                    .map(v => parseFloat(v))
                    .filter(n => !isNaN(n));
                if (!nums.length) return null;
                const sum = nums.reduce((a, b) => a + b, 0);
                return sum / nums.length;
            };

            return {
                entrenamientoId: row.entrenamiento_id,
                nombreEntrenamiento: row.nombre_entrenamiento,
                dia: row.dia_entrenamiento,
                fecha: row.created_at,
                pesoMedio: parseSerie(row.peso),
                repsMedias: parseSerie(row.reps)
            };
        });

        return res.status(200).json({ datos: puntos });
    } catch (err) {
        console.error('Error getStatsEjercicio:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
