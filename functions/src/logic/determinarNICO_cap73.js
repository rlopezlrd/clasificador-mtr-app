// determinarNICO_cap73.js
// Esta función evalúa el NICO correcto basado en fracción y propiedades para capítulo 73

const DEBUG = process.env.DEBUG === 'true'; // Use environment variable for DEBUG

function determinarNICO_Cap73(fraccion, props) {
  const textoGeneral = `${props.descripcion || ''} ${props.usoTecnico || ''} ${props.observaciones || ''} ${props.norma || ''}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const composicion = props.composicion || {};
  const tipoAcero = (props.tipoAcero || '').toLowerCase();
  const esInoxidable = tipoAcero.includes('inoxidable');
  const esAleadoNoInox = tipoAcero.includes('aleado') && !esInoxidable; // Asume 'aleado' no incluye 'inoxidable'
  const esSinAlear = !esInoxidable && !esAleadoNoInox;

  const diametroExterior = props.diametroExterior || 0;
  const espesorPared = props.espesorPared || 0;
  const roscado = textoGeneral.includes('roscado') || textoGeneral.includes('con rosca');
  const recalentadoExtremos = textoGeneral.includes('recalcado') || textoGeneral.includes('recalentado en los extremos'); // "upset"
  const semiterminado = textoGeneral.includes('semiterminado') || textoGeneral.includes('esbozo');
  const recubrimiento = (props.recubrimiento || '').toLowerCase();
  const costura = (props.costura || '').toLowerCase();


  if (DEBUG) {
    console.log('[NICO Cap73] Fracción:', fraccion, 'Props:', props, 'Texto normalizado:', textoGeneral);
  }

  // NICO por defecto si no se encuentra una regla específica.
  const defaultNICO = '00';

  // Fracción 7301.10.01 – Tablestacas
  if (fraccion === '73011001') return defaultNICO;

  // Fracción 7301.20.01 – Perfiles (obtenidos por soldadura)
  if (fraccion === '73012001') return defaultNICO;

  // Fracción 7302.10.02 – Carriles (rieles)
  if (fraccion === '73021002') {
    // NICO 01: Para relaminación o fundición.
    // NICO 02: De acero al carbono sin alear, excepto riel estándar de peso inferior o igual a 30 kg/m (60 libras/yarda).
    // NICO 99: Los demás.
    if (textoGeneral.includes('relaminacion') || textoGeneral.includes('fundicion')) return '01';
    // Asumimos que si es 'sin alear' y no cumple una condición específica de peso/riel estándar, es NICO 02.
    // La condición "excepto riel estándar..." es difícil de programar sin datos de peso/m y definición de "riel estándar".
    if (esSinAlear) return '02'; // Simplificación
    return '99';
  }

  // Fracción 7302.30.01 – Agujas, puntas de corazón, etc.
  if (fraccion === '73023001') return defaultNICO;

  // Fracción 7302.40.02 – Bridas y placas de asiento (eclisas)
  if (fraccion === '73024002') {
    // NICO 01: Placas de asiento.
    // NICO 99: Los demás (e.g. bridas/eclisas).
    if (textoGeneral.includes('placa de asiento')) return '01';
    return '99';
  }

  // Fracción 7302.90.99 – Los demás materiales para vías férreas
  if (fraccion === '73029099') {
    // NICO 01: Piezas de sujeción y anclaje.
    // NICO 02: Traviesas (durmientes).
    // NICO 99: Los demás.
    if (textoGeneral.includes('sujecion') || textoGeneral.includes('anclaje')) return '01';
    if (textoGeneral.includes('traviesa') || textoGeneral.includes('durmiente')) return '02';
    return '99';
  }

  // Fracción 7303.00.02 – Tubos y perfiles huecos, de fundición
  if (fraccion === '73030002') {
    // NICO 01: De diámetro exterior inferior o igual a 350 mm.
    // NICO 99: Los demás.
    if (diametroExterior > 0 && diametroExterior <= 350) return '01';
    return '99';
  }

  // --- Tubos y perfiles huecos, sin costura (Partida 73.04) ---
  // Fracciones de Line Pipe (7304.11.xx, 7304.19.xx)
  if (fraccion === '73041101' || fraccion === '73041102' || fraccion === '73041103' || fraccion === '73041104') {
    // Estas fracciones son específicas (ej. 7304.11.01 para presión de ruptura >= 41.34 MPa).
    // Sin datos de presión de ruptura, es difícil asignar NICO si hubiera. Generalmente son NICO 00.
    return defaultNICO;
  }
  if (fraccion === '73041199') { // Los demás, de acero inoxidable (line pipe)
    // NICO 01: Semiterminados o esbozos.
    // NICO 99: Los demás.
    if (semiterminado) return '01';
    return '99';
  }
  if (fraccion === '73041901') { // Line pipe, sin alear, calidad API 5L
    // NICO 01: De diámetro exterior inferior a 60.3 mm.
    // NICO 02: De diámetro exterior superior o igual a 60.3 mm pero inferior o igual a 114.3 mm.
    // NICO 03: De diámetro exterior inferior a 60.3 mm, de acero aleado. (Esta fracción es para SIN ALEAR, así que este NICO no aplicaría aquí)
    // NICO 04: De diámetro exterior superior o igual a 60.3 mm pero inferior o igual a 114.3 mm, de acero aleado. (Idem)
    // NICO 99: Los demás.
    if (diametroExterior < 60.3) return '01';
    if (diametroExterior >= 60.3 && diametroExterior <= 114.3) return '02';
    return '99';
  }
  if (fraccion === '73041902' || fraccion === '73041903') { // Line pipe, sin alear, para conducción / para servicio amargo
    // NICO 01: De acero aleado. (Estas fracciones son para SIN ALEAR, este NICO es confuso aquí)
    // NICO 99: Los demás.
    // Asumiendo que son sin alear como indica la fracción:
    return '99'; // Si la fracción es correcta, entonces son "los demás" de esa categoría.
  }
  if (fraccion === '73041904') { // Line pipe, sin alear, para uso mecánico
    // NICO 91: De acero sin alear.
    // NICO 99: Los demás. (Este NICO 99 usualmente implica "otros aceros" que no es el caso aquí)
    if (esSinAlear) return '91';
    return '99'; // Revisar si NICO 99 aplica realmente a aceros aleados en una fracción de "sin alear".
  }
  if (fraccion === '73041905') return defaultNICO; // Line pipe, sin alear, semiterminados/esbozos, s/recubrir

  if (fraccion === '73041999') { // Los demás line pipe (sin alear)
    // NICO 01: De acero sin alear.
    // NICO 91: De diámetro exterior inferior o igual a 406.4 mm.
    // NICO 99: Los demás.
    if (esSinAlear && diametroExterior > 406.4) return '01'; // Asumiendo que 01 es para >406.4mm si es sin alear
    if (diametroExterior <= 406.4) return '91';
    return '99';
  }

  // Fracciones para Casing, Tubing, Drill Pipe (7304.22.xx, 7304.23.xx, 7304.24.xx, 7304.29.xx)
  if (fraccion === '73042204') { // Drill pipe, inoxidable
    // NICO 01: Roscados, de diámetro exterior superior o igual a 60.3 mm (2 3/8") pero inferior o igual a 168.3 mm (6 5/8").
    // NICO 02: De diámetro exterior inferior o igual a 35.6 mm (1.4"), espesor de pared superior o igual a 3.3 mm e inferior o igual a 3.5 mm, con los extremos recalcados.
    // NICO 03: Semiterminados o esbozos, sin roscar, de diámetro exterior superior o igual a 60.3 mm (2 3/8") pero inferior o igual a 168.3 mm (6 5/8").
    // NICO 99: Los demás.
    if (roscado && diametroExterior >= 60.3 && diametroExterior <= 168.3) return '01';
    if (diametroExterior <= 35.6 && espesorPared >= 3.3 && espesorPared <= 3.5 && recalentadoExtremos) return '02';
    if (semiterminado && !roscado && diametroExterior >= 60.3 && diametroExterior <= 168.3) return '03';
    return '99';
  }
  if (fraccion === '73042304') return defaultNICO; // Drill pipe, otros aleados, estándar, roscado
  if (fraccion === '73042399') { // Drill pipe, otros aleados, los demás
    // NICO 01: De diámetro exterior inferior o igual a 35.6 mm (1.4"), espesor de pared superior o igual a 3.3 mm e inferior o igual a 3.5 mm, con los extremos recalcados.
    // NICO 02: Semiterminados o esbozos.
    // NICO 99: Los demás.
    if (diametroExterior <= 35.6 && espesorPared >= 3.3 && espesorPared <= 3.5 && recalentadoExtremos) return '01';
    if (semiterminado) return '02';
    return '99';
  }
  if (fraccion === '73042491') { // Casing/Tubing, inoxidable, los demás
    // NICO 01: "Casing" roscados, D.E. >= 114.3mm (4 1/2") y <= 346.1mm (13 5/8").
    // NICO 02: "Casing" roscados, D.E. >= 406.4mm (16") y <= 508mm (20").
    // NICO 03: "Casing" sin roscar, D.E. >= 114.3mm (4 1/2") y <= 346.1mm (13 5/8").
    // NICO 04: "Casing" sin roscar, D.E. >= 406.4mm (16") y <= 508mm (20").
    // NICO 05: "Tubing" roscados.
    // NICO 06: "Tubing" sin roscar.
    // NICO 99: Los demás.
    if (textoGeneral.includes('casing')) {
      if (roscado) {
        if (diametroExterior >= 114.3 && diametroExterior <= 346.1) return '01';
        if (diametroExterior >= 406.4 && diametroExterior <= 508) return '02';
      } else { // sin roscar
        if (diametroExterior >= 114.3 && diametroExterior <= 346.1) return '03';
        if (diametroExterior >= 406.4 && diametroExterior <= 508) return '04';
      }
    }
    if (textoGeneral.includes('tubing')) {
      if (roscado) return '05';
      return '06'; // sin roscar
    }
    return '99';
  }
  if (fraccion === '73042999') { // Casing/Tubing, de los demás aceros (no aleados o aleados no inox, según contexto de la partida)
    // NICOs 01-06 iguales a 7304.24.91
    // NICO 91: Los demás "casing".
    if (textoGeneral.includes('casing')) {
      if (roscado) {
        if (diametroExterior >= 114.3 && diametroExterior <= 346.1) return '01';
        if (diametroExterior >= 406.4 && diametroExterior <= 508) return '02';
      } else {
        if (diametroExterior >= 114.3 && diametroExterior <= 346.1) return '03';
        if (diametroExterior >= 406.4 && diametroExterior <= 508) return '04';
      }
      return '91'; // Los demás casing
    }
    if (textoGeneral.includes('tubing')) {
      if (roscado) return '05';
      return '06';
    }
    return '99';
  }

  // Los demás tubos sin costura, sección circular, de hierro o acero sin alear (7304.31.xx, 7304.39.xx)
  if (fraccion === '73043101' || fraccion === '73043110') { // Estirados/Laminados en frío, s/alear
    // NICO 01: Estructurales.
    // NICO 99: Los demás.
    if (textoGeneral.includes('estructural')) return '01';
    return '99';
  }
  if (fraccion === '73043199') { // Los demás, estirados/laminados en frío, s/alear
    // NICO 01: Barras huecas, D.E. > 30mm y <= 50mm.
    // NICO 02: Barras huecas, D.E. > 50mm.
    // NICO 03: Serpentines.
    // NICO 04: Con aletas o birlos.
    // NICO 05: Al carbono, D.E. > 120mm.
    // ... y más NICOs. Lógica muy específica.
    if (textoGeneral.includes('barra hueca')) {
        if (diametroExterior > 30 && diametroExterior <= 50) return '01';
        if (diametroExterior > 50) return '02';
    }
    if (textoGeneral.includes('serpentin')) return '03';
    if (textoGeneral.includes('aleta') || textoGeneral.includes('birlo')) return '04';
    if (textoGeneral.includes('caldera') || textoGeneral.includes('intercambiador') || textoGeneral.includes('condensador') || textoGeneral.includes('horno') || textoGeneral.includes('agua')) return '91';
    return '99';
  }
  if (fraccion === '73043901' || fraccion === '73043902' || fraccion === '73043903' || fraccion === '73043904' ||
      fraccion === '73043908' || fraccion === '73043909' || fraccion === '73043910' || fraccion === '73043911' ||
      fraccion === '73043912' || fraccion === '73043913' || fraccion === '73043914' || fraccion === '73043915' ||
      fraccion === '73043916' || fraccion === '73043991' || fraccion === '73043992') {
    // Muchas de estas fracciones son muy específicas y tienen NICO 00.
    return defaultNICO;
  }
  if (fraccion === '73043999') { // Los demás, s/alear (no frío)
    // NICO 01: Para usos térmicos o conducción, D.E. <= 60.3mm.
    // NICO 02: De D.E. > 114.3mm.
    // NICO 91: De D.E. <= 60.3mm.
    // NICO 92: De D.E. > 60.3mm y <= 114.3mm, excepto mecánicos.
    // NICO 99: Los demás.
    if ((textoGeneral.includes('termico') || textoGeneral.includes('conduccion')) && diametroExterior <= 60.3) return '01';
    if (diametroExterior > 114.3) return '02';
    if (diametroExterior <= 60.3) return '91';
    if (diametroExterior > 60.3 && diametroExterior <= 114.3 && !textoGeneral.includes('mecanico')) return '92';
    return '99';
  }

  // Los demás tubos sin costura, sección circular, de acero inoxidable (7304.41.xx, 7304.49.xx)
  if (fraccion === '73044103') { // Estirados/Laminados en frío, inoxidable
    // NICO 01: Serpentines.
    // NICO 02: De D.E. < 19mm.
    // NICO 99: Los demás.
    if (textoGeneral.includes('serpentin')) return '01';
    if (diametroExterior > 0 && diametroExterior < 19) return '02';
    return '99';
  }
  if (fraccion === '73044999') { // Los demás, inoxidable (no frío)
    // NICO 01: Serpentines.
    // NICO 99: Los demás.
    if (textoGeneral.includes('serpentin')) return '01';
    return '99';
  }

  // Los demás tubos sin costura, sección circular, de otros aceros aleados (7304.51.xx, 7304.59.xx)
  if (fraccion === '73045112') { // Estirados/Laminados en frío, otros aleados
    // NICOs 01-11 y 91, 99 basados en uso (mecánico, estructural, barra hueca, serpentín, aletado, 52100, caldera, aeronave, zuncho, semiterminado, térmico/conducción).
    // Lógica muy detallada. Ejemplo:
    if (textoGeneral.includes('mecanico') || textoGeneral.includes('estructural')) return '01'; // Simplificado
    if (textoGeneral.includes('caldera') || textoGeneral.includes('astm') || textoGeneral.includes('asme') || props.usoTecnico === "termico_caldera") return '07';
    return '99';
  }
  if (fraccion === '73045909') return defaultNICO; // Con aletas o birlos, otros aleados (no frío)
  if (fraccion === '73045999') { // Los demás, otros aleados (no frío)
    // NICOs 01-14 y 91, 92, 99 basados en uso y dimensiones.
    // NICO 13: Para calderas, sobrecalentadores, intercambiadores, etc.
    if (props.usoTecnico === "termico_caldera" || textoGeneral.includes('caldera') || textoGeneral.includes('sobrecalentador') || textoGeneral.includes('intercambiador') || textoGeneral.includes('horno')) return '13';
    if (textoGeneral.includes('mecanico') || textoGeneral.includes('estructural')) {
        if (diametroExterior <= 114.3) return '01';
        if (diametroExterior > 114.3 && diametroExterior <= 355.6) return '02';
        if (diametroExterior > 355.6 && diametroExterior <= 550) return '14';
    }
    return '99';
  }

  // Los demás tubos y perfiles huecos, sin costura (e.g. no circulares) (7304.90.xx)
  if (fraccion === '73049099' || fraccion === '73049000') return defaultNICO; // Fracción .90.99 o .90.00

  // --- Los demás tubos (e.g. soldados) de gran diámetro (>406.4mm) (Partida 73.05) ---
  if (fraccion === '73051102') { // Line pipe, soldados arco sumergido
    // NICO 01: Espesor < 50.8mm.
    // NICO 02: Espesor >= 4.77mm y <= 25.4mm, D.E. <= 1219.2mm.
    // NICO 99: Los demás.
    if (espesorPared < 50.8 && espesorPared > 0) return '01';
    if (espesorPared >= 4.77 && espesorPared <= 25.4 && diametroExterior <= 1219.2) return '02';
    return '99';
  }
  if (fraccion === '73051291') { // Line pipe, soldados longitudinalmente (no arco sumergido)
    // NICOs iguales a 7305.11.02
    if (espesorPared < 50.8 && espesorPared > 0) return '01';
    if (espesorPared >= 4.77 && espesorPared <= 25.4 && diametroExterior <= 1219.2) return '02';
    return '99';
  }
  if (fraccion === '73051999') { // Line pipe, los demás (e.g. helicoidal)
    // NICO 01: Espesor < 50.8mm.
    // NICO 99: Los demás.
    if (espesorPared < 50.8 && espesorPared > 0) return '01';
    return '99';
  }
  if (fraccion === '73052001' || fraccion === '73052099') return defaultNICO; // Casing para extracción petróleo/gas
  // Los demás tubos soldados, gran diámetro
  if (fraccion.startsWith('730531') || fraccion.startsWith('730539')) {
    // Muchas fracciones específicas aquí, la mayoría NICO 00.
    // Ej. 7305.31.01 (Galvanizados), 7305.31.02 (Inox DE > 1220mm), etc.
    return defaultNICO;
  }
  if (fraccion === '73059099') { // Los demás tubos (e.g. sin costura no clasificados antes en 7305)
    // NICO 01: Espesor > 50.8mm.
    // NICO 99: Los demás.
    if (espesorPared > 50.8) return '01';
    return '99';
  }

  // --- Los demás tubos y perfiles huecos (e.g. soldados, diámetro <= 406.4mm) (Partida 73.06) ---
  if (fraccion === '73061101') return defaultNICO; // Line pipe, inoxidable
  if (fraccion === '73061999') { // Line pipe, los demás aceros
    // NICO 01: D.E. >= 114.3mm (4 1/2").
    // NICO 02: Soldados longitudinalmente.
    // NICO 99: Los demás.
    if (diametroExterior >= 114.3) return '01';
    if (costura.includes('longitudinal')) return '02';
    return '99';
  }
  if (fraccion === '73062101') return defaultNICO; // Casing/Tubing, inoxidable
  if (fraccion === '73062999') return defaultNICO; // Casing/Tubing, los demás aceros

  // Los demás, soldados, sección circular
  if (fraccion === '73063002') return defaultNICO; // Dimensiones específicas (bajo C, galv. inmersión, D.E. 3.92-4.08mm, esp. 0.51-0.77mm)
  if (fraccion === '73063003' || fraccion === '73063004') return defaultNICO; // Galvanizados, por espesor (<1.65mm o >=1.65mm)
  if (fraccion === '73063099') { // Los demás, s/alear, soldados, circular (no galv. esp. o dimensiones de arriba)
    // NICO 01: Para calderas, intercambiadores, condensadores, refinación o calentadores de agua.
    // NICO 02: Para postes de alumbrado público, de sección cónica.
    // NICO 03: Pintados.
    // NICO 04: Para sistemas contra incendio.
    // NICO 05: Para conducción de fluidos.
    // NICO 06: Para la industria automotriz.
    // NICO 91: De espesor inferior a 1.65 mm, o rolados en frío.
    // NICO 99: Los demás.
    if (textoGeneral.includes('caldera') || textoGeneral.includes('intercambiador') || textoGeneral.includes('condensador') || textoGeneral.includes('refinacion') || textoGeneral.includes('calentador agua')) return '01';
    if (textoGeneral.includes('poste alumbrado') || (textoGeneral.includes('seccion conica') && textoGeneral.includes('iluminacion'))) return '02';
    if (recubrimiento.includes('pintado')) return '03';
    if (textoGeneral.includes('contra incendio')) return '04';
    if (textoGeneral.includes('conduccion fluido')) return '05';
    if (textoGeneral.includes('automotriz')) return '06';
    if (espesorPared > 0 && espesorPared < 1.65 || props.procesoLaminado === 'frio') return '91';
    return '99';
  }
  if (fraccion === '73064001') return defaultNICO; // Soldados, circular, inoxidable, D.E. 0.2-1.5mm para conducción eléctrica/refrigeración
  if (fraccion === '73064099') return defaultNICO; // Los demás soldados, circular, inoxidable
  if (fraccion === '73065001') return defaultNICO; // Soldados, circular, otros aleados, doble pared, cobrizados por fusión (brazing)
  if (fraccion === '73065099') { // Los demás soldados, circular, otros aleados
    // NICO 01: Para calderas, intercambiadores, etc.
    // NICO 02: Para postes de alumbrado público, cónicos.
    // NICO 99: Los demás.
    if (textoGeneral.includes('caldera') || textoGeneral.includes('intercambiador') || textoGeneral.includes('refinacion') || textoGeneral.includes('agua')) return '01';
    if (textoGeneral.includes('poste alumbrado') || (textoGeneral.includes('seccion conica') && textoGeneral.includes('iluminacion'))) return '02';
    return '99';
  }
  // Los demás, soldados, sección no circular
  if (fraccion === '73066101') { // Sección cuadrada o rectangular
    // NICO 01: De espesor de pared superior o igual a 4 mm.
    // NICO 02: De acero inoxidable, de espesor de pared inferior a 4 mm.
    // NICO 03: Galvanizados, de espesor de pared superior o igual a 4 mm.
    // NICO 91: Galvanizados.
    // NICO 99: Los demás.
    if (espesorPared >= 4) {
        return recubrimiento.includes('galvanizado') ? '03' : '01';
    }
    if (esInoxidable && espesorPared < 4) return '02';
    if (recubrimiento.includes('galvanizado')) return '91';
    return '99';
  }
  if (fraccion === '73066999') { // Las demás secciones no circulares (e.g. oval, elíptica)
    // NICO 01: De espesor de pared superior o igual a 4 mm.
    // NICO 02: De acero inoxidable, de espesor de pared inferior a 4 mm.
    // NICO 99: Los demás.
    if (espesorPared >= 4) return '01';
    if (esInoxidable && espesorPared < 4) return '02';
    return '99';
  }
  if (fraccion === '73069099') return defaultNICO; // Los demás tubos (e.g. abiertos, remachados)

  // --- Accesorios de tubería (Partida 73.07) ---
  if (fraccion === '73071102') return defaultNICO; // Moldeados, de fundición no maleable
  if (fraccion === '73071999') { // Moldeados, los demás
    // NICO 01: Sin recubrimiento.
    // NICO 02: Con recubrimiento metálico.
    // NICO 03: Boquillas o espreas.
    // NICO 99: Los demás.
    if (recubrimiento === '-' || recubrimiento === 'sin recubrimiento') return '01';
    if (recubrimiento !== '-' && !recubrimiento.includes('plastico') && !recubrimiento.includes('pintado') && !recubrimiento.includes('barnizado')) return '02'; // Asume recubrimiento metálico
    if (textoGeneral.includes('boquilla') || textoGeneral.includes('esprea')) return '03';
    return '99';
  }
  // Accesorios no moldeados (de acero)
  const fracciones7307Acero = [
    '73072101', '73072202', '73072301', '73072399', '73072999', // Inoxidable
    '73079101', '73079202' // Los demás aceros (no inox)
  ];
  if (fracciones7307Acero.includes(fraccion)) return defaultNICO;

  if (fraccion === '73079301') { // Accesorios para soldar a tope, los demás aceros
    // NICO 01: De acero según la norma ASTM A234, grados WPB, WPC, WP1, WP11, WP12, WP22, WP5, WP9 o WP91; o sus equivalentes, del tipo codo, te, reducción, tapa ("cap") o cruz.
    // NICO 99: Los demás.
    if ((norma.includes('astm') && norma.includes('a234')) && (textoGeneral.includes('codo') || textoGeneral.includes('te') || textoGeneral.includes('reduccion') || textoGeneral.includes('tapa') || textoGeneral.includes('cruz'))) return '01';
    return '99';
  }
  if (fraccion === '73079999') { // Los demás accesorios, los demás aceros
    // NICOs 01, 02, 03, 99 iguales a 7307.19.99
    if (recubrimiento === '-' || recubrimiento === 'sin recubrimiento') return '01';
    if (recubrimiento !== '-' && !recubrimiento.includes('plastico') && !recubrimiento.includes('pintado') && !recubrimiento.includes('barnizado')) return '02';
    if (textoGeneral.includes('boquilla') || textoGeneral.includes('esprea')) return '03';
    return '99';
  }

  // --- Construcciones y sus partes (Partida 73.08) ---
  if (fraccion === '73081001') return defaultNICO; // Puentes y sus partes
  if (fraccion === '73082002') { // Torres y castilletes
    // NICO 01: Torres para conducción de energía eléctrica o telecomunicaciones.
    // NICO 99: Los demás.
    if (textoGeneral.includes('torre') && (textoGeneral.includes('energia electrica') || textoGeneral.includes('telecomunicacion'))) return '01';
    return '99';
  }
  if (fraccion === '73083002') { // Puertas, ventanas, y sus marcos, contramarcos y umbrales
    // NICO 01: Puertas, ventanas o marcos.
    // NICO 99: Los demás.
    if (textoGeneral.includes('puerta') || textoGeneral.includes('ventana') || textoGeneral.includes('marco')) return '01';
    return '99';
  }
  if (fraccion === '73084001') return defaultNICO; // Material de andamiaje, encofrado, apeo o apuntalamiento
  if (fraccion === '73089001' || fraccion === '73089002') return defaultNICO; // Barandales, escaleras, armaduras
  if (fraccion === '73089099') { // Las demás construcciones y partes
    // NICO 01: Paneles de acero con material aislante en ambas caras, para cámaras frigoríficas o edificios prefabricados tipo "sándwich".
    // NICO 99: Los demás.
    if ((textoGeneral.includes('panel') && textoGeneral.includes('aislante')) || textoGeneral.includes('sandwich')) return '01';
    return '99';
  }

  // --- Depósitos, cisternas, etc. (Partidas 73.09, 73.10, 73.11) ---
  if (fraccion === '73090004') { // Depósitos, etc. para cualquier materia (excepto gas) > 300 L, sin disp. mecánicos ni térmicos
    // NICO 01: Con revestimiento interior de esmalte vítreo, vidrio o resinas epóxicas.
    // NICO 99: Los demás.
    if (textoGeneral.includes('esmalte vitreo') || textoGeneral.includes('vidrio') || textoGeneral.includes('resina epoxica')) return '01';
    return '99';
  }
  if (fraccion === '73101005') { // Recipientes <= 300 L, para cualquier materia (excepto gas), capacidad >= 50 L
    // NICO 01: Tambores o barriles.
    // NICO 02: Barriles para cerveza.
    // NICO 99: Los demás.
    if (textoGeneral.includes('cerveza') && textoGeneral.includes('barril')) return '02';
    if (textoGeneral.includes('tambor') || textoGeneral.includes('barril')) return '01';
    return '99';
  }
  if (fraccion === '73102101') return defaultNICO; // Latas que se cierran por soldadura o sertido, capacidad < 50 L
  if (fraccion === '73102901' || fraccion === '73102905') return defaultNICO; // Recipientes < 50L, con tapa desmontable / barriles de inox
  if (fraccion === '73102999') { // Los demás recipientes < 50 L
    // NICO 01: De hojalata o de chapa cromada (« TFS »).
    // NICO 99: Los demás.
    if (textoGeneral.includes('hojalata') || textoGeneral.includes('chapa cromada') || textoGeneral.includes('tfs')) return '01';
    return '99';
  }
  if (fraccion === '73110005') { // Recipientes para gases comprimidos o licuados
    // NICO 01: Cilíndricos, presión de trabajo superior a 5.25 kg/cm2 (75 psi), excepto lo comprendido en el NICO 02.
    // NICO 02: Sin costura, con capacidad superior a 100 litros.
    // NICO 99: Los demás.
    // Asumimos que la presión de trabajo se extrae si es relevante.
    const presionTrabajoKgCm2 = props.presionTrabajoKgCm2 || 0;
    const capacidadLitros = props.capacidadLitros || 0;
    if (presionTrabajoKgCm2 > 5.25 && !(costura.includes('sin costura') && capacidadLitros > 100)) return '01';
    if (costura.includes('sin costura') && capacidadLitros > 100) return '02';
    return '99';
  }

  // --- Cables, trenzas, eslingas y artículos sim. (Partida 73.12) ---
  if (fraccion === '73121001') return defaultNICO; // Cables de acero inoxidable, galvanizados
  if (fraccion === '73121005') { // Cables (torones) de acero sin alear, sin revestir o revestidos de cinc
    // NICOs 01, 02, 99 por diámetro
    if (diametro > 0 && diametro < 9.53) return '01';
    if (diametro >= 9.53 && diametro < 25.4) return '02';
    return '99';
  }
  if (fraccion === '73121007') return defaultNICO; // Cables galvanizados para la industria pesquera o minera
  if (fraccion === '73121008') { // Torones para estructuras preesforzadas
    // NICO 01: Para estructuras preesforzadas.
    // NICO 99: Los demás.
    if (textoGeneral.includes('preesforzado') || textoGeneral.includes('pretensado') || textoGeneral.includes('postensado')) return '01';
    return '99';
  }
  if (fraccion === '73121099') { // Los demás cables (torones)
    // NICOs 01-07, 99 basados en tipo (Bowden, latonado, trenzado, plastificado) y diámetro.
    // Lógica muy específica.
    if (textoGeneral.includes('bowden')) return '01';
    if (textoGeneral.includes('plastificado')) return '04';
    return '99'; // Simplificado
  }
  if (fraccion === '73129099') return defaultNICO; // Los demás (trenzas, eslingas, etc.)

  // --- Alambre de púas; alambre o fleje retorcidos, etc. (Partida 73.13) ---
  if (fraccion === '73130001') return defaultNICO; // Alambre de púas; alambre o fleje, retorcidos (incluso con púas) para cercar

  if (DEBUG) console.warn(`[NICO Cap73] Fracción ${fraccion} no tiene reglas NICO específicas implementadas. Retornando ${defaultNICO}.`);
  return defaultNICO;
}

module.exports = {
  determinarNICO_Cap73
};