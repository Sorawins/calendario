const formContainer = document.getElementById('formContainer');


// BOTONES PRINCIPALES
document.getElementById('btnReunion').addEventListener('click', mostrarFormularioReunion);
document.getElementById('btnTaller').addEventListener('click', mostrarFormularioTaller);
document.getElementById('btnCodice').addEventListener('click', mostrarFormularioCodice);
document.getElementById('btnOtros').addEventListener('click', mostrarFormularioOtros);


// FUNCIONES AUXILIARES
// Cargar centros, mentores, talleres y recursos desde el backend
async function cargarDatos() {
  const [centrosRes, mentoresRes, talleresRes, recursosRes] = await Promise.all([
    fetch('http://localhost:3000/api/centros'),
    fetch('http://localhost:3000/api/mentores'),
    fetch('http://localhost:3000/api/taller'),
    fetch('http://localhost:3000/api/recursos')
  ]);
  const centros = (await centrosRes.json()).data || [];
  const mentores = (await mentoresRes.json()).data || [];
  const talleres = (await talleresRes.json()).data || [];
  const recursos = (await recursosRes.json()).data || [];
  return { centros, mentores, talleres, recursos };
}

// Función genérica para crear un desplegable <select>
function crearSelect(id, datos, valueKey, textKey) {
  return `
    <select id="${id}" required>
      <option value="">-- Selecciona --</option>
      ${datos.map(d => `<option value="${d[valueKey]}">${d[textKey]}</option>`).join('')}
    </select>
  `;
}


// FORMULARIO DE REUNIÓN

async function mostrarFormularioReunion() {
  const { centros, mentores } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Reunión Inicial</h2>
    <form id="formReunion">
      <label>Centro:</label>
      ${crearSelect('centro', centros, 'id_centro', 'nombre')}

      <label>Mentor:</label>
      ${crearSelect('mentor', mentores, 'id_mentor', 'nombre')}

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Hora inicio:</label>
      <input type="time" id="horaInicio" required>

      <label>Hora fin:</label>
      <input type="time" id="horaFin" required>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  document.getElementById('formReunion').addEventListener('submit', crearReservaReunion);
}

async function crearReservaReunion(e) {
  e.preventDefault();
  const datos = {
    tipo: 'reunion',
    id_centro: document.getElementById('centro').value,
    id_mentor: document.getElementById('mentor').value,
    fecha: document.getElementById('fecha').value,
    hora_inicio: document.getElementById('horaInicio').value,
    hora_fin: document.getElementById('horaFin').value,
    descripcion: document.getElementById('descripcion').value
  };

  const res = await fetch('http://localhost:3000/api/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  alert(data.ok ? 'Reunión guardada ✅' : '❌ ' + data.error);
}


// FORMULARIO DE TALLER

async function mostrarFormularioTaller() {
  const { centros, mentores, talleres, recursos } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Taller</h2>
    <form id="formTaller">
      <label>Centro:</label>
      ${crearSelect('centro', centros, 'id_centro', 'nombre')}

      <label>Mentor:</label>
      ${crearSelect('mentor', mentores, 'id_mentor', 'nombre')}

      <label>Taller:</label>
      ${crearSelect('taller', talleres, 'id_taller', 'nombre')}

      <label>Recurso:</label>
      ${crearSelect('recurso', recursos, 'id_recurso', 'nombre')}

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  document.getElementById('formTaller').addEventListener('submit', crearReservaTaller);
}

async function crearReservaTaller(e) {
  e.preventDefault();
  const datos = {
    tipo: 'taller',
    id_centro: document.getElementById('centro').value,
    id_mentor: document.getElementById('mentor').value,
    id_recurso: document.getElementById('recurso').value,
    fecha: document.getElementById('fecha').value,
    descripcion: document.getElementById('descripcion').value
  };

  const res = await fetch('http://localhost:3000/api/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  alert(data.ok ? 'Taller guardado ✅' : '❌ ' + data.error);
}


// FORMULARIO DE CÓDICE Y OTROS (pendientes)

function mostrarFormularioCodice() {
  formContainer.innerHTML = `<p>Formulario Códice (pendiente de implementar)</p>`;
}

function mostrarFormularioOtros() {
  formContainer.innerHTML = `<p>Formulario Otros (pendiente de implementar)</p>`;
}


// CARGAR CALENDARIO DE RESERVAS

document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // 1️ Cargar reservas desde el backend
  let reservas = [];
  try {
    const res = await fetch('http://localhost:3000/api/reservas');
    const data = await res.json();
    if (data.ok) reservas = data.data;
  } catch (error) {
    console.error('Error al cargar reservas:', error);
  }

  // 2️ Adaptar las reservas al formato del calendario
  const eventos = reservas.map(r => ({
    title: `${r.tipo.toUpperCase()} - ${r.descripcion || ''}`,
    start: r.hora_inicio
      ? `${r.fecha}T${r.hora_inicio}`
      : `${r.fecha}T08:00:00`, // si no tiene hora
    end: r.hora_fin
      ? `${r.fecha}T${r.hora_fin}`
      : `${r.fecha}T17:00:00`,
    color:
      r.tipo === 'taller'
        ? '#3a87ad'
        : r.tipo === 'reunion'
        ? '#28a745'
        : r.tipo === 'codice'
        ? '#f0ad4e'
        : '#6c757d',
  }));

  // 3️ Crear el calendario
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    events: eventos,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
  });

  console.log("✅ Renderizando calendario con eventos:", eventos);
  calendar.render();
});
