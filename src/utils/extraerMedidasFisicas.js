// src/utils/extraerMedidasFisicas.js
// Placeholder content - Please replace with your actual logic
// Note: Removed the fs.writeFileSync line as it's for debug and should be handled by central logging/debug flags
const DEBUG = process.env.DEBUG === 'true';

function extraerMedidasFisicas(txt, props) {
  const log = []; // For local debugging within this function

  txt = txt.replace(/\s+/g, ' ').replace(/[“”]/g, '"').toLowerCase();

  // ➤ Ultra-flex (mm)(in)
  const matchMMIN = txt.match(/\(mm\)\s*\(in\)[^\d]{1,10}([0-9.,]{1,7})[^\d]{1,10}([0-9.,]{1,7})/i);
  if (!props.espesor && matchMMIN) {
    const mm = parseFloat(matchMMIN[1].replace(',', '.'));
    if (!isNaN(mm) && mm < 5) {
      props.espesor = parseFloat(mm.toFixed(3));
    }
  }

  // ➤ Espesor x ancho en pulgadas
  const matchDim = txt.match(/(0\.\d{3,5})\s*["”']?\s*[x×*/-]\s*(\d{2,4}\.\d{2,5})/i);
  if (matchDim) {
    const pulgadasEsp = parseFloat(matchDim[1]);
    const pulgadasAncho = parseFloat(matchDim[2]);
    props.espesor = parseFloat((pulgadasEsp * 25.4).toFixed(3));
    props.ancho = parseFloat((pulgadasAncho * 25.4).toFixed(1));
  }

  // ➤ OCR múltiple vertical (recorre todos)
  const matches = [...txt.matchAll(/(\d{1,3}[.,]\d{1,4})\s+(\d{3,5}[.,]\d{1,4})/g)];
  for (const m of matches) {
    const v1 = parseFloat(m[1].replace(',', '.'));
    const v2 = parseFloat(m[2].replace(',', '.'));
    if (v1 < 5 && v2 > 1000) {
      props.espesor = v1;
      props.ancho = v2;
      break;
    }
  }

  // ➤ Valores combinados (ej. 0.231170 → espesor 0.231, ancho 1170)
  const combinados = [...txt.matchAll(/0[.,]\d{2,3}\d{3,4}/g)];
  for (const c of combinados) {
    const raw = c[0].replace(',', '.');
    const mm = parseFloat(raw.slice(0, 5));
    const ancho = parseFloat(raw.slice(5));
    if (mm < 5 && ancho > 1000) {
      props.espesor = parseFloat(mm.toFixed(3));
      props.ancho = ancho;
      break;
    }
  }

  // ➤ Gauge: 0.0450in
  if (!props.espesor) {
    const matchGaugeLine = txt.match(/gauge[:\s]*([\d.]+)\s*(in)?/i);
    if (matchGaugeLine) {
      const val = parseFloat(matchGaugeLine[1]);
      if (val < 0.5) { // Assuming typical gauge values are < 0.5 inches
        props.espesor = parseFloat((val * 25.4).toFixed(3));
      }
    }
  }

  // ➤ Thickness: 0.0472 in
  if (!props.espesor) {
    const matchThickness = txt.match(/thickness[:\s]*([\d.]+)\s*(in|mm)?/i);
    if (matchThickness) {
      const valor = parseFloat(matchThickness[1]);
      const unidad = matchThickness[2]?.toLowerCase() || 'mm';
      props.espesor = unidad === 'in' ? valor * 25.4 : valor;
    }
  }

  // ➤ "18 gauge"
  if (!props.espesor) {
    const matchGauge = txt.match(/(\d{1,2})\s*gauge/i);
    if (matchGauge) {
      const gauge = parseInt(matchGauge[1]);
      const gaugeMap = {
        16: 1.613, 17: 1.429, 18: 1.214, 19: 1.016, 20: 0.912,
        21: 0.813, 22: 0.711, 23: 0.609, 24: 0.558, 25: 0.508,
        26: 0.478, 27: 0.418, 28: 0.376, 29: 0.330, 30: 0.305
      };
      if (gaugeMap[gauge]) {
        props.espesor = gaugeMap[gauge];
      }
    }
  }

  // 📐 ANCHO
  const matchWidth = txt.match(/width[:\s]*([\d.]+)\s*(in|mm)?/i);
  if (matchWidth) {
    const valor = parseFloat(matchWidth[1]);
    const unidad = matchWidth[2]?.toLowerCase() || 'mm';
    props.ancho = unidad === 'in'
      ? parseFloat((valor * 25.4).toFixed(1))
      : parseFloat(valor.toFixed(1));
  }

  // 📏 LONGITUD
  const matchLength = txt.match(/length[:\s]*([\d,]+)\s*ft/i);
  if (matchLength) {
    const raw = matchLength[1].replace(/,/g, '');
    props.longitud = parseFloat(raw) * 304.8;
  }

  // 📏 Detección combinada: diámetro exterior y espesor de pared (for tubes)
  // 🧠 Pattern for 'ø273.00mm O.D. x 9.27mm W.T.'
  const matchTenaris = txt.match(/ø\s*([\d.,]+)\s*mm\s*O\.?D\.?\s*x\s*([\d.,]+)\s*mm\s*W\.?T\.?/i);
  if (matchTenaris) {
    const od = parseFloat(matchTenaris[1].replace(',', '.'));
    const wt = parseFloat(matchTenaris[2].replace(',', '.'));
    if (!isNaN(od)) props.diametroExterior = Math.round(od * 1000) / 1000;
    if (!isNaN(wt)) props.espesorPared = Math.round(wt * 1000) / 1000;
  }

  // 📏 Longitud mínima y máxima (10000 mm ÷ 11800 mm)
  const matchLongitudRange = txt.match(/(\d{4,6})\s*mm\s*[÷\-]\s*(\d{4,6})\s*mm/i);
  if (matchLongitudRange) {
    const min = parseInt(matchLongitudRange[1], 10);
    const max = parseInt(matchLongitudRange[2], 10);
    if (!isNaN(min) && !isNaN(max)) props.longitud = Math.round((min + max) / 2);
  }

  // Check for 'coil' or 'bobina' to infer 'esEnrollado'
  if (/(coil|bobina|cr coil)/i.test(txt)) {
    props.esEnrollado = true;
  }


  if (DEBUG) {
    log.push(`✅ Resultado final medidas físicas: ${JSON.stringify({
      espesor: props.espesor,
      ancho: props.ancho,
      espesorPared: props.espesorPared,
      diametroExterior: props.diametroExterior,
      longitud: props.longitud,
      molino: props.molino,
      norma: props.norma,
      coilNumber: props.coilNumber,
      esEnrollado: props.esEnrollado
    })}`);
    log.push(`📦 Props finales: ${JSON.stringify(props, null, 2)}`);
    log.forEach(l => console.log(l));
  }
}

module.exports = extraerMedidasFisicas;