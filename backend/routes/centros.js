const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM centro ORDER BY nombre ASC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error en /api/centros:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener centros' });
  }
});

module.exports = router;
