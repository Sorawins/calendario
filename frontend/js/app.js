const formContainer = document.getElementById('formContainer');
let formularioActual = null; //formulario visible


// BOTONES PRINCIPALES
document.getElementById('btnReunion').addEventListener('click', mostrarFormularioReunion);
document.getElementById('btnTaller').addEventListener('click', mostrarFormularioTaller);
document.getElementById('btnCodice').addEventListener('click', mostrarFormularioCodice);
document.getElementById('btnOtros').addEventListener('click', mostrarFormularioOtros);
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
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

// Función para crear un desplegable
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

  // Si ya está visible, lo ocultamos
  if (formularioActual === 'reunion') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'reunion';

  // Cargamos solo los centros
  const { centros } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Reunión Inicial</h2>
    <form id="formReunion">
      <label>Tipo de centro:</label>
      <select id="tipoCentro">
        <option value="">-- Selecciona tipo --</option>
        <option value="público">Público</option>
        <option value="concertado">Concertado</option>
      </select>

      <label>Centro:</label>
      <select id="centro" required>
        <option value="">-- Selecciona centro --</option>
      </select>

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Hora inicio:</label>
      <input type="time" id="horaInicio" required>

      <label>Hora fin:</label>
      <input type="time" id="horaFin" required>

      <label>Mentor:</label>
      <select id="mentor" disabled required>
        <option value="">-- Primero selecciona fecha --</option>
      </select>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  const tipoSelect = document.getElementById('tipoCentro');
  const centroSelect = document.getElementById('centro');
  const fechaSelect = document.getElementById('fecha');
  const mentorSelect = document.getElementById('mentor');

  // Filtrado de centros por tipo
  tipoSelect.addEventListener('change', () => {
    const tipoSeleccionado = tipoSelect.value;

    const centrosFiltrados = centros
      .filter(c => c.tipo === tipoSeleccionado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    centroSelect.innerHTML = `
      <option value="">-- Selecciona centro --</option>
      ${centrosFiltrados.map(c => `<option value="${c.id_centro}">${c.nombre}</option>`).join('')}
    `;
  });

  // Cargar mentores libres dinámicamente
  async function cargarMentoresLibresReunion() {
    const fecha = fechaSelect.value;

    if (!fecha) {
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">-- Primero selecciona fecha --</option>`;
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/reservas/disponibilidad/mentores?fecha=${fecha}`);
      const data = await res.json();

      mentorSelect.innerHTML = `<option value="">-- Selecciona mentor --</option>`;
      (data.data || []).forEach(m => {
        mentorSelect.innerHTML += `<option value="${m.id_mentor}">${m.nombre}</option>`;
      });

      mentorSelect.disabled = false;
    } catch (error) {
      console.error('Error cargando mentores libres para reunión:', error);
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">Error al cargar mentores</option>`;
    }
  }

  // Cuando cambie la fecha, cargamos los mentores disponibles
  fechaSelect.addEventListener("change", cargarMentoresLibresReunion);

  // Envío del formulario
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
    alert('Reunión guardada');
    formContainer.innerHTML = ''; // limpia el formulario tras guardar
  } else {
    alert('❌ ' + data.error);
  }
}


// FORMULARIO DE TALLER

