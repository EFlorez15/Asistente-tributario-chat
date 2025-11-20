export function init() {
    const container = document.getElementById("normas-container");

    fetch("data/normas.json")
        .then(res => res.json())
        .then(data => {
            data.forEach(item => {
                const card = document.createElement("div");
                card.classList.add("norma-card");

                card.innerHTML = `
          <h3>${item.titulo}</h3>
          <p>${item.descripcion}</p>
          <a href="${item.link}" target="_blank">Ver documento</a>
        `;

                container.appendChild(card);
            });
        })
        .catch(err => {
            container.innerHTML = `<p>Error cargando normatividad: ${err.message}</p>`;
        });
}