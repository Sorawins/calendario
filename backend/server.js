// server.js
const express = require('express');
const pool = require('./db');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


// RUTAS IMPORTADAS

app.use('/api/taller', require('./routes/taller'));
app.use('/api/centros', require('./routes/centros'));
app.use('/api/recursos', require('./routes/recursos'));
app.use('/api/mentores', require('./routes/mentores'));
app.use('/api/reservas', require('./routes/reservas'));


// PRUEBA

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});