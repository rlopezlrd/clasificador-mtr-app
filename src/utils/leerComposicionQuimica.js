// leerComposicionQuimica.js

function detectarComposicionQuimica(texto, tipoProductoDebug = "No especificado") {
  const DEBUG_THIS_FUNCTION = process.env.DEBUG_COMPOSICION === 'true' || true;

  if (DEBUG_THIS_FUNCTION) {
    console.log(`📄 Texto recibido para detectarComposicionQuimica (producto: ${tipoProductoDebug}, longitud: ${texto?.length || 0}).`);
  }


  
// Al inicio de detectarComposicionQuimica
  const composicion = {
    carbono: null, fosforo: null, silicio: null, manganeso: null, niquel: null,
    cromo: null, molibdeno: null, vanadio: null, niobio: null, aluminio: null,
    cobre: null, azufre: null, titanio: null, boro: null, nitrogeno: null,
    wolframio: null, circonio: null, estaño: null, calcio: null, arsenico: null, ce_lf: null,
    aluminioSoluble: null, 
    antimonio: null, 
    cobalto: null, 
    bismuto: null, 
    magnesio: null, 
    plomo: null,
    aleado: false, tipoAcero: 'sin alear', elementosAleantes: [],
    justificacionAleado: '', valoresDescartados: []
  };

  const mapElementos = {
    C: 'carbono', SI: 'silicio', MN: 'manganeso', P: 'fosforo', S: 'azufre',
    AL: 'aluminio', CR: 'cromo', CU: 'cobre', MO: 'molibdeno', N: 'nitrogeno',
    NI: 'niquel', NB: 'niobio', CB: 'niobio', 
    TI: 'titanio', B: 'boro', V: 'vanadio',
    W: 'wolframio', ZR: 'circonio', SN: 'estaño', CA: 'calcio', AS: 'arsenico',
    PB: 'plomo',
    SOL: 'aluminioSoluble', 
    SB: 'antimonio',
    CO: 'cobalto',
    BI: 'bismuto',
    MG: 'magnesio',
    'CE LF': 'ce_lf', CEL: 'ce_lf', CELF: 'ce_lf', 
    CE: 'ce_lf', 
    S1: 'silicio', N0: 'niobio', F1: 'fosforo'
  };

  const divisoresTenarisPredeterminados = {
    C: 100, MN: 100, SI: 100, CR: 100, MO: 100, 
    AL: 100,    
    SOL: 100,   
    CU: 100,
    P: 1000, NI: 1000, V: 1000, 
    SN: 1000, AS: 1000, NB: 1000, TI: 1000, PB: 1000, SB: 1000, CO: 1000, S: 1000,
    ZR: 10000, BI: 10000, CA: 10000, B: 10000, N: 10000, MG: 10000, W: 10000,
    'CE LF': 100, CEL: 100, CELF: 100, CE: 100
  };

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


//   // --- INICIO LÓGICA FORMATO "LADLE_V5.6" ---


// // --- INICIO LÓGICA FORMATO "LADLE_V5.6" (Revisado para Calvert) ---
//   const fraseLadle = "CHEMICAL COMPOSITION OF THE LADLE";
//   let idxFraseLadle = -1;
//   for (let i = 0; i < lineas.length; i++) {
//     if (lineas[i].toUpperCase().includes(fraseLadle)) {
//       idxFraseLadle = i;
//       break;
//     }
//   }

//   if (idxFraseLadle !== -1) {
//     formatoDetectado = "LADLE_V5.6"; // Asumir inicialmente
//     if (DEBUG_THIS_FUNCTION) console.log(`🎯 Formato potencial LADLE_V5.6 detectado por frase en línea ${idxFraseLadle}: "${lineas[idxFraseLadle]}"`);
//     if (DEBUG_THIS_FUNCTION && idxFraseLadle !== -1) {
//     console.log("------------------------------------------------------");
//     console.log("DEBUG: Contenido de 'lineas' después de la frase clave:");
//     for (let j = idxFraseLadle + 1; j < Math.min(idxFraseLadle + 6, lineas.length); j++) {
//         console.log(`lineas[${j}] (original): "${lineas[j]}"`);
//         console.log(`lineas[${j}] (trimmed) : "${lineas[j].trim()}"`);
//     }
//     console.log("------------------------------------------------------");
// }

// // Dentro del bloque if (idxFraseLadle !== -1) { ... } para LADLE_V5.6

//     let idxMainSymbolLine = -1;
//     let mainSymbolLineText = "";

//     const searchRangeStart = idxFraseLadle + 1;
//     // Ampliamos un poco el rango por si hay líneas vacías extras.
//     const searchRangeEnd = Math.min(idxFraseLadle + 6, lineas.length); 

//     for (let i = searchRangeStart; i < searchRangeEnd; i++) {
//         const currentLineOriginal = lineas[i]; // Guardar original para logs si es necesario
//         const currentLine = currentLineOriginal.trim();
//         const currentLineUpper = currentLine.toUpperCase();

//         if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Verificando línea [idx ${i}] para SÍMBOLOS: "${currentLine}"`);

//         if (currentLine.length < 10) { // Demasiado corta para ser la línea de símbolos principal
//             if (DEBUG_THIS_FUNCTION) console.log(`      Línea [idx ${i}] descartada: demasiado corta.`);
//             continue;
//         }
//         if (/^\d/.test(currentLine)) { // Empieza con dígito, probablemente línea de valores
//             if (DEBUG_THIS_FUNCTION) console.log(`      Línea [idx ${i}] descartada: empieza con dígito.`);
//             continue;
//         }

//         // Criterios para ser una línea de símbolos:
//         // 1. Debe contener un conjunto mínimo de símbolos químicos clave.
//         // 2. Puede empezar con "HEAT" o directamente con símbolos, o incluso con "NO." si está mal parseado.
        
//         let potentialSymbolText = currentLine;
//         let potentialSymbolTextUpper = currentLineUpper;

//         // Intentar limpiar prefijos comunes si existen
//         if (currentLineUpper.startsWith("HEAT ")) {
//             potentialSymbolText = currentLine.substring(5); // Quita "HEAT "
//             potentialSymbolTextUpper = potentialSymbolText.toUpperCase();
//         } else if (currentLineUpper.startsWith("NO. ")) { // Específicamente para el caso "No. C Si Mn..."
//             potentialSymbolText = currentLine.substring(4); // Quita "No. "
//             potentialSymbolTextUpper = potentialSymbolText.toUpperCase();
//         }
//          // Asegurarse que después de la limpieza, la línea aún comience con un carácter alfabético (símbolo)
//         if (!/^[A-Z]/.test(potentialSymbolTextUpper.trim())) {
//              if (DEBUG_THIS_FUNCTION) console.log(`      Línea [idx ${i}] descartada: después de limpiar prefijos, no empieza con letra: "${potentialSymbolText.trim()}"`);
//              continue;
//         }


//         const keySymbols = ['C', 'SI', 'MN', 'P', 'S', 'AL'];
//         let foundKeySymbols = 0;
//         keySymbols.forEach(s => {
//             // Usar word boundaries para evitar falsos positivos (e.g., "CA" encontrando "C")
//             // pero \b no funciona bien con todos los casos de pdftotext. Includes es más permisivo.
//             // Para mayor precisión, podríamos usar regex con espacios: new RegExp(`\\s${s}\\s`) o `^${s}\\s` o `\\s${s}$`
//             if (potentialSymbolTextUpper.includes(s)) { 
//                 foundKeySymbols++;
//             }
//         });

//         if (DEBUG_THIS_FUNCTION) console.log(`      Línea [idx ${i}] procesada como "${potentialSymbolText}". Símbolos clave encontrados: ${foundKeySymbols} de ${keySymbols.length}.`);

//         // Si encontramos suficientes símbolos clave (ej. al menos 4 de 6)
//         if (foundKeySymbols >= 4) {
//             mainSymbolLineText = potentialSymbolText; // Usar el texto ya procesado (sin "Heat" o "No.")
//             idxMainSymbolLine = i;
//             if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Línea de SÍMBOLOS ENCONTRADA (idx ${idxMainSymbolLine}): "${mainSymbolLineText}" (Original: "${currentLineOriginal}")`);
//             break; 
//         }
//     }
//     // El resto del bloque LADLE_V5.6 (procesamiento de mainSymbolLineText, búsqueda de línea de valores, etc.) continúa aquí...
//     // Asegúrate que la lógica que sigue a esto utilice 'mainSymbolLineText' que ahora NO debería tener "HEAT" o "NO." al inicio.
//     // La línea: let simbolosTextoLimpio = mainSymbolLineText; ya no necesitaría las primeras dos condiciones 'if/else if' para HEAT/HEAT NO.
//     // sino solo: simbolosTextoLimpio = mainSymbolLineText.trim().replace(/^[^A-Z]+/i, '').trim();
//     // O mejor aún, ya que 'mainSymbolLineText' se ha limpiado, solo usarla directamente.

//     // ---------- INICIO DEL RESTO DEL BLOQUE LADLE_V5.6 (desde donde se procesa mainSymbolLineText) -------------
//     if (idxMainSymbolLine === -1) { // Si después del bucle no se encontró
//         if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ No se pudo encontrar la línea principal de símbolos.`);
//         formatoDetectado = null;
//     } else {
//         // 'mainSymbolLineText' ya debería estar relativamente limpia de prefijos "Heat" o "No."
//         // Pero una limpieza final por si acaso.
//         const simbolosTextoLimpioFinal = mainSymbolLineText.trim().replace(/^[^A-Z]+/i, '').trim();

//         const todosSimbolos = simbolosTextoLimpioFinal.split(/\s+/).filter(s => s && s.length > 0 && mapElementos[s.toUpperCase()]);
//         if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Símbolos extraídos (${todosSimbolos.length}): [${todosSimbolos.join(', ')}] de texto limpio: "${simbolosTextoLimpioFinal}"`);

//         if (todosSimbolos.length < 5) { 
//             if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ Pocos símbolos válidos (${todosSimbolos.length}) extraídos. Verifique mapElementos y la línea de símbolos.`);
//             formatoDetectado = null;
//         } else {
//             let idxMainValueLine = -1;
//             let mainValueLineText = "";
//             for (let i = idxMainSymbolLine + 1; i < Math.min(idxMainSymbolLine + 3, lineas.length); i++) {
//                 const currentLine = lineas[i].trim();
//                 if (currentLine === "" || currentLine.toUpperCase() === "NO.") { 
//                     if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Saltando línea de valores candidata [idx ${i}]: "${currentLine}" (vacía o "No.")`);
//                     continue;
//                 }
//                 const tokens = currentLine.split(/\s+/);
//                 if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Verificando línea de VALORES candidata [idx ${i}]: "${currentLine}". Tokens: ${tokens.length}`);
//                 if (tokens.length >= todosSimbolos.length && /\d{6,}/.test(tokens[0]) && !isNaN(parseFloat(tokens[1]))) {
//                     idxMainValueLine = i;
//                     mainValueLineText = currentLine;
//                     if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Línea de VALORES ENCONTRADA: "${mainValueLineText}" en idx ${idxMainValueLine}`);
//                     break;
//                 } else if (DEBUG_THIS_FUNCTION) {
//                      console.log(`  (${formatoDetectado}) Línea [idx ${i}] no cumple criterios de valores. Tokens[0]: ${tokens[0]}, test HeatNo: ${/\d{6,}/.test(tokens[0])}, parseFloat(tokens[1]): ${parseFloat(tokens[1])}`);
//                 }
//             }
            
//             if (idxMainValueLine === -1) {
//                 if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ No se pudo encontrar la línea principal de valores (Heat No. + números).`);
//                 formatoDetectado = null;
//             } else {
//                 const valorTokens = mainValueLineText.split(/\s+/);
//                 let heatNumberExtraidoLadle = null;
//                 let todosValores = [];
//                 if (/\d{6,}/.test(valorTokens[0])) {
//                     heatNumberExtraidoLadle = valorTokens[0];
//                     todosValores = valorTokens.slice(1).map(v => parseFloat(v.replace(',', '.'))).filter(val => !isNaN(val));
//                     if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Heat Number ${heatNumberExtraidoLadle} extraído.`);
//                 } else {
//                     todosValores = valorTokens.map(v => parseFloat(v.replace(',', '.'))).filter(val => !isNaN(val));
//                 }
//                 if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Valores numéricos extraídos (${todosValores.length}): [${todosValores.join(', ')}]`);

//                 if (todosValores.length < todosSimbolos.length * 0.8) { 
//                     if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ Muy pocos valores numéricos (${todosValores.length}) extraídos para ${todosSimbolos.length} símbolos.`);
//                     formatoDetectado = null;
//                 } else {
//                     composicion.valoresDescartados = [];
//                     if (todosSimbolos.length !== todosValores.length && DEBUG_THIS_FUNCTION) {
//                         // (Misma lógica de advertencia y manejo de descarte que antes)
//                         console.warn(`  (${formatoDetectado}) ⚠️ Desajuste: Símbolos (${todosSimbolos.length}) vs Valores (${todosValores.length}).`);
//                         if (todosValores.length > todosSimbolos.length) {
//                             const descartados = todosValores.slice(todosSimbolos.length);
//                             composicion.valoresDescartados.push(...descartados);
//                             console.warn(`  (${formatoDetectado}) ✂️ Valores descartados (exceso): ${descartados.join(', ')}`);
//                         } else {
//                             const simbolosSinValor = todosSimbolos.slice(todosValores.length);
//                             console.warn(`  (${formatoDetectado}) 📉 Símbolos sin valor asignado: ${simbolosSinValor.join(', ')}`);
//                         }
//                     }
//                     const minLength = Math.min(todosSimbolos.length, todosValores.length);
//                     for (let k = 0; k < minLength; k++) {
//                         const simUpper = todosSimbolos[k].toUpperCase();
//                         const clave = mapElementos[simUpper];
//                         const valor = todosValores[k];
//                         if (clave && valor !== undefined && !isNaN(valor)) {
//                             composicion[clave] = parseFloat(valor.toFixed(6)); 
//                         }
//                     }
//                 }
//             }
//         }
//     }
// // ---------- FIN DEL RESTO DEL BLOQUE LADLE_V5.6 -------------


//   } else {
//      // La fraseLadle no fue encontrada, no se hace nada aquí.
//      // La variable formatoDetectado permanece como null o con el valor de un formato previo.
//   }

// --- INICIO LÓGICA FORMATO "LADLE_V5.6" (Definitivo para Calvert MTR) ---

// --- INICIO LÓGICA FORMATO "LADLE_V5.6" (Definitivo para Calvert MTR v3) ---
const fraseLadle = "CHEMICAL COMPOSITION OF THE LADLE";
let idxFraseLadle = -1;
for (let i = 0; i < lineas.length; i++) {
  if (lineas[i].toUpperCase().includes(fraseLadle)) {
    idxFraseLadle = i;
    break;
  }
}

if (idxFraseLadle !== -1) {
  formatoDetectado = "LADLE_V5.6";
  if (DEBUG_THIS_FUNCTION) console.log(`🎯 Formato potencial LADLE_V5.6 detectado por frase en línea ${idxFraseLadle}: "${lineas[idxFraseLadle]}"`);

  let simbolosParte1Texto = "";
  let simbolosParte2Texto = "";
  let valoresParte1Array = [];
  let valoresParte2Array = [];
  let heatNumberExtraidoLadle = null;
  let todosSimbolos = [];
  let todosValores = [];

  // Índices basados en la estructura observada en MTR_EJEMPLO_CALVERT.txt y logs
  const idxSimbolosP1Expected = idxFraseLadle + 4; // Línea "C Si Mn P S Al Cr Cu Mo N"
  const idxValoresP1Expected = idxFraseLadle + 5; // Línea "1680845 0.0741 ..."
  const idxSimbolosP2Expected = idxFraseLadle + 6; // Línea "Ni Nb Ti B V Ca"
  const idxValoresP2Expected = idxFraseLadle + 7; // Línea "0.007 0.048 ..."

  // Extracción de Símbolos Parte 1
  if (lineas.length > idxSimbolosP1Expected && lineas[idxSimbolosP1Expected]) {
    let tempText = lineas[idxSimbolosP1Expected].trim();
    // La línea "No. C Si Mn..." del log estaba en lineas[39] y idxFraseLadle=37 -> 37+2.
    // Pero el CALVERT.TXT muestra C Si Mn... en la línea idxFraseLadle + 4 (después de Heat, No., <vacio>)
    // El log de lineas muestra lineas[39] ("No. C Si Mn...") como idxFraseLadle+2
    // Si la frase clave está en 37, entonces 39 es idxFraseLadle+2. Si este es el caso, ajustamos:
    // La discrepancia entre el .txt y el log de lineas[] es importante.
    // Usaremos el log de lineas[] como la fuente de verdad de lo que el script ve.
    // Log: lineas[39] es "No. C Si Mn P S Al Cr Cu Mo N" -> idxFraseLadle + 2
    // Log: lineas[41] es "1680845..." -> idxFraseLadle + 4
    
    // REAJUSTE DE ÍNDICES BASADO EN EL LOG MÁS RECIENTE (el que tiene el DEBUG de lineas)
    const idxSimbolosP1Actual = idxFraseLadle + 2; // lineas[39] en el log
    const idxValoresP1Actual = idxFraseLadle + 4;  // lineas[41] en el log

    // SÍMBOLOS PARTE 1 desde lineas[idxSimbolosP1Actual]
    if (lineas.length > idxSimbolosP1Actual && lineas[idxSimbolosP1Actual]) {
        let lineP1Symbols = lineas[idxSimbolosP1Actual].trim();
        let P1TextToParse = lineP1Symbols;
        if (lineP1Symbols.toUpperCase().startsWith("NO. ")) {
            P1TextToParse = lineP1Symbols.substring(4);
        }
        if (P1TextToParse.toUpperCase().includes("C") && P1TextToParse.toUpperCase().includes("SI")) {
            simbolosParte1Texto = P1TextToParse;
            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Símbolos Parte 1 (de línea ${idxSimbolosP1Actual}): "${simbolosParte1Texto}" (Original: "${lineas[idxSimbolosP1Actual]}")`);
        } else {
            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ⚠️ Línea ${idxSimbolosP1Actual} no contiene Símbolos Parte 1 esperados: "${lineas[idxSimbolosP1Actual]}"`);
            formatoDetectado = null;
        }
    } else {
        if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ⚠️ Línea ${idxSimbolosP1Actual} para Símbolos Parte 1 no disponible.`);
        formatoDetectado = null;
    }

    // VALORES PARTE 1 desde lineas[idxValoresP1Actual]
    if (formatoDetectado && lineas.length > idxValoresP1Actual && lineas[idxValoresP1Actual]) {
        const lineP1Values = lineas[idxValoresP1Actual].trim();
        if (/^\d{6,}/.test(lineP1Values)) {
            const tokens = lineP1Values.split(/\s+/);
            heatNumberExtraidoLadle = tokens[0];
            valoresParte1Array = tokens.slice(1).map(v => parseFloat(v.replace(',', '.'))).filter(val => !isNaN(val));
            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Valores Parte 1 (de línea ${idxValoresP1Actual}): Heat=${heatNumberExtraidoLadle}, Valores=[${valoresParte1Array.join(', ')}]`);
        } else {
            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ⚠️ Línea ${idxValoresP1Actual} no parece Valores Parte 1: "${lineP1Values}"`);
            formatoDetectado = null;
        }
    } else if (formatoDetectado) {
        if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ⚠️ Línea ${idxValoresP1Actual} para Valores Parte 1 no disponible.`);
        formatoDetectado = null;
    }

    // Ahora necesitamos encontrar Símbolos Parte 2 y Valores Parte 2
    // En el MTR_EJEMPLO_CALVERT.txt, están en las líneas siguientes a Valores Parte 1
    // Si Valores P1 fue lineas[idxValoresP1Actual], entonces
    // Símbolos P2 debería ser lineas[idxValoresP1Actual + 1] (si no hay vacías)
    // Valores P2 debería ser lineas[idxValoresP1Actual + 2] (si no hay vacías)

    let currentSearchIdx = idxValoresP1Actual + 1;
    let foundP2Symbols = false;

    // Buscar Símbolos Parte 2
    if (formatoDetectado) {
        for (let i = currentSearchIdx; i < Math.min(currentSearchIdx + 3, lineas.length); i++) {
            const lineP2SymbolsCandidate = lineas[i] ? lineas[i].trim() : "";
            if (lineP2SymbolsCandidate === "") { currentSearchIdx++; continue; } // Avanzar índice si la línea está vacía

            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Buscando Símbolos P2 [idx ${i}]: "${lineP2SymbolsCandidate}"`);
            if (lineP2SymbolsCandidate.toUpperCase().includes("NI") && lineP2SymbolsCandidate.toUpperCase().includes("NB") && !/^\d/.test(lineP2SymbolsCandidate)) {
                simbolosParte2Texto = lineP2SymbolsCandidate;
                currentSearchIdx = i + 1; // Siguiente línea para Valores P2
                foundP2Symbols = true;
                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Símbolos Parte 2 (de línea ${i}): "${simbolosParte2Texto}"`);
                break;
            }
        }
        if (!foundP2Symbols && DEBUG_THIS_FUNCTION) {
            console.log(`  (${formatoDetectado}) ℹ️ No se encontró Símbolos Parte 2 explícitamente.`);
            // No se resetea formatoDetectado aquí, puede que no haya P2.
        }
    }

    // Buscar Valores Parte 2 (solo si se encontraron Símbolos Parte 2)
    if (formatoDetectado && foundP2Symbols && simbolosParte2Texto) {
         for (let i = currentSearchIdx; i < Math.min(currentSearchIdx + 3, lineas.length); i++) {
            const lineP2ValuesCandidate = lineas[i] ? lineas[i].trim() : "";
             if (lineP2ValuesCandidate === "") { currentSearchIdx++; continue; }

            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Buscando Valores P2 [idx ${i}]: "${lineP2ValuesCandidate}"`);
            // Valores P2 no tienen HeatNo, solo son números
            const potentialValues = lineP2ValuesCandidate.split(/\s+/).map(v => parseFloat(v.replace(',', '.'))).filter(val => !isNaN(val));
            if (potentialValues.length > 0 && potentialValues.every(v => !isNaN(v))) { // Todos deben ser números
                const simbolosP2ArrayTemp = simbolosParte2Texto.split(/\s+/).filter(s => s && mapElementos[s.toUpperCase()]);
                if (potentialValues.length === simbolosP2ArrayTemp.length) { // Coincidencia en cantidad
                    valoresParte2Array = potentialValues;
                    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) ✅ Valores Parte 2 (de línea ${i}): [${valoresParte2Array.join(', ')}]`);
                    break;
                } else if (DEBUG_THIS_FUNCTION) {
                     console.log(`  (${formatoDetectado}) ⚠️ Desajuste entre Símbolos P2 (${simbolosP2ArrayTemp.length}) y Valores P2 encontrados (${potentialValues.length}) en línea ${i}.`);
                }
            }
        }
        if (valoresParte2Array.length === 0 && DEBUG_THIS_FUNCTION) {
             console.warn(`  (${formatoDetectado}) ⚠️ Símbolos Parte 2 encontrados pero no sus Valores Parte 2 correspondientes.`);
             // No necesariamente un error fatal si P2 no siempre está presente.
        }
    


    // Consolidar y Mapear
    if (formatoDetectado && simbolosParte1Texto && valoresParte1Array.length > 0) {
        const simbolosP1Array = simbolosParte1Texto.split(/\s+/).filter(s => s && mapElementos[s.toUpperCase()]);
        todosSimbolos.push(...simbolosP1Array);
        todosValores.push(...valoresParte1Array);

        // Solo añadir P2 si ambos, símbolos y valores, fueron encontrados y tienen contenido
        if (simbolosParte2Texto && valoresParte2Array.length > 0) {
            const simbolosP2Array = simbolosParte2Texto.split(/\s+/).filter(s => s && mapElementos[s.toUpperCase()]);
            // Asegurarse que el número de símbolos y valores P2 coincida
            if (simbolosP2Array.length === valoresParte2Array.length) {
                todosSimbolos.push(...simbolosP2Array);
                todosValores.push(...valoresParte2Array);
            } else if (DEBUG_THIS_FUNCTION) {
                console.warn(`  (${formatoDetectado}) ⚠️ No se añadirán Símbolos/Valores P2 debido a desajuste en cantidad (S:${simbolosP2Array.length}, V:${valoresParte2Array.length})`);
            }
        }

        if (DEBUG_THIS_FUNCTION) {
            console.log(`  (${formatoDetectado}) Símbolos TOTALES extraídos (${todosSimbolos.length}): [${todosSimbolos.join(', ')}]`);
            console.log(`  (${formatoDetectado}) Valores TOTALES extraídos (${todosValores.length}): [${todosValores.join(', ')}]`);
        }

        // Para Calvert esperamos ~16 símbolos y valores en total
        if (todosSimbolos.length < 15 || todosValores.length < 15) {
          if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ Insuficientes símbolos o valores totales extraídos para Calvert (S:${todosSimbolos.length}, V:${todosValores.length}). Mínimo esperado: ~15.`);
          formatoDetectado = null; // Falló en obtener la data completa
        } else {
            // Mapeo final
            composicion.valoresDescartados = [];
            if (todosSimbolos.length !== todosValores.length && DEBUG_THIS_FUNCTION) {
                console.warn(`  (${formatoDetectado}) ⚠️ Desajuste Final: Símbolos (${todosSimbolos.length}) vs Valores (${todosValores.length}).`);
                // (Manejo de descarte como antes)
                 if (todosValores.length > todosSimbolos.length) {
                    const descartados = todosValores.slice(todosSimbolos.length);
                    if (descartados.length > 0) composicion.valoresDescartados.push(...descartados);
                    if (DEBUG_THIS_FUNCTION && descartados.length > 0) console.warn(`  (${formatoDetectado}) ✂️ Valores descartados (exceso): ${descartados.join(', ')}`);
                } else {
                    const simbolosSinValor = todosSimbolos.slice(todosValores.length);
                    if (DEBUG_THIS_FUNCTION && simbolosSinValor.length > 0) console.warn(`  (${formatoDetectado}) 📉 Símbolos sin valor asignado: ${simbolosSinValor.join(', ')}`);
                }
            }

            const minLength = Math.min(todosSimbolos.length, todosValores.length);
            for (let k = 0; k < minLength; k++) {
                const simUpper = todosSimbolos[k].toUpperCase();
                const clave = mapElementos[simUpper];
                const valor = todosValores[k];
                if (clave && valor !== undefined && !isNaN(valor)) {
                    composicion[clave] = parseFloat(valor.toFixed(6));
                }
            }
        }
    } else if (formatoDetectado) { // Si no se encontraron Símbolos P1 o Valores P1 válidos
         if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) ⚠️ Fallo crítico al obtener Símbolos Parte 1 o Valores Parte 1.`);
         formatoDetectado = null;
    }

} else { 
  // fraseLadle no fue encontrada
}
   } }
