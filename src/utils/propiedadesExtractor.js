// src/utils/propiedadesExtractor.js

const DEBUG = true; // Forzado para depuración

function _extraerProcesoLaminado(productTypeField, manufacturingProcessField, textoGeneral) {
  let procesoLaminado = null;
  const keywordsCaliente = /\b(hot finished|warmgefertigt|hot rolled|laminado en caliente|seamless hot rolled)\b/i;
  const keywordsFrio = /\b(cold finished|kaltgefertigt|cold rolled|laminado en frio|cold drawn|kaltgezogen|cold sized)\b/i;

  if (productTypeField) {
    if (keywordsCaliente.test(productTypeField)) procesoLaminado = 'caliente';
    else if (keywordsFrio.test(productTypeField)) procesoLaminado = 'frio';
    if (procesoLaminado && DEBUG) console.log(`🏭 P.L. (de Product Type Field): ${procesoLaminado}`);
  }

  if (!procesoLaminado && manufacturingProcessField) {
    if (keywordsCaliente.test(manufacturingProcessField)) procesoLaminado = 'caliente';
    else if (keywordsFrio.test(manufacturingProcessField)) procesoLaminado = 'frio';
    if (procesoLaminado && DEBUG) console.log(`🏭 P.L. (de Mfg. Process Field): ${procesoLaminado}`);
  }

  if (!procesoLaminado && textoGeneral) {
    if (keywordsCaliente.test(textoGeneral)) procesoLaminado = 'caliente';
    else if (keywordsFrio.test(textoGeneral)) procesoLaminado = 'frio';
    if (procesoLaminado && DEBUG) console.log(`🏭 P.L. (de Texto General): ${procesoLaminado}`);
  }
  return procesoLaminado;
}

