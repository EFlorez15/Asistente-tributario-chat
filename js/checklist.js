export function init() {
  const list = document.getElementById("checklist");

  fetch("data/checklist.json")
    .then(res => res.json())
    .then(data => {
      data.forEach((item, index) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `task-${index}`;

        // Recuperar estado guardado en localStorage
        const saved = localStorage.getItem(`task-${index}`);
        if (saved === "true") checkbox.checked = true;

        checkbox.addEventListener("change", () => {
          localStorage.setItem(`task-${index}`, checkbox.checked);
        });

        const label = document.createElement("label");
        label.htmlFor = `task-${index}`;
        label.textContent = item.tarea;

        li.appendChild(checkbox);
        li.appendChild(label);
        list.appendChild(li);
      });
    })
    .catch(err => {
      list.innerHTML = `<p>Error cargando checklist: ${err.message}</p>`;
    });
}