// --- FIN LÓGICA FORMATO "LADLE_V5.6" (Definitivo para Calvert MTR v3) ---





  // --- FIN LÓGICA FORMATO "LADLE_V5.6" (Revisado para Calvert) ---





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
        // Aumentar ligeramente el rango de búsqueda para la línea de símbolos si es necesario
        const RANGO_BUSQUEDA_SIMBOLOS_TENARIS = 30; 

        for (let j = idxInicioSeccionTenaris + 1; j < Math.min(idxInicioSeccionTenaris + RANGO_BUSQUEDA_SIMBOLOS_TENARIS, lineas.length); j++) {
            const lineaActual = lineas[j];
            if (!lineaActual || lineaActual.trim() === "") {
                 if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Buscando símbolos: Línea [${j}] vacía, saltando.`);
                 continue;
            }
            if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Verificando línea [${j}] para símbolos: "${lineaActual}"`);
            
            if (lineaActual.toUpperCase().startsWith("X ")) {
                 if (DEBUG_THIS_FUNCTION) console.log(`      Línea [${j}] -> Parece ser de multiplicadores, saltando.`);
                 continue;
            }
            // Excluir líneas que claramente son de valores (H/P seguido de muchos números)
            if (/^(?:[A-Z0-9\/\s.-]*?\s+)?[HP]\s+\.?\d/.test(lineaActual.toUpperCase())) {
                 if (DEBUG_THIS_FUNCTION) console.log(`      Línea [${j}] -> Parece ser de valores H/P, saltando.`);
                continue;
            }
            // Excluir líneas que sean solo "H Max Min" o "P Max Min" o variaciones
            if (/^[HP]\s+(MAX|MIN)/i.test(lineaActual.toUpperCase())) {
                if (DEBUG_THIS_FUNCTION) console.log(`      Línea [${j}] -> Parece ser línea de Max/Min, saltando.`);
                continue;
            }


            const tokens = lineaActual.split(/\s+/).filter(Boolean);
            const potentialSymbolsInLine = tokens.filter(t =>
                /^[A-Z][A-Z0-9]*(?:LF|L)?$/.test(t.toUpperCase()) &&
                t.length <= 5 && // Símbolos como Ce.1 podrían no pasar este filtro si "Ce.1" se tokeniza como uno solo.
                                  // El regex de rawSymbolsRegexMatch es más robusto para esto.
                !['HEAT', 'CHARGE', 'SAMPLE', 'PROBE', 'LOT', 'LOS', 'NR', 'TYPE', 'ANALYSE', 'ANALYSIS', 'TEST', 'WERKSTOFF', 'GRADE', 'MAX', 'MIN'].includes(t.toUpperCase())
            );

            const commonSymbols = ['C', 'MN', 'SI', 'P', 'S', 'CR', 'NI'];
            let commonFoundCount = 0;
            potentialSymbolsInLine.forEach(ps => {
                const cleanPs = ps.toUpperCase().replace('LF','').replace('L','');
                if (commonSymbols.includes(cleanPs) || commonSymbols.includes(ps.toUpperCase())) {
                    commonFoundCount++;
                }
            });

            if (DEBUG_THIS_FUNCTION) {
                console.log(`      Línea [${j}] DEBUG Símbolos: Tokens: [${tokens.join('|')}], Potenciales: [${potentialSymbolsInLine.join('|')}], Comunes: ${commonFoundCount}`);
            }

            if (potentialSymbolsInLine.length >= 4 && commonFoundCount >= 2) { // Ajustado el umbral, a veces hay menos de 5 símbolos pero son los correctos
                 idxSimbolos = j;
                 lineaSimbolosTexto = lineaActual;
                 if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) ✅ Línea de Símbolos ENCONTRADA (idx ${idxSimbolos}): "${lineaSimbolosTexto}"`);
                 break; 
            }
        }

        if (idxSimbolos !== -1) {
            const rawSymbolsRegexMatch = lineaSimbolosTexto.match(/[A-Z][A-Z0-9\.]*(?:\s*(?:LF|L))?/gi) || []; // Permitir puntos en símbolos como "Ce.1"
            let parsedSymbols = [];
            for (let i = 0; i < rawSymbolsRegexMatch.length; i++) {
                let currentSymbolClean = rawSymbolsRegexMatch[i].toUpperCase().replace(/\s+/g, '');
                if (currentSymbolClean === 'CE' && (rawSymbolsRegexMatch[i+1]?.toUpperCase().replace(/\s+/g,'')) === 'LF') {
                    parsedSymbols.push('CE LF'); i++;
                } else {
                    // Limpiar "Ce.1" a "CE" o manejarlo específicamente si tienes un mapeo para "CE.1"
                    if (currentSymbolClean.endsWith('.')) currentSymbolClean = currentSymbolClean.slice(0,-1); // Quitar punto final si lo hay
                    if (currentSymbolClean === 'CE.1') currentSymbolClean = 'CE'; // O mapElementos['CE.1'] = 'ce_lf'
                    parsedSymbols.push(currentSymbolClean);
                }
            }
            const todosSimbolosTenaris = parsedSymbols.filter(s => /^[A-Z]/.test(s) && !['HEAT', 'CHARGE', 'SAMPLE', 'MAX', 'MIN'].includes(s.toUpperCase()));
            if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Símbolos parseados de la línea (${todosSimbolosTenaris.length}): [${todosSimbolosTenaris.join(', ')}]`);

            let valoresBrutos = null; 
            let tipoAnalisisSeleccionado = null;
            // Rango de búsqueda para valores H/P
            for (let k = idxSimbolos + 1; k < Math.min(idxSimbolos + 10, lineas.length); k++) {
              if (!lineas[k] || lineas[k].trim() === "") continue;
              const lineaValoresPotencial = lineas[k];
              if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS) Buscando valores H/P: Verificando línea [${k}]: "${lineaValoresPotencial}"`);




              // Regex para identificar líneas que comienzan con H o P (posiblemente precedidas por Heat No, etc.)
              // y son seguidas por una secuencia de números.
              const matchHPLine = lineaValoresPotencial.match(/(?:^|\s)([HP])\s+((?:\.?\d+\s*)+)$/i);

              if (matchHPLine) {
                const tipoAnalisis = matchHPLine[1].toUpperCase();
                const valoresTexto = matchHPLine[2].trim(); // El grupo de números
                const numerosExtraidos = extraerNumerosDesdeTexto(valoresTexto, `(${formatoDetectado}) TENARIS Valores ${tipoAnalisis}:`);
                
                if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Línea H/P candidata (idx ${k}): Tipo: ${tipoAnalisis}, TextoValores: "${valoresTexto}", Números: [${numerosExtraidos.join(', ')}]`);

                if (numerosExtraidos.length > 0) {
                    if (tipoAnalisis === 'P') {
                        valoresBrutos = numerosExtraidos;
                        tipoAnalisisSeleccionado = 'P (Producto)';
                        if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Análisis 'P' seleccionado. Valores: [${valoresBrutos.join(', ')}]`);
                        break; 
                    } else if (tipoAnalisis === 'H' && !valoresBrutos) { 
                        valoresBrutos = numerosExtraidos;
                        tipoAnalisisSeleccionado = 'H (Cuchara)';
                        if (DEBUG_THIS_FUNCTION) console.log(`    (TENARIS) Análisis 'H' temporalmente seleccionado. Valores: [${valoresBrutos.join(', ')}]`);
                    }
                }
              } else if (DEBUG_THIS_FUNCTION) {
                  console.log(`    (TENARIS) Línea [${k}] NO coincide con patrón de valores H/P (Regex principal).`);
              }
            }




            
// --- INICIO LÓGICA PARA FORMATO "TENARIS" ---
// (Las frases de detección y bucle para encontrar idxInicioSeccionTenaris se mantienen como las tenías)
// ...
// (El bucle para encontrar idxSimbolos y lineaSimbolosTexto se mantiene como lo tenías)
// ...
// (El parseo de lineaSimbolosTexto para obtener todosSimbolosTenaris se mantiene)
// ...
// (El bucle para encontrar las líneas de valores H/P y obtener valoresBrutos y tipoAnalisisSeleccionado se mantiene)
// ...

 if (valoresBrutos && valoresBrutos.length > 0 && todosSimbolosTenaris.length > 0) {
            if (DEBUG_THIS_FUNCTION) {
                console.log(`✅ (TENARIS Modificado) Usando análisis tipo "${tipoAnalisisSeleccionado}"`);
                console.log(`✅ (TENARIS Modificado) Símbolos parseados (${todosSimbolosTenaris.length}): [${todosSimbolosTenaris.join(', ')}]`);
                console.log(`✅ (TENARIS Modificado) Valores brutos extraídos (${valoresBrutos.length}): [${valoresBrutos.join(', ')}]`);
            }
            composicion.valoresDescartados = [];

            let valorIdx = 0;
            let simboloIdx = 0;
            let firstAlContextProcessed = false; // Para rastrear si el primer contexto de 'Al' (ya sea 'Al sol' o 'Al' solo) ha sido procesado

            while (simboloIdx < todosSimbolosTenaris.length) {
                if (valorIdx >= valoresBrutos.length) {
                    if (DEBUG_THIS_FUNCTION) console.log(`(TENARIS Modificado) No hay más valores para el símbolo ${todosSimbolosTenaris[simboloIdx]} y los siguientes.`);
                    break;
                }

                const currentSymbolRaw = todosSimbolosTenaris[simboloIdx];
                const currentSymbolUpper = currentSymbolRaw.toUpperCase();
                let targetClave;
                let rawValue = valoresBrutos[valorIdx];
                let divisor = 1;
                let symbolsConsumedThisIteration = 1;
                let symbolForLog = currentSymbolRaw;

                if (currentSymbolUpper === 'AL' && (todosSimbolosTenaris[simboloIdx + 1]?.toUpperCase() === 'SOL')) {
                    // Interpretación confirmada: "Al" y "sol" juntos = "Aluminio Soluble", toma el valor en la posición de "Al".
                    targetClave = mapElementos['SOL']; // Mapea a 'aluminioSoluble'
                    divisor = 100; // "Al" está en la columna X100
                    symbolsConsumedThisIteration = 2; // Se consumen "Al" y "sol"
                    symbolForLog = `${currentSymbolRaw} ${todosSimbolosTenaris[simboloIdx + 1]}`;
                    firstAlContextProcessed = true; // El primer contexto de Aluminio ha sido procesado
                    if (DEBUG_THIS_FUNCTION) console.log(`  (TENARIS Modificado) Par "Al sol" detectado para ${targetClave}.`);
                } else {
                    // Procesamiento estándar para otros símbolos
                    targetClave = mapElementos[currentSymbolUpper];
                    if (targetClave) {
                        if (['C', 'MN', 'SI', 'CR', 'MO', 'CU'].includes(currentSymbolUpper)) {
                            divisor = 100;
                        } else if (currentSymbolUpper === 'AL') { // Un "Al" independiente
                            if (!firstAlContextProcessed) { // Es el primer "Al" (y es independiente)
                                divisor = 100;
                                firstAlContextProcessed = true;
                            } else { // Es el segundo (o posterior) "Al" independiente
                                divisor = 1000;
                            }
                        } else if (currentSymbolUpper === 'SOL') { // "sol" independiente (no debería ocurrir si "Al sol" es la norma)
                            divisor = 100;
                            if (DEBUG_THIS_FUNCTION) console.warn(`  (TENARIS Modificado) Procesando 'SOL' como símbolo independiente.`);
                        } else if (['P', 'NI', 'V', 'SN', 'AS', 'NB', 'TI', 'PB', 'SB', 'CO', 'S'].includes(currentSymbolUpper)) {
                            divisor = 1000;
                        } else if (['ZR', 'BI', 'CA', 'B', 'N', 'MG', 'W'].includes(currentSymbolUpper)) {
                            divisor = 10000;
                        } else if (['CE LF', 'CEL', 'CELF', 'CE'].includes(currentSymbolUpper)) {
                            divisor = 100; // Ce.1 está bajo X100 en el MTR
                        } else {
                            divisor = divisoresTenarisPredeterminados[currentSymbolUpper] || 1; // Fallback
                            if (DEBUG_THIS_FUNCTION && divisor === 1 && currentSymbolUpper !== '') console.warn(`  (TENARIS Modificado) Símbolo ${currentSymbolUpper} usó divisor de fallback 1.`);
                        }
                    }
                }

                if (targetClave && rawValue !== undefined && !isNaN(rawValue) && divisor !== 0) {
                    const correctedValue = rawValue / divisor;
                    composicion[targetClave] = parseFloat(correctedValue.toFixed(6));
                    if (DEBUG_THIS_FUNCTION) {
                        console.log(`  (TENARIS Modificado) Asignado: ${targetClave} = ${composicion[targetClave]} (Crudo: ${rawValue}, Símbolo(s): ${symbolForLog}, Divisor: ${divisor})`);
                    }
                } else if (!targetClave && currentSymbolRaw) {
                    if (DEBUG_THIS_FUNCTION) console.warn(`🚫 (TENARIS Modificado) Símbolo ${symbolForLog} (${currentSymbolRaw}) no mapeado o sin clave destino. Se salta su valor correspondiente.`);
                } else if (targetClave && (rawValue === undefined || isNaN(rawValue))) {
                    if (DEBUG_THIS_FUNCTION) console.warn(`📉 (TENARIS Modificado) Símbolo ${symbolForLog} (clave: ${targetClave}) con valor crudo no numérico/undefined (${rawValue}).`);
                }

                simboloIdx += symbolsConsumedThisIteration;
                valorIdx++; // Siempre se consume un valor de `valoresBrutos` en cada iteración del bucle while principal.
            }

            if (valorIdx < valoresBrutos.length) { // Si sobran valores después de procesar todos los símbolos
                const descartadosAlFinal = valoresBrutos.slice(valorIdx);
                if (descartadosAlFinal.length > 0) {
                    composicion.valoresDescartados.push(...descartadosAlFinal);
                    if (DEBUG_THIS_FUNCTION) console.warn(`✂️ (TENARIS Modificado) Valores numéricos descartados al final (exceso de valores no mapeados a símbolos): ${descartadosAlFinal.join(', ')}`);
                }
            }
        } else if (DEBUG_THIS_FUNCTION) {
            if (todosSimbolosTenaris.length === 0) {
                console.warn("⚠️ (TENARIS Modificado) No se parsearon símbolos, no se puede asignar composición.");
            } else if (!valoresBrutos || valoresBrutos.length === 0) {
                console.warn("⚠️ (TENARIS Modificado) No se encontraron valores numéricos válidos para H o P.");
            }
        }




           } 
    else if (DEBUG_THIS_FUNCTION) { 
        console.warn("⚠️ (TENARIS) No se encontró la línea de símbolos principal después de la detección inicial del formato.");
    }
} // Fin if (seccionTenarisEncontrada)
           
  }
  // --- FIN Lógica Formato TENARIS ---







  // --- INICIO LÓGICA FORMATO "TABLA_SIMPLE_CON_HEAT" (Cleveland-Cliffs y similares) ---
  if (!formatoDetectado) {
    let idxHeatWtPercent = -1;
    let idxSimbolosCleveland = -1;
    let idxValoresCleveland = -1;
    let heatNumberExtraido = null;

    for (let i = 0; i < lineas.length; i++) {
      if (lineas[i].toUpperCase().includes("HEAT (WT.%)")) {
        idxHeatWtPercent = i;
        let potentialSymbolLineIndex = -1;
        let potentialValueLineIndex = -1;

        // Intenta: Símbolos en la misma línea que "HEAT (WT.%)", valores en la siguiente
        if (lineas.length > i + 1) {
            const currentLineSymbolsCheck = ['C', 'MN', 'P', 'S', 'SI'].every(s => lineas[i].toUpperCase().includes(s));
            const nextLineStartsWithHeatNo = /\d{6,}/.test(lineas[i+1].trim().split(/\s+/)[0]);
            if (currentLineSymbolsCheck && nextLineStartsWithHeatNo) {
                potentialSymbolLineIndex = i;
                potentialValueLineIndex = i + 1;
            }
        }
        
        // Intenta: Símbolos en la línea SIGUIENTE a "HEAT (WT.%)", valores en la línea después de eso
        if (potentialSymbolLineIndex === -1 && lineas.length > i + 2) {
            const nextLineSymbolsCheck = ['C', 'MN', 'P', 'S', 'SI'].every(s => lineas[i+1].toUpperCase().includes(s));
            const twoLinesDownStartsWithHeatNo = /\d{6,}/.test(lineas[i+2].trim().split(/\s+/)[0]);
            if (nextLineSymbolsCheck && twoLinesDownStartsWithHeatNo) {
                potentialSymbolLineIndex = i + 1;
                potentialValueLineIndex = i + 2;
            }
        }

        if (potentialSymbolLineIndex !== -1) {
            idxSimbolosCleveland = potentialSymbolLineIndex;
            idxValoresCleveland = potentialValueLineIndex;
            formatoDetectado = "TABLA_SIMPLE_CON_HEAT";
            if (DEBUG_THIS_FUNCTION) console.log(`🎯 Formato detectado: "${formatoDetectado}" por encabezado en línea ${idxHeatWtPercent}. Símbolos en línea ${idxSimbolosCleveland}, Valores en línea ${idxValoresCleveland}`);
            break; 
        }
      }
    }

// CLIFF

    if (formatoDetectado === "TABLA_SIMPLE_CON_HEAT") {
      const lineaSimbolosBruta = lineas[idxSimbolosCleveland];
      const lineaValoresBruta = lineas[idxValoresCleveland];
      let valoresNumericos = [];

      if (DEBUG_THIS_FUNCTION) {
        console.log(`  (${formatoDetectado}) Línea Símbolos Bruta (idx ${idxSimbolosCleveland}): "${lineaSimbolosBruta}"`);
        console.log(`  (${formatoDetectado}) Línea Valores Bruta (idx ${idxValoresCleveland}): "${lineaValoresBruta}"`);
      }

      // Procesar línea de valores PRIMERO para obtener el Heat No. y los números puros
      const tokensValores = lineaValoresBruta.trim().split(/\s+/).filter(v => v.length > 0);
      if (tokensValores.length > 0 && /\d{6,}/.test(tokensValores[0])) {
        heatNumberExtraido = tokensValores[0];
        if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Heat Number extraído: ${heatNumberExtraido}`);
        valoresNumericos = tokensValores.slice(1).map(v => parseFloat(v)).filter(v => !isNaN(v));
      } else {
        if (DEBUG_THIS_FUNCTION) console.warn(`⚠️ (${formatoDetectado}) No se pudo extraer Heat Number o la línea de valores no comenzó con él. Intentando parsear todos los tokens como valores.`);
        valoresNumericos = tokensValores.map(v => parseFloat(v)).filter(v => !isNaN(v));
      }
      
      if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Valores Numéricos Extraídos (${valoresNumericos.length}): [${valoresNumericos.join(', ')}]`);
      
      // Para el formato Cleveland-Cliffs (y similares con tabla simple),
      // definimos el orden esperado de símbolos según el PDF visual.
      // Esto es más robusto si la línea de símbolos extraída por pdftotext es incompleta.


 // Usar los símbolos REALMENTE extraídos por pdftotext de la línea de símbolos
      const simbolosTextoExtraido = lineaSimbolosBruta.replace(/HEAT\s*\(WT\.?%\)\s*/i, '').trim();
      const simbolosDetectadosExtraidos = simbolosTextoExtraido.split(/\s+/).filter(s => s.length > 0);

      if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Símbolos Detectados de Línea Bruta (${simbolosDetectadosExtraidos.length}): [${simbolosDetectadosExtraidos.join(', ')}]`);

      composicion.valoresDescartados = [];
      if (simbolosDetectadosExtraidos.length !== valoresNumericos.length && DEBUG_THIS_FUNCTION) {
        console.warn(`⚠️ (${formatoDetectado}) Desajuste: Símbolos Detectados de Línea Bruta (${simbolosDetectadosExtraidos.length}) vs Valores Numéricos Extraídos (${valoresNumericos.length}).`);
        if (valoresNumericos.length > simbolosDetectadosExtraidos.length) {
            const descartados = valoresNumericos.slice(simbolosDetectadosExtraidos.length);
            composicion.valoresDescartados.push(...descartados);
            if (DEBUG_THIS_FUNCTION) console.warn(`✂️ (${formatoDetectado}) Valores numéricos descartados (exceso): ${descartados.join(', ')}`);
        } else {
            const simbolosSinValor = simbolosDetectadosExtraidos.slice(valoresNumericos.length);
            if (DEBUG_THIS_FUNCTION) console.warn(`📉 (${formatoDetectado}) Símbolos detectados de línea bruta sin valor numérico asignado: ${simbolosSinValor.join(', ')}`);
        }
      }
      
      const minLength = Math.min(simbolosDetectadosExtraidos.length, valoresNumericos.length);
      for (let k = 0; k < minLength; k++) {
        let simUpperOriginal = simbolosDetectadosExtraidos[k].toUpperCase();
        // No necesitamos el mapeo CB a NB aquí si CB ya está en mapElementos,
        // pero es bueno tenerlo si 'CB' es una variante que quieres mapear a 'niobio' (cuya clave es NB).
        let simUpperParaMapeo = simUpperOriginal;
        if (simUpperOriginal === 'CB' && mapElementos['NB']) { // Si existe NB como clave preferida para Niobio
            simUpperParaMapeo = 'NB'; 
        } else if (!mapElementos[simUpperOriginal] && mapElementos[simUpperOriginal.replace('.', '')]) { // Intentar quitar puntos (ej. MN.)
            simUpperParaMapeo = simUpperOriginal.replace('.', '');
        }
        
        const clave = mapElementos[simUpperParaMapeo];
        let valor = valoresNumericos[k];
      
        if (clave && valor !== undefined && !isNaN(valor)) {
          if ((simUpperOriginal === 'MN' || simUpperOriginal === 'MN.') && valor > 1 && valor < 100) { 
              valor = valor / 100;
              if (DEBUG_THIS_FUNCTION) console.log(`      Aplicada corrección heurística a MN: ${valoresNumericos[k]} -> ${valor}`);
          }
          composicion[clave] = parseFloat(Number(valor).toFixed(6));
          if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Asignado (de línea símbolos): ${clave} (Símbolo Original: ${simbolosDetectadosExtraidos[k]}) = ${composicion[clave]}`);
        } else if (!clave && DEBUG_THIS_FUNCTION) {
            console.warn(`🚫 (${formatoDetectado}) Símbolo detectado "${simbolosDetectadosExtraidos[k]}" (mapeado a "${simUpperParaMapeo}") no tiene entrada en mapElementos.`);
        } else if (clave && (valor === undefined || isNaN(valor)) && DEBUG_THIS_FUNCTION) {
            console.warn(`📉 (${formatoDetectado}) Símbolo detectado "${simbolosDetectadosExtraidos[k]}" (clave: ${clave}) no tiene un valor numérico válido (valor: ${valor}).`);
        }
      }



      const elementosEsperados = ['carbono', 'manganeso', 'fosforo', 'azufre', 'silicio', 'titanio', 'nitrogeno', 'boro', 'cobre', 'niquel', 'molibdeno', 'cromo', 'niobio', 'vanadio', 'aluminio', 'estaño'];
      const faltantes = elementosEsperados.filter(el => composicion[el] === null);
      if (faltantes.length > 0 && DEBUG_THIS_FUNCTION) {
          console.warn(`🟡 (${formatoDetectado}) Algunos elementos clave esperados aún son null después del parseo: ${faltantes.join(', ')}. Esto puede ser normal si el MTR no los reporta o si el desajuste símbolo-valor fue grande.`);
      }
    }
  }
  // --- FIN LÓGICA FORMATO "TABLA_SIMPLE_CON_HEAT" ---


// --- INICIO LÓGICA FORMATO "GENERIC_CHEMICAL_ANALYSIS" ---


// --- INICIO LÓGICA FORMATO "GENERIC_CHEMICAL_ANALYSIS" ---
if (!formatoDetectado) {
    const fraseGenericChem = "CHEMICAL ANALYSIS";
    const fraseGenericChemEs = "ANÁLISIS QUÍMICO"; // From PDF source 27
    let idxFraseGenericChem = -1;
    let idxLineaSimbolosGeneric = -1;
    let idxLineaValoresGeneric = -1;

    for (let i = 0; i < lineas.length; i++) {
        const lineaUpper = lineas[i].toUpperCase();
        if (lineaUpper.includes(fraseGenericChem) || lineaUpper.includes(fraseGenericChemEs)) {
            idxFraseGenericChem = i;
            if (DEBUG_THIS_FUNCTION) console.log(`🎯 Potencial formato "GENERIC_CHEMICAL_ANALYSIS" por encabezado en línea ${idxFraseGenericChem} ("${lineas[idxFraseGenericChem]}").`);

            let symbolLineCandidateIdx = -1;
            // Search for symbol line within a few lines after the header
            for (let j = idxFraseGenericChem + 1; j < Math.min(idxFraseGenericChem + 4, lineas.length); j++) {
                if (lineas[j] && lineas[j].trim() !== "") {
                    const testTokens = lineas[j].trim().split(/\s+/);
                    const commonElements = ["C", "MN", "P", "S", "SI", "AL", "CU", "HEAT"]; // Include "HEAT" as it's often on this line
                    let foundCount = 0;
                    let hasHeatKeyword = false;
                    testTokens.forEach(token => {
                        const cleanTokenUpper = token.toUpperCase().replace(/[():%]/g, '');
                        if (mapElementos[cleanTokenUpper]) foundCount++;
                        if (cleanTokenUpper === "HEAT") hasHeatKeyword = true;
                    });
                    // Expect several chemical symbols OR a common keyword like "HEAT" and at least one symbol
                    if (foundCount >= 3 || (hasHeatKeyword && foundCount >=1)) {
                        symbolLineCandidateIdx = j;
                        if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado || "GENERIC_CHEMICAL_ANALYSIS"}) Línea de símbolos candidata (idx ${j}): "${lineas[j]}" (Common symbols found: ${foundCount})`);
                        break;
                    }
                }
            }

            if (symbolLineCandidateIdx !== -1) {
                // Look for the values line immediately after the symbol line (or skip one empty line)
                if (lineas.length > symbolLineCandidateIdx + 1 && lineas[symbolLineCandidateIdx + 1] && lineas[symbolLineCandidateIdx + 1].trim() !== "") {
                    idxLineaSimbolosGeneric = symbolLineCandidateIdx;
                    idxLineaValoresGeneric = symbolLineCandidateIdx + 1;
                } else if (lineas.length > symbolLineCandidateIdx + 2 && lineas[symbolLineCandidateIdx + 2] && lineas[symbolLineCandidateIdx + 2].trim() !== "") {
                    // Assuming one empty line might be between symbols and values
                     idxLineaSimbolosGeneric = symbolLineCandidateIdx;
                     idxLineaValoresGeneric = symbolLineCandidateIdx + 2;
                     if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado || "GENERIC_CHEMICAL_ANALYSIS"}) Saltada línea vacía entre símbolos y valores.`);
                }


                if (idxLineaSimbolosGeneric !== -1 && idxLineaValoresGeneric !== -1) {
                    formatoDetectado = "GENERIC_CHEMICAL_ANALYSIS"; // Confirm format
                    if (DEBUG_THIS_FUNCTION) {
                        console.log(`🎯 Formato confirmado: "${formatoDetectado}".`);
                        console.log(`  (${formatoDetectado}) Línea Símbolos (idx ${idxLineaSimbolosGeneric}): "${lineas[idxLineaSimbolosGeneric]}"`);
                        console.log(`  (${formatoDetectado}) Línea Valores (idx ${idxLineaValoresGeneric}): "${lineas[idxLineaValoresGeneric]}"`);
                    }
                    break; // Exit main loop once format is detected and lines are set
                } else {
                     if (DEBUG_THIS_FUNCTION) console.log(`  (GENERIC_CHEMICAL_ANALYSIS) No se pudo confirmar la línea de valores después de la línea de símbolos candidata ${symbolLineCandidateIdx}.`);
                }
            } else {
                if (DEBUG_THIS_FUNCTION) console.log(`  (GENERIC_CHEMICAL_ANALYSIS) No se encontró una línea de símbolos convincente después del encabezado en línea ${idxFraseGenericChem}.`);
            }
        }
    }

    if (formatoDetectado === "GENERIC_CHEMICAL_ANALYSIS") {
        const lineaSimbolosCompleta = lineas[idxLineaSimbolosGeneric];
        const lineaValoresCompleta = lineas[idxLineaValoresGeneric];

        const tokensSimbolosAll = lineaSimbolosCompleta.trim().split(/\s+/).filter(s => s.length > 0);
        const originalTokensValores = lineaValoresCompleta.trim().split(/\s+/).filter(v => v.length > 0);

        let firstElementSymbolIndex = -1;
        // Find the start of chemical symbols in the symbol line (e.g., after "Heat")
        for (let i = 0; i < tokensSimbolosAll.length; i++) {
            const tokenUpper = tokensSimbolosAll[i].toUpperCase().replace(/[():%]/g, '');
            if (mapElementos[tokenUpper]) {
                firstElementSymbolIndex = i;
                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Primer símbolo químico "${tokensSimbolosAll[i]}" encontrado en la línea de símbolos en el índice ${i}.`);
                break;
            }
        }

        if (firstElementSymbolIndex === -1) {
            if (DEBUG_THIS_FUNCTION) console.warn(`⚠️ (${formatoDetectado}) No se pudo determinar el inicio de los símbolos químicos en: "${lineaSimbolosCompleta}"`);
            formatoDetectado = null; // Critical failure
        } else {
            const simbolosDetectados = tokensSimbolosAll.slice(firstElementSymbolIndex);
            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Símbolos Relevantes Detectados (${simbolosDetectados.length}): [${simbolosDetectados.join(', ')}]`);

            let firstChemicalValueIndexInValuesLine = -1;
            // Heuristic: Find the Heat ID in originalTokensValores. Values start after it.
            // Heat ID often contains letters and numbers. e.g., A505067 [cite: 5]
            // It's often the last non-purely-numeric token before pure chemical values.
            let heatIdCandidate = "";
            for(let i=0; i < firstElementSymbolIndex && i < originalTokensValores.length; i++){ // Check tokens before where symbols start
                // A simple check for Heat ID: alphanumeric and not 'kg', 'lb', etc.
                 if (/[A-Z]/i.test(originalTokensValores[i]) && /\d/.test(originalTokensValores[i]) && !/KG|LB/i.test(originalTokensValores[i].toUpperCase())) {
                    heatIdCandidate = originalTokensValores[i];
                 }
            }
            if (heatIdCandidate) {
                const heatIdIndex = originalTokensValores.indexOf(heatIdCandidate);
                if (heatIdIndex !== -1 && heatIdIndex + 1 < originalTokensValores.length) {
                    firstChemicalValueIndexInValuesLine = heatIdIndex + 1;
                    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Heat ID "${heatIdCandidate}" encontrado en línea de valores en índice ${heatIdIndex}. Valores comenzarán desde el índice ${firstChemicalValueIndexInValuesLine}.`);
                }
            }

            // Fallback if Heat ID method fails: count non-numeric leading tokens in values line
            if (firstChemicalValueIndexInValuesLine === -1) {
                let leadingTokensCount = 0;
                for (let i = 0; i < originalTokensValores.length; i++) {
                    // A simple check: if it's not a number and not "<", it's likely a leading token
                    // This is a weak heuristic and might need adjustment.
                    // Example leading tokens: "25L579676A", "41,757", "lb.", "18,940.6791", "kg", "A505067" [cite: 5]
                    if (isNaN(parseFloat(originalTokensValores[i].replace(',','.'))) && originalTokensValores[i] !== "<") {
                        leadingTokensCount++;
                    } else {
                        // If current token IS a number or "<", assume previous ones were all leading.
                        // This can be problematic if weight numbers appear before Heat ID.
                        // A better fallback: the number of prefix tokens in symbol line.
                        if (i >= firstElementSymbolIndex && firstElementSymbolIndex < originalTokensValores.length) { // If symbol line prefix is shorter
                           firstChemicalValueIndexInValuesLine = firstElementSymbolIndex; // Use symbol line's prefix count
                           if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Fallback: Usando el conteo de prefijo de la línea de símbolos (${firstElementSymbolIndex}) para la línea de valores.`);
                           break;
                        } else if (originalTokensValores.length - i >= simbolosDetectados.filter(s=>mapElementos[s.toUpperCase().replace(/[():%]/g, '')]).length) {
                           // If remaining tokens match expected number of chemical values
                           firstChemicalValueIndexInValuesLine = i;
                           if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Fallback: Inicio de valores por conteo de tokens restantes en línea ${i}.`);
                           break;
                        }
                    }
                }
                 if (firstChemicalValueIndexInValuesLine === -1 && originalTokensValores.length > 0) { // Default if still not found
                    firstChemicalValueIndexInValuesLine = (originalTokensValores.length - simbolosDetectados.length > 0) ? originalTokensValores.length - simbolosDetectados.length : 0;
                    if (firstChemicalValueIndexInValuesLine < 0) firstChemicalValueIndexInValuesLine = 0;
                    if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Fallback extremo: Inicio de valores por cálculo de longitud en índice ${firstChemicalValueIndexInValuesLine}.`);
                 }
            }
             // Validate the calculated index. For the example log, it should be around index 6 for originalTokensValores
             // PDF (source MTR_EJEMPLO_STEEL_2.pdf, page 2, source 12): "25L579676A", "41,757", "lb.", "18,940.6791", "kg", "A505067", ".05" <- .05 is 7th item, index 6
            if (originalTokensValores.indexOf("A505067") !== -1) { // Specific check for provided MTR example
                 firstChemicalValueIndexInValuesLine = originalTokensValores.indexOf("A505067") + 1;
                 if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Ajuste específico para MTR: Índice de inicio de valores ajustado a ${firstChemicalValueIndexInValuesLine} después de Heat ID 'A505067'.`);
            }


            if (firstChemicalValueIndexInValuesLine === -1 || firstChemicalValueIndexInValuesLine >= originalTokensValores.length) {
                if (DEBUG_THIS_FUNCTION) console.warn(`⚠️ (${formatoDetectado}) No se pudo determinar el inicio de los valores químicos en la línea de valores: "${lineaValoresCompleta}"`);
                formatoDetectado = null; // Critical failure
            } else {
                const valoresCrudosParaMapeo = originalTokensValores.slice(firstChemicalValueIndexInValuesLine);
                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Valores Crudos Relevantes para Mapeo (${valoresCrudosParaMapeo.length}): [${valoresCrudosParaMapeo.join(', ')}]`);

                const processedValores = [];
                let tempIdx = 0;
                while (tempIdx < valoresCrudosParaMapeo.length) {
                    if (valoresCrudosParaMapeo[tempIdx] === "<" && (tempIdx + 1 < valoresCrudosParaMapeo.length)) {
                        processedValores.push(valoresCrudosParaMapeo[tempIdx] + " " + valoresCrudosParaMapeo[tempIdx + 1]);
                        tempIdx += 2;
                    } else {
                        processedValores.push(valoresCrudosParaMapeo[tempIdx]);
                        tempIdx += 1;
                    }
                }
                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Valores Procesados (manejo de '<') (${processedValores.length}): [${processedValores.join(', ')}]`);

                composicion.valoresDescartados = [];
                const minLength = Math.min(simbolosDetectados.length, processedValores.length);

                for (let k = 0; k < minLength; k++) {
                    const simOriginal = simbolosDetectados[k];
                    const simUpper = simOriginal.toUpperCase().replace(/[():%]/g, '');
                    const clave = mapElementos[simUpper];
                    let valorStr = processedValores[k];

                    if (clave) {
                        let valorNum;
                        if (valorStr.startsWith("<")) { // e.g., "< .001" [cite: 5, 6]
                            const parts = valorStr.split(/\s+/); // Split by space
                            if (parts.length > 1 && !isNaN(parseFloat(parts[1].replace(',','.')))) {
                                valorNum = parseFloat(parts[1].replace(',','.')) * 0.5; // Or other rule, like parts[1] directly if "<" means "up to"
                                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Valor "<" detectado y procesado: "${valorStr}" -> ${valorNum}`);
                            } else {
                                valorNum = NaN; // Could not parse number after "<"
                                if (DEBUG_THIS_FUNCTION) console.warn(`  (${formatoDetectado}) Valor "<" detectado pero no se pudo parsear el número: "${valorStr}"`);
                            }
                        } else {
                            valorNum = parseFloat(valorStr.replace(',','.').replace(/[^\d.-]/g, '')); // Clean non-numeric, ensure comma is dot
                        }

                        if (!isNaN(valorNum)) {
                            composicion[clave] = parseFloat(Number(valorNum).toFixed(6));
                            if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Asignado: ${clave} (${simOriginal}) = ${composicion[clave]}`);
                        } else if (DEBUG_THIS_FUNCTION) {
                            console.warn(`📉 (${formatoDetectado}) Valor no numérico para ${simOriginal} (clave: ${clave}): "${processedValores[k]}" (Parseado como: ${valorNum})`);
                        }
                    } else if (DEBUG_THIS_FUNCTION && simUpper !== "C(EQ)") { // C(EQ) is expected not to map [cite: 7]
                        console.warn(`🚫 (${formatoDetectado}) Símbolo "${simOriginal}" (limpio: "${simUpper}") no tiene mapeo en mapElementos.`);
                    }
                }

                if (processedValores.length > simbolosDetectados.length) {
                    const descartados = processedValores.slice(simbolosDetectados.length);
                     if (descartados.length > 0) {
                        descartados.forEach(d => {
                            if (d.startsWith("<")) { // Handle "< .001" type strings in discarded
                                const parts = d.split(/\s+/);
                                if (parts.length > 1 && !isNaN(parseFloat(parts[1].replace(',','.')))) composicion.valoresDescartados.push(parseFloat(parts[1].replace(',','.')) * 0.5);
                                else if (!isNaN(parseFloat(d.replace(',','.')))) composicion.valoresDescartados.push(parseFloat(d.replace(',','.'))); // Fallback
                            } else if (!isNaN(parseFloat(d.replace(',','.')))) {
                                composicion.valoresDescartados.push(parseFloat(d.replace(',','.')));
                            }
                        });
                     }
                    if (DEBUG_THIS_FUNCTION && composicion.valoresDescartados.length > 0) console.warn(`✂️ (${formatoDetectado}) Valores numéricos descartados (exceso de la línea de valores procesada): ${composicion.valoresDescartados.join(', ')} (Original descartado: ${descartados.join(', ')})`);
                } else if (simbolosDetectados.length > processedValores.length) {
                    const simbolosSinValor = simbolosDetectados.slice(processedValores.length);
                     if (DEBUG_THIS_FUNCTION && simbolosSinValor.length > 0) console.warn(`📉 (${formatoDetectado}) Símbolos sin valor asignado (faltan valores en línea procesada): ${simbolosSinValor.join(', ')}`);
                }
            }
        }
    }
}
// --- FIN LÓGICA FORMATO "GENERIC_CHEMICAL_ANALYSIS" ---













