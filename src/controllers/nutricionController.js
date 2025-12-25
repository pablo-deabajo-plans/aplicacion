const pool = require('../db');

// Obtener registro de nutrición de un día
exports.obtenerRegistroDia = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fecha } = req.query; // formato: YYYY-MM-DD

        if (!fecha) {
            return res.status(400).json({ error: 'Falta la fecha' });
        }

        // Obtener o crear registro del día
        let registro = await pool.query(
            'SELECT id FROM registros_nutricion WHERE user_id = $1 AND fecha = $2',
            [user_id, fecha]
        );

        let registro_id;
        if (registro.rows.length === 0) {
            const crear = await pool.query(
                'INSERT INTO registros_nutricion (user_id, fecha) VALUES ($1, $2) RETURNING id',
                [user_id, fecha]
            );
            registro_id = crear.rows[0].id;
        } else {
            registro_id = registro.rows[0].id;
        }

        // Obtener comidas del día
        const comidas = await pool.query(
            `SELECT id, tipo, nombre, cantidad, calorias, proteina, carbohidratos, grasas
             FROM comidas
             WHERE registro_id = $1
             ORDER BY tipo`,
            [registro_id]
        );

        // Agrupar por tipo
        const comidasPorTipo = {
            'Desayuno': [],
            'Almuerzo': [],
            'Cena': [],
            'Snack': []
        };

        comidas.rows.forEach(comida => {
            if (comidasPorTipo[comida.tipo]) {
                comidasPorTipo[comida.tipo].push(comida);
            }
        });

        // Calcular totales
        const totales = {
            calorias: 0,
            proteina: 0,
            carbohidratos: 0,
            grasas: 0
        };

        comidas.rows.forEach(c => {
            totales.calorias += c.calorias || 0;
            totales.proteina += parseFloat(c.proteina) || 0;
            totales.carbohidratos += parseFloat(c.carbohidratos) || 0;
            totales.grasas += parseFloat(c.grasas) || 0;
        });

        return res.status(200).json({
            registro_id,
            fecha,
            comidasPorTipo,
            totales
        });
    } catch (err) {
        console.error('Error obtenerRegistroDia:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Agregar comida al día
exports.agregarComida = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fecha, tipo, nombre, cantidad, calorias, proteina, carbohidratos, grasas } = req.body;

        if (!fecha || !tipo || !nombre || calorias === undefined) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Obtener o crear registro
        let registro = await pool.query(
            'SELECT id FROM registros_nutricion WHERE user_id = $1 AND fecha = $2',
            [user_id, fecha]
        );

        let registro_id;
        if (registro.rows.length === 0) {
            const crear = await pool.query(
                'INSERT INTO registros_nutricion (user_id, fecha) VALUES ($1, $2) RETURNING id',
                [user_id, fecha]
            );
            registro_id = crear.rows[0].id;
        } else {
            registro_id = registro.rows[0].id;
        }

        // Agregar comida
        const resultado = await pool.query(
            `INSERT INTO comidas (registro_id, tipo, nombre, cantidad, calorias, proteina, carbohidratos, grasas)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, tipo, nombre, cantidad, calorias, proteina, carbohidratos, grasas`,
            [registro_id, tipo, nombre, cantidad || null, calorias, proteina || 0, carbohidratos || 0, grasas || 0]
        );

        return res.status(201).json({ success: true, comida: resultado.rows[0] });
    } catch (err) {
        console.error('Error agregarComida:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Eliminar comida
exports.eliminarComida = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Verificar que la comida pertenece al usuario
        const verificar = await pool.query(
            `SELECT c.id FROM comidas c
             JOIN registros_nutricion r ON c.registro_id = r.id
             WHERE c.id = $1 AND r.user_id = $2`,
            [id, user_id]
        );

        if (verificar.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        await pool.query('DELETE FROM comidas WHERE id = $1', [id]);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error eliminarComida:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener histórico de últimos 7 días
exports.obtenerHistorico = async (req, res) => {
    try {
        const user_id = req.user.id;

        const resultado = await pool.query(
            `SELECT r.fecha,
                    COALESCE(SUM(c.calorias), 0) as calorias,
                    COALESCE(SUM(c.proteina), 0) as proteina,
                    COALESCE(SUM(c.carbohidratos), 0) as carbohidratos,
                    COALESCE(SUM(c.grasas), 0) as grasas
             FROM registros_nutricion r
             LEFT JOIN comidas c ON r.id = c.registro_id
             WHERE r.user_id = $1 AND r.fecha >= NOW() - INTERVAL '7 days'
             GROUP BY r.fecha
             ORDER BY r.fecha ASC`,
            [user_id]
        );

        return res.status(200).json({ historico: resultado.rows });
    } catch (err) {
        console.error('Error obtenerHistorico:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};
