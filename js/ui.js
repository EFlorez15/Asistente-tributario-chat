// Detecta si es móvil
function isMobile() {
  return window.innerWidth <= 992;
}

function openSidebarMobile() {
  const sidebar = document.querySelector(".pc-sidebar");
  sidebar.classList.add("pc-sidebar-show");
  showOverlay();
}

function closeSidebarMobile() {
  const sidebar = document.querySelector(".pc-sidebar");
  sidebar.classList.remove("pc-sidebar-show");
  hideOverlay();
}

function toggleSidebarDesktop() {
  const sidebar = document.querySelector(".pc-sidebar");
  sidebar.classList.toggle("pc-sidebar-hide");
}

// --- Overlay ---
function showOverlay() {
  let overlay = document.getElementById("sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 1400;
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", closeSidebarMobile);
  }
}

function hideOverlay() {
  const overlay = document.getElementById("sidebar-overlay");
  if (overlay) overlay.remove();
}

// --- EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
  const sidebarBtnDesktop = document.getElementById("sidebar-hide");
  const sidebarBtnMobile = document.getElementById("mobile-collapse");

  // Escritorio
  sidebarBtnDesktop?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleSidebarDesktop();
  });

  // Móvil
  sidebarBtnMobile?.addEventListener("click", (e) => {
    e.preventDefault();
    openSidebarMobile();
  });
});

// Export global
window.ui = {
  openSidebarMobile,
  closeSidebarMobile,
  toggleSidebarDesktop
};


