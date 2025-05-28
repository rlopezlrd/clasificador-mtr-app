// determinarFraccionFinal.js

const DEBUG = process.env.DEBUG === 'true';

function clasificarTubo7304(props, subpartidaInput) {
  if (!((props.partida || '').startsWith('7304')) || !((props.costura || '').toLowerCase().includes('sin'))) {
    if (DEBUG) console.log('DEBUG (7304): No es partida 7304 o no es sin costura. Retornando null.');
    return null;
  }

  const norma = (props.norma || '').replace(/\s+/g, '').toLowerCase();
  const tipoAceroOriginal = (props.tipoAcero || '').toLowerCase();
  const usoTecnico = (props.usoTecnico || '').toLowerCase();
  const procesoLaminado = (props.procesoLaminado || '').toLowerCase();
  const esRealmenteAleado = props.aleado === true;
  const descripcion = (props.descripcion || '').toLowerCase();
  const observaciones = (props.observaciones || '').toLowerCase();
  const esInoxidable = tipoAceroOriginal.includes('inoxidable');
  const esAleadoNoInox = esRealmenteAleado && !esInoxidable;
  const esNoAleado = !esRealmenteAleado && !esInoxidable;
  const diametroExterior = props.diametroExterior || 0;
  const espesorPared = props.espesorPared || 0;
  const textoGeneral = `${descripcion} ${norma} ${usoTecnico} ${observaciones} ${props.tipoProducto || ''} ${tipoAceroOriginal}`;

  let proceso = '';
  if (['frio', 'estirado en frio', 'estirado', 'laminado en frio'].includes(procesoLaminado)) proceso = 'frio';
  else if (['caliente', 'laminado en caliente'].includes(procesoLaminado)) proceso = 'caliente';

  if (DEBUG) {
    console.log('DEBUG (7304): === Inicio clasificarTubo7304 ===');
    console.log('DEBUG (7304): Subpartida Input:', subpartidaInput);
    console.log('DEBUG (7304): Props Relevantes:', {
      normaOriginal: props.norma, tipoAceroOriginal, procesoLaminado, esRealmenteAleado,
      esInoxidable, esAleadoNoInox, esNoAleado, usoTecnico, proceso, diametroExterior, espesorPared
    });
    console.log('DEBUG (7304): Texto General para búsqueda:', textoGeneral.substring(0,200));
  }

  const esTuboPetroleoGas = /casing|tubing|perforaci[oó]n|drill\s*pipe|api\s*5ct|api\s*5dp|api\s*5l|petrol[eí]fero|gasoducto|oleoducto|line\s*pipe/i.test(textoGeneral);
  if (DEBUG) console.log('DEBUG (7304): esTuboPetroleoGas:', esTuboPetroleoGas);

  // --- LÓGICA PARA TUBOS DE PETRÓLEO/GAS ---
  if (esTuboPetroleoGas) {
    // ... (Lógica para Petróleo/Gas se mantiene igual que en la respuesta #17)
    if (DEBUG) console.log('DEBUG (7304): Entró en lógica de Tubo Petróleo/Gas');
    if (esInoxidable) {
        if (DEBUG) console.log('DEBUG (7304): Es Inoxidable (Petróleo/Gas)');
        if (subpartidaInput === '730411') {
            if (proceso === 'frio') return { fraccion: '73041104', justificacion: 'Tubo s/c inoxidable, Line Pipe, estirado/laminado en frío (7304.11).' };
            if (descripcion.includes('semiterminado') || descripcion.includes('esbozo')) return { fraccion: '73041199', nico: '01', justificacion: 'Tubo s/c inoxidable, Line Pipe, semiterminado/esbozo (7304.11).' };
            return { fraccion: '73041199', justificacion: 'Tubo s/c inoxidable, Line Pipe (no frío, no semiterminado) (7304.11).' };
        }
        if (subpartidaInput === '730422') {
            if (props.tipoProducto?.toLowerCase().includes('drill pipe') && (descripcion.includes('roscado') || norma.includes('api5dp'))) return { fraccion: '73042204', nico: '01', justificacion: 'Tubo s/c inoxidable, Drill Pipe roscado (7304.22).' };
            return { fraccion: '73042204', justificacion: 'Tubo s/c inoxidable, para perforación (casing/tubing/drill pipe) (7304.22).' };
        }
        if (subpartidaInput === '730424') {
            return { fraccion: '73042491', justificacion: 'Tubo s/c inoxidable, para perforación (casing/tubing), los demás (7304.24).' };
        }
        if (proceso === 'frio') return { fraccion: '73041104', justificacion: 'Tubo s/c inoxidable, Line Pipe, estirado/laminado en frío (fallback petróleo/gas).' };
        return { fraccion: '73041199', justificacion: 'Tubo s/c inoxidable, Line Pipe (fallback petróleo/gas, no frío).' };
    }
    else if (esAleadoNoInox) {
        if (DEBUG) console.log('DEBUG (7304): Es Aleado No Inox (Petróleo/Gas)');
        if (subpartidaInput === '730419' || subpartidaInput === '730423' || subpartidaInput === '730429') {
            if (props.tipoProducto?.toLowerCase().includes('drill pipe')) return { fraccion: '73042304', justificacion: 'Tubo s/c aleado (no inox), Drill Pipe (7304.23).' };
            if (norma.includes('api5l')) return { fraccion: '73041901', justificacion: 'Tubo s/c aleado (no inox), Line Pipe API 5L (7304.19), NICO por diámetro.'};
            return { fraccion: '73042999', justificacion: 'Tubo s/c aleado (no inox), uso petróleo/gas (casing/tubing) (7304.29).' };
        }
        return { fraccion: '73042999', justificacion: 'Tubo s/c aleado (no inox), uso petróleo/gas (fallback general).' };
    }
    else if (esNoAleado) {
        if (DEBUG) console.log('DEBUG (7304): Es No Aleado (Petróleo/Gas)');
        if (subpartidaInput === '730419') {
            if (diametroExterior < 60.3) return { fraccion: '73041901', nico: '01', justificacion: 'Tubo s/c no aleado, Line Pipe, Ø < 60.3 mm (7304.19).' };
            if (descripcion.includes('semiterminado') || descripcion.includes('esbozo')) return { fraccion: '73041905', justificacion: 'Tubo s/c no aleado, Line Pipe, semiterminado/esbozo (7304.19).' };
            return { fraccion: '73041999', justificacion: 'Tubo s/c no aleado, Line Pipe, los demás (7304.19).' };
        }
        if (subpartidaInput === '730429') {
             return { fraccion: '73042999', justificacion: 'Tubo s/c no aleado, para perforación (casing/tubing) (7304.29).'};
        }
        return { fraccion: '73041999', justificacion: 'Tubo s/c no aleado, uso petróleo/gas (fallback general).' };
    }
  }
  // --- LÓGICA PARA LOS DEMÁS TUBOS (NO OIL/GAS) ---
  else {
    if (DEBUG) console.log('DEBUG (7304): No es tubo de Petróleo/Gas. Entrando en "Los demás Tubos" lógica.');
    if (esInoxidable) {
        // ... (Lógica para Inoxidable NO Oil/Gas se mantiene igual)
        if (DEBUG) console.log('DEBUG (7304): Es Inoxidable (no oil/gas)');
        if (subpartidaInput === '730441') {
            if (descripcion.includes("serpentin")) return { fraccion: '73044103', nico: '01', justificacion: 'Tubo s/c inoxidable, serpentín, frío (no oil/gas) (7304.41).' };
            if (diametroExterior > 0 && diametroExterior < 19) return { fraccion: '73044103', nico: '02', justificacion: 'Tubo s/c inoxidable, Ø < 19mm, frío (no oil/gas) (7304.41).' };
            return { fraccion: '73044103', justificacion: 'Tubo s/c inoxidable, estirado/laminado en frío (no oil/gas) (7304.41).' };
        }
        if (subpartidaInput === '730449') {
             if (descripcion.includes("serpentin")) return { fraccion: '73044999', nico: '01', justificacion: 'Tubo s/c inoxidable, serpentín (no frío, no oil/gas) (7304.49).' };
            return { fraccion: '73044999', justificacion: 'Tubo s/c inoxidable, no estirado/laminado en frío (no oil/gas) (7304.49).' };
        }
        if (proceso === 'frio') return { fraccion: '73044103', justificacion: 'Tubo s/c inoxidable, frío (no oil/gas, fallback general).' };
        return { fraccion: '73044999', justificacion: 'Tubo s/c inoxidable, no frío (no oil/gas, fallback general).' };
    }
    else if (esAleadoNoInox) {
      if (DEBUG) console.log(`DEBUG (7304): Es Aleado No Inox (no oil/gas). Proceso: ${proceso}, Subpartida Input: ${subpartidaInput}`);
      if (subpartidaInput === '730451') { // Aleado, Frío
          if (usoTecnico.includes("mecanico") || usoTecnico.includes("estructural")) return { fraccion: '73045112', nico: '01', justificacion: 'Tubo s/c aleado (no inox), uso mecánico/estructural, frío (no oil/gas) (7304.51).' };
          return { fraccion: '73045112', justificacion: 'Tubo s/c aleado (no inox), estirado/laminado en frío (no oil/gas) (7304.51).' };
      }
      if (subpartidaInput === '730459') { // Aleado, No Frío (es decir, Caliente)
        if (DEBUG) console.log('DEBUG (7304): Subpartida 7304.59 (Aleado, Caliente). Evaluando NICOs...');

        // NICO 13: Para Calderas (ASTM A335, u otros para caldera)
        if (norma.includes('a335') || usoTecnico.includes('termico_caldera') || textoGeneral.includes('boiler') || textoGeneral.includes('caldera')) {
            if (DEBUG) console.log('DEBUG (7304): 7304.59 - NICO 13 (Caldera/A335).');
            return { fraccion: '73045999', nico: '13', justificacion: 'Tubo s/c aleado (no inox), para calderas/alta temperatura (e.g. A335) (7304.59).' };
        }
        // NICO para ASTM A333 (Servicio a Baja Temperatura, aleado por Ni Gr.6) -> Debería ser "Los demás" o un NICO de conducción/térmico
        if (norma.includes('a333')) {
            if (DEBUG) console.log('DEBUG (7304): 7304.59 - Norma A333 detectada.');
            // Verificar si califica como "térmico" o "de conducción" por sus dimensiones para A333
            // NICO 09: Térmicos, DE > 114.3 a 406.4 mm, EP >= 6.35 a 38.1 mm
            if ((usoTecnico.includes('termico') || textoGeneral.includes('low temperature service')) && (diametroExterior > 114.3 && diametroExterior <= 406.4 && espesorPared >= 6.35 && espesorPared <= 38.1)) {
                if (DEBUG) console.log('DEBUG (7304): 7304.59 - NICO 09 (Térmico A333).');
                return { fraccion: '73045999', nico: '09', justificacion: 'Tubo s/c aleado (no inox), térmico (e.g. A333 baja temp.), DE >114.3-406.4mm (7304.59).' };
            }
            // NICO 10: Conducción, DE > 114.3 a 406.4 mm, EP >= 6.35 a 38.1 mm
            if ((usoTecnico.includes('conduccion') || textoGeneral.includes('low temperature service') || textoGeneral.includes('pipe for low temperature')) && (diametroExterior > 114.3 && diametroExterior <= 406.4 && espesorPared >= 6.35 && espesorPared <= 38.1)) {
                 if (DEBUG) console.log('DEBUG (7304): 7304.59 - NICO 10 (Conducción A333).');
                return { fraccion: '73045999', nico: '10', justificacion: 'Tubo s/c aleado (no inox), de conducción (e.g. A333 baja temp.), DE >114.3-406.4mm (7304.59).' };
            }
            if (DEBUG) console.log('DEBUG (7304): 7304.59 - NICO 99 (A333, Los demás).');
            return { fraccion: '73045999', nico: '99', justificacion: 'Tubo s/c aleado (no inox), para baja temperatura (e.g. A333), los demás (7304.59).' };
        }

        // NICO para Tubos Aletados o con Birlos (esto es una fracción diferente, 7304.59.09)
        if (/\baleta|birlo\b/.test(textoGeneral)) {
            if (DEBUG) console.log('DEBUG (7304): 7304.59.09 - NICO para Aletados/Birlos.');
            return { fraccion: '73045909', nico: '00', justificacion: 'Tubo s/c aleado (no inox), con aletas o birlos (7304.59.09).' }; // NICO '00' para esta fracción usualmente
        }

        // NICOs para Mecánicos o Estructurales (7304.59.99.01, .02, .14)
        if (usoTecnico.includes("mecanico") || usoTecnico.includes("estructural")) {
            if (DEBUG) console.log('DEBUG (7304): 7304.59 - Uso Mecánico/Estructural detectado.');
            if (diametroExterior <= 114.3 && espesorPared >= 4 && espesorPared <= 19.5) {
                return { fraccion: '73045999', nico: '01', justificacion: 'Tubo s/c aleado (no inox), mecánico/estructural, DE ≤114.3mm, EP 4-19.5mm (7304.59).' };
            }
            if (diametroExterior > 114.3 && diametroExterior <= 355.6 && espesorPared >= 6.35 && espesorPared <= 38.1) {
                return { fraccion: '73045999', nico: '02', justificacion: 'Tubo s/c aleado (no inox), mecánico/estructural, DE >114.3-355.6mm, EP 6.35-38.1mm (7304.59).' };
            }
            if (diametroExterior > 355.6 && diametroExterior <= 550.0) { // Cualquier espesor para este NICO
                return { fraccion: '73045999', nico: '14', justificacion: 'Tubo s/c aleado (no inox), mecánico/estructural, DE >355.6-550mm (7304.59).' };
            }
        }
        
        // NICOs para Barras Huecas (7304.59.99.04, .05)
        if (usoTecnico.includes("barra hueca") || descripcion.includes("barra hueca")) {
            if ((diametroExterior > 30 && diametroExterior <= 50) || diametroExterior > 300) {
                 return { fraccion: '73045999', nico: '04', justificacion: 'Tubo s/c aleado (no inox), barra hueca DE >30-50mm o >300mm (7304.59).' };
            }
            if (diametroExterior > 50 && diametroExterior <= 300) {
                 return { fraccion: '73045999', nico: '05', justificacion: 'Tubo s/c aleado (no inox), barra hueca DE >50-300mm (7304.59).' };
            }
        }
        // NICO para Semielaborados (7304.59.99.06)
        if (descripcion.includes('semiterminado') || descripcion.includes('esbozo')) {
            // Dimensiones: DE >= 20 a <= 460 mm, EP >= 2.8 a <= 35.4 mm
            if (diametroExterior >= 20 && diametroExterior <= 460 && espesorPared >= 2.8 && espesorPared <= 35.4) {
                return { fraccion: '73045999', nico: '06', justificacion: 'Tubo s/c aleado (no inox), semielaborado/esbozo (7304.59).' };
            }
        }

        // NICOs para Térmicos o Conducción NO A333 y con dimensiones específicas (7304.59.99.07 a .12)
        // Esta lógica necesita que `usoTecnico` sea 'termico' o 'conduccion' explícitamente.
        if (usoTecnico.includes('termico') && !norma.includes('a333')) { // Evitar doble conteo con A333
            if (diametroExterior <= 114.3 && espesorPared >= 4 && espesorPared <= 19.5) return { fraccion: '73045999', nico: '07', justificacion: 'Tubo s/c aleado (no inox), térmico, DE ≤114.3mm, EP 4-19.5mm (7304.59).' };
            if (diametroExterior > 114.3 && diametroExterior <= 406.4 && espesorPared >= 6.35 && espesorPared <= 38.1) return { fraccion: '73045999', nico: '09', justificacion: 'Tubo s/c aleado (no inox), térmico, DE >114.3-406.4mm, EP 6.35-38.1mm (7304.59).' };
            if (diametroExterior > 406.4 && espesorPared >= 9.52 && espesorPared <= 31.75) return { fraccion: '73045999', nico: '11', justificacion: 'Tubo s/c aleado (no inox), térmico, DE >406.4mm, EP 9.52-31.75mm (7304.59).' };
        }
        if (usoTecnico.includes('conduccion') && !norma.includes('a333')) { // Evitar doble conteo con A333
            if (diametroExterior <= 114.3 && espesorPared >= 4 && espesorPared <= 19.5) return { fraccion: '73045999', nico: '08', justificacion: 'Tubo s/c aleado (no inox), conducción, DE ≤114.3mm, EP 4-19.5mm (7304.59).' };
            if (diametroExterior > 114.3 && diametroExterior <= 406.4 && espesorPared >= 6.35 && espesorPared <= 38.1) return { fraccion: '73045999', nico: '10', justificacion: 'Tubo s/c aleado (no inox), conducción, DE >114.3-406.4mm, EP 6.35-38.1mm (7304.59).' };
            if (diametroExterior > 406.4 && espesorPared >= 9.52 && espesorPared <= 31.75) return { fraccion: '73045999', nico: '12', justificacion: 'Tubo s/c aleado (no inox), conducción, DE >406.4mm, EP 9.52-31.75mm (7304.59).' };
        }

        // NICOs residuales por dimensiones para 7304.59.99 (.91, .92)
        if (diametroExterior >= 38.1 && diametroExterior <= 406.4 && espesorPared > 12.7) {
             return { fraccion: '73045999', nico: '91', justificacion: 'Tubo s/c aleado (no inox), DE 38.1-406.4mm, EP >12.7mm (7304.59).' };
        }
        if (diametroExterior >= 38.1 && diametroExterior <= 114.3 && espesorPared > 6.4 && espesorPared <= 12.7) {
             return { fraccion: '73045999', nico: '92', justificacion: 'Tubo s/c aleado (no inox), DE 38.1-114.3mm, EP >6.4-12.7mm (7304.59).' };
        }

        if (DEBUG) console.log('DEBUG (7304): 7304.59 - Fallback NICO 99 para aleado no inox, no frío, sin criterios NICO específicos.');
        return { fraccion: '73045999', nico: '99', justificacion: 'Tubo s/c aleado (no inox), los demás (no frío, no oil/gas) (7304.59).' };
      }
      // Fallback general para aleado no inox, no oil/gas, si la subpartida NO es 51 ni 59 (lo cual sería un error de subpartida)
      if (proceso === 'frio') return { fraccion: '73045112', justificacion: 'Tubo s/c aleado (no inox), frío (no oil/gas, fallback general por error de subpartida).' };
      return { fraccion: '73045999', justificacion: 'Tubo s/c aleado (no inox), no frío (no oil/gas, fallback general por error de subpartida).' };
    }
    else if (esNoAleado) {
      // ... (Lógica para No Aleado NO Oil/Gas se mantiene igual)
        if (DEBUG) console.log(`DEBUG (7304): Es No Aleado (no oil/gas). Proceso: ${proceso}, Subpartida Input: ${subpartidaInput}`);
        if (subpartidaInput === '730431') {
            if (usoTecnico.includes("estructural")) return { fraccion: '73043101', justificacion: 'Tubo s/c no aleado, estructural, frío (no oil/gas) (7304.31).' };
            return { fraccion: '73043199', justificacion: 'Tubo s/c no aleado, los demás, frío (no oil/gas) (7304.31).' };
        }
        if (subpartidaInput === '730439') {
            if (usoTecnico.includes("estructural")) return { fraccion: '73043901', justificacion: 'Tubo s/c no aleado, estructural (no frío, no oil/gas) (7304.39).' };
            if (usoTecnico.includes("mecanico")) return { fraccion: '73043902', justificacion: 'Tubo s/c no aleado, mecánico (no frío, no oil/gas) (7304.39).' };
            if (usoTecnico.includes('termico_caldera') || textoGeneral.includes('boiler') || textoGeneral.includes('caldera')) return { fraccion: '73043916', justificacion: 'Tubo s/c no aleado, para caldera (no frío, no oil/gas) (7304.39).' };
            return { fraccion: '73043999', justificacion: 'Tubo s/c no aleado, los demás (no frío, no oil/gas) (7304.39).' };
        }
        if (proceso === 'frio') return { fraccion: '73043199', justificacion: 'Tubo s/c no aleado, frío (no oil/gas, fallback general).' };
        return { fraccion: '73043999', justificacion: 'Tubo s/c no aleado, caliente (no oil/gas, fallback general).' };
    }
  }

  // Último fallback si todo lo demás falla
  if (DEBUG) console.warn('DEBUG (7304): Fallback final absoluto dentro de clasificarTubo7304. Revisar lógica y propiedades.');
  if (subpartidaInput && subpartidaInput.length === 6) {
      return { fraccion: subpartidaInput + '00', nico: '00', justificacion: `Tubo s/c, fracción genérica para subpartida ${subpartidaInput}.` };
  }
  return { fraccion: '73049000', nico: '00', justificacion: 'Tubo s/c no clasificable con reglas detalladas (7304.90).' };
}

