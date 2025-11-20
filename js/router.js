// Router SPA básico
function navigate(page) {
  // Cargar el HTML de la vista
  fetch(`pages/${page}.html`)
    .then(res => {
      if (!res.ok) throw new Error("Vista no encontrada: " + page);
      return res.text();
    })
    .then(html => {
      // Renderizar la vista en el contenedor principal
      document.getElementById("view").innerHTML = html;

      // Intentar cargar el JS específico del módulo
      import(`./${page}.js`)
        .then(module => {
          if (module.init) module.init(); // inicializar si existe
        })
        .catch(err => console.warn("No hay JS para esta vista:", page, err));
    })
    .catch(err => {
      document.getElementById("view").innerHTML = `<p>Error cargando vista: ${err.message}</p>`;
    });
}

// Página inicial por defecto
navigate("dashboard");