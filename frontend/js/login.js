// Usuario y contraseña válidos
const USUARIO_VALIDO = "admin";
const PASSWORD_VALIDO = "1234";

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const mensaje = document.getElementById("mensaje");

  if (usuario === USUARIO_VALIDO && password === PASSWORD_VALIDO) {
    // Guardar sesión y redirigir
    sessionStorage.setItem("usuario", usuario);
    window.location.href = "index.html";
  } else {
    mensaje.textContent = "Usuario o contraseña incorrectos";
  }
});
