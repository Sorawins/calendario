// Volver a la página principal
function volverInicio() {
    window.location.href = "index.html";
}

// Mostrar calendario con datos desde backend
document.addEventListener("DOMContentLoaded", async () => {
    const calendarEl = document.getElementById("calendar");
    let reservas = [];
  
    try {
        const res = await fetch("http://localhost:3000/api/reservas");
        const data = await res.json();
        if (data.ok) reservas = data.data;
    } catch (err) {
        console.error("❌ Error al cargar reservas:", err);
    }

    // Adaptar reservas corrigiendo zona horaria
    const eventos = reservas.map(r => {
    const fechaUTC = new Date(r.fecha);
    const fechaLocal = new Date(fechaUTC.getTime() - fechaUTC.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

    const horaInicio = r.hora_inicio ? r.hora_inicio.slice(0, 5) : "08:00";
    const horaFin = r.hora_fin ? r.hora_fin.slice(0, 5) : "17:00";

    // Abreviaturas para tipos de evento
    let abreviatura = "";
    switch (r.tipo?.toLowerCase()) {
        case "reunion":
            abreviatura = "RI"; // Reunión inicial
            break;
        case "taller":
            abreviatura = "TA"; // Taller
            break;
        case "codice":
            abreviatura = "CO"; // Códice
            break;
        case "otros":
            abreviatura = "OT"; // Otros
            break;
        default:
            abreviatura = r.tipo ? r.tipo.toUpperCase() : "EV";
    }

    // Construcción del texto que se mostrará en el calendario
    const detalles = [];

    if (r.descripcion) detalles.push(r.descripcion);
    if (r.id_mentor) detalles.push(`Mentor: ${r.id_mentor}`);
    if (r.id_taller) detalles.push(`Taller: ${r.id_taller}`);
    if (r.id_centro) detalles.push(`Centro: ${r.id_centro}`);

    const texto = `${abreviatura} | ${detalles.join(" | ")}`;

    return {
        title: texto,
        start: `${fechaLocal}T${horaInicio}`,
        end: `${fechaLocal}T${horaFin}`,
        color:
            r.tipo === "taller"
                ? "#3a87ad"
                : r.tipo === "reunion"
                ? "#28a745"
                : r.tipo === "codice"
                ? "#f0ad4e"
                : "#6c757d",
    };
});

    // Crear y renderizar calendario
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "es",
        firstDay: 1, // Semana comienza el lunes
        height: "100%", // Ocupa todo el alto del contenedor
        expandRows: true,
        events: eventos,
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        },
    });

    console.log("✅ Eventos cargados:", eventos);
    calendar.render();
});
