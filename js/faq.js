export function init() {
  const container = document.getElementById("faq-container");

  fetch("data/faq.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const faqItem = document.createElement("div");
        faqItem.classList.add("faq-item");

        const questionBtn = document.createElement("button");
        questionBtn.classList.add("faq-question");
        questionBtn.textContent = item.pregunta;

        const answerDiv = document.createElement("div");
        answerDiv.classList.add("faq-answer");
        answerDiv.innerHTML = `<p>${item.respuesta}</p>`;

        // Evento para mostrar/ocultar respuesta
        questionBtn.addEventListener("click", () => {
          const visible = answerDiv.style.display === "block";
          document.querySelectorAll(".faq-answer").forEach(a => a.style.display = "none");
          answerDiv.style.display = visible ? "none" : "block";
        });

        faqItem.appendChild(questionBtn);
        faqItem.appendChild(answerDiv);
        container.appendChild(faqItem);
      });
    })
    .catch(err => {
      container.innerHTML = `<p>Error cargando FAQ: ${err.message}</p>`;
    });
}