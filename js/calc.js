export function init() {
    const form = document.getElementById("calcForm");
    const result = document.getElementById("calcResult");

    // Modal
    const modal = document.getElementById("configModal");
    const openBtn = document.getElementById("openConfig");
    const closeBtn = document.getElementById("closeConfig");
    const saveBtn = document.getElementById("saveConfig");

    // Abrir modal
    openBtn.addEventListener("click", () => modal.style.display = "block");
    closeBtn.addEventListener("click", () => modal.style.display = "none");

    // Guardar configuración en localStorage
    saveBtn.addEventListener("click", () => {
        const uvt = parseFloat(document.getElementById("uvt").value);
        const redondeo = document.getElementById("redondeo").value;
        localStorage.setItem("uvtVigente", uvt);
        localStorage.setItem("redondeo", redondeo);
        alert("Configuración guardada ✅");
        modal.style.display = "none";
    });


    form.addEventListener("submit", async e => {
        e.preventDefault();

        const tipo = document.getElementById("tipo").value;
        const unidad = document.getElementById("unidad").value;
        const base = parseFloat(document.getElementById("base").value);
        const excep = document.getElementById("excep").value;

        const { ok, retencionCOP, tarifaAplicada, detalle, msg } =
            await calcularRetencionAvanzada({ tipo, unidad, base, excep });

        if (!ok) {
            result.innerHTML = `<p style="color:red">${msg}</p>`;
            return;
        }

        result.innerHTML = `
      <p><b>Tipo:</b> ${tipo}</p>
      <p><b>Base:</b> ${base} ${unidad}</p>
      <p><b>Tarifa aplicada:</b> ${(tarifaAplicada * 100).toFixed(2)}%</p>
      <p><b>Retención calculada:</b> ${retencionCOP.toLocaleString()} COP</p>
      <p><i>${detalle}</i></p>
    `;
        // Guardar último cálculo en localStorage para reportes
        const ultimoCalculo = {
            tipo,
            unidad,
            base,
            excep,
            retencionCOP,
            tarifaAplicada,
            detalle
        };
        localStorage.setItem("ultimoCalculo", JSON.stringify(ultimoCalculo));

        // También registrar en logs para trazabilidad
        audit.log("CALC_OK_ADV", { data: ultimoCalculo });
    });
}

// ------------------ Lógica de cálculo ------------------

async function cargarReglas() {
    const resp = await fetch("data/tarifas.json");
    return resp.json();
}

function convertirBase(base, unidadEntrada, unidadRegla, uvtVigente) {
    if (unidadEntrada === unidadRegla) return base;
    if (!uvtVigente || uvtVigente <= 0) throw new Error("UVT vigente no configurada");

    if (unidadEntrada === "COP" && unidadRegla === "UVT") return base / uvtVigente;
    if (unidadEntrada === "UVT" && unidadRegla === "COP") return base * uvtVigente;

    return base;
}

function seleccionarTarifaPorRango(baseNormalizada, regla) {
    const rangos = regla.rangoTarifasUVT || regla.rangoTarifas || [];
    const match = rangos.find(r =>
        baseNormalizada >= (r.min || 0) &&
        (r.max === null || baseNormalizada <= r.max)
    );
    return match ? match.tarifa : null;
}

function aplicarExcepcion(tarifa, regla, excep) {
    if (!excep) return { tarifaFinal: tarifa, detalle: "Sin excepción" };
    const ex = (regla.excepciones || []).find(e => e.clave.toLowerCase() === excep.toLowerCase());
    if (!ex) return { tarifaFinal: tarifa, detalle: "Excepción no reconocida" };

    if (ex.efecto.tipo === "exonerar") {
        return { tarifaFinal: 0, detalle: `Exonerado por "${ex.clave}"` };
    }
    if (ex.efecto.tipo === "reducirTarifa") {
        const factor = ex.efecto.factor || 1;
        return { tarifaFinal: tarifa * factor, detalle: `Tarifa reducida (${(factor * 100).toFixed(0)}%) por "${ex.clave}"` };
    }
    return { tarifaFinal: tarifa, detalle: "Excepción sin efecto definido" };
}

function aplicarTopes(retencionCOP, topes) {
    if (!topes) return retencionCOP;
    const min = topes.minRetencionCOP ?? null;
    const max = topes.maxRetencionCOP ?? null;
    if (min !== null && retencionCOP < min) return 0;
    if (max !== null && retencionCOP > max) return max;
    return retencionCOP;
}

function aplicarRedondeo(valorCOP) {
    return Math.round(valorCOP);
}

export async function calcularRetencionAvanzada({ tipo, unidad, base, excep }) {
    try {
        const reglas = await cargarReglas();
        const regla = reglas.find(r => r.tipo === tipo);

        if (!regla) return { ok: false, msg: "Tipo de pago no encontrado" };
        if (Number.isNaN(base) || base < 0) return { ok: false, msg: "Base inválida" };

        const uvtVigente = 47000; // ⚠️ valor UVT de ejemplo, puedes cargarlo de config

        const baseNormalizada = convertirBase(base, unidad, (regla.unidadBase || (regla.rangoTarifasUVT ? "UVT" : "COP")), uvtVigente);

        const baseMinima = (regla.unidadBase === "UVT" || regla.rangoTarifasUVT) ? (regla.baseMinimaUVT || 0) : (regla.baseMinima || 0);
        if (baseNormalizada < baseMinima) {
            const detalle = `Base inferior al mínimo (${baseMinima} ${regla.unidadBase || "COP"})`;
            return { ok: true, retencionCOP: 0, tarifaAplicada: 0, detalle };
        }

        const tarifaBase = seleccionarTarifaPorRango(baseNormalizada, regla);
        if (tarifaBase === null) return { ok: false, msg: "No hay rango aplicable para la base" };

        const { tarifaFinal, detalle: detalleEx } = aplicarExcepcion(tarifaBase, regla, excep);
        const tarifaAplicada = tarifaFinal;

        const retencion = baseNormalizada * tarifaAplicada;
        const retencionCOP = (regla.unidadBase === "UVT" || regla.rangoTarifasUVT) ? retencion * (uvtVigente || 1) : retencion;

        const retencionAjustada = aplicarTopes(retencionCOP, regla.topes);
        const retencionFinal = aplicarRedondeo(retencionAjustada);

        const detalle = `Tarifa por rango: ${(tarifaBase * 100).toFixed(2)}% • ${detalleEx}`;
        return { ok: true, retencionCOP: retencionFinal, tarifaAplicada, detalle };
    } catch (err) {
        console.error(err);
        return { ok: false, msg: "Error en el cálculo. Revisa configuración de UVT y reglas." };
    }
}