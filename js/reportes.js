// --- Simulación de store y audit usando localStorage ---
const store = {
    getLogs: () => JSON.parse(localStorage.getItem("logs") || "[]"),
    addLog: (log) => {
        const logs = store.getLogs();
        logs.push(log);
        localStorage.setItem("logs", JSON.stringify(logs));
    }
};

const audit = {
    log: (action, data) => {
        store.addLog({ action, data, ts: new Date().toISOString() });
    }
};

// --- Utilidades ---
function formatCOP(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
}
function nowISO() { return new Date().toISOString(); }
async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Certificados ---
function obtenerDatosCertificado() {
    const lastCalc = JSON.parse(localStorage.getItem("ultimoCalculo"));
    if (!lastCalc) return null;

    const id = "CERT-" + Date.now();
    const d = {
        id,
        tipo: lastCalc.tipo,
        base: lastCalc.base,
        excep: lastCalc.excep || "",
        retencion: lastCalc.retencionCOP || 0,
        tarifa: lastCalc.tarifaAplicada || 0,
        tsCalc: new Date().toISOString()
    };

    localStorage.setItem(id, JSON.stringify(d));
    audit.log("CERT_CREATE", d);
    return d;
}

async function generarPDFCertificado() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'jsPDF no cargado. Verifica el script en index.html',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }

    const cert = obtenerDatosCertificado();
    if (!cert) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin cálculo previo',
            text: 'No hay cálculo previo para generar el certificado',
            confirmButtonColor: '#f6ad55'
        });
        return;
    }

    const empresa = 'Eurotech Pharma Ltda.';
    const nit = '900.123.456-7';
    const ciudad = 'Barranquilla, Atlantico';
    const responsable = 'Responsable: Área Tributaria';
    const fechaEmision = new Date();

    const payload = JSON.stringify(cert);
    const hash = await sha256Hex(payload);

    const COLOR_PRIMARY = [31, 111, 235];
    const COLOR_SECONDARY = [100, 100, 100];
    const COLOR_ACCENT = [235, 64, 52];

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;

    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Certificado de Retención en la Fuente', margin, y);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 18;
    doc.text(`ID: ${cert.id}`, margin, y);
    y += 14;
    doc.text(`${empresa} • NIT ${nit} • ${ciudad}`, margin, y);
    y += 10;
    doc.text(responsable, margin, y);

    y += 16;
    doc.setDrawColor(...COLOR_PRIMARY);
    doc.line(margin, y, 595 - margin, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text('Detalle del cálculo', margin, y);

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const rows = [
        [`Tipo de pago:`, cert.tipo],
        [`Base gravable:`, formatCOP(cert.base)],
        [`Tarifa aplicada:`, `${(cert.tarifa * 100).toFixed(2)} %`],
        [`Beneficio/Excepción:`, cert.excep || 'N/A'],
        [`Retención calculada:`, formatCOP(cert.retencion)]
    ];
    rows.forEach(([k, v]) => {
        doc.setTextColor(...COLOR_SECONDARY);
        doc.text(k, margin, y);
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(String(v), margin + 180, y);
        y += 18;
    });

    y += 20;
    doc.setTextColor(...COLOR_ACCENT);
    doc.text(`Hash (SHA-256): ${hash}`, margin, y);

    const filename = `Certificado_${cert.id}.pdf`;
    doc.save(filename);
    audit.log('PDF_EXPORT', { id: cert.id, filename, hash });
    Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: `PDF generado: ${filename}`,
        confirmButtonColor: '#2b6cb0'
    });

}

function generarExcelCertificados() {
    const logs = store.getLogs().filter(l => l.action === 'CERT_CREATE');
    if (!logs.length) {
        Swal.fire({
            icon: 'info',
            title: 'Sin certificados',
            text: 'No hay certificados para exportar',
            confirmButtonColor: '#2b6cb0'
        });
        return;
    }

    const data = logs.map(l => ({
        ID: l.data.id,
        Tipo: l.data.tipo,
        Base: l.data.base,
        Excepcion: l.data.excep,
        Retencion: l.data.retencion,
        Tarifa: (l.data.tarifa * 100).toFixed(2) + '%',
        FechaCalculo: l.data.tsCalc
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificados");
    XLSX.writeFile(wb, "Certificados.xlsx");

    audit.log('EXCEL_EXPORT', { count: data.length });
    Swal.fire({
        icon: 'success',
        title: 'Excel generado',
        text: `Se exportaron ${data.length} certificados`,
        confirmButtonColor: '#2b6cb0'
    });
}

// --- Checklist ---
function generarExcelChecklist() {
    const tareas = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("task-")) {
            tareas.push({
                Tarea: key,
                Completada: localStorage.getItem(key) === "true" ? "Sí" : "No"
            });
        }
    }
    if (!tareas.length) return alert("No hay tareas en el checklist");

    const ws = XLSX.utils.json_to_sheet(tareas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Checklist");
    XLSX.writeFile(wb, "Checklist.xlsx");
    alert(`Excel generado con ${tareas.length} tareas`);
}

function generarPDFChecklist() {
    const { jsPDF } = window.jspdf;
    const tareas = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("task-")) {
            tareas.push([key, localStorage.getItem(key) === "true" ? "Sí" : "No"]);
        }
    }
    if (!tareas.length) return alert("No hay tareas en el checklist");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("📋 Reporte de Checklist", 20, 20);

    doc.autoTable({
        startY: 40,
        head: [["Tarea", "Completada"]],
        body: tareas,
        styles: { fontSize: 11, halign: "center" },
        headStyles: { fillColor: [43, 108, 176], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [237, 242, 247] }
    });

    doc.save("Checklist.pdf");
    alert("PDF de checklist generado");
}

// --- Inicialización del módulo ---
export function init() {
    document.getElementById("btnCertPDF").addEventListener("click", generarPDFCertificado);
    document.getElementById("btnCertExcel").addEventListener("click", generarExcelCertificados);
    document.getElementById("btnChecklistExcel").addEventListener("click", generarExcelChecklist);
    document.getElementById("btnChecklistPDF").addEventListener("click", generarPDFChecklist);
}