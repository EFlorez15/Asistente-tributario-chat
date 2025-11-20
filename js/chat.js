function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function init() {
  const chatbox = document.getElementById("chatbox");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  let respuestas = [];

  // Cargar respuestas desde JSON
  fetch("data/chat.json")
    .then(res => res.json())
    .then(data => { respuestas = data; })
    .catch(err => {
      chatbox.innerHTML += `
        <div class="msg bot">❌ Error cargando respuestas: ${err.message}</div>
      `;
    });

  // Función para enviar mensaje
  function enviarMensaje(textoManual = null) {
    const preguntaOriginal = textoManual || input.value;
    const pregunta = normalizar(preguntaOriginal);

    if (!pregunta) return;

    // Mostrar mensaje del usuario
    chatbox.innerHTML += `<div class="msg user">${preguntaOriginal}</div>`;
    input.value = "";
    chatbox.scrollTop = chatbox.scrollHeight;

    // Buscar respuesta (exacta primero, luego parcial)
    let respuesta = null;
    for (let item of respuestas) {
      const clave = normalizar(item.clave || item.pregunta || "");
      if (pregunta === clave) { respuesta = item.respuesta; break; }
    }
    if (!respuesta) {
      for (let item of respuestas) {
        const clave = normalizar(item.clave || item.pregunta || "");
        if (pregunta.includes(clave) || clave.includes(pregunta)) {
          respuesta = item.respuesta; break;
        }
      }
    }
    if (!respuesta) {
      respuesta = "Lo siento, aún no tengo información exacta sobre ese tema.";
    }

    // Mostrar con pequeño delay
    setTimeout(() => {
      chatbox.innerHTML += `<div class="msg bot">${respuesta}</div>`;
      chatbox.scrollTop = chatbox.scrollHeight;
    }, 400);
  }

  // Botón enviar
  sendBtn.addEventListener("click", () => enviarMensaje());

  // Enter para enviar
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensaje();
  });

  // 👉 NUEVO: Listener para preguntas sugeridas
  document.querySelectorAll(".chat-suggestions li").forEach(li => {
    li.addEventListener("click", () => {
      enviarMensaje(li.dataset.pregunta);
    });
  });

  // Exponer globalmente si quieres usarlo en otros módulos
  window.chatEnviar = enviarMensaje;
}
