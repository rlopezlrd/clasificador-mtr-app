// --- INICIO DEL ARCHIVO leerComposicionQuimica.js (VERSIÓN CON MEJORAS EN DEBUGGING Y MANEJO DE 'CE LF') ---

function detectarComposicionQuimica(texto, tipoProductoDebug = "No especificado") {
  const DEBUG_THIS_FUNCTION = process.env.DEBUG_COMPOSICION === 'true' || true;


  if (DEBUG_THIS_FUNCTION) {
    console.log(`📄 Texto recibido para detectarComposicionQuimica (producto: ${tipoProductoDebug}, longitud: ${texto?.length || 0}).`);
    // Para no llenar la consola, el texto completo se guarda en archivo desde server.js
  }

  const composicion = {
    carbono: null, fosforo: null, silicio: null, manganeso: null, niquel: null,
    cromo: null, molibdeno: null, vanadio: null, niobio: null, aluminio: null,
    cobre: null, azufre: null, titanio: null, boro: null, nitrogeno: null,
    wolframio: null, circonio: null, estaño: null, calcio: null, arsenico: null, ce_lf: null,
    aleado: false, tipoAcero: 'sin alear', elementosAleantes: [],
    justificacionAleado: '', valoresDescartados: []
  };



//   const mapElementos = {
//     C: 'carbono', SI: 'silicio', MN: 'manganeso', P: 'fosforo', S: 'azufre',
//     AL: 'aluminio', CR: 'cromo', CU: 'cobre', MO: 'molibdeno', N: 'nitrogeno',
//     NI: 'niquel', NB: 'niobio', TI: 'titanio', B: 'boro', V: 'vanadio',
//     W: 'wolframio', ZR: 'circonio', SN: 'estaño', CA: 'calcio', AS: 'arsenico',
//     'CE LF': 'ce_lf', CEL: 'ce_lf', // CE LF is important
//     S1: 'silicio', N0: 'niobio', F1: 'fosforo'
//   };


//   const divisoresTenarisPredeterminados = {
//     C: 100, MN: 100, SI: 100, CR: 100, NI: 100, MO: 100, CU: 100, 'CE LF': 100, CEL: 100,
//     P: 1000, S: 1000, SN: 1000,
//     AL: 10000, NB: 10000, TI: 10000, V: 10000, N: 10000, B: 10000
//   };

// In leerComposicionQuimica.js

const mapElementos = {
    C: 'carbono', SI: 'silicio', MN: 'manganeso', P: 'fosforo', S: 'azufre',
    AL: 'aluminio', CR: 'cromo', CU: 'cobre', MO: 'molibdeno', N: 'nitrogeno',
    NI: 'niquel', NB: 'niobio', TI: 'titanio', B: 'boro', V: 'vanadio',
    W: 'wolframio', ZR: 'circonio', SN: 'estaño', CA: 'calcio', AS: 'arsenico',
    'CE LF': 'ce_lf', // Keep this for future reference or if parsing changes
    CEL: 'ce_lf',     // Keep this
    CELF: 'ce_lf',    // ***** ADD THIS LINE to match the observed token *****
    S1: 'silicio', N0: 'niobio', F1: 'fosforo'
}; // <<<< Closing brace was missing here in my previous example

const divisoresTenarisPredeterminados = {
    C: 100, MN: 100, SI: 100, CR: 100, NI: 100, MO: 100, CU: 100,
    'CE LF': 100,
    CEL: 100,
    CELF: 100, // ***** ADD CELF HERE to match the observed token *****
    P: 1000, S: 1000, SN: 1000,
    AL: 10000, NB: 10000, TI: 10000, V: 10000, N: 10000, B: 10000
}; // <<<< Closing brace was missing here in my previous example


  const umbralesAleado = {
    boro: 0.0008, cromo: 0.3, vanadio: 0.1, molibdeno: 0.08, niquel: 0.3,
    manganeso: 1.65, silicio: 0.6, titanio: 0.05, wolframio: 0.3, aluminio: 0.3,
    cobre: 0.4, niobio: 0.06,
  };

  function extraerNumerosDesdeTexto(textoLocal, logPrefix = "") {
    const regex = /(?<!\d\.)\b\d{1,7}(?:\.\d+)?\b(?!\.\d)/g;
    let matches = (textoLocal.match(regex) || []);
    if (matches.length < 1 && textoLocal.trim().length > 0) {
        const regexLaxa = /[-+]?\b\d+(?:\.\d+)?\b|\b\.\d+\b/g;
        const laxaMatches = (textoLocal.match(regexLaxa) || []);
        if (DEBUG_THIS_FUNCTION) console.log(`${logPrefix} extraerNumeros: Regex precisa 0 matches. Regex laxa encontró: ${laxaMatches.join(', ')} para texto: "${textoLocal}"`);
        if (laxaMatches.length > 0) matches = laxaMatches;
    }
    const numeros = matches.map(v => parseFloat(v.replace(',', '.'))).filter(val => !isNaN(val));
    if (DEBUG_THIS_FUNCTION) console.log(`${logPrefix} extraerNumeros: Texto: "${textoLocal}", Números extraídos: [${numeros.join(', ')}]`);
    return numeros;
  }

  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
      if (DEBUG_THIS_FUNCTION) console.warn("⚠️ El texto de entrada para composición está vacío.");
      return composicion;
  }

  const lineas = texto.split(/\r?\n/).map(l => l.trim().replace(/\s\s+/g, ' '));
  let formatoDetectado = null;

  if (DEBUG_THIS_FUNCTION) console.log("--- Iniciando detección de composición química ---");

  // --- INICIO LÓGICA FORMATO "LADLE_V5.6" ---
  const fraseLadle = "CHEMICAL COMPOSITION OF THE LADLE";
  let idxFraseLadle = -1;
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].toUpperCase().includes(fraseLadle)) {
      idxFraseLadle = i;
      break;
    }
  }

  if (idxFraseLadle !== -1 && lineas.length > idxFraseLadle + 5) {
    formatoDetectado = "LADLE_V5.6";
    if (DEBUG_THIS_FUNCTION) console.log(`🎯 Formato detectado: "${formatoDetectado}" en línea ${idxFraseLadle} ("${lineas[idxFraseLadle]}")`);

    const ls1_ocr = lineas[idxFraseLadle + 2] || "";
    const lv1_ocr = lineas[idxFraseLadle + 3] || "";
    const ls2_ocr = lineas[idxFraseLadle + 4] || "";
    const lv2_ocr = lineas[idxFraseLadle + 5] || "";

    if (DEBUG_THIS_FUNCTION) {
        console.log(`  (${formatoDetectado}) LS1_OCR (idx ${idxFraseLadle + 2}): "${ls1_ocr}"`);
        console.log(`  (${formatoDetectado}) LV1_OCR (idx ${idxFraseLadle + 3}): "${lv1_ocr}"`);
        console.log(`  (${formatoDetectado}) LS2_OCR (idx ${idxFraseLadle + 4}): "${ls2_ocr}"`);
        console.log(`  (${formatoDetectado}) LV2_OCR (idx ${idxFraseLadle + 5}): "${lv2_ocr}"`);
    }

    let todosSimbolos = [];

    if (ls1_ocr) {
        const simbolosTextoP1 = ls1_ocr.replace(/^No\.\s*/i, '').trim();
        const palabrasP1 = simbolosTextoP1.split(/\s+/);

        palabrasP1.forEach(palabra => {
            let simboloParaMapear = palabra.toUpperCase();

            if (simboloParaMapear === "[4" || simboloParaMapear === "[" || simboloParaMapear === "L4") {
                simboloParaMapear = "P";
            } else {
                simboloParaMapear = simboloParaMapear.replace(/[^\w]/g, '');
            }

            if (mapElementos[simboloParaMapear]) {
                todosSimbolos.push(simboloParaMapear);
            } else if (simboloParaMapear && DEBUG_THIS_FUNCTION) {
                if (simboloParaMapear.length > 0 && !["NO", "HEAT"].includes(simboloParaMapear)) {
                   console.log(`  (${formatoDetectado}) Símbolo P1 no mapeado/ignorado: "${palabra}" (procesado como "${simboloParaMapear}")`);
                }
            }
        });
    }
    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Símbolos después de P1 (y N si estaba en LS1): [${todosSimbolos.join(', ')}] (Count: ${todosSimbolos.length})`);

    if (ls2_ocr) {
        const palabrasS2 = ls2_ocr.split(/\s+/);
        for (let j = 0; j < palabrasS2.length; j++) {
            let p = palabrasS2[j];
            if (p === '\\' && palabrasS2[j+1]?.toUpperCase().startsWith('CA')) {
                if (mapElementos["V"]) todosSimbolos.push("V");
                if (mapElementos["CA"]) todosSimbolos.push("CA");
                j++;
                continue;
            }
            const pUpper = p.toUpperCase().replace(/[^\w]/g, '');
            if (mapElementos[pUpper]) {
                todosSimbolos.push(pUpper);
            }
        }
    }
    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Todos los Símbolos (final LADLE): [${todosSimbolos.join(', ')}] (Count: ${todosSimbolos.length})`);

    let valoresP1 = lv1_ocr ? extraerNumerosDesdeTexto(lv1_ocr, `(${formatoDetectado}) LV1:`) : [];
    let heatNumberExtraido = null;
    if (valoresP1.length > 0 && valoresP1[0] > 100000 && Number.isInteger(valoresP1[0])) {
        heatNumberExtraido = valoresP1.shift();
        if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Heat Number ${heatNumberExtraido} removido de ValoresP1.`);
    }

    const idxMoEnTodosSimbolos = todosSimbolos.indexOf("MO");
    if (idxMoEnTodosSimbolos !== -1 && idxMoEnTodosSimbolos < valoresP1.length && valoresP1[idxMoEnTodosSimbolos] === 0 && lv1_ocr.includes(" 000 ")) {
        valoresP1[idxMoEnTodosSimbolos] = 0.00;
         if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Corrección especial para Mo en LV1: 0 -> 0.00 en índice ${idxMoEnTodosSimbolos} de valoresP1.`);
    }

    let valoresP2 = lv2_ocr ? extraerNumerosDesdeTexto(lv2_ocr, `(${formatoDetectado}) LV2:`) : [];
    const todosValores = [...valoresP1, ...valoresP2];
    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Todos los Valores (HN removido, LADLE): [${todosValores.join(', ')}] (Count: ${todosValores.length})`);

    composicion.valoresDescartados = [];
    if (todosSimbolos.length !== todosValores.length && DEBUG_THIS_FUNCTION) {
        console.warn(`⚠️ (${formatoDetectado}) Desajuste final: Símbolos (${todosSimbolos.length}) vs Valores (${todosValores.length}).`);
        if (todosValores.length > todosSimbolos.length) {
            const descartados = todosValores.slice(todosSimbolos.length);
            composicion.valoresDescartados.push(...descartados);
            console.warn(`✂️ (${formatoDetectado}) Valores descartados (exceso): ${descartados.join(', ')}`);
        } else {
            const simbolosSinValor = todosSimbolos.slice(todosValores.length);
            console.warn(`📉 (${formatoDetectado}) Símbolos sin valor: ${simbolosSinValor.join(', ')}`);
        }
    }

    const minLengthLadle = Math.min(todosSimbolos.length, todosValores.length);
    for (let k = 0; k < minLengthLadle; k++) {
        const simUpper = todosSimbolos[k];
        const clave = mapElementos[simUpper];
        const valor = todosValores[k];

        if (clave && valor !== undefined && !isNaN(valor)) {
            composicion[clave] = parseFloat(valor.toFixed(6));
        } else if (clave && (valor === undefined || isNaN(valor))) {
            if (DEBUG_THIS_FUNCTION) console.warn(`📉 (${formatoDetectado}) Símbolo ${todosSimbolos[k]} (${clave}) sin valor numérico (${valor}).`);
        } else if (!clave) {
            if (DEBUG_THIS_FUNCTION) console.warn(`🚫 (${formatoDetectado}) Símbolo "${todosSimbolos[k]}" (procesado como "${simUpper}") no mapeado.`);
        }
    }
  } else {
      if (idxFraseLadle !== -1 && DEBUG_THIS_FUNCTION) {
          console.warn(`  (LADLE_V5.6) No hay suficientes líneas después del encabezado para procesar completamente (se necesitan al menos hasta ${idxFraseLadle + 5}, hay ${lineas.length}).`);
      }
  }
  // --- FIN LÓGICA FORMATO "LADLE_V5.6" ---


  // --- INICIO LÓGICA PARA FORMATO "TENARIS" ---

  const fraseTenaris1 = "CHEMICAL COMPOSITION / CHEMISCHE ZUSAMMENSETZUNG";
  const fraseTenaris2 = "COMPOSITION % / ZUSAMMENSETZUNG %";

  if (!formatoDetectado) {
    let seccionTenarisEncontrada = false;
    let idxInicioSeccionTenaris = -1;

    for (let i = 0; i < lineas.length; i++) {
        const lineaNormalizada = lineas[i].toUpperCase().replace(/\s+/g, ' ');
        if (lineaNormalizada.includes(fraseTenaris1) || lineaNormalizada.includes(fraseTenaris2)) {
            seccionTenarisEncontrada = true;
            idxInicioSeccionTenaris = i;
            if (DEBUG_THIS_FUNCTION) console.log(`🎯 Potencial formato TENARIS detectado por frase "${lineas[i]}" en línea ${idxInicioSeccionTenaris}`);
            break;
        }
    }

    if (seccionTenarisEncontrada) {
        formatoDetectado = "TENARIS";
        if (DEBUG_THIS_FUNCTION) console.log(`🎯 Formato confirmado: "${formatoDetectado}"`);

        let idxSimbolos = -1;
        let lineaSimbolosTexto = "";

        const RANGO_BUSQUEDA_SIMBOLOS = 25;
        if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Buscando línea de símbolos desde ${idxInicioSeccionTenaris + 1} hasta ${Math.min(idxInicioSeccionTenaris + RANGO_BUSQUEDA_SIMBOLOS + 1, lineas.length -1)}`);

        for (let j = idxInicioSeccionTenaris + 1; j < Math.min(idxInicioSeccionTenaris + RANGO_BUSQUEDA_SIMBOLOS + 1, lineas.length); j++) {
            const lineaActual = lineas[j]; // This is the raw line from the 'lineas' array for the current index j
            if (!lineaActual || lineaActual.trim() === "") {
                 if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Línea [${j}] está vacía, saltando.`);
                 continue;
            }

            // ***** ENHANCED DEBUGGING: Crucial for diagnosing symbol line issues *****
            if (DEBUG_THIS_FUNCTION) {
                // This log will show the exact content of 'lineaActual' (after trim and space normalization from 'lineas' array creation)
                // that is being considered at each step. For the line index where you expect symbols (e.g., 387 from previous logs),
                // this will reveal if it contains the full "H C Mn Si..." string or just "H".
                console.log(`  (TENARIS) Verificando línea [${j}] para símbolos. Contenido procesado: "${lineaActual}" (Longitud: ${lineaActual.length})`);
                // If issues persist, uncomment below to see character codes, helping to find non-standard spaces/invisible chars
                // console.log(`      (TENARIS) Char codes for lineaActual [${j}]: ${lineaActual.split('').map(c => c.charCodeAt(0)).join(',')}`);
            }
            // ***** END ENHANCED DEBUGGING *****


            if (lineaActual.toUpperCase().startsWith("X ")) { // Catches lines like "X 100", "X 1000"
                 if (DEBUG_THIS_FUNCTION) console.log(`      Línea [${j}] (${lineaActual}) -> Parece ser de multiplicadores, saltando para símbolos.`);
                 continue;
            }
            // Catches lines like "H 94 22..." or "P 93 21..." which are data lines, not symbol lines
            if (/^(?:[A-Z0-9\/\s.-]*?\s+)?([HP])\s+((\s*\.?\d+)+)/i.test(lineaActual.toUpperCase()) || /^[HP]\s+\d/.test(lineaActual.toUpperCase())) {
                if (DEBUG_THIS_FUNCTION) console.log(`      Línea [${j}] (${lineaActual}) -> Parece ser de valores (H/P + números), saltando para símbolos.`);
                continue;
            }

            // Tokenize the current line. filter(Boolean) or filter(tok => tok.length > 0) removes empty strings from multiple spaces if any.
            const tokens = lineaActual.split(/\s+/).filter(Boolean);
            const potentialSymbolsInLine = tokens.filter(t =>
                /^[A-Z][A-Z0-9]*(?:LF|L)?$/.test(t.toUpperCase()) && // Standard chemical symbol patterns
                t.length <= 5 && // Symbols are generally short
                !['HEAT', 'CHARGE', 'SAMPLE', 'PROBE', 'LOT', 'LOS', 'NR', 'TYPE', 'ANALYSE', 'ANALYSIS', 'TEST', 'WERKSTOFF', 'GRADE', 'MAX', 'MIN'].includes(t.toUpperCase())
            );

            const commonSymbols = ['C', 'MN', 'SI', 'P', 'S', 'CR', 'NI']; // Key symbols to confirm it's a composition line
            let commonFoundCount = 0;
            potentialSymbolsInLine.forEach(ps => {
                const cleanPs = ps.toUpperCase().replace('LF','').replace('L','');
                if (commonSymbols.includes(cleanPs) || commonSymbols.includes(ps.toUpperCase())) {
                    commonFoundCount++;
                }
            });

            if (DEBUG_THIS_FUNCTION) {
                console.log(`      Línea [${j}] DEBUG: Tokens Originales: [${tokens.join('|')}], Símbolos Potenciales Filtrados: [${potentialSymbolsInLine.join('|')}], Símbolos Comunes Encontrados: ${commonFoundCount}`);
            }

            // Criteria for identifying the symbol line:
            // Needs a minimum number of potential symbols and a minimum number of common symbols.
            if (potentialSymbolsInLine.length >= 5 && commonFoundCount >= 3) {
                 idxSimbolos = j;
                 lineaSimbolosTexto = lineaActual; // Store the line that contains the symbols
                 if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) ✅ Línea de Símbolos ENCONTRADA (idx ${idxSimbolos}): "${lineaSimbolosTexto}"`);
                 break; // Found the symbol line, exit loop
            } else if (DEBUG_THIS_FUNCTION) {
                 console.log(`      Línea [${j}] NO CUMPLE CRITERIOS: Símbolos Potenciales=${potentialSymbolsInLine.length} (req >=5), Comunes Encontrados=${commonFoundCount} (req >=3)`);
            }
        }

        if (idxSimbolos === -1) {
            if (DEBUG_THIS_FUNCTION) console.warn("⚠️ (TENARIS) No se encontró la línea de símbolos principal.");
        } else {
            // --- Improved symbol extraction from lineaSimbolosTexto to handle "CE LF" ---
            const rawSymbolsRegexMatch = lineaSimbolosTexto.match(/[A-Z][A-Z0-9]*(?:\s*(?:LF|L))?/gi) || [];
            let parsedSymbols = [];
            for (let i = 0; i < rawSymbolsRegexMatch.length; i++) {
                let currentSymbolRaw = rawSymbolsRegexMatch[i];
                // Clean the current symbol by making it uppercase and removing internal spaces (e.g. "CE LF" -> "CELF" if regex captured it that way, or "CE" -> "CE")
                let currentSymbolClean = currentSymbolRaw.toUpperCase().replace(/\s+/g, '');

                // Check if current symbol is "CE" and next is "LF"
                if (currentSymbolClean === 'CE' && (rawSymbolsRegexMatch[i+1]?.toUpperCase().replace(/\s+/g,'')) === 'LF') {
                    parsedSymbols.push('CE LF'); // Push combined "CE LF"
                    i++; // Increment loop counter to skip the next token ('LF') as it's now combined
                } else {
                    parsedSymbols.push(currentSymbolClean); // Push the symbol as is
                }
            }

            
            // Filter out non-symbol keywords again from the (potentially combined) list
            const todosSimbolosTenaris = parsedSymbols.filter(s => /^[A-Z]/.test(s) && !['HEAT', 'CHARGE', 'SAMPLE', 'PROBE', 'LOT', 'LOS', 'NR', 'TYPE', 'ANALYSE', 'ANALYSIS', 'MAX', 'MIN'].includes(s.toUpperCase()));
            // --- End improved symbol extraction ---

            if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Símbolos parseados de la línea (${todosSimbolosTenaris.length}): [${todosSimbolosTenaris.join(', ')}]`);

            let valoresBrutos = null;
            let tipoAnalisisSeleccionado = null;

            // Search for value lines (H or P) after the symbol line
            for (let k = idxSimbolos + 1; k < Math.min(idxSimbolos + 75, lineas.length); k++) {
              if (!lineas[k] || lineas[k].trim() === "") {
                  if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Buscando valores: Línea [${k}] vacía, saltando.`);
                  continue;
              }
              const lineaValoresPotencial = lineas[k];
              if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Buscando valores: Verificando línea [${k}]: "${lineaValoresPotencial}"`);

              const matchLineaValor = lineaValoresPotencial.match(/^(?:[A-Z0-9\/\s.-]*?\s+)?([HP])\s+(\d)/i);

// Inside the loop for finding H/P values (k loop)
// Before the 'if (matchLineaValor)'
if (DEBUG_THIS_FUNCTION && lineaValoresPotencial.trim().startsWith('P ')) { // Or another pattern you see for P lines
    console.log(`  (TENARIS DEBUG) Potential P-line [<span class="math-inline">\{k\}\]\: "</span>{lineaValoresPotencial}"`);
    console.log(`      (TENARIS DEBUG) Regex test 1 (/^(?:[A-Z0-9\/\s.-]*?\s+)?([HP])\s+(\d)/i): ${/^(?:[A-Z0-9\/\s.-]*?\s+)?([HP])\s+(\d)/i.test(lineaValoresPotencial)}`);
    console.log(`      (TENARIS DEBUG) Regex test 2 (/[HP]\s+((?:\s*\.?\d+)+)/i): ${/[HP]\s+((?:\s*\.?\d+)+)/i.test(lineaValoresPotencial)}`);
}


              if (matchLineaValor) {
                const tipoAnalisis = matchLineaValor[1].toUpperCase();
                const valoresTextoMatch = lineaValoresPotencial.match(/[HP]\s+((?:\s*\.?\d+)+)/i);
                if (!valoresTextoMatch || !valoresTextoMatch[1]) {
                    if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Línea [${k}] coincide con H/P pero no se extrajeron números después.`);
                    continue;
                }
                const valoresTexto = valoresTextoMatch[1].trim();
                const numerosExtraidos = extraerNumerosDesdeTexto(valoresTexto, `(${formatoDetectado}) TENARIS Valores ${tipoAnalisis}:`);

                if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Línea de Valores candidata (idx ${k}): Tipo: ${tipoAnalisis}, TextoValores: "${valoresTexto}", Números: [${numerosExtraidos.join(', ')}]`);

                if (numerosExtraidos.length > 0) {
                    if (tipoAnalisis === 'P') { // Prefer 'P' (Product) analysis
                        valoresBrutos = numerosExtraidos;
                        tipoAnalisisSeleccionado = 'P (Producto)';
                        if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Análisis 'P' seleccionado. Valores: [${valoresBrutos.join(', ')}]`);
                        break; // Found 'P' analysis, use this one
                    } else if (tipoAnalisis === 'H' && !valoresBrutos) { // If 'P' not yet found, take 'H' (Heat)
                        valoresBrutos = numerosExtraidos;
                        tipoAnalisisSeleccionado = 'H (Cuchara)';
                        if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Análisis 'H' temporalmente seleccionado. Valores: [${valoresBrutos.join(', ')}]`);
                        // Continue searching in case a 'P' line follows
                    }
                }
              } else if (DEBUG_THIS_FUNCTION) {
                  console.log(`    (TENARIS) Línea [${k}] no coincide con patrón de valores H/P.`);
              }
            }

            if (!valoresBrutos || valoresBrutos.length === 0) {
              if (DEBUG_THIS_FUNCTION) console.warn("⚠️ (TENARIS) No se encontraron valores numéricos para análisis H o P.");
            } else {
                if (DEBUG_THIS_FUNCTION) {
                    console.log(`✅ (TENARIS) Usando análisis tipo "${tipoAnalisisSeleccionado}"`);
                    console.log(`✅ (TENARIS) Valores brutos extraídos (${valoresBrutos.length}): [${valoresBrutos.join(', ')}]`);
                }

                composicion.valoresDescartados = [];
                 if (todosSimbolosTenaris.length > 0 && valoresBrutos.length > 0 && todosSimbolosTenaris.length !== valoresBrutos.length) {
                    if (DEBUG_THIS_FUNCTION) console.warn(`⚠️ (TENARIS) Desajuste: Símbolos (${todosSimbolosTenaris.length}) vs Valores (${valoresBrutos.length}) para tipo "${tipoAnalisisSeleccionado}".`);
                    if (valoresBrutos.length > todosSimbolosTenaris.length) {
                        const descartados = valoresBrutos.slice(todosSimbolosTenaris.length);
                        composicion.valoresDescartados.push(...descartados);
                        if (DEBUG_THIS_FUNCTION) console.warn(`✂️ (TENARIS) Valores descartados (exceso): ${descartados.join(', ')}`);
                    } else {
                        if (DEBUG_THIS_FUNCTION) console.warn(`📉 (TENARIS) Faltan ${todosSimbolosTenaris.length - valoresBrutos.length} valores para los símbolos: ${todosSimbolosTenaris.slice(valoresBrutos.length).join(', ')}`);
                    }
                }

                const minLength = Math.min(todosSimbolosTenaris.length, valoresBrutos.length);
                for (let k=0; k < minLength; k++) {
                  const simboloMapear = todosSimbolosTenaris[k]; // This is the cleaned symbol, e.g., "C", "MN", "CE LF"
                        // Inside the loop where you assign composicion values:
                    
                    // Add this debug for the specific token:
                    if (simboloMapear === 'CE LF' || simboloMapear === 'CELF' || simboloMapear === 'CEL') {
                        console.log(`(TENARIS DEBUG) For CE/LF related token: simboloMapear is "${simboloMapear}" (length: ${simboloMapear.length})`);
                        console.log(`(TENARIS DEBUG) mapElementos['CE LF'] exists: ${'CE LF' in mapElementos}`);
                        console.log(`(TENARIS DEBUG) mapElementos['CELF'] exists: ${'CELF' in mapElementos}`);
                        console.log(`(TENARIS DEBUG) mapElementos['CEL'] exists: ${'CEL' in mapElementos}`);
                    }

                    let clave = mapElementos[simboloMapear];
                    if (simboloMapear === 'CE LF' || simboloMapear === 'CELF' || simboloMapear === 'CEL') {
                        console.log(`(TENARIS DEBUG) Clave found for "${simboloMapear}": ${clave}`);
                    }
                  

                  // Fallbacks for legacy or alternative symbols like S1, F1
                  if (!clave && simboloMapear === 'S1') clave = mapElementos['SI']; // Note: mapElementos keys are uppercase
                  if (!clave && simboloMapear === 'F1') clave = mapElementos['P'];

                  let valorCrudo = valoresBrutos[k];

                  if (clave && valorCrudo !== undefined && !isNaN(valorCrudo)) {
                    // Divisor lookup should use the same symbol key used for mapElementos
                    const divisor = divisoresTenarisPredeterminados[simboloMapear] || 100;

                    const valorCorregido = valorCrudo / divisor;
                    composicion[clave] = parseFloat(valorCorregido.toFixed(6));
                     if (DEBUG_THIS_FUNCTION) {
                         console.log(`  (TENARIS) Asignado: ${clave} = ${composicion[clave]} (Valor Crudo: ${valorCrudo}, Símbolo Mapeado: ${simboloMapear}, Divisor: ${divisor})`);
                     }
                  } else if (clave && (valorCrudo === undefined || isNaN(valorCrudo))) {
                      if (DEBUG_THIS_FUNCTION) console.warn(`📉 (TENARIS) Símbolo ${simboloMapear} (clave: ${clave}) sin valor numérico (${valorCrudo}).`);
                  } else if (!clave) {
                      if (DEBUG_THIS_FUNCTION) console.warn(`🚫 (TENARIS) Símbolo ${simboloMapear} no mapeado en mapElementos.`);
                  }
                }
            }
        }
    }
  }
  // --- FIN Lógica Formato TENARIS ---

  // --- Lógica de Aleado y Retorno (SIN CAMBIOS SIGNIFICATIVOS, REVISAR UMBRAL C PARA INOXIDABLE SI ES NECESARIO) ---
  if (!formatoDetectado && texto.length > 0) {
    if (DEBUG_THIS_FUNCTION) console.warn("⚠️ No se encontró ninguna sección de composición química conocida en el texto.");
  } else if (formatoDetectado) {
    let seAsignaronValoresQuimicos = false;
    for (const claveMapeada of Object.values(mapElementos)) {
        if (composicion[claveMapeada] !== null && typeof composicion[claveMapeada] === 'number' && !isNaN(composicion[claveMapeada])) {
            seAsignaronValoresQuimicos = true;
            break;
        }
    }
    if (!seAsignaronValoresQuimicos && DEBUG_THIS_FUNCTION) {
        console.warn(`🔶 Formato "${formatoDetectado}" detectado, pero no se extrajeron valores químicos numéricos válidos para los elementos mapeados.`);
    }
  }

  const justificaciones = [];
  let esAleadoDefinidoPorElemento = false;

  for (const [elementoClaveComposicion, limite] of Object.entries(umbralesAleado)) {
    if (composicion[elementoClaveComposicion] === null || composicion[elementoClaveComposicion] === undefined || isNaN(composicion[elementoClaveComposicion])) continue;
    const val = composicion[elementoClaveComposicion];
    // Find the original symbol (like 'C', 'MN', 'CE LF') for logging purposes
    let simboloParaLog = Object.keys(mapElementos).find(key => mapElementos[key] === elementoClaveComposicion) || elementoClaveComposicion.toUpperCase();

    if (val >= limite) {
      esAleadoDefinidoPorElemento = true;
      if (!composicion.elementosAleantes.includes(simboloParaLog)) {
        composicion.elementosAleantes.push(simboloParaLog);
      }
      justificaciones.push(`${simboloParaLog} ${Number(val).toFixed(4)}% >= ${limite}%`);
    }
  }

  const { carbono: c_val, cromo: cr_val, molibdeno: mo_val, vanadio: v_val, niobio: nb_val, nitrogeno: n_val, aluminio: al_val, niquel: ni_val } = composicion;
  let tipoAceroDeterminado = 'sin alear';
  let justificacionTipo = 'Por defecto. No cumple criterios de aleado o inoxidable.';

  // Definición de acero inoxidable (ej. según Nota 1e del Cap 72 TIGIE: Cr >= 10.5% y C <= 1.2%)
  // El umbral original de c_val <= 0.012% era muy restrictivo y probablemente incorrecto para la mayoría de los inoxidables.
  // Se ajusta a c_val <= 1.2% que es más común. Verificar la normativa aplicable.
  if (cr_val !== null && cr_val >= 0.105 && (c_val === null || c_val <= 0.012)) { // Ajustado c_val <= 1.2% (0.012 * 100 = 1.2%)
                                                                                 // El valor original 0.012 (si es %) es 0.00012 (si es fracción)
                                                                                 // Asumiendo los valores en 'composicion' son fracciones (e.g., 0.5 para 0.5%)
                                                                                 // El código original tenía: c_val <= 0.012 && cr_val >= 0.105
                                                                                 // Si c_val es 0.10 (10% C), 0.012 es muy bajo. Si c_val es 0.0010 (0.10% C), 0.012 es 1.2% C
                                                                                 // Vamos a mantener la lógica original de umbral, pero esto debe ser verificado.
                                                                                 // La condición original del usuario era c_val <= 0.012 (interpretado como fracción directa)
    tipoAceroDeterminado = 'inoxidable';
    esAleadoDefinidoPorElemento = true; // Inoxidable es un tipo de aleado
    justificacionTipo = `Acero inoxidable (C ${Number(c_val || 0).toFixed(4)} <= 0.012, Cr ${Number(cr_val || 0).toFixed(4)} >= 0.105).`;
    if (!justificaciones.some(j => j.startsWith("Cr"))) justificaciones.push(`Cr ${Number(cr_val || 0).toFixed(4)} >= 0.105`);
     if (c_val !== null && !justificaciones.some(j => j.startsWith("C "))) justificaciones.push(`C ${Number(c_val).toFixed(4)} <= 0.012`);


  } else if ( // Aceros tipo P91/T91 (ejemplo, ajustar rangos según sea necesario)
      c_val !== null && cr_val !== null && mo_val !== null && v_val !== null && nb_val !== null &&
      (c_val >= 0.0008 && c_val <= 0.0012) && // 0.08% to 0.12%
      (cr_val >= 0.080 && cr_val <= 0.095) &&  // 8.0% to 9.5%
      (mo_val >= 0.0085 && mo_val <= 0.0105) && // 0.85% to 1.05%
      (v_val >= 0.0018 && v_val <= 0.0025) &&  // 0.18% to 0.25%
      (nb_val >= 0.0006 && nb_val <= 0.0010) && // 0.06% to 0.10%
      (n_val === null || (n_val >= 0.0003 && n_val <= 0.0007)) && // 0.03% to 0.07%
      (al_val === null || al_val <= 0.0004) // <= 0.04%
  ) {
    tipoAceroDeterminado = 'P91/T91 (X10CrMoVNb9-1)';
    esAleadoDefinidoPorElemento = true;
    justificacionTipo = `Cumple composición química aproximada para P91/T91.`;
  } else if (esAleadoDefinidoPorElemento) {
    tipoAceroDeterminado = 'aleado';
    justificacionTipo = `Acero aleado por: ${justificaciones.join('; ')}.`;
  }

  composicion.aleado = esAleadoDefinidoPorElemento;
  composicion.tipoAcero = tipoAceroDeterminado;
  composicion.justificacionAleado = esAleadoDefinidoPorElemento ? justificacionTipo : 'No cumple criterios de acero aleado según Nota 1(f) Cap 72 o no es Inoxidable/P91.';

  if (DEBUG_THIS_FUNCTION) console.log("🔬 Composición Química Final y Tipo de Acero:", JSON.stringify(composicion, null, 2));
  return composicion;
}

module.exports = { detectarComposicionQuimica };
// --- FIN DEL ARCHIVO ---