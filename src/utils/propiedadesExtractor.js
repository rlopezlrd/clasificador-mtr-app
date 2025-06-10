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
    resistencia: null,
    isPickled: false, // <--- NUEVA PROPIEDAD INICIALIZADA
    // ... otras propiedades que inicialices ...
  };
  const { detectarAcabado, extraerHeatYCoil, extraerMedidasFisicas } = utils;
  
  const textoNormalizado = rawText.toLowerCase().replace(/[\n\t\f\r]/g, ' ').replace(/\s+/g, ' ').trim();

  extraerHeatYCoil(textoNormalizado, props);

  // 1. Descripción del Producto
  let productTypeField = '';
  //const productTypeLabelRegex = /(product type\s*\/.*?art des produkts?)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  const productTypeLabelRegex = /(product type\s*\/.*?art des produkts?|Product Desc\.)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  
  // --- ATENCIÓN: Esta regex puede necesitar ajuste para tu MTR específico si "PRODUCT TYPE" está en una línea y el valor en la siguiente ---
  // --- Como en el MTR de Steel Dynamics:
  // PRODUCT TYPE
  // Prime Pickled Hot Rolled Sheet
  // --- Considera una lógica más robusta para capturar `productTypeField` si el log sigue mostrando "Product Type Field no encontrado" ---
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
  
  if (!productTypeField) {
    const steelGradeRegex = /(?:steel grade\s*\/\s*customer specification|type of product\s*\/\s*surface)\s*[:\-\s]*([^\n;,.(]+)/i;
    const matchSteelGrade = rawText.match(steelGradeRegex); 
    if (matchSteelGrade && matchSteelGrade[1]) {
        productTypeField = matchSteelGrade[1].trim();
        if (DEBUG) console.log(`🕵️ Product Type Field (from Steel Grade/Type of Product Surface): "${productTypeField}"`);
    }
  }
  
  // --- INICIO: Lógica MEJORADA para Product Type Field (Ejemplo para MTR de Steel Dynamics) ---
  // Esta es una sugerencia si la lógica anterior falla consistentemente para ciertos MTRs.
  // Debes probar y ajustar esta regex para que sea lo suficientemente general o específica.
  if (!productTypeField) {
    const productTypeSDRegex = /PRODUCT TYPE\s*\n+\s*([^\n]+)/i; // Busca "PRODUCT TYPE" seguido de nueva(s) línea(s) y captura la siguiente línea.
    const matchSDProductType = rawText.match(productTypeSDRegex);
    if (matchSDProductType && matchSDProductType[1]) {
        productTypeField = matchSDProductType[1].trim();
        if (DEBUG) console.log(`🕵️ Product Type Field (from SD-like MTR structure): "${productTypeField}"`);
    }
  }
  // --- FIN: Lógica MEJORADA ---


  if (!productTypeField && DEBUG) console.log(`🕵️ Product Type Field no encontrado con patrón principal o alternativos.`);
  props.descripcion = productTypeField; // props.descripcion ahora tendrá el valor (o estará vacía si aún no se encuentra)
  const textoParaTipo = (productTypeField || textoNormalizado).toLowerCase();


  // --- INICIO: Lógica para props.isPickled ---
  // Se ejecuta DESPUÉS de que props.descripcion (productTypeField) haya sido determinada.
  if (props.descripcion.toLowerCase().includes('pickled') || props.descripcion.toLowerCase().includes('decapado')) {
    props.isPickled = true;
  } else {
    // Fallback: buscar en todo el texto normalizado, pero con más contexto para evitar falsos positivos.
    // Ejemplo: "pickled" o "decapado" cerca de términos como "hot rolled", "sheet", "coil", "plate".
    if (textoNormalizado.match(/\b(pickled|decapado)\s+(hot rolled|cold rolled|sheet|plate|coil)\b/i) ||
        textoNormalizado.match(/\b(hot rolled|cold rolled|sheet|plate|coil)\s+(pickled|decapado)\b/i) ||
        textoNormalizado.match(/\b(hrp&o|hrpo)\b/i) // Hot Rolled Pickled and Oiled
       ) {
      props.isPickled = true;
    }
  }
  if (DEBUG) console.log(`🛠️ Pickled status (props.isPickled): ${props.isPickled}`);
  // --- FIN: Lógica para props.isPickled ---


  // ... (Lógica para tipoProducto, costura, esEnrollado - SIN CAMBIOS IMPORTANTES A MENOS QUE DEPENDAN DE isPickled)
    if (/(tube|pipe|tubo|tubing|piping|conduit)/i.test(textoParaTipo)) {
      props.tipoProducto = 'tubo';
      props.formaFisica = 'cilindrica';
      if (/\bseamless\b|nahtlos/i.test(textoParaTipo)) props.costura = 'sin costura';
      else if (/\b(welded|erw|hfw|saw|geschweisst)\b/i.test(textoParaTipo)) props.costura = 'con costura';
      else props.costura = 'sin costura'; // Defaulting to sin costura if not specified as welded
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
      if (/\b(normalized and tempered|normalizado y templado|normalgeglueht und anlassen)\b/i.test(mfgProcessParaAnalisis)) props.tratamiento = 'normalizado y templado';
      else if (/\b(normalized|normalizado|normalgeglueht)\b/i.test(mfgProcessParaAnalisis)) props.tratamiento = 'normalizado';
  }
  if (DEBUG && props.tratamiento) console.log(`🔥 Tratamiento: ${props.tratamiento}`);
  props.procesoLaminado = _extraerProcesoLaminado(textoParaTipo, mfgProcessParaAnalisis, textoNormalizado);


  // 3. Uso Técnico
  if (props.descripcion && /\b(for boilers|kesselrohre|caldera)\b/i.test(props.descripcion.toLowerCase())) {
      props.usoTecnico = 'termico_caldera';
  }
  if (!props.usoTecnico) {
    if (/\b(boiler|caldera|heat exchanger|intercambiador de calor|superheater|horno|refinacion|calentador|heater tube)\b/i.test(textoNormalizado)) props.usoTecnico = 'termico_caldera';
    else if (/line\s?pipe|oil country|gas line|oleoducto|gasoducto/i.test(textoNormalizado)) props.usoTecnico = 'oleogas';
    else if (/drill pipe|perforacion petrolera/i.test(textoNormalizado)) props.usoTecnico = 'perforacion';
  }


  // 4. Norma de Producto
  let normaField = "";
  //const normLabelRegex = /(standard or specification|norm oder spezifikation)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*;\s*[^\n;,.(]+)*))/i;
  const normLabelRegex = /(standard or specification|norm oder spezifikation|Material Spec\.)\s*[:\-\s]*(see note nr\.?\s*(\d+)|sehen sie anmerkung nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*;\s*[^\n;,.(]+)*))/i;
  
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


  // 5. Medidas Físicas
  extraerMedidasFisicas(textoNormalizado, props);

  // 6. Recubrimiento
  let surfaceField = "";
  const typeProductSurfaceRegex = /(?:type of product\s*\/[^\n]+surface|product\/surface|product and surface finish|product description\s*-\s*finish)\s*[:\-\s]*(see note nr\.?\s*(\d+)|([^\n;,.(]+(?:\s*\(.*?\))?))/i;
  let matchTypeProductSurface = rawText.match(typeProductSurfaceRegex);
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

//   } else if ((/\b(hot[- ]?dip|inmersi[oó]n|a653)\b/i.test(textoParaRecubrimiento) && /\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) || 
//              (/\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento) && /\b(60g\/60g|g60|g90)\b/i.test(textoParaRecubrimiento)) ||
//              /\bz\d{2,3}\b/i.test(textoParaRecubrimiento) ) {
//     props.recubrimiento = 'galvanizado_inmersion';
//   } else if (/\b(galvanize[d]?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) {
    } else if ((/\b(hot[- ]?dip|inmersi[oó]n|a653)\b/i.test(textoParaRecubrimiento) && /\b(galv(anize[d]?)?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) || 
           (/\b(galv(anize[d]?)?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento) && /\b(60g\/60g|g60|g90)\b/i.test(textoParaRecubrimiento)) ||
           /\bz\d{2,3}\b/i.test(textoParaRecubrimiento) ) {
  props.recubrimiento = 'galvanizado_inmersion';
} else if (/\b(galv(anize[d]?)?|galvanizado|zincado|gi|ga|zf)\b/i.test(textoParaRecubrimiento)) {


    props.recubrimiento = 'galvanizado'; 
  } 
  else if (/\b(bare|uncoated|sin recubrimiento|self color|roh|int bare)\b/i.test(textoParaRecubrimiento)) {
    props.recubrimiento = 'sin recubrimiento';
  }

  if (!props.recubrimiento) { 
      const textoFallbackRec = textoNormalizado; 
      if (/\b(galvanize|galvanizado)\b/i.test(textoFallbackRec)) {
          if (/\b(egl|electro)\b/i.test(textoFallbackRec) && !/\b(non chem treat|quaker ferrocote\s+egl)\b/i.test(textoFallbackRec)) { 
          }
          if (!props.recubrimiento) props.recubrimiento = 'galvanizado';
      }
  }
  // If props.isPickled is true and it's some form of hot-rolled, recubrimiento should remain 'sin recubrimiento'
  // unless an actual metallic coating is also specified. "Pickled" itself is not a "recubrimiento" for tariff.
  if (props.isPickled && !props.recubrimiento) {
      props.recubrimiento = 'sin recubrimiento';
  } else if (!props.recubrimiento) {
      props.recubrimiento = 'sin recubrimiento';
  }
  if(DEBUG && props.recubrimiento) console.log(`✨ Recubrimiento (final): ${props.recubrimiento}`);


  // 7. Acabado y Refinamiento de Proceso Laminado
  let acabadoDetectado = detectarAcabado(textoNormalizado, props); // `props` is passed but not used by `detectarAcabado` as per its definition
  if (DEBUG && acabadoDetectado) console.log(`💅 Acabado (de detectarAcabado): ${acabadoDetectado}`);
  
  // Prioritize "pickled" or "decapado" in acabado if props.isPickled is true,
  // especially for hot-rolled products, otherwise use standard logic.
  if (props.isPickled && props.procesoLaminado === 'caliente') {
      props.acabado = 'decapado'; // Or 'pickled' if you prefer that term consistently
  } else if (props.procesoLaminado === 'caliente') {
    if (props.tratamiento) { 
        props.acabado = props.tratamiento; 
    } else if (acabadoDetectado && typeof acabadoDetectado === 'string' && !acabadoDetectado.toLowerCase().includes('frio')) { 
        props.acabado = acabadoDetectado; 
    } else { 
        props.acabado = 'laminado en caliente'; 
    }
  } else if (props.procesoLaminado === 'frio') {
    props.acabado = acabadoDetectado && acabadoDetectado !== '-' ? acabadoDetectado : 'laminado en frio';
  } else { 
    props.acabado = acabadoDetectado && acabadoDetectado !== '-' ? acabadoDetectado : null; // Set to null if no process and no specific finish detected
    if (!props.procesoLaminado && props.acabado && typeof props.acabado === 'string') {
      if (props.acabado.toLowerCase().includes('frio') || props.acabado.toLowerCase().includes('cold')) props.procesoLaminado = 'frio';
      else if (props.acabado.toLowerCase().includes('caliente') || props.acabado.toLowerCase().includes('hot')) props.procesoLaminado = 'caliente';
    }
  }
  if (DEBUG && props.acabado) console.log(`💅 Acabado (final): ${props.acabado}`);


  // --- INICIO DE LA SECCIÓN DE PROPIEDADES MECÁNICAS (Yield Strength / Resistencia) ---
  const seccionPruebaExtensionMatch = textoNormalizado.match(/tensile test[\s\S]*?(?=chemical composition|mill certificate|this is not a nafta|page\s\d+\s*of\s*\d+|$)/i);
  if (seccionPruebaExtensionMatch && seccionPruebaExtensionMatch[0]) {
      const textoPruebaExtension = seccionPruebaExtensionMatch[0]; 
      if (DEBUG) console.log(`💪 Texto para Pruebas de Tensión: "${textoPruebaExtension.substring(0,150)}..."`);

      const matchEncabezadoValores = textoPruebaExtension.match(/(?:yield\s*strength.*?)(l|t)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)\s+(\d+\.?\d*)/i);
      let matchValoresDirectos = null;

      if (!matchEncabezadoValores) { 
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
          
          props.resistencia = fluenciaEnMPa; 

          if (DEBUG && props.resistencia !== undefined && props.resistencia !== null) console.log(`💪 Resistencia (Límite de Fluencia) Convertida: ${props.resistencia} MPa`);

      } else if (DEBUG) {
          console.log("💪 Límite de Fluencia (y otros datos de tensión) no encontrado con las regex para TENSILE TEST.");
          const matchFluenciaFallback = textoPruebaExtension.match(/(?:yield\s*strength|limite\s*de\s*fluencia|proof\s*strength\s*rp0\.2)\s*[^0-9.]*(\d+\.?\d*)\s*(ksi|mpa|psi|n\/mm2)/i);
          if (matchFluenciaFallback) {
               const valorFluenciaFallback = parseFloat(matchFluenciaFallback[1]);
               const unidadFluenciaFallback = matchFluenciaFallback[2].toLowerCase();
               if (DEBUG) console.log(`💪 Límite de Fluencia (Fallback) Detectado: ${valorFluenciaFallback} ${unidadFluenciaFallback}`);
                let fluenciaEnMPaFallback = null;
                if (unidadFluenciaFallback === 'ksi') fluenciaEnMPaFallback = parseFloat((valorFluenciaFallback * 6.89476).toFixed(2));
                else if (unidadFluenciaFallback === 'psi') fluenciaEnMPaFallback = parseFloat((valorFluenciaFallback * 0.00689476).toFixed(2));
                else if (unidadFluenciaFallback === 'mpa' || unidadFluenciaFallback === 'n/mm2') fluenciaEnMPaFallback = valorFluenciaFallback;
                props.resistencia = fluenciaEnMPaFallback;
                if (DEBUG && props.resistencia !== undefined && props.resistencia !== null) console.log(`💪 Resistencia (Fallback) Convertida: ${props.resistencia} MPa`);
           } else if (DEBUG) {
               console.log("💪 Límite de Fluencia no encontrado con ninguna regex en TENSILE TEST.");
           }
      }
  } else if (DEBUG) {
      console.log("💪 Sección de Pruebas de Tensión no encontrada.");
  }


  // 8. Molino
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
      if (molinoDetectadoLocal.includes("SILCOTUB S.A. PLANT") || molinoDetectadoLocal === "SILCOTUB") props.molino = "TENARIS - SILCOTUB";
      else if (molinoDetectadoLocal.includes("DALMINE")) props.molino = "TENARIS - DALMINE";
      else { props.molino = molinoDetectadoLocal; }
  } 
  if (DEBUG && props.molino) console.log(`🏭 Molino Detectado: ${props.molino}`);
  else if (DEBUG) console.log(`🏭 Molino no detectado.`);
  

  // 9. Serie Inox
  const matchSerieInox = textoParaTipo.match(/\b(2\d{2}|3\d{2}[a-z]?|4\d{2}[a-z]?)\b/i);
  if (matchSerieInox && matchSerieInox[1]) {
      if (textoParaTipo.includes('stainless') || textoParaTipo.includes('inox') || textoParaTipo.match(/aisi\s*(2\d{2}|3\d{2}|4\d{2})/i)) {
        props.serie = matchSerieInox[1].toUpperCase();
      }
  }
  if(DEBUG && props.serie) console.log(`🕵️ Serie Inox (preliminar): ${props.serie}`);

  // 10. Forma Transversal
   if (!props.formaTransversal) {
      if (props.tipoProducto === 'tubo') {
          if (textoNormalizado.includes('round tube') || textoNormalizado.includes('tubo redondo') || props.formaFisica === 'cilindrica') props.formaTransversal = 'circular';
      }
  }
  if (DEBUG && props.formaTransversal) console.log(`📐 Forma Transversal: ${props.formaTransversal}`);


  if (DEBUG) {
    console.log("📦 Propiedades Analizadas (final de extraerTodasLasPropiedades):", JSON.stringify(props, null, 2));
  }
  return props;
}

module.exports = { extraerTodasLasPropiedades };
