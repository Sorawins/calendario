document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id_mentor = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const mensaje = document.getElementById("mensaje");

  try {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_mentor, password })
    });

    const data = await res.json();

    
    // 1. Usuario sin contraseña (primera vez)
        if (data.primeraVez) {
      // Guardamos el id de usuario para la página de creación
      sessionStorage.setItem("tempUser", id_mentor);

      // Redirigimos a la página donde creará la contraseña
      window.location.href = "crearpassword.html";
      return;
    }

    
    // 2. Error en login normal
        if (!res.ok) {
      mensaje.textContent = data.error;
      return;
    }

    
    // 3. Login correcto
       sessionStorage.setItem("usuario", JSON.stringify(data));

    window.location.href = "index.html";

  } catch (err) {
    mensaje.textContent = "Error de conexión con el servidor";
  }
});

