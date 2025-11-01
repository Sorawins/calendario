const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recurso');
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error en /api/recursos:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener recursos' });
  }
});

module.exports = router;