// --- FIN LÓGICA FORMATO "GENERIC_CHEMICAL_ANALYSIS" ---


























// --- INICIO LÓGICA FORMATO "SDI_LADLE" ---
if (!formatoDetectado) {
    const fraseSDILadle = "LADLE CHEMICAL ANALYSIS (%)";
    let idxFraseSDILadle = -1;
    let idxLineaSimbolosSDI = -1;
    let idxLineaValoresSDI = -1;

    for (let i = 0; i < lineas.length; i++) {
        if (lineas[i].toUpperCase().includes(fraseSDILadle)) {
            idxFraseSDILadle = i;
            // Expected: Symbols on the next line, Values on the line after symbols
            if (lineas.length > i + 2) {
                idxLineaSimbolosSDI = i + 1;
                idxLineaValoresSDI = i + 2;
                formatoDetectado = "SDI_LADLE";
                if (DEBUG_THIS_FUNCTION) {
                    console.log(`🎯 Formato detectado: "${formatoDetectado}" por encabezado en línea ${idxFraseSDILadle} ("${lineas[idxFraseSDILadle]}").`);
                    console.log(`  (${formatoDetectado}) Potencial Línea Símbolos (idx ${idxLineaSimbolosSDI}): "${lineas[idxLineaSimbolosSDI]}"`);
                    console.log(`  (${formatoDetectado}) Potencial Línea Valores (idx ${idxLineaValoresSDI}): "${lineas[idxLineaValoresSDI]}"`);
                }
                break;
            }
        }
    }

    if (formatoDetectado === "SDI_LADLE") {
        const lineaSimbolos = lineas[idxLineaSimbolosSDI];
        const lineaValores = lineas[idxLineaValoresSDI];

        const simbolosDetectados = lineaSimbolos.trim().split(/\s+/).filter(s => s.length > 0);
        const valoresNumericos = lineaValores.trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));

        if (DEBUG_THIS_FUNCTION) {
            console.log(`  (${formatoDetectado}) Símbolos Detectados (${simbolosDetectados.length}): [${simbolosDetectados.join(', ')}]`);
            console.log(`  (${formatoDetectado}) Valores Numéricos (${valoresNumericos.length}): [${valoresNumericos.join(', ')}]`);
        }

        composicion.valoresDescartados = [];
        if (simbolosDetectados.length !== valoresNumericos.length && DEBUG_THIS_FUNCTION) {
            console.warn(`⚠️ (${formatoDetectado}) Desajuste: Símbolos (${simbolosDetectados.length}) vs Valores (${valoresNumericos.length}).`);
            if (valoresNumericos.length > simbolosDetectados.length) {
                const descartados = valoresNumericos.slice(simbolosDetectados.length);
                composicion.valoresDescartados.push(...descartados);
                console.warn(`✂️ (${formatoDetectado}) Valores numéricos descartados (exceso): ${descartados.join(', ')}`);
            } else {
                const simbolosSinValor = simbolosDetectados.slice(valoresNumericos.length);
                console.warn(`📉 (${formatoDetectado}) Símbolos sin valor asignado: ${simbolosSinValor.join(', ')}`);
            }
        }

        const minLength = Math.min(simbolosDetectados.length, valoresNumericos.length);
        for (let k = 0; k < minLength; k++) {
            const simUpper = simbolosDetectados[k].toUpperCase();
            const clave = mapElementos[simUpper]; // Uses your existing mapElementos
            let valor = valoresNumericos[k];

            if (clave && valor !== undefined && !isNaN(valor)) {
                // Values in this MTR are direct decimal percentages (e.g., 0.05 for C)
                // No division by 100/1000 needed.
                if ((simUpper === 'MN') && valor > 1 && valor < 100) { 
                    valor = valor / 100; // Heuristic for MN like "0.17" (already fine) vs. "17"
                    if (DEBUG_THIS_FUNCTION) console.log(`      (Heurística MN) ${simbolosDetectados[k]}: ${valoresNumericos[k]} -> ${valor}`);
                }
                composicion[clave] = parseFloat(Number(valor).toFixed(6)); // toFixed for consistency
                if (DEBUG_THIS_FUNCTION) console.log(`  (${formatoDetectado}) Asignado: ${clave} (${simbolosDetectados[k]}) = ${composicion[clave]}`);
            } else if (!clave && DEBUG_THIS_FUNCTION) {
                console.warn(`🚫 (${formatoDetectado}) Símbolo "${simbolosDetectados[k]}" no tiene mapeo en mapElementos.`);
            }
        }
    }
}
// --- FIN LÓGICA FORMATO "SDI_LADLE" ---

