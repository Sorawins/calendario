document.getElementById("createForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nueva = document.getElementById("nueva").value.trim();
    const repetir = document.getElementById("repetir").value.trim();
    const mensaje = document.getElementById("mensaje");

    if (nueva !== repetir) {
        mensaje.textContent = "Las contraseñas no coinciden";
        return;
    }

    // Recuperar usuario guardado temporalmente
    const id_mentor = sessionStorage.getItem("tempUser");

    if (!id_mentor) {
        mensaje.textContent = "Error: usuario no encontrado";
        return;
    }

    const res = await fetch("http://localhost:3000/api/login/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_mentor, password: nueva })
    });

    const data = await res.json();

    if (!res.ok) {
        mensaje.textContent = data.error;
        return;
    }

    //Mensaje tras creación de password
    mensaje.style.color = "green";
    mensaje.textContent = "Contraseña creada correctamente. Serás redirigido al login...";

    setTimeout(() => {
        window.location.href = "login.html";
    }, 2000); // 2 segundos

    
});
