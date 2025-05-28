// src/utils/extraerHeatYCoil.js
// Placeholder content - Please replace with your actual logic
const DEBUG = process.env.DEBUG === 'true';


function extraerHeatYCoil(texto, props) {
  // 🔥 Heat number (robust extraction)
  const matchHeat = texto.match(/heat\s*(no\.?|number|#)?\s*[:\-]?\s*\n?\s*([a-z0-9\-]+)/i);

  if (matchHeat) {
    const candidato = matchHeat[2].toUpperCase();

    // If it's a generic word like 'COIL' or chemical names, look for a valid number afterwards
    const palabrasInvalidas = ["COIL", "NUMBER", "NO", "NUM", "N", "CSIMNPSALCRCUMON"];
    if (palabrasInvalidas.includes(candidato) || /^[A-Z]{5,}$/.test(candidato)) {
      const after = texto.slice(matchHeat.index).match(/\b\d{6,20}\b/); // long number
      if (after) {
        props.heatNumber = after[0];
        if (DEBUG) console.log(`🔥 Heat Number detectado (corregido): ${props.heatNumber}`);
      } else {
        if (DEBUG) console.warn('⚠️ No se encontró número válido tras encabezado inválido.');
      }
    } else if (/^\d{6,20}$/.test(candidato)) {
      // Already a valid number
      props.heatNumber = candidato;
      if (DEBUG) console.log(`🔥 Heat Number detectado: ${props.heatNumber}`);
    } else {
      if (DEBUG) console.warn(`⚠️ Heat Number inválido: ${candidato}`);
    }
  } else {
    if (DEBUG) console.warn('⚠️ No se detectó ningún patrón de heat number.');
  }

  // Detección del coil number a partir del heat (if heat is found)
  if (!props.coilNumber && props.heatNumber && texto.includes(props.heatNumber)) {
    const index = texto.indexOf(props.heatNumber);
    // Look for a number after the heat number
    const coilCandidateMatch = texto.slice(index + props.heatNumber.length).trim().match(/\b\d{6,}\b/);
    if (coilCandidateMatch) {
      props.coilNumber = coilCandidateMatch[0];
      if (DEBUG) console.log(`🔢 Coil Number detectado: ${props.coilNumber}`);
    }
  }
}

module.exports = extraerHeatYCoil;