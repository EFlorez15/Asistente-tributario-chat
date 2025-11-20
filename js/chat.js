export function init() {
  const chatbox = document.getElementById("chatbox");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  let respuestas = [];

  // Cargar respuestas desde JSON
  fetch("data/chat.json")
    .then(res => res.json())
    .then(data => {
      respuestas = data;
    })
    .catch(err => {
      chatbox.innerHTML += `<div class="msg bot">Error cargando respuestas: ${err.message}</div>`;
    });

  // Enviar mensaje
  sendBtn.addEventListener("click", () => {
    const pregunta = input.value.trim().toLowerCase();
    if (!pregunta) return;

    // Mostrar mensaje del usuario
    chatbox.innerHTML += `<div class="msg user">${input.value}</div>`;

    // Buscar respuesta
    let respuesta = "Lo siento, no tengo información sobre eso.";
    for (let item of respuestas) {
      if (pregunta.includes(item.clave)) {
        respuesta = item.respuesta;
        break;
      }
    }

    // Mostrar respuesta del bot
    chatbox.innerHTML += `<div class="msg bot">${respuesta}</div>`;
    chatbox.scrollTop = chatbox.scrollHeight;
    input.value = "";
  });
}