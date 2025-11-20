export function init() {
    // Lista de eventos tributarios (puedes moverlos a un JSON externo si quieres)
    const eventosTributarios = [
        { title: 'Retención Octubre', start: '2025-11-10' },
        { title: 'ICA Bimestre 5', start: '2025-12-15' },
        { title: 'Declaración IVA', start: '2025-11-20' }
    ];

    // Inicializar FullCalendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        events: eventosTributarios,
        eventColor: '#2b6cb0',
        eventTextColor: '#fff',
        eventClick: function (info) {
            // Al hacer clic en un evento, mostrar alerta con detalles
            Swal.fire({
                title: info.event.title,
                text: `Fecha: ${info.event.start.toLocaleDateString()}`,
                icon: 'info',
                confirmButtonColor: '#2b6cb0'
            });
        }
    });
    calendar.render();

    // Generar panel de alertas
    const hoy = new Date();
    const panel = document.getElementById("alertPanel");
    panel.innerHTML = ""; // limpiar

    eventosTributarios.forEach(evento => {
        const fechaEvento = new Date(evento.start);
        const diferenciaDias = Math.floor((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
        let mensaje = "";

        if (diferenciaDias < 0) {
            mensaje = `⚠️ El evento <b>${evento.title}</b> ya caducó (fue el ${fechaEvento.toLocaleDateString()}).`;
        } else if (diferenciaDias === 0) {
            mensaje = `📌 Hoy es el evento <b>${evento.title}</b> (${fechaEvento.toLocaleDateString()}).`;
        } else if (diferenciaDias <= 3) {
            mensaje = `⏳ El evento <b>${evento.title}</b> está próximo (en ${diferenciaDias} día(s)).`;
        } else {
            mensaje = `✅ El evento <b>${evento.title}</b> está programado para el ${fechaEvento.toLocaleDateString()}.`;
        }

        const alerta = document.createElement("p");
        alerta.innerHTML = mensaje;
        panel.appendChild(alerta);
    });
}