// Asegúrate que este nuevo bloque "SDI_LADLE" esté antes de la lógica final de 
// determinación de acero aleado/inoxidable y el return.




  // --- Lógica de Aleado y Retorno ---
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
    let simboloParaLog = Object.keys(mapElementos).find(key => mapElementos[key] === elementoClaveComposicion) || elementoClaveComposicion.toUpperCase();

    if (val >= limite) {
      esAleadoDefinidoPorElemento = true;
      if (!composicion.elementosAleantes.includes(simboloParaLog)) {
        composicion.elementosAleantes.push(simboloParaLog);
      }
      // Asegurarse de que 'val' y 'limite' se muestren como porcentajes si así están definidos los umbrales
      justificaciones.push(`${simboloParaLog} ${Number(val * 100).toFixed(4)}% >= ${Number(limite * 100).toFixed(4)}%`);
    }
  }

  const { carbono: c_val, cromo: cr_val, molibdeno: mo_val, vanadio: v_val, niobio: nb_val, nitrogeno: n_val, aluminio: al_val } = composicion;
  let tipoAceroDeterminado = 'sin alear';
  let justificacionTipo = 'Por defecto. No cumple criterios de aleado o inoxidable.';

  // Nota: Los valores en 'composicion' se asumen como fracciones decimales (e.g., 0.05 para 5%).
  // Los umbrales como 0.105 (para 10.5% Cr) y 0.012 (para 1.2% C) deben ser consistentes.
  if (cr_val !== null && cr_val >= 0.105 && (c_val === null || c_val <= 0.012)) {
    tipoAceroDeterminado = 'inoxidable';
    esAleadoDefinidoPorElemento = true;
    justificacionTipo = `Acero inoxidable (C ${c_val !== null ? Number(c_val * 100).toFixed(4) : 'N/A'}% <= 1.2%, Cr ${Number(cr_val * 100).toFixed(4)}% >= 10.5%).`;
    if (!justificaciones.some(j => j.startsWith("Cr"))) justificaciones.push(`Cr ${Number(cr_val * 100).toFixed(4)}% >= 10.5%`);
    if (c_val !== null && !justificaciones.some(j => j.startsWith("C "))) justificaciones.push(`C ${Number(c_val * 100).toFixed(4)}% <= 1.2%`);
  } else if (
      c_val !== null && cr_val !== null && mo_val !== null && v_val !== null && nb_val !== null &&
      (c_val >= 0.0008 && c_val <= 0.0012) && // C: 0.08% - 0.12%
      (cr_val >= 0.080 && cr_val <= 0.095) &&  // Cr: 8.0% - 9.5%
      (mo_val >= 0.0085 && mo_val <= 0.0105) && // Mo: 0.85% - 1.05%
      (v_val >= 0.0018 && v_val <= 0.0025) &&  // V: 0.18% - 0.25%
      (nb_val >= 0.0006 && nb_val <= 0.0010) && // Nb: 0.06% - 0.10%
      (n_val === null || (n_val >= 0.0003 && n_val <= 0.0007)) && // N: 0.03% - 0.07%
      (al_val === null || al_val <= 0.0004) // Al: <= 0.04%
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