async function mostrarFormularioTaller() {
  if (formularioActual === 'taller') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'taller';

  const { centros, talleres, recursos } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Taller</h2>
    <form id="formTaller">
      <label>Tipo de centro:</label>
      <select id="tipoCentro">
        <option value="">-- Selecciona tipo --</option>
        <option value="público">Público</option>
        <option value="concertado">Concertado</option>
      </select>

      <label>Centro:</label>
      <select id="centro" required>
        <option value="">-- Selecciona centro --</option>
      </select>

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Hora inicio:</label>
      <input type="time" id="horaInicio" required>

      <label>Hora fin:</label>
      <input type="time" id="horaFin" required>

      <label>Taller:</label>
      ${crearSelect('taller', talleres, 'id_taller', 'nombre')}

      <label>Recurso:</label>
      <select id="recurso" disabled>
      <option value="">-- Primero centro y fecha --</option>
      </select>

      <label>Mentor:</label>
      <select id="mentor" disabled>
      <option value="">-- Primero fecha --</option>
      </select>


      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  const tipoSelect = document.getElementById('tipoCentro');
  const centroSelect = document.getElementById('centro');
  const fechaSelect = document.getElementById('fecha');
  const recursoSelect = document.getElementById('recurso');
  const mentorSelect = document.getElementById('mentor');

  tipoSelect.addEventListener('change', () => {
    const tipo = tipoSelect.value;
    const filtrados = centros.filter(c => c.tipo === tipo);
    centroSelect.innerHTML = `<option value="">-- Selecciona centro --</option>` +
      filtrados.map(c => `<option value="${c.id_centro}">${c.nombre}</option>`).join('');
  });

  // Cargar recursos libres dinámicamente
  async function cargarRecursosLibres() {
    const centro = centroSelect.value;
    const fecha = fechaSelect.value;

    if (!centro || !fecha) {
      recursoSelect.disabled = true;
      return;
    }

    const res = await fetch(`http://localhost:3000/api/reservas/disponibilidad/recursos?fecha=${fecha}&id_centro=${centro}`);
    const data = await res.json();

    recursoSelect.innerHTML = `<option value="">-- Selecciona recurso --</option>`;
    data.data.forEach(r => {
      recursoSelect.innerHTML += `<option value="${r.id_recurso}">${r.nombre}</option>`;
    });

    recursoSelect.disabled = false;
  }

  // Cargar mentores libres dinámicamente
  async function cargarMentoresLibres() {
    const fecha = fechaSelect.value;
    if (!fecha) return;

    const res = await fetch(`http://localhost:3000/api/reservas/disponibilidad/mentores?fecha=${fecha}`);
    const data = await res.json();

    mentorSelect.innerHTML = `<option value="">-- Selecciona mentor --</option>`;
    data.data.forEach(m => {
      mentorSelect.innerHTML += `<option value="${m.id_mentor}">${m.nombre}</option>`;
    });

    mentorSelect.disabled = false;
  }

  centroSelect.addEventListener("change", cargarRecursosLibres);
  fechaSelect.addEventListener("change", () => {
    cargarRecursosLibres();
    cargarMentoresLibres();
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
    id_taller: document.getElementById('taller').value,
    hora_inicio: document.getElementById('horaInicio').value,
    hora_fin: document.getElementById('horaFin').value,
    fecha: document.getElementById('fecha').value,
    descripcion: document.getElementById('descripcion').value
  };

  const res = await fetch('http://localhost:3000/api/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  alert(data.ok ? 'Taller guardado' : '❌ ' + data.error);
  if (data.ok) formContainer.innerHTML = '';
}

// FORMULARIO DE CÓDICE (CORREGIDO)
async function mostrarFormularioCodice() {

  if (formularioActual === 'codice') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'codice';

  const { centros } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Actividad Códice</h2>
    <form id="formCodice">

      <!-- Igual que en Taller y Reunión -->
      <label>Tipo de centro:</label>
      <select id="tipoCentro">
        <option value="">-- Selecciona tipo --</option>
        <option value="público">Público</option>
        <option value="concertado">Concertado</option>
      </select>

      <label>Centro:</label>
      <select id="centro" required>
        <option value="">-- Selecciona centro --</option>
      </select>

      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Mentor:</label>
      <!-- Igual que en Reunión y Taller: deshabilitado hasta elegir fecha -->
      <select id="mentor" disabled>
        <option value="">-- Primero selecciona fecha --</option>
      </select>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  const tipoSelect = document.getElementById('tipoCentro');
  const centroSelect = document.getElementById('centro');
  const fechaInput = document.getElementById('fecha');
  const mentorSelect = document.getElementById('mentor');

  tipoSelect.addEventListener('change', () => {
    const tipo = tipoSelect.value;
    const filtrados = centros
      .filter(c => c.tipo === tipo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    centroSelect.innerHTML =
      `<option value="">-- Selecciona centro --</option>` +
      filtrados.map(c => `<option value="${c.id_centro}">${c.nombre}</option>`).join('');
  });

  // Cargar mentores libres dinámicamente
  async function cargarMentoresLibresCodice() {
    const fecha = fechaInput.value;

    if (!fecha) {
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">-- Primero selecciona fecha --</option>`;
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/reservas/disponibilidad/mentores?fecha=${fecha}`);
      const data = await res.json();

      mentorSelect.innerHTML = `<option value="">-- Selecciona mentor --</option>`;
      (data.data || []).forEach(m => {
        mentorSelect.innerHTML += `<option value="${m.id_mentor}">${m.nombre}</option>`;
      });

      mentorSelect.disabled = false;
    } catch (err) {
      console.error("❌ Error cargando mentores disponibles:", err);
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">Error al cargar</option>`;
    }
  }

  fechaInput.addEventListener("change", cargarMentoresLibresCodice);

  // Envío del formulario
  document.getElementById('formCodice').addEventListener('submit', async e => {
    e.preventDefault();

    const datos = {
      tipo: 'codice',
      id_centro: centroSelect.value,
      id_mentor: mentorSelect.value,
      fecha: fechaInput.value,
      descripcion: document.getElementById('descripcion').value,
    };

    const res = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    alert(data.ok ? 'Códice guardado' : '❌ ' + data.error);

    if (data.ok) formContainer.innerHTML = '';
  });
}


// FORMULARIO DE OTROS (CORREGIDO Y UNIFICADO)
async function mostrarFormularioOtros() {

  if (formularioActual === 'otros') {
    formContainer.innerHTML = '';
    formularioActual = null;
    return;
  }
  formularioActual = 'otros';

  const { mentores } = await cargarDatos();

  formContainer.innerHTML = `
    <h2>Otras Actividades</h2>
    <form id="formOtros">

      <!-- Igual que en el resto: primero se selecciona la fecha -->
      <label>Fecha:</label>
      <input type="date" id="fecha" required>

      <label>Mentor:</label>
      <!-- Deshabilitado hasta elegir fecha -->
      <select id="mentor" disabled>
        <option value="">-- Primero selecciona fecha --</option>
      </select>

      <label>Descripción:</label>
      <textarea id="descripcion"></textarea>

      <button type="submit">Guardar</button>
    </form>
  `;

  // ➤ Referencias
  const fechaInput = document.getElementById('fecha');
  const mentorSelect = document.getElementById('mentor');

  // ➤ Cargar mentores libres según fecha seleccionada
  async function cargarMentoresLibres() {
    const fecha = fechaInput.value;

    if (!fecha) {
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">-- Primero selecciona fecha --</option>`;
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/api/reservas/disponibilidad/mentores?fecha=${fecha}`
      );
      const data = await res.json();

      mentorSelect.innerHTML = `<option value="">-- Selecciona mentor --</option>`;
      (data.data || []).forEach(m => {
        mentorSelect.innerHTML += `<option value="${m.id_mentor}">${m.nombre}</option>`;
      });

      mentorSelect.disabled = false;
    } catch (err) {
      console.error("❌ Error al cargar mentores para otros:", err);
      mentorSelect.disabled = true;
      mentorSelect.innerHTML = `<option value="">Error al cargar</option>`;
    }
  }

  // ➤ Solo cuando cambia la fecha, se cargan mentores libres
  fechaInput.addEventListener("change", cargarMentoresLibres);

  // ➤ Envío del formulario
  document.getElementById('formOtros').addEventListener('submit', async e => {
    e.preventDefault();

    const datos = {
      tipo: 'otros',
      fecha: fechaInput.value,
      id_mentor: mentorSelect.value,
      descripcion: document.getElementById('descripcion').value,
    };

    const res = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    alert(data.ok ? 'Actividad guardada' : '❌ ' + data.error);

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
      console.log("Reservas cargadas desde el backend:", reservas);
    } else {
      console.warn("No se recibieron reservas válidas del backend:", data);
    }
  } catch (error) {
    console.error("Error al cargar reservas:", error);
  }

  // 2️ Adaptar las reservas al formato del calendario (corrige fechas con zona horaria)
  const eventos = reservas.map(r => {
    // Normaliza la fecha a formato local YYYY-MM-DD
    const fecha = new Date(r.fecha);
    const fechaLocal = fecha.toISOString().split('T')[0];

    const horaInicio = r.hora_inicio ? r.hora_inicio.slice(0, 5) : "08:00";
    const horaFin = r.hora_fin ? r.hora_fin.slice(0, 5) : "17:00";

    // Construimos el título del evento
    let titulo = `${r.tipo.toUpperCase()} - ${r.descripcion || ''}`;

    // Si es un taller, añadimos id_taller e id_recurso
    if (r.tipo === 'taller') {
      titulo += ` - TALLER: ${r.id_taller || ''} - RECURSO: ${r.id_recurso || ''}`;
    }

    return {
      title: titulo,
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


  console.log("Eventos generados (fecha local corregida):", eventos);
});
