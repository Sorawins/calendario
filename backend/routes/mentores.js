const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/', async (req, res) => {
  try {
    // Consulta todos los mentores
    const [rows] = await pool.query(
      'SELECT id_mentor, nombre, apellidos, rol, correo FROM mentor'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error en /api/mentores:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener mentores' });
  }
});


module.exports = router;
