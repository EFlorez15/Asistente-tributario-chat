// ---------------------------------------------------
//  UI.JS — Control de la barra lateral (sidebar)
// ---------------------------------------------------
// ui.js — versión FINAL para escritorio + móvil

function attachSidebarEvents() {
  const sidebar = document.querySelector(".pc-sidebar");
  if (!sidebar) return;

  const btnDesktop = document.getElementById("sidebar-hide");
  const btnMobile = document.getElementById("mobile-collapse");

  const toggle = (e) => {
    e.preventDefault();
    sidebar.classList.toggle("pc-sidebar-hide");
  };

  // Aseguramos listeners correctos en ambos botones
  if (btnDesktop && !btnDesktop.dataset.bound) {
    btnDesktop.addEventListener("click", toggle);
    btnDesktop.dataset.bound = "1";
  }

  if (btnMobile && !btnMobile.dataset.bound) {
    btnMobile.addEventListener("click", toggle);
    btnMobile.dataset.bound = "1";
  }
}

// 1) Ejecutar cuando cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  attachSidebarEvents();

  // 2) Reintentar después de 300ms (por si aparecer en móvil tarda)
  setTimeout(attachSidebarEvents, 300);
});

// 3) Exponer global si lo necesitas
window.ui = { attachSidebarEvents };

