const formContainer = document.getElementById('formContainer');
let formularioActual = null; //formulario visible


// BOTONES PRINCIPALES
document.getElementById('btnReunion').addEventListener('click', mostrarFormularioReunion);
document.getElementById('btnTaller').addEventListener('click', mostrarFormularioTaller);
document.getElementById('btnCodice').addEventListener('click', mostrarFormularioCodice);
document.getElementById('btnOtros').addEventListener('click', mostrarFormularioOtros);
document.getElementById('btnVerCalendario').addEventListener('click', () => {
  window.location.href = 'calendario.html';
});


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

  if (formularioActual === 'reunion') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'reunion';

  const { centros, mentores } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Reunión Inicial</h2>
    <form id="formReunion">
      <label>Tipo de centro:</label>
      <select id="tipoCentro">
        <option value="">-- Selecciona tipo --</option>
        <option value="público">Público</option>
        <option value="privado">Privado</option>
      </select>

      <label>Centro:</label>
      <select id="centro" required>
        <option value="">-- Selecciona centro --</option>
      </select>

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

   // 🔹 Filtrado de centros por tipo
  const tipoSelect = document.getElementById('tipoCentro');
  const centroSelect = document.getElementById('centro');

  tipoSelect.addEventListener('change', (e) => {
    const tipoSeleccionado = e.target.value;

    // Filtramos los centros según el tipo y ordenamos por nombre
    const centrosFiltrados = centros
      .filter(c => c.tipo === tipoSeleccionado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Llenamos el desplegable de centros
    centroSelect.innerHTML = `
      <option value="">-- Selecciona centro --</option>
      ${centrosFiltrados.map(c => `<option value="${c.id_centro}">${c.nombre}</option>`).join('')}
    `;
  });


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

  if (data.ok) {
    alert('Reunión guardada ✅');
    formContainer.innerHTML = ''; // 👈 🔥 limpia el formulario tras guardar
  } else {
    alert('❌ ' + data.error);
  }
}


// FORMULARIO DE TALLER

async function mostrarFormularioTaller() {
  // 🔹 Si el formulario actual es "taller", se oculta
  if (formularioActual === 'taller') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'taller';

  const { centros, mentores, talleres, recursos } = await cargarDatos();

  // Estructura del formulario con tipo de centro
  formContainer.innerHTML = `
    <h2>Taller</h2>
    <form id="formTaller">
      <label>Tipo de centro:</label>
      <select id="tipoCentro">
        <option value="">-- Selecciona tipo --</option>
        <option value="público">Público</option>
        <option value="privado">Privado</option>
      </select>

      <label>Centro:</label>
      <select id="centro" required>
        <option value="">-- Selecciona centro --</option>
      </select>

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

  // Filtrado de centros por tipo
  const tipoSelect = document.getElementById('tipoCentro');
  const centroSelect = document.getElementById('centro');

  tipoSelect.addEventListener('change', (e) => {
    const tipoSeleccionado = e.target.value;

    // Filtramos los centros según el tipo y ordenamos por nombre
    const centrosFiltrados = centros
      .filter(c => c.tipo === tipoSeleccionado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Llenamos el desplegable de centros
    centroSelect.innerHTML = `
      <option value="">-- Selecciona centro --</option>
      ${centrosFiltrados.map(c => `<option value="${c.id_centro}">${c.nombre}</option>`).join('')}
    `;
  });

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

  if (data.ok) {
    alert('Taller guardado ✅');
    formContainer.innerHTML = ''; // 👈 🔥 limpia el formulario tras guardar
  } else {
    alert('❌ ' + data.error);
  }
}


// FORMULARIO DE CÓDICE Y OTROS (pendientes)

async function mostrarFormularioCodice() {
  if (formularioActual === 'codice') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'codice';

  const { centros, mentores } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Actividad Códice</h2>
    <form id="formCodice">
      <label>Centro:</label>
      ${crearSelect('centro', centros, 'id_centro', 'nombre')}

      <label>Mentor:</label>
      ${crearSelect('mentor', mentores, 'id_mentor', 'nombre')}

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  document.getElementById('formCodice').addEventListener('submit', async e => {
    e.preventDefault();
    const datos = {
      tipo: 'codice',
      id_centro: document.getElementById('centro').value,
      id_mentor: document.getElementById('mentor').value,
      fecha: document.getElementById('fecha').value,
      descripcion: document.getElementById('descripcion').value,
    };

    const res = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    alert(data.ok ? 'Códice guardado ✅' : '❌ ' + data.error);
    if (data.ok) formContainer.innerHTML = '';
  });
}

// FORMULARIO DE OTROS
async function mostrarFormularioOtros() {
  if (formularioActual === 'otros') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'otros';

  const { centros, mentores } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Otras Actividades</h2>
    <form id="formOtros">
      <label>Centro:</label>
      ${crearSelect('centro', centros, 'id_centro', 'nombre')}

      <label>Mentor:</label>
      ${crearSelect('mentor', mentores, 'id_mentor', 'nombre')}

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  document.getElementById('formOtros').addEventListener('submit', async e => {
    e.preventDefault();
    const datos = {
      tipo: 'otros',
      id_centro: document.getElementById('centro').value,
      id_mentor: document.getElementById('mentor').value,
      fecha: document.getElementById('fecha').value,
      descripcion: document.getElementById('descripcion').value,
    };

    const res = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    alert(data.ok ? 'Actividad guardada ✅' : '❌ ' + data.error);
    if (data.ok) formContainer.innerHTML = '';
  });
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

  if (data.ok && Array.isArray(data.data)) {
    reservas = data.data;
    console.log("✅ Reservas cargadas desde el backend:", reservas);
  } else {
    console.warn("⚠️ No se recibieron reservas válidas del backend:", data);
  }
} catch (error) {
  console.error("❌ Error al cargar reservas:", error);
}

// 2️ Adaptar las reservas al formato del calendario (corrige fechas con zona horaria)
const eventos = reservas.map(r => {
  // Normaliza la fecha a formato local YYYY-MM-DD
  const fecha = new Date(r.fecha);
  const fechaLocal = fecha.toISOString().split('T')[0]; // se queda con la parte de la fecha sin hora

  const horaInicio = r.hora_inicio ? r.hora_inicio.slice(0, 5) : "08:00";
  const horaFin = r.hora_fin ? r.hora_fin.slice(0, 5) : "17:00";

  return {
    title: `${r.tipo.toUpperCase()} - ${r.descripcion || ''}`,
    start: `${fechaLocal}T${horaInicio}`,
    end: `${fechaLocal}T${horaFin}`,
    color:
      r.tipo === 'taller'
        ? '#3a87ad'
        : r.tipo === 'reunion'
          ? '#28a745'
          : r.tipo === 'codice'
            ? '#f0ad4e'
            : '#6c757d',
  };
});

console.log("🗓️ Eventos generados (fecha local corregida):", eventos);


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
