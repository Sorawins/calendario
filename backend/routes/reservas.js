const express = require('express');
const router = express.Router();
const pool = require('../db');

// Regla: bloquea_dia = true para 'taller', 'codice', 'otros'; false para 'reunion'
function bloqueaDiaPorTipo(tipo) {
  return (tipo === 'taller' || tipo === 'codice' || tipo === 'otros');
}

// Comprobar solapamiento simple (hora_inicio < otra.hora_fin y hora_fin > otra.hora_inicio)
function haySolape(hIni, hFin, H2Ini, H2Fin) {
  return (hIni < H2Fin && hFin > H2Ini);
}

// Crear nueva reserva
router.post('/', async (req, res) => {
  const { tipo, fecha, hora_inicio, hora_fin, id_centro, id_mentor, id_recurso = null, descripcion = '' } = req.body;

  if (!tipo || !fecha || !id_centro || !id_mentor) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: tipo, fecha, id_centro, id_mentor' });
  }

  const bloquea_dia = bloqueaDiaPorTipo(tipo);

  try {
    // 1) Mentor bloqueado todo el día
    const [mentorDia] = await pool.query(
      `SELECT 1 FROM reserva WHERE id_mentor=? AND fecha=? AND bloquea_dia=TRUE LIMIT 1`,
      [id_mentor, fecha]
    );
    if (mentorDia.length > 0) {
      return res.status(400).json({ ok: false, error: 'El mentor ya está bloqueado todo el día.' });
    }

    // 2) Si NO bloquea el día (reunión), comprobar solape horario con otras reuniones
    if (!bloquea_dia) {
      if (!hora_inicio || !hora_fin) {
        return res.status(400).json({ ok: false, error: 'Reunión requiere hora_inicio y hora_fin.' });
      }
      const [reuniones] = await pool.query(
        `SELECT hora_inicio, hora_fin 
         FROM reserva 
         WHERE id_mentor=? AND fecha=? AND bloquea_dia=FALSE`,
        [id_mentor, fecha]
      );
      const solapa = reuniones.some(r => haySolape(hora_inicio, hora_fin, r.hora_inicio, r.hora_fin));
      if (solapa) {
        return res.status(400).json({ ok: false, error: 'El mentor ya tiene una reserva en ese horario.' });
      }
    }

    // 3) Validación de recursos si se pasa id_recurso
    if (id_recurso) {
      // Recurso bloqueado en otro centro ese día
      const [recursoOtroCentro] = await pool.query(
        `SELECT 1 FROM reserva 
         WHERE id_recurso=? AND fecha=? AND bloquea_dia=TRUE AND id_centro<>? LIMIT 1`,
        [id_recurso, fecha, id_centro]
      );
      if (recursoOtroCentro.length > 0) {
        return res.status(400).json({ ok: false, error: 'El recurso ya está bloqueado en otro centro ese día.' });
      }
      // Nota: si el recurso está bloqueado en este mismo centro, sí puede volver a usarse en otras horas (según tus reglas).
    }

    // 4) Insertar
    const [result] = await pool.query(
      `INSERT INTO reserva (tipo, fecha, hora_inicio, hora_fin, id_centro, id_mentor, id_recurso, descripcion, bloquea_dia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, fecha, hora_inicio || null, hora_fin || null, id_centro, id_mentor, id_recurso, descripcion, bloquea_dia]
    );

    res.json({ ok: true, mensaje: 'Reserva creada', id_reserva: result.insertId });

  } catch (err) {
    console.error('Error /api/reservas:', err);
    res.status(500).json({ ok: false, error: 'Error del servidor al crear reserva' });
  }
});


// Obtener reservas por rango de fechas (para el calendario)
router.get('/', async (req, res) => {
  // filtros opcionales: fecha_desde, fecha_hasta, id_centro, id_mentor, tipo
  const { fecha_desde, fecha_hasta, id_centro, id_mentor, tipo } = req.query;
  const params = [];
  let where = 'WHERE 1=1';

  if (fecha_desde) { where += ' AND fecha >= ?'; params.push(fecha_desde); }
  if (fecha_hasta) { where += ' AND fecha <= ?'; params.push(fecha_hasta); }
  if (id_centro)   { where += ' AND id_centro = ?'; params.push(id_centro); }
  if (id_mentor)   { where += ' AND id_mentor = ?'; params.push(id_mentor); }
  if (tipo)        { where += ' AND tipo = ?'; params.push(tipo); }

  try {
    const [rows] = await pool.query(
      `SELECT id_reserva, tipo, fecha, hora_inicio, hora_fin, id_centro, id_mentor, id_recurso, descripcion, bloquea_dia
       FROM reserva
       ${where}
       ORDER BY fecha, COALESCE(hora_inicio,'00:00:00')`
      , params
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error GET /api/reservas:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener calendario' });
  }
});

// Disponibilidad de mentores para un día (no bloqueados)
router.get('/disponibilidad/mentores', async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ ok: false, error: 'Parámetro fecha requerido' });

  try {
    const [ocupados] = await pool.query(
      `SELECT DISTINCT id_mentor FROM reserva WHERE fecha=? AND bloquea_dia=TRUE`,
      [fecha]
    );
    const idsOcupados = ocupados.map(o => o.id_mentor);
    // Todos los mentores menos los ocupados (ajusta a tu tabla real de mentores)
    const [mentores] = await pool.query(
      idsOcupados.length
        ? `SELECT * FROM mentor WHERE id_mentor NOT IN (${idsOcupados.map(()=>'?').join(',')})`
        : `SELECT * FROM mentor`,
      idsOcupados
    );
    res.json({ ok: true, data: mentores });
  } catch (err) {
    console.error('Error /disponibilidad/mentores:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener disponibilidad de mentores' });
  }
});

// Disponibilidad de recursos por centro y día
router.get('/disponibilidad/recursos', async (req, res) => {
  const { fecha, id_centro } = req.query;
  if (!fecha || !id_centro) return res.status(400).json({ ok: false, error: 'fecha e id_centro son requeridos' });

  try {
    // Recursos bloqueados en otro centro ese día
    const [bloqueados] = await pool.query(
      `SELECT DISTINCT id_recurso FROM reserva 
       WHERE fecha=? AND bloquea_dia=TRUE AND id_centro<>? AND id_recurso IS NOT NULL`,
      [fecha, id_centro]
    );
    const idsBloq = bloqueados.map(r => r.id_recurso);

    // Lista de recursos (ajusta si tienes tabla de recursos por centro)
    let sql = 'SELECT * FROM recurso';
    let params = [];
    if (idsBloq.length) {
      sql += ` WHERE id_recurso NOT IN (${idsBloq.map(()=>'?').join(',')})`;
      params = idsBloq;
    }
    const [recursos] = await pool.query(sql, params);
    res.json({ ok: true, data: recursos });
  } catch (err) {
    console.error('Error /disponibilidad/recursos:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener disponibilidad de recursos' });
  }
});


module.exports = router;