// --- Función Principal determinarFraccionFinal ---
function determinarFraccionFinal(props) {
  const subpartida = (props.subpartida || '').trim();
  const partidaBase = (props.partida || '').substring(0, 4);

  if (DEBUG) {
    console.log('🧮 Entrando a determinarFraccionFinal...');
    console.log(`➡️ Props recibidas: Partida: ${props.partida}, Subpartida: ${subpartida}, TipoAcero: ${props.tipoAcero}, ProcesoLaminado: ${props.procesoLaminado}, Aleado: ${props.aleado}, UsoTecnico: ${props.usoTecnico}, Norma: ${props.norma}`);
  }

  if (partidaBase === '7304') {
      if (DEBUG) console.log('🧮 Delegando a clasificarTubo7304 para partida 7304 y subpartida:', subpartida);
      const result7304 = clasificarTubo7304(props, subpartida);
      if (result7304 && result7304.fraccion) {
          if (DEBUG) console.log('🏁 Resultado de clasificarTubo7304:', result7304);
          return result7304;
      } else {
          if (DEBUG) console.warn('⚠️ clasificarTubo7304 no retornó una fracción válida. Subpartida:', subpartida, 'Resultado:', result7304);
          if (subpartida && subpartida.startsWith('7304') && subpartida.length === 6) {
            return { fraccion: subpartida + '00', justificacion: `Clasificación genérica para subpartida ${subpartida} en 73.04.`, nico: '00' };
          }
          return { fraccion: '73049000', justificacion: 'Fallo al determinar fracción específica en 73.04, asignado a "los demás".', nico: '00' };
      }
  }

  // --- LÓGICA PARA CAPÍTULO 72 Y OTRAS PARTIDAS DEL 73 ---
  // ... (Esta parte del código se mantiene igual a la versión de la respuesta #10)
  // Por brevedad, no se repite aquí, pero debe estar presente en tu archivo.




  // 📦 Capítulo 72 – Subpartidas comunes
  if (subpartida === '720110') {
    const fosforo = props.composicion?.fosforo;
    // La Nota 1 a) de subpartida del Cap 72 define "Fundición en bruto sin alear con un contenido de fósforo..."
    // La fracción 7201.10.01 es para "Con un contenido de fósforo, en peso, inferior o igual al 0.5%."
    if (fosforo !== null && fosforo <= 0.005) { // Asumiendo que el valor de fósforo en props está en porcentaje (0.5% = 0.005)
                                             // Si el valor de fósforo en props es directo (e.g., 0.5 para 0.5%), entonces la comparación es fosforo <= 0.5
      return {
        fraccion: '72011001',
        justificacion: 'Fundición en bruto sin alear, fósforo ≤ 0.5% en peso.'
      };
    }
    // Si no cumple la condición anterior pero la subpartida es 720110, hay una inconsistencia.
    // Debería ser asignado a 720120 si el fósforo es > 0.5%.
    // Por ahora, si la subpartida es 720110, asumimos que la condición de fósforo se cumplió para llegar aquí.
    return { fraccion: '72011001', justificacion: 'Fundición en bruto sin alear, fósforo ≤ 0.5% en peso (según subpartida).' };
  }

  if (subpartida === '720120') {
    // Fracción 7201.20.01 es para "Con un contenido de fósforo, en peso, superior al 0.5%."
    return {
      fraccion: '72012001',
      justificacion: 'Fundición en bruto sin alear, fósforo > 0.5% en peso.'
    };
  }

  if (subpartida === '720150') {
    return {
      fraccion: '72015002', // Fracción única para "Fundición en bruto aleada; fundición especular."
      justificacion: 'Fundición en bruto aleada; fundición especular.'
    };
  }

  if (subpartida === '720211') return { fraccion: '72021101', justificacion: 'Ferroaleación: ferromanganeso con contenido de carbono > 2% en peso.' };
  if (subpartida === '720219') return { fraccion: '72021999', justificacion: 'Ferroaleación: los demás ferromanganesos.' };
  // Para 7202.21, la subpartida es "Con un contenido de silicio, en peso, superior al 55 %"
  // La fracción 7202.21.02 es la única.
  if (subpartida === '720221') return { fraccion: '72022102', justificacion: 'Ferroaleación: ferrosilicomanganeso con contenido de silicio > 55%.' }; // Descripción corregida
  if (subpartida === '720229') return { fraccion: '72022999', justificacion: 'Ferroaleación: demás ferrosilicio.' }; // Descripción corregida
  if (subpartida === '720230') return { fraccion: '72023001', justificacion: 'Ferroaleación: ferro-sílico-manganeso.' };
  if (subpartida === '720241') return { fraccion: '72024101', justificacion: 'Ferroaleación: ferrocromo con carbono > 4% en peso.' };
  if (subpartida === '720249') return { fraccion: '72024999', justificacion: 'Ferroaleación: los demás ferrocromos.' };
  if (subpartida === '720250') return { fraccion: '72025001', justificacion: 'Ferroaleación: ferro-sílico-cromo.' };
  if (subpartida === '720260') return { fraccion: '72026001', justificacion: 'Ferroaleación: ferroníquel.' };
  if (subpartida === '720270') return { fraccion: '72027001', justificacion: 'Ferroaleación: ferromolibdeno.' };
  if (subpartida === '720280') return { fraccion: '72028001', justificacion: 'Ferroaleación: ferrovolframio y ferro-sílico-volframio.' };
  // Para 7202.91, la subpartida es "Ferrotitanio y ferro-sílico-titanio"
  // La fracción 7202.91.04 es la única.
  if (subpartida === '720291') return { fraccion: '72029104', justificacion: 'Ferroaleación: ferrotitanio y ferro-sílico-titanio.' };
  if (subpartida === '720292') return { fraccion: '72029202', justificacion: 'Ferroaleación: ferrovanadio.' };
  if (subpartida === '720293') return { fraccion: '72029301', justificacion: 'Ferroaleación: ferroniobio.' };
  if (subpartida === '720299') return { fraccion: '72029999', justificacion: 'Ferroaleación: las demás no clasificadas anteriormente.' };

  if (subpartida === '720310') return { fraccion: '72031001', justificacion: 'Productos férricos obtenidos por reducción directa de minerales de hierro.' };
  // Para 7203.90, la subpartida es "Los demás" (productos férreos esponjosos y hierro con pureza >= 99.94%)
  // La fracción 7203.90.99 es la única.
  if (subpartida === '720390') return { fraccion: '72039099', justificacion: 'Los demás productos férreos esponjosos; hierro con pureza >= 99.94%.' };


  if (subpartida === '720410') return { fraccion: '72041001', justificacion: 'Desperdicios y desechos, de fundición.' };
  if (subpartida === '720421') return { fraccion: '72042101', justificacion: 'Desperdicios y desechos de acero inoxidable.' };
  if (subpartida === '720429') return { fraccion: '72042999', justificacion: 'Desperdicios y desechos de los demás aceros aleados.' }; // Descripción ajustada
  if (subpartida === '720430') return { fraccion: '72043001', justificacion: 'Desperdicios y desechos, de hierro o acero estañados.' };
  if (subpartida === '720441') return { fraccion: '72044101', justificacion: 'Torneaduras, virutas, esquirlas, limaduras y recortes de hierro o acero, incluso en paquetes.' }; // Descripción ajustada
  if (subpartida === '720449') return { fraccion: '72044999', justificacion: 'Los demás desperdicios y desechos de hierro o acero.' }; // Descripción ajustada
  if (subpartida === '720450') return { fraccion: '72045001', justificacion: 'Lingotes de chatarra.' };

  if (subpartida === '720510') return { fraccion: '72051001', justificacion: 'Granallas de fundición en bruto, de hierro especular o de acero.' }; // Descripción ajustada
  if (subpartida === '720521') return { fraccion: '72052101', justificacion: 'Polvo de aceros aleados.' }; // Descripción ajustada
  if (subpartida === '720529') return { fraccion: '72052999', justificacion: 'Los demás polvos (de fundición en bruto, hierro especular, o acero sin alear).' }; // Descripción ajustada

  // Para 72.06, la partida es "Hierro y acero sin alear en lingotes o demás formas primarias..."
  if (subpartida === '720610') return { fraccion: '72061001', justificacion: 'Lingotes de hierro o acero sin alear.' };
  if (subpartida === '720690') return { fraccion: '72069099', justificacion: 'Las demás formas primarias de hierro o acero sin alear.' }; // Descripción ajustada

  // Para 72.07, la partida es "Productos intermedios de hierro o acero sin alear."
  if (subpartida === '720711') return { fraccion: '72071101', justificacion: 'Semiproductos de hierro/acero s/alear, C < 0.25%, sección cuadrada/rectangular, anchura < 2x espesor.' }; // Descripción ajustada
  if (subpartida === '720712') return { fraccion: '72071291', justificacion: 'Los demás semiproductos de sección transversal rectangular, C < 0.25%.' }; // Descripción ajustada
  if (subpartida === '720719') return { fraccion: '72071999', justificacion: 'Los demás semiproductos de hierro/acero s/alear, C < 0.25% (e.g. sección circular).' }; // Descripción ajustada
  if (subpartida === '720720') return { fraccion: '72072002', justificacion: 'Semiproductos de hierro/acero s/alear, C ≥ 0.25% en peso.' }; // Descripción ajustada

  // 72.08 Productos laminados planos de hierro o acero sin alear, de anchura >= 600 mm, laminados en caliente, sin chapar ni revestir.
  if (subpartida === '720810') return { fraccion: '72081003', justificacion: 'Enrollados, simplemente laminados en caliente, con motivos en relieve.' };
  if (subpartida === '720825') return { fraccion: '72082502', justificacion: 'De espesor superior o igual a 4.75 mm, enrollados, decapados.' }; // Descripción ajustada
  if (subpartida === '720826') return { fraccion: '72082601', justificacion: 'De espesor superior o igual a 3 mm pero inferior a 4.75 mm, enrollados, decapados.' }; // Descripción ajustada
  if (subpartida === '720827') return { fraccion: '72082701', justificacion: 'De espesor inferior a 3 mm, enrollados, decapados.' }; // Descripción ajustada
  if (subpartida === '720836') return { fraccion: '72083601', justificacion: 'De espesor superior a 10 mm, enrollados, los demás (sin decapar, sin relieve).' }; // Descripción ajustada
  if (subpartida === '720837') return { fraccion: '72083701', justificacion: 'De espesor superior o igual a 4.75 mm pero inferior o igual a 10 mm, enrollados, los demás.' }; // Descripción ajustada
  if (subpartida === '720838') return { fraccion: '72083801', justificacion: 'De espesor superior o igual a 3 mm pero inferior a 4.75 mm, enrollados, los demás.' }; // Descripción ajustada
  if (subpartida === '720839') return { fraccion: '72083901', justificacion: 'De espesor inferior a 3 mm, enrollados, los demás.' }; // Descripción ajustada
  if (subpartida === '720840') return { fraccion: '72084002', justificacion: 'Sin enrollar, simplemente laminados en caliente, con motivos en relieve.' };
  if (subpartida === '720851') return { fraccion: '72085104', justificacion: 'De espesor superior a 10 mm, sin enrollar, los demás.' }; // Descripción ajustada
  if (subpartida === '720852') return { fraccion: '72085201', justificacion: 'De espesor superior o igual a 4.75 mm pero inferior o igual a 10 mm, sin enrollar, los demás.' }; // Descripción ajustada
  if (subpartida === '720853') return { fraccion: '72085301', justificacion: 'De espesor superior o igual a 3 mm pero inferior a 4.75 mm, sin enrollar, los demás.' }; // Descripción ajustada
  if (subpartida === '720854') return { fraccion: '72085401', justificacion: 'De espesor inferior a 3 mm, sin enrollar, los demás.' }; // Descripción ajustada
  if (subpartida === '720890') return { fraccion: '72089099', justificacion: 'Los demás productos laminados planos s/alear, ancho >=600mm, caliente, sin revestir (trabajados posteriormente).' }; // Descripción ajustada

  // 72.09 Productos laminados planos de hierro o acero sin alear, de anchura >= 600 mm, laminados en frío, sin chapar ni revestir.
  if (subpartida === '720915') return { fraccion: '72091504', justificacion: 'De espesor superior o igual a 3 mm, enrollados, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720916') return { fraccion: '72091601', justificacion: 'De espesor superior a 1 mm pero inferior a 3 mm, enrollados, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720917') return { fraccion: '72091701', justificacion: 'De espesor superior o igual a 0.5 mm pero inferior o igual a 1 mm, enrollados, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720918') return { fraccion: '72091801', justificacion: 'De espesor inferior a 0.5 mm, enrollados, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720925') return { fraccion: '72092501', justificacion: 'De espesor superior o igual a 3 mm, sin enrollar, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720926') return { fraccion: '72092601', justificacion: 'De espesor superior a 1 mm pero inferior a 3 mm, sin enrollar, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720927') return { fraccion: '72092701', justificacion: 'De espesor superior o igual a 0.5 mm pero inferior o igual a 1 mm, sin enrollar, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720928') return { fraccion: '72092801', justificacion: 'De espesor inferior a 0.5 mm, sin enrollar, laminados en frío.' }; // Descripción ajustada
  if (subpartida === '720990') return { fraccion: '72099099', justificacion: 'Los demás productos laminados planos s/alear, ancho >=600mm, frío, sin revestir (trabajados posteriormente).' }; // Descripción ajustada

  // 72.10 Productos laminados planos de hierro o acero sin alear, de anchura >= 600 mm, chapados o revestidos.
  if (subpartida === '721011') return { fraccion: '72101101', justificacion: 'Estañados, de espesor superior o igual a 0.5 mm.' };
  if (subpartida === '721012') return { fraccion: '72101204', justificacion: 'Estañados, de espesor inferior a 0.5 mm.' };
  if (subpartida === '721020') return { fraccion: '72102001', justificacion: 'Emplomados, incluidos los revestidos con una aleación de plomo y estaño.' };
  if (subpartida === '721030') return { fraccion: '72103002', justificacion: 'Cincados electrolíticamente.' };
  if (subpartida === '721041') { // Corrugados o acanalados
      // Fracción 7210.41.01 y 7210.41.99. NICO depende de espesor y si es alta resistencia.
      // La distinción entre 01 y 99 es si son corrugados o no, pero la subpartida 7210.41 ya es para corrugados.
      // Asumimos que aquí la distinción de fracción es por otras características.
      // Para simplificar, si es corrugado (lo cual es implícito por la subpartida)
      // la fracción será 7210.41.01 o 7210.41.99. Sin más datos, es difícil elegir una.
      // Vamos a asumir que "Los demás" (7210.41.99) es un catch-all para corrugados.
      // Sin embargo, la tarifa suele ser más específica.
      // Fracción 7210.41.01 : Láminas cincadas por las dos caras.
      // Fracción 7210.41.99 : Los demás. (También cincados y corrugados)
      // Vamos a necesitar más lógica o asumir una por defecto.
      // Por ahora, si es corrugado, va a 7210.41.01 si se puede identificar "por las dos caras".
      if (descripcion.includes("dos caras") || descripcion.includes("ambas caras")) {
          return { fraccion: '72104101', justificacion: 'Cincados de otro modo, corrugados, por las dos caras.' };
      }
      return { fraccion: '72104199', justificacion: 'Cincados de otro modo, corrugados (los demás).' };
  }
  if (subpartida === '721049') return { fraccion: '72104999', justificacion: 'Cincados de otro modo (no corrugados), los demás.' }; // Descripción ajustada
  if (subpartida === '721050') return { fraccion: '72105003', justificacion: 'Revestidos de óxidos de cromo o de cromo y óxidos de cromo.' };
  if (subpartida === '721061') return { fraccion: '72106101', justificacion: 'Revestidos de aleaciones de aluminio y cinc.' };
  if (subpartida === '721069') return { fraccion: '72106999', justificacion: 'Revestidos de aluminio (los demás).' }; // Descripción ajustada
  if (subpartida === '721070') return { fraccion: '72107002', justificacion: 'Pintados, barnizados o revestidos de plástico.' };
  if (subpartida === '721090') return { fraccion: '72109099', justificacion: 'Los demás (chapados, etc.).' }; // Descripción ajustada

  // 72.11 Productos laminados planos de hierro o acero sin alear, de anchura < 600 mm, sin chapar ni revestir.
  if (subpartida === '721113') return { fraccion: '72111301', justificacion: 'Laminados en caliente en las cuatro caras o en acanaladuras cerradas, anchura > 150 mm y espesor ≥ 4 mm, sin enrollar.' }; // Descripción ajustada
  if (subpartida === '721114') return { fraccion: '72111491', justificacion: 'Los demás, laminados en caliente, de espesor superior o igual a 4.75 mm.' }; // Descripción ajustada
  if (subpartida === '721119') return { fraccion: '72111999', justificacion: 'Los demás, laminados en caliente, de espesor inferior a 4.75mm.' }; // Descripción ajustada
  if (subpartida === '721123') return { fraccion: '72112303', justificacion: 'Laminados en frío, con un contenido de carbono inferior al 0.25% en peso.' }; // Descripción ajustada
  if (subpartida === '721129') return { fraccion: '72112999', justificacion: 'Los demás, laminados en frío (C >= 0.25%).' }; // Descripción ajustada
  if (subpartida === '721190') return { fraccion: '72119099', justificacion: 'Los demás (trabajados posteriormente).' }; // Descripción ajustada

  // 72.12 Productos laminados planos de hierro o acero sin alear, de anchura < 600 mm, chapados o revestidos.
  if (subpartida === '721210') return { fraccion: '72121003', justificacion: 'Estañados.' };
  if (subpartida === '721220') return { fraccion: '72122003', justificacion: 'Cincados electrolíticamente.' };
  if (subpartida === '721230') return { fraccion: '72123003', justificacion: 'Cincados de otro modo.' };
  if (subpartida === '721240') return { fraccion: '72124004', justificacion: 'Pintados, barnizados o revestidos de plástico.' };
  if (subpartida === '721250') return { fraccion: '72125001', justificacion: 'Revestidos de otro modo (e.g. cromo).' }; // Descripción ajustada
  if (subpartida === '721260') return { fraccion: '72126004', justificacion: 'Chapados.' };

  // 72.13 Alambrón de hierro o acero sin alear.
  if (subpartida === '721310') return { fraccion: '72131001', justificacion: 'Con muescas, cordones, surcos o relieves, producidos en el laminado (para hormigón).' }; // Descripción ajustada
  if (subpartida === '721320') return { fraccion: '72132091', justificacion: 'Los demás, de acero de fácil mecanización.' };
  if (subpartida === '721391') return { fraccion: '72139103', justificacion: 'De sección circular con diámetro inferior a 14 mm (excepto fácil mecanización y con relieves).' }; // Descripción ajustada
  if (subpartida === '721399') return { fraccion: '72139999', justificacion: 'Los demás alambrones sin alear.' }; // Descripción ajustada

  // 72.14 Barras de hierro o acero sin alear, simplemente forjadas, laminadas o extrudidas, en caliente, así como las sometidas a torsión después del laminado.
  if (subpartida === '721410') return { fraccion: '72141001', justificacion: 'Forjadas.' };
  if (subpartida === '721420') { // Con muescas, cordones, surcos o relieves... o sometidas a torsión después del laminado.
      // La fracción 7214.20.01 es "Varillas corrugadas o barras para armadura, para cemento u hormigón".
      // La fracción 7214.20.99 es "Las demás".
      if (descripcion.includes("varilla corrugada") || descripcion.includes("barra para armadura") || descripcion.includes("hormigon") || descripcion.includes("cemento")) {
          return { fraccion: '72142001', justificacion: 'Varillas corrugadas o barras para armadura, para cemento u hormigón.' };
      }
      return { fraccion: '72142099', justificacion: 'Las demás barras con relieves o torsionadas.' };
  }
  if (subpartida === '721430') return { fraccion: '72143091', justificacion: 'Las demás, de acero de fácil mecanización.' };
  if (subpartida === '721491') return { fraccion: '72149103', justificacion: 'De sección transversal rectangular (excepto fácil mecanización y con relieves/torsión).' }; // Descripción ajustada
  if (subpartida === '721499') return { fraccion: '72149999', justificacion: 'Las demás barras (e.g. sección circular, cuadrada, etc. sin relieves/torsión, no fácil mecanización).' }; // Descripción ajustada

  // 72.15 Las demás barras de hierro o acero sin alear. (No entran las de 72.14)
  if (subpartida === '721510') return { fraccion: '72151001', justificacion: 'De acero de fácil mecanización, simplemente obtenidas o acabadas en frío.' };
  if (subpartida === '721550') return { fraccion: '72155091', justificacion: 'Las demás, simplemente obtenidas o acabadas en frío (C < 0.25% o C >= 0.25%).' }; // Descripción ajustada
  if (subpartida === '721590') return { fraccion: '72159099', justificacion: 'Las demás (e.g. forjadas y obtenidas/acabadas en frío, plaqueadas, etc.).' }; // Descripción ajustada

  // 72.16 Perfiles de hierro o acero sin alear.
  if (subpartida === '721610') return { fraccion: '72161001', justificacion: 'Perfiles en U, en I o en H, simplemente laminados o extrudidos en caliente, de altura inferior a 80 mm.' };
  if (subpartida === '721621') return { fraccion: '72162101', justificacion: 'Perfiles en L, simplemente laminados o extrudidos en caliente, de altura inferior a 80 mm.' };
  if (subpartida === '721622') return { fraccion: '72162201', justificacion: 'Perfiles en T, simplemente laminados o extrudidos en caliente, de altura inferior a 80 mm.' };
  if (subpartida === '721631') return { fraccion: '72163103', justificacion: 'Perfiles en U, simplemente laminados o extrudidos en caliente, de altura superior o igual a 80 mm.' }; // Ajustada con NICO en mente
  if (subpartida === '721632') { // Perfiles en I, altura >= 80mm
      // Fracción 7216.32.04 : Cuyo patín (ancho de las secciones paralelas) sea superior a 270 mm y su peso sea superior a 190 kg por metro lineal.
      // Fracción 7216.32.99 : Los demás.
      // Necesitaríamos patín y peso para distinguir. Asumimos "Los demás" si no hay datos.
      const patin = props.patin || 0; // Ancho de las alas
      const pesoPorMetro = props.pesoPorMetro || 0;
      if (patin > 270 && pesoPorMetro > 190) {
          return { fraccion: '72163204', justificacion: 'Perfiles en I, altura >= 80mm, patín > 270mm y peso > 190 kg/m.' };
      }
      return { fraccion: '72163299', justificacion: 'Los demás perfiles en I, simplemente laminados o extrudidos en caliente, de altura superior o igual a 80 mm.' };
  }
  if (subpartida === '721633') { // Perfiles en H, altura >= 80mm
      // Fracción 7216.33.01 : Perfiles en H, excepto lo comprendido en la fracción arancelaria 7216.33.02.
      // Fracción 7216.33.02 : Cuyo patín (ancho de las secciones paralelas) sea superior a 300 mm.
      const patin = props.patin || 0;
      if (patin > 300) {
          return { fraccion: '72163302', justificacion: 'Perfiles en H, altura >= 80mm, patín > 300mm.' };
      }
      return { fraccion: '72163301', justificacion: 'Perfiles en H, simplemente laminados o extrudidos en caliente, de altura superior o igual a 80 mm (patín <= 300mm o no especificado).' };
  }
  if (subpartida === '721640') return { fraccion: '72164001', justificacion: 'Perfiles en L o en T, simplemente laminados o extrudidos en caliente, de altura superior o igual a 80 mm.' };
  if (subpartida === '721650') { // Los demás perfiles, simplemente laminados o extrudidos en caliente.
      // Fracción 7216.50.01 : Perfiles en forma de Z, cuyo espesor no exceda de 23 cm.
      // Fracción 7216.50.99 : Los demás.
      if (forma.includes("perfil z") || descripcion.includes("perfil z")) { // Asumiendo que 'forma' puede tener 'perfil z'
          return { fraccion: '72165001', justificacion: 'Perfiles en Z, simplemente laminados/extrudidos en caliente, espesor <= 23cm.' };
      }
      return { fraccion: '72165099', justificacion: 'Los demás perfiles (no U,I,H,L,T,Z especificados), simplemente laminados/extrudidos en caliente.' };
  }
  if (subpartida === '721661') { // Perfiles simplemente obtenidos o acabados en frío, a partir de productos laminados planos.
    // Fracción 7216.61.01 : Perfiles en forma de H, I, L, T, U y Z, cuyo espesor no exceda a 23 cm, excepto lo comprendido en la fracción arancelaria 7216.61.02.
    // Fracción 7216.61.02 : En forma de U e I, cuyo espesor sea superior o igual a 13 cm, sin exceder de 20 cm.
    // Fracción 7216.61.99 : Los demás.
    // Esto es complejo sin la forma exacta y el espesor bien definido.
    // Asumimos una lógica simplificada.
    const espesorPerfil = props.espesorPerfil || props.espesor || 0; // Necesitaríamos un 'espesorPerfil' si es distinto al espesor de lámina.
    if ((forma.includes("perfil u") || forma.includes("perfil i")) && espesorPerfil >= 13 && espesorPerfil <= 20) {
        return { fraccion: '72166102', justificacion: 'Perfiles U o I, obtenidos/acabados en frío de laminados planos, espesor 13-20cm.' };
    }
    if (/(perfil\s)(h|i|l|t|u|z)/.test(forma) && espesorPerfil <= 23) {
        return { fraccion: '72166101', justificacion: 'Perfiles H,I,L,T,U,Z, obtenidos/acabados en frío de laminados planos, espesor <= 23cm (no 7216.61.02).' };
    }
    return { fraccion: '72166199', justificacion: 'Los demás perfiles obtenidos/acabados en frío de laminados planos.' };
  }
  if (subpartida === '721669') return { fraccion: '72166999', justificacion: 'Los demás perfiles, simplemente obtenidos o acabados en frío (no a partir de laminados planos).' };
  if (subpartida === '721691') return { fraccion: '72169101', justificacion: 'Los demás perfiles, obtenidos o acabados en frío, a partir de productos laminados planos (soldados, etc.).' }; // Ajustada
  if (subpartida === '721699') return { fraccion: '72169999', justificacion: 'Los demás perfiles (e.g. forjados y trabajados, etc.).' }; // Ajustada

  // 72.17 Alambre de hierro o acero sin alear.
  if (subpartida === '721710') return { fraccion: '72171002', justificacion: 'Sin revestir, incluso pulido.' }; // Ajustada (NICO depende de C, diámetro, uso)
  if (subpartida === '721720') return { fraccion: '72172002', justificacion: 'Cincado.' }; // Ajustada (NICO depende de si es para grapas)
  if (subpartida === '721730') return { fraccion: '72173002', justificacion: 'Revestido de otro metal común (ej. cobre).' }; // Ajustada (NICO depende de C y si es cobre)
  if (subpartida === '721790') return { fraccion: '72179099', justificacion: 'Los demás (revestido de plástico, etc.).' }; // Ajustada (NICO depende de si es plástico)

  // 72.18 Acero inoxidable en lingotes o demás formas primarias; productos intermedios de acero inoxidable.
  if (subpartida === '721810') return { fraccion: '72181001', justificacion: 'Lingotes o demás formas primarias de acero inoxidable.' };
  if (subpartida === '721891') return { fraccion: '72189101', justificacion: 'Productos intermedios de acero inoxidable, de sección transversal rectangular.' };
  if (subpartida === '721899') return { fraccion: '72189999', justificacion: 'Los demás productos intermedios de acero inoxidable.' };

  // 72.19 Productos laminados planos de acero inoxidable, de anchura >= 600 mm.
  if (subpartida === '721911') return { fraccion: '72191101', justificacion: 'Laminados en caliente, enrollados, espesor > 10 mm.' };
  if (subpartida === '721912') return { fraccion: '72191202', justificacion: 'Laminados en caliente, enrollados, espesor >= 4.75 mm pero <= 10 mm.' }; // Ajustada
  if (subpartida === '721913') return { fraccion: '72191301', justificacion: 'Laminados en caliente, enrollados, espesor >= 3 mm pero < 4.75 mm.' };
  if (subpartida === '721914') return { fraccion: '72191401', justificacion: 'Laminados en caliente, enrollados, espesor < 3 mm.' };
  if (subpartida === '721921') return { fraccion: '72192101', justificacion: 'Laminados en caliente, sin enrollar, espesor > 10 mm.' };
  if (subpartida === '721922') return { fraccion: '72192201', justificacion: 'Laminados en caliente, sin enrollar, espesor >= 4.75 mm pero <= 10 mm.' };
  if (subpartida === '721923') return { fraccion: '72192301', justificacion: 'Laminados en caliente, sin enrollar, espesor >= 3 mm pero < 4.75 mm.' };
  if (subpartida === '721924') return { fraccion: '72192401', justificacion: 'Laminados en caliente, sin enrollar, espesor < 3 mm.' };
  if (subpartida === '721931') return { fraccion: '72193101', justificacion: 'Laminados en frío, espesor >= 4.75 mm.' };
  if (subpartida === '721932') return { fraccion: '72193202', justificacion: 'Laminados en frío, espesor >= 3 mm pero < 4.75 mm.' }; // Ajustada
  if (subpartida === '721933') return { fraccion: '72193301', justificacion: 'Laminados en frío, espesor > 1 mm pero < 3 mm.' };
  if (subpartida === '721934') return { fraccion: '72193401', justificacion: 'Laminados en frío, espesor >= 0.5 mm pero <= 1 mm.' };
  if (subpartida === '721935') return { fraccion: '72193502', justificacion: 'Laminados en frío, espesor < 0.5 mm.' }; // Ajustada
  if (subpartida === '721990') return { fraccion: '72199099', justificacion: 'Los demás productos laminados planos de acero inoxidable, ancho >= 600mm (trabajados posteriormente).' }; // Ajustada

  // 72.20 Productos laminados planos de acero inoxidable, de anchura < 600 mm.
  if (subpartida === '722011') return { fraccion: '72201101', justificacion: 'Laminados en caliente, espesor >= 4.75 mm.' };
  if (subpartida === '722012') return { fraccion: '72201201', justificacion: 'Laminados en caliente, espesor < 4.75 mm.' };
  if (subpartida === '722020') return { fraccion: '72202003', justificacion: 'Simplemente laminados en frío.' }; // Ajustada
  if (subpartida === '722090') return { fraccion: '72209099', justificacion: 'Los demás productos laminados planos de acero inoxidable, ancho < 600mm (trabajados posteriormente).' }; // Ajustada

  // 72.21 Alambrón de acero inoxidable.
  if (subpartida === '722100') return { fraccion: '72210001', justificacion: 'Alambrón de acero inoxidable.' };

  // 72.22 Barras y perfiles, de acero inoxidable.
  if (subpartida === '722211') return { fraccion: '72221102', justificacion: 'Barras de acero inoxidable de sección circular, laminadas/extrudidas en caliente.' }; // Ajustada
  if (subpartida === '722219') return { fraccion: '72221999', justificacion: 'Las demás barras de acero inoxidable, laminadas/extrudidas en caliente.' };
  if (subpartida === '722220') return { fraccion: '72222001', justificacion: 'Barras de acero inoxidable, simplemente obtenidas o acabadas en frío.' };
  if (subpartida === '722230') return { fraccion: '72223091', justificacion: 'Las demás barras de acero inoxidable (e.g. forjadas y trabajadas).' }; // Ajustada
  if (subpartida === '722240') return { fraccion: '72224001', justificacion: 'Perfiles de acero inoxidable.' };

  // 72.23 Alambre de acero inoxidable.
  if (subpartida === '722300') return { fraccion: '72230002', justificacion: 'Alambre de acero inoxidable.' }; // Ajustada

  // 72.24 Los demás aceros aleados en lingotes o demás formas primarias; productos intermedios de los demás aceros aleados.
  if (subpartida === '722410') return { fraccion: '72241006', justificacion: 'Lingotes o demás formas primarias, de los demás aceros aleados.' }; // Ajustada (NICO depende de si es herramienta, rápido, etc.)
  if (subpartida === '722490') { // Productos intermedios de los demás aceros aleados.
      // Fracción 7224.90.02 : Productos intermedios con contenido de carbono inferior o igual al 0.006% en peso, excepto los de acero grado herramienta.
      // Fracción 7224.90.99 : Los demás.
      const carbono = props.composicion?.carbono || 0;
      const esHerramienta = (props.norma || '').toLowerCase().includes('herramienta') || (props.usoTecnico || '').toLowerCase().includes('herramienta');
      if (carbono <= 0.00006 && !esHerramienta) { // 0.006% = 0.00006
          return { fraccion: '72249002', justificacion: 'Productos intermedios de los demás aceros aleados, C <= 0.006%, no herramienta.' };
      }
      return { fraccion: '72249099', justificacion: 'Los demás productos intermedios de los demás aceros aleados.' };
  }


  // 72.25 Productos laminados planos de los demás aceros aleados, de anchura >= 600 mm.
  if (subpartida === '722511') return { fraccion: '72251101', justificacion: 'De acero al silicio llamado «magnético de grano orientado».' };
  if (subpartida === '722519') return { fraccion: '72251999', justificacion: 'Los demás de acero al silicio (magnético no orientado).' }; // Ajustada
  if (subpartida === '722530') return { fraccion: '72253091', justificacion: 'Los demás, simplemente laminados en caliente, enrollados.' }; // Ajustada (NICO depende de boro, espesor, uso)
  if (subpartida === '722540') return { fraccion: '72254091', justificacion: 'Los demás, simplemente laminados en caliente, sin enrollar.' }; // Ajustada (NICO depende de boro, espesor, uso)
  if (subpartida === '722550') return { fraccion: '72255091', justificacion: 'Los demás, simplemente laminados en frío.' }; // Ajustada (NICO depende de boro, espesor, uso)
  if (subpartida === '722591') return { fraccion: '72259101', justificacion: 'Cincados electrolíticamente.' };
  if (subpartida === '722592') return { fraccion: '72259201', justificacion: 'Cincados de otro modo.' };
  if (subpartida === '722599') return { fraccion: '72259999', justificacion: 'Los demás (pintados, aluminizados, etc.).' }; // Ajustada (NICO depende del tipo de revestimiento)

  // 72.26 Productos laminados planos de los demás aceros aleados, de anchura < 600 mm.
  if (subpartida === '722611') return { fraccion: '72261101', justificacion: 'De acero al silicio llamado «magnético de grano orientado».' };
  if (subpartida === '722619') return { fraccion: '72261999', justificacion: 'Los demás de acero al silicio (magnético no orientado).' }; // Ajustada
  if (subpartida === '722620') return { fraccion: '72262001', justificacion: 'De acero rápido.' };
  if (subpartida === '722691') return { fraccion: '72269107', justificacion: 'Simplemente laminados en caliente.' }; // Ajustada (NICO depende de boro, espesor, uso)
  if (subpartida === '722692') return { fraccion: '72269206', justificacion: 'Simplemente laminados en frío.' }; // Ajustada (NICO depende de boro, espesor)
  if (subpartida === '722699') return { fraccion: '72269999', justificacion: 'Los demás (revestidos).' }; // Ajustada (NICO depende del tipo de revestimiento)

  // 72.27 Alambrón de los demás aceros aleados.
  if (subpartida === '722710') return { fraccion: '72271001', justificacion: 'De acero rápido.' };
  if (subpartida === '722720') return { fraccion: '72272001', justificacion: 'De acero silicomanganeso.' };
  if (subpartida === '722790') return { fraccion: '72279099', justificacion: 'Los demás alambrones de aceros aleados.' }; // Ajustada (NICO depende de uso, elementos)

  // 72.28 Barras y perfiles, de los demás aceros aleados; barras huecas para perforación, de acero aleado o sin alear.
  if (subpartida === '722810') return { fraccion: '72281002', justificacion: 'Barras de acero rápido.' }; // Ajustada (NICO depende si es acabado en caliente)
  if (subpartida === '722820') return { fraccion: '72282002', justificacion: 'Barras de acero silicomanganeso.' }; // Ajustada (NICO depende si es acabado en caliente)
  if (subpartida === '722830') { // Las demás barras, simplemente laminadas o extrudidas en caliente.
      // Fracción 7228.30.01 : En aceros grado herramienta.
      // Fracción 7228.30.99 : Las demás.
      if (descripcion.includes("herramienta") || norma.toLowerCase().includes("grado herramienta")) {
        return { fraccion: '72283001', justificacion: 'Barras de acero grado herramienta, laminadas/extrudidas en caliente.' };
      }
      return { fraccion: '72283099', justificacion: 'Las demás barras (no herramienta), laminadas/extrudidas en caliente.' };
  }
  if (subpartida === '722840') return { fraccion: '72284091', justificacion: 'Las demás barras, simplemente forjadas.' }; // Ajustada (NICO si es herramienta)
  if (subpartida === '722850') return { fraccion: '72285091', justificacion: 'Las demás barras, simplemente obtenidas o acabadas en frío.' }; // Ajustada (NICO si es herramienta)
  if (subpartida === '722860') return { fraccion: '72286091', justificacion: 'Las demás barras (e.g. forjadas y acabadas en frío).' }; // Ajustada (NICO si es herramienta o laminada en caliente)
  if (subpartida === '722870') return { fraccion: '72287001', justificacion: 'Perfiles de los demás aceros aleados.' }; // Ajustada (NICO por peralte)
  if (subpartida === '722880') return { fraccion: '72288001', justificacion: 'Barras huecas para perforación, de acero aleado o sin alear.' };

  // 72.29 Alambre de los demás aceros aleados.
  if (subpartida === '722920') return { fraccion: '72292001', justificacion: 'De acero silicomanganeso.' }; // Ajustada (NICO por tipo de soldadura y presentación)
  if (subpartida === '722990') return { fraccion: '72299099', justificacion: 'Los demás alambres de aceros aleados.' }; // Ajustada (NICO por uso, elementos)

  // --- END FRACCION DETERMINATION LOGIC ---
  // If no specific rule above returned a fraction, return a general fallback
  // This part should ideally not be reached if subpartida is correctly determined and all cases are handled.

 if (DEBUG) console.warn('🚨 No se encontró lógica de fracción para subpartida:', subpartida, 'en determinarFraccionFinal (fuera de 7304). Props:', JSON.stringify(props, null, 2).substring(0, 500));
  if (subpartida && subpartida.length === 6) {
    return { fraccion: subpartida + '00', justificacion: `Fracción genérica basada en subpartida ${subpartida}.`, nico: '00' };
  }
  if (partidaBase && partidaBase.length === 4) {
    return { fraccion: partidaBase + '0000', justificacion: `Fracción genérica basada en partida ${partidaBase}.`, nico: '00' };
  }
  return { fraccion: null, justificacion: 'No se pudo determinar la fracción final.', nico: null };
}

module.exports = determinarFraccionFinal;