function _extraerContenidoNota(txt, numeroNota, terminosClaveCampoEnNota) {
    for (const termino of terminosClaveCampoEnNota) {
        const regexConDescripcionCompleta = new RegExp(
            `(?:note|anmerkung)\\s*${numeroNota}\\s*(?:is the full description of the|ist die volle beschreibung de[rs])\\s*'${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*([\\s\\S]*?)(?=\\s*(?:note|anmerkung)\\s*${parseInt(numeroNota) + 1}\\s*(?:is the full description|ist die volle beschreibung)|supplementary information|product description notes|standard editions|marking|page\\s*\\d+\\s*\\/|$)`,
            "i"
        );
        let match = txt.match(regexConDescripcionCompleta);
        if (match && match[1]) {
            const contenido = match[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            if (DEBUG) console.log(`DEBUG (_extraerContenidoNota - Regex Principal para '${termino}') Nota ${numeroNota}: Encontrado: "${contenido}"`);
            if (contenido.length > 3) return contenido;
        }
    }
    const fallbackRegex = new RegExp(
        `(?:note|anmerkung)\\s*${numeroNota}\\s+([a-z0-9].*?)(?=\\s*(?:note|anmerkung)\\s*${parseInt(numeroNota) + 1}\\s|supplementary information|product description notes|standard editions|marking|page\\s*\\d+\\s*\\/|$)`,
        "is"
    );
    let matchFallback = txt.match(fallbackRegex);
    if (matchFallback && matchFallback[1]) {
        let contenido = matchFallback[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        contenido = contenido.replace(/^(?:is the full description of the|ist die volle beschreibung de[rs])\s*'.*?'\s*/i, '').trim();
        if (contenido.length > 5) {
             if (DEBUG) console.log(`DEBUG (_extraerContenidoNota - Fallback Genérico) Nota ${numeroNota} (buscando ${terminosClaveCampoEnNota.join('/')}): Encontrado: "${contenido}"`);
            return contenido;
        }
    }
    if (DEBUG) console.log(`DEBUG (_extraerContenidoNota) para Nota ${numeroNota} (campos: ${terminosClaveCampoEnNota.join('/')}): No se encontró contenido con ninguna regex.`);
    return null;
}

function extraerTodasLasPropiedades(rawText, utils) {
  const props = {
    descripcion: '',
    tipoProducto: null,
    formaFisica: null,
    costura: null,
    procesoLaminado: null,
    usoTecnico: null,
    norma: null,
    normaTecnica: null,
    tratamiento: null,
    recubrimiento: null,
    acabado: null,
    molino: null,
    espesor: null,
    ancho: null,
    diametroExterior: null,
    espesorPared: null,
    longitud: null,
    heatNumber: null,
    coilNumber: null,
    serie: null,
    formaTransversal: null,
    esEnrollado: false,
    resistencia: null, // <--- AÑADIDO PARA GUARDAR LÍMITE DE FLUENCIA EN MPA
    // ... otras propiedades que inicialices ...
  };
  const { detectarAcabado, extraerHeatYCoil, extraerMedidasFisicas } = utils;
  
  const textoNormalizado = rawText.toLowerCase().replace(/[\n\t\f\r]/g, ' ').replace(/\s+/g, ' ').trim();

  extraerHeatYCoil(textoNormalizado, props);

  // 1. Descripción del Producto
  let productTypeField = '';
  const productTypeLabelRegex = /(product type\s*\/.*?art des produkts?)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  let matchProductTypeLabel = rawText.match(productTypeLabelRegex); 

  if (matchProductTypeLabel) {
      if (matchProductTypeLabel[2] || matchProductTypeLabel[3]) {
          const noteNumber = matchProductTypeLabel[2] || matchProductTypeLabel[3];
          productTypeField = _extraerContenidoNota(rawText, noteNumber, ["product type", "art des produkts"]) || '';
          if (DEBUG && productTypeField) console.log(`🕵️ Product Type Field (from Note ${noteNumber}): "${productTypeField}"`);
      } else if (matchProductTypeLabel[4] && !matchProductTypeLabel[4].toLowerCase().includes("see note")) {
          productTypeField = matchProductTypeLabel[4].trim();
          if (DEBUG && productTypeField) console.log(`🕵️ Product Type Field (direct): "${productTypeField}"`);
      }
  }
  
  // Fallback para productTypeField si el anterior no encontró nada (para el MTR de AM/NS Calvert)
  if (!productTypeField) {
    const steelGradeRegex = /(?:steel grade\s*\/\s*customer specification|type of product\s*\/\s*surface)\s*[:\-\s]*([^\n;,.(]+)/i;
    const matchSteelGrade = rawText.match(steelGradeRegex); // Usar rawText para capturar la línea como está
    if (matchSteelGrade && matchSteelGrade[1]) {
        productTypeField = matchSteelGrade[1].trim();
        if (DEBUG) console.log(`🕵️ Product Type Field (from Steel Grade/Type of Product Surface): "${productTypeField}"`);
    }
  }

  if (!productTypeField && DEBUG) console.log(`🕵️ Product Type Field no encontrado con patrón principal o alternativos.`);
  props.descripcion = productTypeField;
  const textoParaTipo = (productTypeField || textoNormalizado).toLowerCase();

  // ... (Lógica para tipoProducto, costura, esEnrollado - SIN CAMBIOS IMPORTANTES)
    if (/(tube|pipe|tubo|tubing|piping|conduit)/i.test(textoParaTipo)) {
      props.tipoProducto = 'tubo';
      props.formaFisica = 'cilindrica';
      if (/\bseamless\b|nahtlos/i.test(textoParaTipo)) props.costura = 'sin costura';
      else if (/\b(welded|erw|hfw|saw|geschweisst)\b/i.test(textoParaTipo)) props.costura = 'con costura';
      else props.costura = 'sin costura';
  } else if (/(plate|lamina|sheet|coil|strip|bobina|blech|band)/i.test(textoParaTipo)) {
      props.tipoProducto = 'lamina'; props.formaFisica = 'plana';
      if (/\b(coil|bobina|rollo)\b/i.test(textoParaTipo)) props.esEnrollado = true;
      props.costura = 'no aplica';
  } else if (/\b(bar|barra|stabstahl)\b/i.test(textoParaTipo)) {
      props.tipoProducto = 'barra';
      props.costura = 'no aplica';
  } // ... más tipos ...


  // 2. Proceso de Manufactura y Tratamiento
  let manufacturingProcessField = "";
  // ... (lógica para extraer manufacturingProcessField - SIN CAMBIOS IMPORTANTES)
  const mfgProcessLabelRegex = /(manufacturing process\s*\/.*?herstellungsprozess)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  const matchMfgProcessLabel = rawText.match(mfgProcessLabelRegex);
   if (matchMfgProcessLabel) {
      if (matchMfgProcessLabel[2] || matchMfgProcessLabel[3]) {
          const noteNumber = matchMfgProcessLabel[2] || matchMfgProcessLabel[3];
          manufacturingProcessField = _extraerContenidoNota(rawText, noteNumber, ["manufacture process", "herstellungsprozess"]) || '';
          if (DEBUG && manufacturingProcessField) console.log(`🕵️ Mfg Process Field (from Note ${noteNumber}): "${manufacturingProcessField}"`);
      } else if (matchMfgProcessLabel[4] && !matchMfgProcessLabel[4].toLowerCase().includes("see note")) {
          manufacturingProcessField = matchMfgProcessLabel[4].trim();
          if (DEBUG && manufacturingProcessField) console.log(`🕵️ Mfg Process Field (direct): "${manufacturingProcessField}"`);
      }
  }
  const mfgProcessParaAnalisis = (manufacturingProcessField || "").toLowerCase();
  if (mfgProcessParaAnalisis) {
    // ... (lógica de tratamiento - SIN CAMBIOS IMPORTANTES)
      if (/\b(normalized and tempered|normalizado y templado|normalgeglueht und anlassen)\b/i.test(mfgProcessParaAnalisis)) props.tratamiento = 'normalizado y templado';
      else if (/\b(normalized|normalizado|normalgeglueht)\b/i.test(mfgProcessParaAnalisis)) props.tratamiento = 'normalizado';
  }
  if (DEBUG && props.tratamiento) console.log(`🔥 Tratamiento: ${props.tratamiento}`);
  props.procesoLaminado = _extraerProcesoLaminado(textoParaTipo, mfgProcessParaAnalisis, textoNormalizado);
  //  (El log de procesoLaminado explícito ya estaba, se mantiene)

  // 3. Uso Técnico
  // ... (lógica de uso técnico - SIN CAMBIOS IMPORTANTES)
  if (props.descripcion && /\b(for boilers|kesselrohre|caldera)\b/i.test(props.descripcion.toLowerCase())) {
      props.usoTecnico = 'termico_caldera';
  }
  if (!props.usoTecnico) {
    if (/\b(boiler|caldera|heat exchanger|intercambiador de calor|superheater|horno|refinacion|calentador|heater tube)\b/i.test(textoNormalizado)) props.usoTecnico = 'termico_caldera';
    else if (/line\s?pipe|oil country|gas line|oleoducto|gasoducto/i.test(textoNormalizado)) props.usoTecnico = 'oleogas';
    else if (/drill pipe|perforacion petrolera/i.test(textoNormalizado)) props.usoTecnico = 'perforacion';
    // ... más usos ...
  }


  // 4. Norma de Producto
  // ... (lógica de norma - SIN CAMBIOS IMPORTANTES)
  let normaField = "";
  const normLabelRegex = /(standard or specification|norm oder spezifikation)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*;\s*[^\n;,.(]+)*))/i;
  const matchNormLabel = rawText.match(normLabelRegex);
  let notaNormaUsada = false;
  if (matchNormLabel) {
      if (matchNormLabel[2] || matchNormLabel[3]) {
          const noteNumber = matchNormLabel[2] || matchNormLabel[3];
          normaField = _extraerContenidoNota(rawText, noteNumber, ["standard or specification", "norm oder spezifikation"]) || '';
          notaNormaUsada = true;
          if (DEBUG && normaField) console.log(`🕵️ Norma (from Note ${noteNumber}): "${normaField}"`);
      } else if (matchNormLabel[4] && !matchNormLabel[4].toLowerCase().includes("see note")) {
          normaField = matchNormLabel[4].trim();
          if (DEBUG && normaField) console.log(`🕵️ Norma (direct from field): "${normaField}"`);
      }
  }
   if (!normaField || !notaNormaUsada) {
      const matchStdEditions = rawText.match(/standard editions\s*ausgabe nach\s*([^]+?)(?=note \d|product description notes|manufacturing process|supplementary information|$)/i);
      if (matchStdEditions && matchStdEditions[1]) {
          const stdEditionsText = matchStdEditions[1].replace(/[\n\r\t\f]/g, ' ').replace(/\s+/g, ' ').trim();
          normaField = (normaField ? normaField + " ; " : "") + stdEditionsText;
          if (DEBUG) console.log(`🕵️ Norma (agregada de Standard Editions): "${stdEditionsText}"`);
      }
  }
  const textoParaNorma = (normaField || textoNormalizado).toLowerCase();
  const normasCandidatas = [];
  const regexNormas = /\b(ASTM\s*[A-Z]\s*\d+(?:\s*\/\s*[A-Z]{1,2}\s*\d+)?M?(?:[\s\-]*GR(?:ADE)?\.?\s*[A-Z\d\.\-]+)?(?:[\s\-]*CL(?:ASS)?\.?\s*\d+)?|ASME\s*S[A-Z]\s*\d+(?:\s*\/\s*S[A-Z]{1,2}\s*\d+)?M?|EN\s*\d+(?:[\s\-:]*[\dTZP]+)?(?:[\s\-]*TC\d)?|DIN\s*(?:EN\s*)?\d+|JIS\s*[A-Z]\s*\d+|API\s*(?:SPEC\s*)?\s*5[LCTDP]+(?:[\s\-]*[A-Z\d]+)?|VDTUV\s*\d+(?:\/\d)?|AD\s*\d*W\d*|NACE\s*MR\d+)\b/gi;
  let matchNormIterator;
  while ((matchNormIterator = regexNormas.exec(textoParaNorma)) !== null) {
      // ... (lógica de prioridad de normas) ...
      let normaPotencial = matchNormIterator[0].replace(/\s+/g, ' ').trim().toUpperCase();
      if (normaPotencial.startsWith("EN 10204")) continue;
      let prioridad = 2;
      if (normaPotencial.match(/A333|SA333|A335|SA335/)) prioridad = 0;
      else if (normaPotencial.match(/EN\s*10216-2/)) prioridad = 1;
      else if (normaPotencial.startsWith("API ")) prioridad = 1;
      else if (normaPotencial.startsWith("NACE MR")) prioridad = 1;
      normasCandidatas.push({ norma: normaPotencial, prioridad: prioridad });
  }
  if (normasCandidatas.length > 0) {
      normasCandidatas.sort((a, b) => a.prioridad - b.prioridad);
      props.norma = [...new Set(normasCandidatas.map(n => n.norma))].slice(0, 3).join('; ');
      const apiNorm = normasCandidatas.find(n => n.norma.startsWith("API "));
      if (apiNorm) props.normaTecnica = apiNorm.norma;
  } else { props.norma = '-'; }
  if (!props.usoTecnico && props.norma && props.norma.toLowerCase().includes('a333')) {
      props.usoTecnico = 'conduccion_baja_temp';
  }
  if(DEBUG) console.log(`📜 Norma(s) Detectada(s): ${props.norma} ${props.normaTecnica ? `| Tecnica: ${props.normaTecnica}` : ''}`);
  // (El log de usoTecnico ya estaba, se mantiene)


  // 5. Medidas Físicas
  extraerMedidasFisicas(textoNormalizado, props);

  // 6. Recubrimiento
  let surfaceField = "";
  const typeProductSurfaceRegex = /(?:type of product\s*\/[^\n]+surface|product\/surface|product and surface finish|product description\s*-\s*finish)\s*[:\-\s]*(see note nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  matchTypeProductSurface = rawText.match(typeProductSurfaceRegex); // Re-usar variable, ya estaba declarada arriba
  if (matchTypeProductSurface) {
      if (matchTypeProductSurface[2]) {
          const noteNumber = matchTypeProductSurface[2];
          surfaceField = _extraerContenidoNota(rawText, noteNumber, ["type of product / surface", "product/surface", "product and surface finish"]) || '';
          if (DEBUG && surfaceField) console.log(`🎨 Surface Field (from Note ${noteNumber} via Product/Surface): "${surfaceField}"`);
      } else if (matchTypeProductSurface[3] && !matchTypeProductSurface[3].toLowerCase().includes("see note")) {
          surfaceField = matchTypeProductSurface[3].trim();
          if (DEBUG && surfaceField) console.log(`🎨 Surface Field (direct from Product/Surface): "${surfaceField}"`);
      }
  }
  if (!surfaceField) {
      const surfaceLabelRegex = /(surface\s*\/.*?oberflaeche)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
      const matchSurfaceLabel = rawText.match(surfaceLabelRegex);
      if (matchSurfaceLabel) {
          if (matchSurfaceLabel[2] || matchSurfaceLabel[3]) { /* ... */ }
          else if (matchSurfaceLabel[4] && !matchSurfaceLabel[4].toLowerCase().includes("see note")) {
              surfaceField = matchSurfaceLabel[4].trim();
              if (DEBUG && surfaceField) console.log(`🎨 Surface Field (direct from Surface Label): "${surfaceField}"`);
          }
      }
  }
  
  const textoParaRecubrimiento = (surfaceField || productTypeField || textoNormalizado).toLowerCase();
  if (DEBUG) console.log(`🎨 Texto para análisis de recubrimiento: "${textoParaRecubrimiento.substring(0,200)}..."`);
  props.recubrimiento = null; 
  if (/\b(electro[- ]?galvanized|electrozincado|electro-?zinc|eg|eg-coat(?:ed)?)\b/i.test(textoParaRecubrimiento)) {
    props.recubrimiento = 'galvanizado_electrolitico';
  } else if ((/\b(hot[- ]?dip|inmersi[oó]n|a653)\b/i.test(textoParaRecubrimiento) && /\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) || 
             (/\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento) && /\b(60g\/60g|g60|g90)\b/i.test(textoParaRecubrimiento)) ||
             /\bz\d{2,3}\b/i.test(textoParaRecubrimiento) ) {
    props.recubrimiento = 'galvanizado_inmersion';
  } else if (/\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) {
    props.recubrimiento = 'galvanizado'; 
  } // ... más else if para otros recubrimientos ...
  else if (/\b(bare|uncoated|sin recubrimiento|self color|roh|int bare)\b/i.test(textoParaRecubrimiento)) {
    props.recubrimiento = 'sin recubrimiento';
  }

  if (!props.recubrimiento) { // Fallback más agresivo usando textoNormalizado completo
      const textoFallbackRec = textoNormalizado; // Usar el texto completo OCRizado
      if (/\b(galvanize|galvanizado)\b/i.test(textoFallbackRec)) {
          if (/\b(egl|electro)\b/i.test(textoFallbackRec) && !/\b(non chem treat|quaker ferrocote\s+egl)\b/i.test(textoFallbackRec)) { 
            // ^-- Condición ajustada: si dice EGL pero también "Non Chem Treat Quaker Ferrocote EGL", no es necesariamente electro.
            // Para el MTR de Calvert, "Quaker Ferrocote EGL-1" está en la descripción "Type of Product/Surface: Galvanize Non Chem Treat... EGL-1"
            // Esta línea del MTR: "Galvanize Non Chem Treat, 1.0 g/m2 Quaker Ferrocote EGL-1"
            // Si "EGL" se encuentra aquí y no hay "electro" explícito, priorizamos las otras pistas como "60G/60G".
            // Si el `surfaceField` capturó "Galvanize Non Chem Treat, 1.0 g/m2 Quaker Ferrocote EGL-1",
            // y `textoParaRecubrimiento` lo contiene, la regex `/\b(electro...|quaker ferrocote egl)\b/i` podría activarse.
            // La clave es si "quaker ferrocote egl" implica electrolítico. Si no estás seguro, es mejor no asignarlo.
          }
          // La lógica para "60G/60G" ya está arriba y debería haberlo capturado como inmersion.
          // Si llegó hasta aquí y aún es "galvanize", entonces 'galvanizado' genérico es lo más seguro.
          if (!props.recubrimiento) props.recubrimiento = 'galvanizado';
      }
  }
  if (!props.recubrimiento) props.recubrimiento = 'sin recubrimiento';
  if(DEBUG && props.recubrimiento) console.log(`✨ Recubrimiento (final): ${props.recubrimiento}`);


  // 7. Acabado y Refinamiento de Proceso Laminado
  // ... (lógica de acabado - SIN CAMBIOS IMPORTANTES) ...
  let acabadoDetectado = detectarAcabado(textoNormalizado, props);
  if (DEBUG && acabadoDetectado) console.log(`💅 Acabado (de detectarAcabado): ${acabadoDetectado}`);
  if (props.procesoLaminado === 'caliente') {
    if (props.tratamiento) { props.acabado = props.tratamiento; }
    else if (acabadoDetectado && typeof acabadoDetectado === 'string' && !acabadoDetectado.toLowerCase().includes('frio')) { props.acabado = acabadoDetectado; }
    else { props.acabado = 'laminado en caliente'; }
  } else if (props.procesoLaminado === 'frio') {
    props.acabado = acabadoDetectado || 'laminado en frio';
  } else { 
    props.acabado = acabadoDetectado;
    if (!props.procesoLaminado && props.acabado && typeof props.acabado === 'string') {
      if (props.acabado.toLowerCase().includes('frio') || props.acabado.toLowerCase().includes('cold')) props.procesoLaminado = 'frio';
      else if (props.acabado.toLowerCase().includes('caliente') || props.acabado.toLowerCase().includes('hot')) props.procesoLaminado = 'caliente';
    }
  }
  if (DEBUG && props.acabado) console.log(`💅 Acabado (final): ${props.acabado}`);
  // (El log de procesoLaminado final ya estaba, se mantiene)


  // --- INICIO DE LA SECCIÓN DE PROPIEDADES MECÁNICAS (Yield Strength / Resistencia) ---
  const seccionPruebaExtensionMatch = textoNormalizado.match(/tensile test[\s\S]*?(?=chemical composition|mill certificate|this is not a nafta|page\s\d+\s*of\s*\d+|$)/i);
  if (seccionPruebaExtensionMatch && seccionPruebaExtensionMatch[0]) {
      const textoPruebaExtension = seccionPruebaExtensionMatch[0]; // Ya está en minúsculas por textoNormalizado
      if (DEBUG) console.log(`💪 Texto para Pruebas de Tensión: "${textoPruebaExtension.substring(0,150)}..."`);

      // Regex ajustada para el formato OCR: "l 669ksi 82ksi 28 0.47"
      // Busca "yield strength" o similar, y luego la línea con valores L/T valorUnidad valorUnidad valor
      const matchEncabezadoValores = textoPruebaExtension.match(/(?:yield\s*strength.*?)(l|t)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)/i);
      let matchValoresDirectos = null;

      if (!matchEncabezadoValores) { // Si no encuentra el encabezado "yield strength" seguido de la línea L/T...
          // Intentar buscar directamente la línea de valores L/T si la estructura es consistente
          matchValoresDirectos = textoPruebaExtension.match(/\b(l|t)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)/i);
          if (DEBUG && matchValoresDirectos) console.log("💪 Match directo para valores de tensión (sin encabezado yield explícito):", matchValoresDirectos);
      }
      
      const finalMatch = matchEncabezadoValores || matchValoresDirectos;

      if (finalMatch) {
          const valorFluencia = parseFloat(finalMatch[2]);
          const unidadFluencia = finalMatch[3].toLowerCase();
          
          props.limiteFluenciaOriginal = valorFluencia;
          props.unidadFluencia = unidadFluencia;
          if (DEBUG) console.log(`💪 Límite de Fluencia Detectado: ${valorFluencia} ${unidadFluencia}`);

          let fluenciaEnMPa = null;
          if (unidadFluencia === 'ksi') {
              fluenciaEnMPa = parseFloat((valorFluencia * 6.89476).toFixed(2));
          } else if (unidadFluencia === 'psi') {
              fluenciaEnMPa = parseFloat((valorFluencia * 0.00689476).toFixed(2));
          } else if (unidadFluencia === 'mpa' || unidadFluencia === 'n/mm2') {
              fluenciaEnMPa = valorFluencia;
          }
          
          props.resistencia = fluenciaEnMPa; // Asignar a props.resistencia

          if (DEBUG && props.resistencia !== undefined) console.log(`💪 Resistencia (Límite de Fluencia) Convertida: ${props.resistencia} MPa`);

      } else if (DEBUG) {
          console.log("💪 Límite de Fluencia (y otros datos de tensión) no encontrado con las regex para TENSILE TEST.");
          // Fallback a la regex original si las nuevas no funcionan (por si el OCR varía)
          const matchFluenciaFallback = textoPruebaExtension.match(/(?:yield\s*strength|limite\s*de\s*fluencia|proof\s*strength\s*rp0\.2)\s*[^0-9.]*(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)/i);
          if (matchFluenciaFallback) {
               const valorFluenciaFallback = parseFloat(matchFluenciaFallback[1]);
               const unidadFluenciaFallback = matchFluenciaFallback[2].toLowerCase();
               if (DEBUG) console.log(`💪 Límite de Fluencia (Fallback) Detectado: ${valorFluenciaFallback} ${unidadFluenciaFallback}`);
               // ... (lógica de conversión para fallback)
                let fluenciaEnMPaFallback = null;
                if (unidadFluenciaFallback === 'ksi') fluenciaEnMPaFallback = parseFloat((valorFluenciaFallback * 6.89476).toFixed(2));
                // ... otros ...
                props.resistencia = fluenciaEnMPaFallback;
                if (DEBUG && props.resistencia !== undefined) console.log(`💪 Resistencia (Fallback) Convertida: ${props.resistencia} MPa`);
           } else if (DEBUG) {
               console.log("💪 Límite de Fluencia no encontrado con ninguna regex en TENSILE TEST.");
           }
      }
  } else if (DEBUG) {
      console.log("💪 Sección de Pruebas de Tensión no encontrada.");
  }
  // --- FIN DE LA SECCIÓN DE PROPIEDADES MECÁNICAS ---


  // 8. Molino
  // ... (lógica de molino - SIN CAMBIOS IMPORTANTES) ...
  let molinoDetectadoLocal = null;
  const molinoFieldRegex = /(?:mill|manufacturer|plant|werk|hersteller)\s*[:\-\s]*([^\n,;(\bsee\b)]+)/i;
  const molinoFieldMatchLocal = textoNormalizado.match(molinoFieldRegex);
  if (molinoFieldMatchLocal && molinoFieldMatchLocal[1]) {
      let molinoPotencial = molinoFieldMatchLocal[1].trim();
      if (molinoPotencial.length > 2 && !molinoPotencial.toLowerCase().includes('n/a') && !molinoPotencial.toLowerCase().includes('see note')) {
        molinoDetectadoLocal = molinoPotencial.toUpperCase().replace(/\.$/, '').trim();
      }
  }
  if (!molinoDetectadoLocal || molinoDetectadoLocal.length < 3) {
      const molinosConocidos = /\b(tenaris|silcotub|dalmine|siderca|tamsa|steel dynamics|sdi|ternium|ahmsa|nucor|posco|arcelormittal|calvert|usiminas|baosteel|nippon steel|jfe|voestalpine|thyssenkrupp)\b/i;
      const molinoEncontrado = textoNormalizado.match(molinosConocidos);
      if (molinoEncontrado && molinoEncontrado[1]) molinoDetectadoLocal = molinoEncontrado[1].toUpperCase();
  }
   if (!molinoDetectadoLocal && textoNormalizado.includes("tenaris")) molinoDetectadoLocal = "TENARIS";

  if (molinoDetectadoLocal) {
    // ... (lógica de asignación de molino)
      if (molinoDetectadoLocal.includes("SILCOTUB S.A. PLANT") || molinoDetectadoLocal === "SILCOTUB") props.molino = "TENARIS - SILCOTUB";
      else if (molinoDetectadoLocal.includes("DALMINE")) props.molino = "TENARIS - DALMINE";
      // ...
      else { props.molino = molinoDetectadoLocal; }
  } else {
    // ... (lógica de fallback para molino)
  }
  if (DEBUG && props.molino) console.log(`🏭 Molino Detectado: ${props.molino}`);
  else if (DEBUG) console.log(`🏭 Molino no detectado.`);
  

  // 9. Serie Inox
  // ... (lógica de serie inox - SIN CAMBIOS IMPORTANTES) ...
  const matchSerieInox = textoParaTipo.match(/\b(2\d{2}|3\d{2}[a-z]?|4\d{2}[a-z]?)\b/i);
  if (matchSerieInox && matchSerieInox[1]) {
      if (textoParaTipo.includes('stainless') || textoParaTipo.includes('inox') || textoParaTipo.match(/aisi\s*(2\d{2}|3\d{2}|4\d{2})/i)) {
        props.serie = matchSerieInox[1].toUpperCase();
      }
  }
  if(DEBUG && props.serie) console.log(`🕵️ Serie Inox (preliminar): ${props.serie}`);

  // 10. Forma Transversal
  // ... (lógica de forma transversal - SIN CAMBIOS IMPORTANTES) ...
   if (!props.formaTransversal) {
      if (props.tipoProducto === 'tubo') {
          if (textoNormalizado.includes('round tube') || textoNormalizado.includes('tubo redondo') || props.formaFisica === 'cilindrica') props.formaTransversal = 'circular';
      }
  }
  if (DEBUG && props.formaTransversal) console.log(`📐 Forma Transversal: ${props.formaTransversal}`);


  if (DEBUG) {
    // Esta es la línea que antes daba error como 494
    console.log("📦 Propiedades Analizadas (final de extraerTodasLasPropiedades):", JSON.stringify(props, null, 2));
  }
  return props;
}

module.exports = { extraerTodasLasPropiedades };