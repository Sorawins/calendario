const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

console.log("Ruta /api/login CARGADA");


// LOGIN
router.post('/', async (req, res) => {
  try {
    const { id_mentor, password } = req.body;

    if (!id_mentor || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Buscar usuario en la tabla CORRECTA
    const [rows] = await pool.query(
      "SELECT * FROM mentor WHERE id_mentor = ?",
      [id_mentor]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];

    
    // 1. PRIMERA VEZ (contrasena NULL)
    if (!usuario.contrasena) {
      return res.json({
        primeraVez: true,
        id_mentor: usuario.id_mentor,
        nombre: usuario.Nombre
      });
    }

    
    // 2. YA TIENE CONTRASEÑA:comprobar
    const ok = await bcrypt.compare(password, usuario.contrasena);

    if (!ok) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    return res.json({
      message: "Login correcto",
      id_mentor: usuario.id_mentor,
      nombre: usuario.Nombre,
      rol: usuario.rol
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


// CREAR CONTRASEÑA
router.post('/crear', async (req, res) => {
  try {
    const { id_mentor, password } = req.body;

    if (!id_mentor || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Guardar en columna CORRECTA
    await pool.query(
      "UPDATE mentor SET contrasena = ? WHERE id_mentor = ?",
      [hash, id_mentor]
    );

    return res.json({
      message: "Contraseña creada correctamente"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
