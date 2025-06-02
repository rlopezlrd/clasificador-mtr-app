// determinarNICO_Cap72.js
// Esta función evalúa el NICO correcto basado en fracción y propiedades para capítulo 72

const DEBUG = process.env.DEBUG === 'true'; // Use environment variable for DEBUG

function determinarNICO_Cap72(fraccion, props) {
  // Log #1: ¿Qué 'props' está recibiendo esta función?
  if (DEBUG) {
    console.log(`[NICO Cap72 - INICIO] Llamada para fraccion: ${fraccion}. props.tipoProducto entrante: "${props ? props.tipoProducto : 'props es undefined o null'}"`);
    if (props && typeof props.tipoProducto !== 'string' && props.tipoProducto !== null && props.tipoProducto !== undefined) {
        console.error(`[NICO Cap72 - INICIO - ERROR TIPO] props.tipoProducto NO ES STRING, NULL O UNDEFINED. Es: ${typeof props.tipoProducto}, Valor:`, props.tipoProducto);
    }
  }

  // Línea de declaración original. Hacerla más explícita para depuración
  let tipoProductoLocalCrudo;
  if (props && props.tipoProducto !== undefined && props.tipoProducto !== null) {
      tipoProductoLocalCrudo = String(props.tipoProducto); // Asegurar que es string antes de toLowerCase
  } else {
      tipoProductoLocalCrudo = '';
  }
  const tipoProducto = tipoProductoLocalCrudo.toLowerCase();


  // Log #2: ¿Cuál es el valor de la constante local 'tipoProducto'?
  if (DEBUG) {
    console.log(`[NICO Cap72 - INICIO] Constante local 'tipoProducto' (después de toLowerCase): "${tipoProducto}"`);
  }



  const texto = `${props.descripcion || ''} ${props.usoTecnico || ''} ${props.observaciones || ''}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const composicion = props.composicion || {};
  const carbono = composicion.carbono; // Puede ser undefined si no está presente
  const norma = (props.norma || '').toLowerCase();
  const espesor = props.espesor || 0;
  const ancho = props.ancho || 0;
  const resistencia = props.resistencia || 0; // Límite de resistencia a la tracción en MPa
  // const galvanizado = props.recubrimiento?.toLowerCase().includes('galvanizado'); // No se usa directamente aquí, el recubrimiento ya influyó en la fracción.
  const diametro = props.diametroExterior || 0; // Para alambrón, barras, etc.
  // const seccion = props.seccionTransversal || 0; // 'seccionTransversal' no es una prop estándar, usar formaTransversal o dimensiones.
  const forma = (props.formaFisica || '').toLowerCase();
  const formaTransversal = (props.formaTransversal || '').toLowerCase();
  const peralte = props.peralte || props.altura || 0; // Para perfiles
  // const altura = props.altura || 0; // 'altura' es sinónimo de 'peralte' para perfiles
  const serie = props.serie || null;  // Para aceros inoxidables: e.g., '200', '300', '400'. Debe ser string o numérico.
                                      // Asegurarse que 'serie' se extraiga en analizarPropiedades si es necesario.
  const enrollado = props.esEnrollado || false;
  const decapado = (props.acabado || '').toLowerCase().includes('decapado');

  if (DEBUG) {
    console.log('[NICO Cap72] Fracción:', fraccion, 'Props:', props, 'Texto normalizado:', texto);
    if (serie) console.log('[NICO Cap72] Serie Inox detectada:', serie);
  }

  // NICO por defecto si no se encuentra una regla específica.
  // '00' es generalmente el NICO para "Los demás" o cuando no hay subdivisiones.
  const defaultNICO = '00';

  // 7201.10.01 – Fundición en bruto sin alear con fósforo ≤ 0.5%
  if (fraccion === '72011001') return defaultNICO;

  // 7201.20.01 – Fundición en bruto sin alear con fósforo > 0.5%
  if (fraccion === '72012001') return defaultNICO;

  // 7201.50.02 – Fundición en bruto aleada; fundición especular
  if (fraccion === '72015002') return defaultNICO;

  // 7202.11.01 – Ferromanganeso, C > 2%
  if (fraccion === '72021101') return defaultNICO;

  // 7202.19.99 – Los demás ferromanganesos (C <= 2%)
  if (fraccion === '72021999') {
    // NICO 01: Con un contenido de carbono, en peso, inferior o igual al 1%.
    // NICO 99: Los demás.
    if (carbono !== undefined && carbono <= 0.01) return '01'; // 1% = 0.01
    return '99';
  }

  // 7202.21.02 – Ferrosilicio, Si > 55%
  if (fraccion === '72022102') return defaultNICO;

  // 7202.29.99 – Los demás ferrosilicios (Si <= 55%)
  if (fraccion === '72022999') return defaultNICO;

  // 7202.30.01 – Ferro-sílico-manganeso
  if (fraccion === '72023001') return defaultNICO;

  // 7202.41.01 – Ferrocromo, C > 4%
  if (fraccion === '72024101') return defaultNICO;

  // 7202.49.99 – Los demás ferrocromos (C <= 4%)
  if (fraccion === '72024999') return defaultNICO;

  // 7202.50.01 – Ferro-sílico-cromo
  if (fraccion === '72025001') return defaultNICO;

  // 7202.60.01 – Ferroníquel
  if (fraccion === '72026001') return defaultNICO;

  // 7202.70.01 – Ferromolibdeno
  if (fraccion === '72027001') return defaultNICO;

  // 7202.80.01 – Ferrovolframio y ferro-sílico-volframio
  if (fraccion === '72028001') return defaultNICO;

  // 7202.91.04 – Ferrotitanio y ferro-sílico-titanio
  if (fraccion === '72029104') {
    // NICO 01: Encapsulados para la industria siderúrgica.
    // NICO 02: Ferrosilicotitanio.
    // NICO 03: Los demás.
    if (texto.includes('encapsulado')) return '01';
    if (texto.includes('silicotitanio') || texto.includes('silico-titanio')) return '02';
    return '03';
  }

  // 7202.92.02 – Ferrovanadio
  if (fraccion === '72029202') return defaultNICO;

  // 7202.93.01 – Ferroniobio
  if (fraccion === '72029301') return defaultNICO;

  // 7202.99.99 – Las demás ferroaleaciones
  if (fraccion === '72029999') {
    // NICO 01: Ferrocalciosilicio, sin encapsular.
    // NICO 02: Ferrocalcioaluminio o ferrocalciosilicioaluminio, encapsulados para la industria siderúrgica.
    // NICO 03: Ferroboro o ferrofósforo.
    // NICO 99: Las demás.
    if (texto.includes('ferrocalciosilicio') && !texto.includes('encapsulado') && !texto.includes('aluminio')) return '01';
    if ((texto.includes('ferrocalcioaluminio') || (texto.includes('ferrocalciosilicioaluminio') || (texto.includes('ferrocalciosilicio') && texto.includes('aluminio')))) && texto.includes('encapsulado')) return '02';
    if (texto.includes('ferroboro') || texto.includes('ferrofosforo')) return '03';
    return '99';
  }

  // 7203.10.01 – Productos férreos obtenidos por reducción directa de minerales de hierro
  if (fraccion === '72031001') return defaultNICO;

  // 7203.90.99 – Los demás (productos férreos esponjosos; hierro pureza >= 99.94%)
  if (fraccion === '72039099') return defaultNICO;

  // Desperdicios y desechos (chatarra) - Partida 72.04
  if (fraccion.startsWith('7204')) return defaultNICO; // No suelen tener NICO más allá de la fracción

  // Granallas y polvo - Partida 72.05
  if (fraccion.startsWith('7205')) return defaultNICO;

  // Hierro y acero sin alear en lingotes o demás formas primarias - Partida 72.06
  if (fraccion.startsWith('7206')) return defaultNICO;

  // Productos intermedios (semiproductos) de hierro o acero sin alear - Partida 72.07
  if (fraccion === '72071101') return defaultNICO; // C < 0.25%, sección cuadrada/rectangular, anchura < 2x espesor
  if (fraccion === '72071291') { // Los demás, de sección transversal rectangular C < 0.25%
    // NICO 01: De espesor inferior o igual a 185 mm.
    // NICO 99: Los demás.
    if (espesor <= 185) return '01';
    return '99';
  }
  if (fraccion === '72071999') return defaultNICO; // Los demás, C < 0.25%
  if (fraccion === '72072002') { // Con un contenido de carbono >= 0.25%
    // NICO 01: De espesor inferior o igual a 185 mm y anchura superior o igual al doble del espesor.
    // NICO 99: Los demás.
    if (espesor <= 185 && ancho >= (2 * espesor)) return '01';
    return '99';
  }

  // Productos laminados planos, hierro/acero s/alear, >=600mm, CALIENTE, s/chapar, s/revestir - Partida 72.08
  if (fraccion === '72081003') { // Enrollados, con motivos en relieve
    // NICO 01: De espesor superior a 10 mm.
    // NICO 02: De espesor superior a 4.75 mm pero inferior o igual a 10 mm.
    // NICO 03: De espesor inferior o igual a 4.75 mm, sin decapar.
    // NICO 99: Los demás. (e.g. esp <= 4.75mm, decapados)
    if (espesor > 10) return '01';
    if (espesor > 4.75 && espesor <= 10) return '02';
    if (espesor <= 4.75 && !decapado) return '03';
    return '99';
  }




  
  if (fraccion === '72082502') { // Enrollados, decapados, espesor >= 4.75mm
    // NICO 01: De espesor superior a 10 mm.
    // NICO 99: Los demás (4.75mm <= espesor <= 10mm)
    if (espesor > 10) return '01';
    return '99';
  }
  const fracciones7208SimplesCaliente = ['72082601', '72082701', '72083601', '72083701', '72083801', '72083901'];
  if (fracciones7208SimplesCaliente.includes(fraccion)) {
    // NICO 01: De acero de alta resistencia (límite elástico >= 355 MPa).
    // NICO 02: Para fabricación de tubos de las partidas 73.04, 73.05 o 73.06, o para oleoductos o gasoductos.
    // NICO 99: Los demás.
    if (resistencia >= 355 || texto.includes('alta resistencia')) return '01';
    if (texto.includes('para tubos') || texto.includes('oleoducto') || texto.includes('gasoducto')) return '02';
    return '99';
  }
  if (fraccion === '72084002') { // Sin enrollar, con motivos en relieve
    // NICO 01: De espesor superior a 4.75 mm.
    // NICO 99: Los demás (espesor <= 4.75mm)
    if (espesor > 4.75) return '01';
    return '99';
  }
  if (fraccion === '72085104') { // Sin enrollar, esp > 10mm (los demás)
    // NICO 01: De espesor superior a 10 mm, excepto lo comprendido en los NICO 02, 03, 04 y 05.
    // NICO 02: De acero calidad SHT-80, SHT-110, AR-400 o SMM-400, o A-516 o equivalentes.
    // NICO 03: De espesor superior a 70 mm, de acero calidad A-36 o equivalente.
    // NICO 04: Normalizados, excepto lo comprendido en el NICO 02.
    // NICO 05: Para fabricación de tubos de las partidas 73.04, 73.05 o 73.06, o para oleoductos o gasoductos.
    // NICO 99: Los demás. (Este NICO parece que no debería existir si 01 es "excepto...")
    if (norma.includes('sht-80') || norma.includes('sht-110') || norma.includes('ar-400') || norma.includes('smm-400') || norma.includes('a-516')) return '02';
    if (espesor > 70 && (norma.includes('a-36') || texto.includes('a36'))) return '03';
    if (texto.includes('normalizado')) return '04'; // Asumiendo que "normalizado" es una propiedad que se extrae
    if (texto.includes('para tubos') || texto.includes('oleoducto') || texto.includes('gasoducto')) return '05';
    if (espesor > 10) return '01'; // Si no encaja en 02-05 y es > 10mm
    return '99'; // Fallback, aunque la nota del NICO 01 lo hace parecer exclusivo.
  }
  if (fraccion === '72085201' || fraccion === '72085301' || fraccion === '72085401' || fraccion === '72089099') {
    return defaultNICO; // Estas fracciones tienen un solo NICO '00' en muchas tarifas.
  }

  // Productos laminados planos, hierro/acero s/alear, >=600mm, FRÍO, s/chapar, s/revestir - Partida 72.09
  if (fraccion === '72091504') { // Enrollados, esp >= 3mm
    // NICO 01: Con un contenido de carbono superior o igual al 0.4% en peso.
    // NICO 02: De alta resistencia (límite elástico >= 355 MPa).
    // NICO 03: Aptos para ser esmaltados (porcelanizados).
    // NICO 99: Los demás.
    if (carbono !== undefined && carbono >= 0.004) return '01'; // 0.4% = 0.004 (asumiendo C es ej. 0.004 para 0.4%)
    if (resistencia >= 355 || texto.includes('alta resistencia')) return '02';
    if (texto.includes('para esmaltar') || texto.includes('porcelanizar')) return '03';
    return '99';
  }
  if (fraccion === '72091601' || fraccion === '72091701') { // Enrollados, 1mm < esp < 3mm ó 0.5mm <= esp <= 1mm
    // NICO 01: De alta resistencia (límite elástico >= 355 MPa).
    // NICO 99: Los demás.
    if (resistencia >= 355 || texto.includes('alta resistencia')) return '01';
    return '99';
  }
  if (fraccion === '72091801') { // Enrollados, esp < 0.5mm
    // NICO 01: "Placa negra" (Blackplate) de espesor inferior a 0.361 mm.
    // NICO 99: Los demás.
    if ((texto.includes('placa negra') || texto.includes('blackplate')) && espesor < 0.361) return '01';
    return '99';
  }
  if (['72092501', '72092601', '72092701', '72092801', '72099099'].includes(fraccion)) {
    return defaultNICO;
  }

  // Productos laminados planos, hierro/acero s/alear, >=600mm, CHAPADOS O REVESTIDOS - Partida 72.10
  if (fraccion === '72101101') return defaultNICO; // Estañados, esp >= 0.5mm
  if (fraccion === '72101204') { // Estañados, esp < 0.5mm
    // NICO 01: De espesor superior o igual a 0.20 mm, tipos T2, T3, T4 o T5, excepto lo comprendido en el NICO 03.
    // NICO 02: Tipos DR.
    // NICO 03: De espesor superior o igual a 0.20 mm, tipos T2, T3, T4 o T5, para fabricación de envases para pilas secas o de fondos o tapas para envases.
    // NICO 99: Los demás.
    const esTipoT = /t[2-5]/.test(norma) || /t[2-5]/.test(texto); // Asumiendo que el tipo T se encuentra en norma o descripción.
    const esTipoDR = /dr/.test(norma) || /dr/.test(texto);
    const esParaPilasEnvases = texto.includes('pilas secas') || texto.includes('fondos para envases') || texto.includes('tapas para envases');

    if (espesor >= 0.20 && esTipoT && esParaPilasEnvases) return '03';
    if (espesor >= 0.20 && esTipoT) return '01';
    if (esTipoDR) return '02';
    return '99';
  }
  if (fraccion === '72102001') return defaultNICO; // Emplomados
  if (fraccion === '72103002') { // Cincados electrolíticamente
    // NICO 01: Cincados por las dos caras.
    // NICO 99: Los demás.
    if (texto.includes('dos caras') || texto.includes('ambas caras')) return '01';
    return '99';
  }
  if (fraccion === '72104101' || fraccion === '72104199') return defaultNICO; // Cincados (inmersión), corrugados
  if (fraccion === '72104999') { // Cincados (inmersión), los demás (no corrugados)
    // NICO 01: De espesor inferior a 3 mm y límite de fluencia superior o igual a 275 MPa.
    // NICO 02: De alta resistencia (límite elástico >= 355 MPa).
    // NICO 99: Los demás.
    // Asumiendo que límite de fluencia y límite elástico son equivalentes para esta distinción.
    if (espesor < 3 && (resistencia >= 275 || texto.includes('limite fluencia'))) return '01'; // 'resistencia' aquí es elástico o fluencia
    if (resistencia >= 355 || texto.includes('alta resistencia')) return '02';
    return '99';
  }
  if (fraccion === '72105003') { // Revestidos de óxidos de cromo o cromo y óxidos de cromo
    // NICO 01: De espesor superior o igual a 0.20 mm, tipos T2, T3, T4 o T5.
    // NICO 02: Tipos DR.
    // NICO 99: Los demás.
    const esTipoT = /t[2-5]/.test(norma) || /t[2-5]/.test(texto);
    const esTipoDR = /dr/.test(norma) || /dr/.test(texto);
    if (espesor >= 0.20 && esTipoT) return '01';
    if (esTipoDR) return '02';
    return '99';
  }
  if (fraccion === '72106101') return defaultNICO; // Revestidos de aleaciones Al-Zn
  if (fraccion === '72106999') { // Revestidos de aluminio
    // NICO 01: Aluminizados.
    // NICO 99: Los demás.
    if (texto.includes('aluminizado')) return '01'; // Si el recubrimiento es solo aluminio
    return '99';
  }
  if (fraccion === '72107002') { // Pintados, barnizados o revestidos de plástico
    // NICO 01: Pintados por inmersión en caliente.
    // NICO 02: Sin revestimiento metálico previo, o plaqueados.
    // NICO 03: Con revestimiento metálico electrolítico.
    // NICO 91: Con revestimiento metálico por inmersión en caliente (cincados).
    // NICO 99: Los demás.
    if (texto.includes('pintado') && texto.includes('inmersion caliente')) return '01';
    if (texto.includes('sin revestimiento metalico') || texto.includes('plaqueado')) return '02';
    if (props.recubrimiento?.toLowerCase().includes('electrolitico') && (texto.includes('pintado') || texto.includes('barnizado') || texto.includes('plastico'))) return '03';
    if (props.recubrimiento?.toLowerCase().includes('inmersion') && (texto.includes('pintado') || texto.includes('barnizado') || texto.includes('plastico'))) return '91'; // Asumiendo que el revestimiento por inmersión es el metálico previo
    return '99';
  }
  if (fraccion === '72109099') { // Los demás (e.g. chapados)
    // NICO 01: Chapados con acero inoxidable.
    // NICO 91: Plaqueados.
    // NICO 99: Los demás.
    if (texto.includes('chapado') && texto.includes('acero inoxidable')) return '01';
    if (texto.includes('plaqueado')) return '91';
    return '99';
  }

  // Productos laminados planos, hierro/acero s/alear, <600mm, SIN revestir - Partida 72.11
  if (fraccion === '72111301') return defaultNICO; // Laminados en 4 caras (fleje universal), caliente, ancho > 150mm, esp >= 4mm, no enrollado
  if (fraccion === '72111491') { // Los demás, caliente, esp >= 4.75mm
    // NICO 01: Flejes, sin enrollar.
    // NICO 02: Laminados en caliente, de espesor superior o igual a 4.75 mm pero inferior a 12 mm, sin enrollar.
    // NICO 03: Enrollados.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje') && !enrollado) return '01';
    if (espesor >= 4.75 && espesor < 12 && !enrollado && props.procesoLaminado?.toLowerCase() === 'caliente') return '02';
    if (enrollado) return '03';
    return '99';
  }
  if (fraccion === '72111999') { // Los demás, caliente, esp < 4.75mm
    // NICO 01: Flejes, de espesor inferior a 4.75 mm.
    // NICO 02: Laminados en caliente, de espesor superior o igual a 1.9 mm pero inferior a 4.75 mm.
    // NICO 03: Desbastes en rollo ("Coil breaks").
    // NICO 04: De espesor superior o igual a 1.9 mm pero inferior a 4.75 mm y anchura superior a 500 mm pero inferior a 600 mm.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje') && espesor < 4.75) return '01';
    if (espesor >= 1.9 && espesor < 4.75 && props.procesoLaminado?.toLowerCase() === 'caliente') return '02';
    if (texto.includes('desbaste rollo') || texto.includes('coil break')) return '03';
    if (espesor >= 1.9 && espesor < 4.75 && ancho > 500 && ancho < 600) return '04';
    return '99';
  }
  if (fraccion === '72112303') { // Laminados en frío, C < 0.25%
    // NICO 01: Flejes, de espesor superior o igual a 0.05 mm.
    // NICO 02: Laminados en frío, de espesor superior a 0.46 mm e inferior o igual a 3.4 mm.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje') && espesor >= 0.05) return '01';
    if (espesor > 0.46 && espesor <= 3.4 && props.procesoLaminado?.toLowerCase() === 'frio') return '02';
    return '99';
  }
  if (fraccion === '72112999') { // Los demás, laminados en frío (C >= 0.25%)
    // NICO 01: Flejes, de espesor superior o igual a 0.05 mm y con un contenido de carbono inferior al 0.6% en peso.
    // NICO 02: Flejes, con un contenido de carbono superior o igual al 0.6% en peso.
    // NICO 03: Laminados en frío, de espesor superior a 0.46 mm e inferior o igual a 3.4 mm.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje') && espesor >= 0.05 && carbono !== undefined && carbono < 0.006) return '01'; // 0.6%
    if (tipoProducto.toLowerCase().includes('fleje') && carbono !== undefined && carbono >= 0.006) return '02';
    if (espesor > 0.46 && espesor <= 3.4 && props.procesoLaminado?.toLowerCase() === 'frio') return '03';
    return '99';
  }
  if (fraccion === '72119099') return defaultNICO; // Los demás (trabajados posteriormente)

  // Productos laminados planos, hierro/acero s/alear, <600mm, CHAPADOS O REVESTIDOS - Partida 72.12
  if (fraccion === '72121003') { // Estañados
    // NICO 01: Flejes.
    // NICO 02: Chapa o lámina estañada (hojalata).
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje')) return '01';
    if (texto.includes('chapa estanada') || texto.includes('lamina estanada') || texto.includes('hojalata')) return '02';
    return '99';
  }
  if (fraccion === '72122003') { // Cincados electrolíticamente
    // NICO 01: Flejes.
    // NICO 02: Cincados por las dos caras y anchura superior a 500 mm.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje')) return '01';
    if ((texto.includes('dos caras') || texto.includes('ambas caras')) && ancho > 500) return '02';
    return '99';
  }
  if (fraccion === '72123003') { // Cincados de otro modo (inmersión)
      // Log #3: Justo antes de la línea que falla
    if (DEBUG) {
        console.log(`[NICO Cap72 - DEBUG 72123003] Fracción: ${fraccion}. Verificando constante local 'tipoProducto'. Valor: "${tipoProducto}"`);
    }
    // NICO 01: Flejes.
    // NICO 02: Cincados por las dos caras y anchura superior a 500 mm.
    // NICO 99: Los demás.
    if (tipoProducto.toLowerCase().includes('fleje')) return '01';
    if ((texto.includes('dos caras') || texto.includes('ambas caras')) && ancho > 500) return '02';
    return '99';
  }

  
  if (fraccion === '72124004') { // Pintados, barnizados o revestidos de plástico
    // NICO 01: Con barniz a base de silicona.
    // NICO 02: De espesor superior o igual a 0.075 mm e inferior o igual a 0.55 mm, revestidos de plástico.
    // NICO 03: Cincados por las dos caras y anchura superior a 500 mm.
    // NICO 99: Los demás.
    if (texto.includes('barniz') && texto.includes('silicona')) return '01';
    if (espesor >= 0.075 && espesor <= 0.55 && props.recubrimiento?.toLowerCase().includes('plastico')) return '02';
    if ((texto.includes('dos caras') || texto.includes('ambas caras')) && ancho > 500 && props.recubrimiento?.toLowerCase().includes('cincado')) return '03'; // Asumiendo que el cincado es el revestimiento base
    return '99';
  }
  if (fraccion === '72125001') return defaultNICO; // Revestidos de otro modo (cromo, aluminio)
  if (fraccion === '72126004') { // Chapados
    // NICO 01: Cromados, sin trabajar.
    // NICO 02: Flejes cobrizados de anchura inferior o igual a 100 mm, espesor inferior o igual a 0.6 mm y con un contenido de cobre superior o igual al 5% en peso.
    // NICO 03: Plaqueados con acero inoxidable.
    // NICO 99: Los demás.
    if (props.recubrimiento?.toLowerCase().includes('cromado') && !texto.includes('trabajado')) return '01';
    if (tipoProducto.toLowerCase().includes('fleje') && props.recubrimiento?.toLowerCase().includes('cobrizado') && ancho <= 100 && espesor <= 0.6 && (composicion.cobre !== undefined && composicion.cobre >= 0.05)) return '02';
    if (texto.includes('plaqueado') && texto.includes('acero inoxidable')) return '03';
    return '99';
  }

  // Alambrón, hierro/acero s/alear - Partida 72.13
  if (fraccion === '72131001') return defaultNICO; // Con muescas/relieves (para hormigón)
  if (fraccion === '72132091') return defaultNICO; // De acero de fácil mecanización
  if (fraccion === '72139103') { // Los demás, sección circular, D < 14mm
    // NICO 01: Con un contenido de carbono, en peso, inferior al 0.4%.
    // NICO 02: Con un contenido de carbono, en peso, superior o igual al 0.4%.
    if (carbono !== undefined && carbono < 0.004) return '01'; // 0.4%
    if (carbono !== undefined && carbono >= 0.004) return '02';
    return '99'; // Si C no está definido
  }
  if (fraccion === '72139999') { // Los demás alambrones (e.g. no circular, o circular D >= 14mm)
    // NICO 01: Con un contenido de carbono, en peso, inferior o igual al 0.13%, de silicio, en peso, inferior o igual al 0.10% y de aluminio, en peso, superior o igual al 0.02%.
    // NICO 02: De diámetro superior o igual a 19 mm.
    // NICO 99: Los demás.
    if (carbono !== undefined && carbono <= 0.0013 && (composicion.silicio !== undefined && composicion.silicio <= 0.0010) && (composicion.aluminio !== undefined && composicion.aluminio >= 0.0002)) return '01';
    if (diametro >= 19) return '02';
    return '99';
  }

  // Barras, hierro/acero s/alear - Partida 72.14
  if (fraccion === '72141001' || fraccion === '72142001' || fraccion === '72142099' || fraccion === '72143091') {
    return defaultNICO;
  }
  if (fraccion === '72149103') { // Las demás, simplemente laminadas/extrudidas en caliente, sección rectangular
    // NICO 01: Con un contenido de carbono inferior al 0.25% en peso y la mayor dimensión de la sección transversal inferior o igual a 80 mm.
    // NICO 02: Con un contenido de carbono superior o igual al 0.25% pero inferior al 0.6%, en peso.
    // NICO 91: Con un contenido de carbono inferior al 0.25% en peso.
    // NICO 99: Las demás.
    // Necesitaríamos 'mayor dimensión de la sección transversal'. Usamos 'ancho' o 'espesor' como proxy.
    const mayorDimension = Math.max(ancho, espesor);
    if (carbono !== undefined && carbono < 0.0025 && mayorDimension <= 80) return '01';
    if (carbono !== undefined && carbono >= 0.0025 && carbono < 0.006) return '02';
    if (carbono !== undefined && carbono < 0.0025) return '91';
    return '99';
  }
  if (fraccion === '72149999') { // Las demás barras (e.g. sección circular, cuadrada), simplemente laminadas/extrudidas en caliente
    // NICO 01: De sección redonda, con un contenido de carbono inferior al 0.25% en peso.
    // NICO 02: De sección cuadrada, con un contenido de carbono inferior al 0.25% en peso.
    // NICO 03: De sección redonda, con un contenido de carbono superior o igual al 0.25% pero inferior al 0.6%, en peso.
    // NICO 04: De sección redonda, con un contenido de carbono superior o igual al 0.6% en peso.
    // NICO 91: Con un contenido de carbono inferior al 0.25% en peso.
    // NICO 92: Con un contenido de carbono superior o igual al 0.25% pero inferior al 0.6%, en peso.
    // NICO 99: Las demás.
    if (formaTransversal.includes('redonda') || formaTransversal.includes('circular')) {
      if (carbono !== undefined && carbono < 0.0025) return '01';
      if (carbono !== undefined && carbono >= 0.0025 && carbono < 0.006) return '03';
      if (carbono !== undefined && carbono >= 0.006) return '04';
    }
    if (formaTransversal.includes('cuadrada')) {
      if (carbono !== undefined && carbono < 0.0025) return '02';
    }
    // Fallbacks generales por carbono
    if (carbono !== undefined && carbono < 0.0025) return '91';
    if (carbono !== undefined && carbono >= 0.0025 && carbono < 0.006) return '92';
    return '99';
  }

  // Las demás barras, hierro/acero s/alear (no 72.14) - Partida 72.15
  if (fraccion === '72151001') return defaultNICO; // De fácil mecanización, simplemente obtenidas/acabadas en frío
  if (fraccion === '72155091') { // Simplemente obtenidas/acabadas en frío (no fácil mec.)
    // NICO 01: Macizas, revestidas de aluminio o de cobre.
    // NICO 99: Las demás.
    if (texto.includes('maciza') && (props.recubrimiento?.toLowerCase().includes('aluminio') || props.recubrimiento?.toLowerCase().includes('cobre'))) return '01';
    return '99';
  }
  if (fraccion === '72159099') { // Las demás (e.g. forjadas y obtenidas/acabadas en frío)
    // NICO 01: Laminadas en caliente, plaqueadas o revestidas con metal.
    // NICO 99: Las demás.
    if (props.procesoLaminado?.toLowerCase() === 'caliente' && (texto.includes('plaqueada') || (props.recubrimiento && props.recubrimiento !== '-' && props.recubrimiento !== 'sin recubrimiento'))) return '01';
    return '99';
  }

  // Perfiles, hierro/acero s/alear - Partida 72.16
  // Muchos NICOs aquí dependen de dimensiones muy específicas que pueden no estar en `props` de forma estándar.
  // Se simplificará o se usará `defaultNICO`.
  if (fraccion === '72161001') { // U, I o H, caliente, altura < 80mm
    // NICO 01: Perfiles en U.
    // NICO 99: Los demás.
    if (formaTransversal.includes('u')) return '01';
    return '99';
  }
  if (fraccion === '72162101') { // L, caliente, altura < 80mm
    // NICO 01: De altura inferior o igual a 50 mm.
    // NICO 99: Los demás.
    if (peralte <= 50) return '01';
    return '99';
  }
  if (fraccion === '72162201') return defaultNICO; // T, caliente, altura < 80mm
  if (fraccion === '72163103') { // U, caliente, altura >= 80mm
    // NICO 01: De espesor inferior o igual a 230 mm (23cm), excepto lo comprendido en el NICO 02.
    // NICO 02: De espesor superior o igual a 130 mm (13cm) pero inferior o igual a 200 mm (20cm).
    // NICO 99: Los demás.
    // 'espesor' aquí se refiere al espesor del alma o patines, no un espesor de lámina.
    // Sin una prop 'espesorPerfil', es difícil.
    return '99'; // Fallback
  }
  if (fraccion === '72163204' || fraccion === '72163299') { // I, caliente, altura >= 80mm
     // La fracción 7216.32.04 ya es muy específica. Para 7216.32.99 NICO 01 y 02 son similares a 7216.31.03
    return '99'; // Fallback
  }
  if (fraccion === '72163301' || fraccion === '72163302') { // H, caliente, altura >= 80mm
    // NICOs 01-04 y 99 dependen del peralte (altura).
    if (peralte <= 254) return '01';
    if (peralte > 254 && peralte <= 457) return '02';
    if (peralte > 457 && peralte <= 609) return '03';
    if (peralte > 609 && peralte <= 914) return '04'; // OJO: La tarifa mexicana llega hasta 914mm, verificar si es universal
    return '99';
  }
  if (fraccion === '72164001') { // L o T, caliente, altura >= 80mm
    // NICO 01: De altura inferior a 152.4 mm (6 pulgadas).
    // NICO 02: De altura superior o igual a 152.4 mm (6 pulgadas) pero inferior a 203.2 mm (8 pulgadas).
    // NICO 91: Perfiles en L.
    // NICO 99: Los demás.
    if (peralte < 152.4) return '01';
    if (peralte >= 152.4 && peralte < 203.2) return '02';
    if (formaTransversal.includes('l')) return '91';
    return '99';
  }
  if (fraccion === '72165001' || fraccion === '72165099') return defaultNICO; // Otros perfiles (e.g. Z), caliente
  if (fraccion.startsWith('72166')) return defaultNICO; // Perfiles obtenidos/acabados en frío
  if (fraccion.startsWith('72169')) return defaultNICO; // Los demás perfiles (trabajados)

  // Alambre, hierro/acero s/alear - Partida 72.17
  if (fraccion === '72171002') { // Sin revestir
    // NICOs 01-06, 91-93, 99 dependen de C, diámetro, uso (presfuerzo, grafilado)
    // Esta lógica es compleja y depende de muchas variables que pueden no estar estandarizadas en `props`.
    // Ejemplo simplificado:
    if (texto.includes('presfuerzo') || texto.includes('pretensado') || texto.includes('postensado')) return '02';
    // ... más lógica ...
    return '99'; // Fallback muy genérico
  }
  if (fraccion === '72172002') { // Cincado
    // NICO 01: Para fabricación de grapas.
    // NICO 99: Los demás.
    if (texto.includes('para grapas') || texto.includes('fabricacion grapas')) return '01';
    return '99';
  }
  if (fraccion === '72173002') { // Revestido de otros metales comunes (cobre)
    // NICO 01: Revestido de cobre, con un contenido de carbono inferior al 0.6% en peso.
    // NICO 99: Los demás.
    if (props.recubrimiento?.toLowerCase().includes('cobre') && (carbono !== undefined && carbono < 0.006)) return '01';
    return '99';
  }
  if (fraccion === '72179099') { // Los demás (revestido de plástico)
    // NICO 01: Revestido de plástico.
    // NICO 99: Los demás.
    if (props.recubrimiento?.toLowerCase().includes('plastico')) return '01';
    return '99';
  }

  // Acero Inoxidable - Partidas 72.18 a 72.23
  if (fraccion.startsWith('7218')) return defaultNICO; // Inox en formas primarias; semiproductos
  if (fraccion === '72191301' || fraccion === '72191401' || fraccion === '72192201' || fraccion === '72193301' || fraccion === '72193401') {
    // NICO 01: De la serie 200.
    // NICO 02: De la serie 300.
    // NICO 03: De la serie 400.
    // NICO 99: Los demás.
    // Asumiendo que `props.serie` es un string '200', '300', '400'
    if (serie === '200') return '01';
    if (serie === '300') return '02';
    if (serie === '400') return '03';
    return '99';
  }
  if (fraccion === '72193101') { // Laminados en frío, inox, >=600mm, esp >= 4.75mm
      // NICO 01: Enrollados.
      // NICO 99: Los demás.
      if(enrollado) return '01';
      return '99';
  }
  if (fraccion === '72193202') { // Laminados en frío, inox, >=600mm, 3mm <= esp < 4.75mm
      // NICO 02: Serie 200, esp <= 4mm
      // NICO 03: Serie 300, esp <= 4mm
      // NICO 04: Serie 400, esp <= 4mm
      // NICO 91: Serie 200
      // NICO 92: Serie 300
      // NICO 93: Serie 400
      // NICO 99: Los demás
      if (serie === '200') return espesor <= 4 ? '02' : '91';
      if (serie === '300') return espesor <= 4 ? '03' : '92';
      if (serie === '400') return espesor <= 4 ? '04' : '93';
      return '99';
  }
  if (fraccion === '72193502') { // Laminados en frío, inox, >=600mm, esp < 0.5mm
      // NICO 01: De espesor superior o igual a 0.3 mm.
      // NICO 99: Los demás.
      if (espesor >= 0.3) return '01';
      return '99';
  }
  // Otras fracciones de 7219, 7220 (laminados planos inox)
  if (fraccion.startsWith('7219') || fraccion.startsWith('7220')) {
    // Muchos tienen NICO 00 o dependen de la serie que ya cubrimos arriba.
    // Revisar si hay más casos específicos.
    if (fraccion === '72202003') { // Laminados planos inox, <600mm, frío
        // NICO 01: DGN-410, DGN-420 o DGN-440, de espesor superior o igual a 0.3 mm e inferior o igual a 6 mm y anchura inferior o igual a 325 mm.
        // NICO 03: Serie 200, de espesor superior o igual a 0.3 mm e inferior o igual a 4.0 mm, excepto lo comprendido en el NICO 01.
        // NICO 04: Serie 300, ...
        // NICO 05: Serie 400, ...
        // NICO 99: Los demás.
        if ((norma.includes('dgn-410') || norma.includes('dgn-420') || norma.includes('dgn-440')) && espesor >= 0.3 && espesor <= 6 && ancho <= 325) return '01';
        if (serie === '200' && espesor >= 0.3 && espesor <= 4.0) return '03';
        if (serie === '300' && espesor >= 0.3 && espesor <= 4.0) return '04';
        if (serie === '400' && espesor >= 0.3 && espesor <= 4.0) return '05';
        return '99';
    }
    return defaultNICO;
  }

  if (fraccion === '72210001') { // Alambrón inox
    // NICO 01: De sección circular y diámetro inferior a 19 mm.
    // NICO 99: Los demás.
    if ((formaTransversal.includes('circular') || formaTransversal.includes('redonda')) && diametro < 19) return '01';
    return '99';
  }
  if (fraccion === '72221102') { // Barras inox, caliente, circular
    // NICO 01: Nitrogenadas, obtenidas en caliente, peladas o rectificadas.
    // NICO 99: Las demás.
    if (texto.includes('nitrogenada') && (texto.includes('caliente') || texto.includes('pelada') || texto.includes('rectificada'))) return '01';
    return '99';
  }
  if (fraccion === '72223091') { // Las demás barras inox (e.g. forjadas)
    // NICO 01: Huecas para perforación (barras de mina).
    // NICO 99: Las demás.
    if (texto.includes('hueca para perforacion') || texto.includes('barra de mina')) return '01';
    return '99';
  }
  if (fraccion === '72224001') { // Perfiles inox
    // NICO 01: Obtenidos en caliente, sin perforar ni trabajar de otro modo, de altura inferior o igual a 80 mm.
    // NICO 99: Los demás.
    if (props.procesoLaminado?.toLowerCase() === 'caliente' && !texto.includes('perforado') && !texto.includes('trabajado de otro modo') && peralte <= 80) return '01';
    return '99';
  }
  if (fraccion === '72230002') { // Alambre inox
    // NICO 01: De sección circular.
    // NICO 99: Los demás.
    if (formaTransversal.includes('circular') || formaTransversal.includes('redonda')) return '01';
    return '99';
  }


  // Los demás aceros aleados - Partidas 72.24 a 72.29
  if (fraccion === '72241006') { // Otros aleados, lingotes/formas primarias
    // NICO 01: Lingotes de acero grado herramienta.
    // NICO 02: Lingotes de acero rápido.
    // NICO 03: Los demás lingotes.
    // NICO 04: Desbastes ("blooms") o palanquillas ("billets"), de acero grado herramienta.
    // NICO 05: Desbastes ("blooms") o palanquillas ("billets"), de acero rápido.
    // NICO 91: De acero grado herramienta.
    // NICO 99: Los demás.
    const esLingote = forma.includes('lingote') || tipoProducto.toLowerCase().includes('lingote');
    const esDesbastePalanquilla = forma.includes('desbaste') || forma.includes('bloom') || forma.includes('palanquilla') || forma.includes('billet');
    const esGradoHerramienta = texto.includes('grado herramienta') || norma.includes('tool steel');
    const esAceroRapido = texto.includes('acero rapido') || norma.includes('high speed steel');

    if (esLingote) {
      if (esGradoHerramienta) return '01';
      if (esAceroRapido) return '02';
      return '03';
    }
    if (esDesbastePalanquilla) {
      if (esGradoHerramienta) return '04';
      if (esAceroRapido) return '05';
    }
    if (esGradoHerramienta) return '91'; // Para otras formas primarias no lingote/desbaste
    return '99';
  }
  if (fraccion === '72249002') { // Semiproductos otros aleados, C <= 0.006%, no herramienta
    return defaultNICO;
  }
  if (fraccion === '72249099') { // Los demás semiproductos otros aleados
    // NICO 01: Forjados; piezas para perforación o juntas ("tool joints").
    // NICO 02: De acero grado herramienta.
    // NICO 99: Los demás.
    if (props.acabado?.toLowerCase().includes('forjado') || texto.includes('pieza perforacion') || texto.includes('tool joint')) return '01';
    if (texto.includes('grado herramienta') || norma.includes('tool steel')) return '02';
    return '99';
  }

  // Laminados planos, otros aceros aleados, >=600mm - Partida 72.25
 // Dentro de asignarSubpartidaCap72.js -> función determinarSubpartida(props, partida)

if (fraccion === '72251102') return '01';
if (fraccion.startsWith('72251')) return defaultNICO; // '00' para 72251101, 72251999, etc.


 
  
if (fraccion === '72253091') {
    const boro = props.composicion?.boro || 0; // Ejemplo: 0.0002 para 0.0002%
    const espesor = props.espesor || 0;
    const esDecapado = props.isPickled;
    const esAceroRapido = (props.descripcion + " " + props.observaciones).toLowerCase().includes('acero rapido');
    const esGradoHerramienta = (props.descripcion + " " + props.observaciones).toLowerCase().includes('grado herramienta');

    if (boro >= 0.0008) { // Contenido de Boro ALTO
        if (!esAceroRapido && esGradoHerramienta) { /* Podría ser NICO 06 si aplica aquí o se maneja después */ }
        // Solo si el boro es ALTO, se evalúan 01-04 basados en espesor (y que no sea NICO 06)
        if (espesor > 10 && !(esGradoHerramienta && !esAceroRapido)) return '01';
        if (espesor >= 4.75 && espesor <= 10 && !(esGradoHerramienta && !esAceroRapido)) return '02';
        if (espesor >= 3 && espesor < 4.75 && !(esGradoHerramienta && !esAceroRapido)) return '03';
        if (espesor < 3 && !(esGradoHerramienta && !esAceroRapido)) return '04'; // El sistema está llegando aquí incorrectamente
    }

    // Si el boro es BAJO o las condiciones anteriores no se cumplieron:
    if (esAceroRapido) return '05';
    if (esGradoHerramienta && !esAceroRapido) return '06';

    if (esDecapado) {
        // NICO 07: esDecapado Y boro >= 0.0008% (ya se habría cubierto arriba si boro fuera alto)
        // Por lo tanto, si llegamos aquí y esDecapado es true, el boro es bajo.
        if (boro >= 0.0008) return '07'; // Esta condición sería falsa aquí si la lógica anterior es correcta

        // NICO 08: esDecapado, espesor >= 4.75mm, Y NO NICO 07 (o sea, boro < 0.0008%)
        if (espesor >= 4.75) return '08'; 

        return '91'; // Los demás decapados (boro bajo, y espesor no cumple para 08)
    }

    // Si NO es decapado y no es 01-06:
    if (espesor < 4.75) return '92';

    return '99'; // Los demás
}

// Dentro de tu función determinarNICO_Cap72(fraccion, props)

if (fraccion === '72254091') {
  const boro = props.composicion?.boro || 0; // Ejemplo: 0.0002 para 0.0002%
  const espesor = props.espesor || 0; // en mm
  const texto = `${props.descripcion || ''} ${props.usoTecnico || ''} ${props.observaciones || ''}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  
  // Para "Acero de alta resistencia", la definición puede variar.
  // Usaremos una combinación de props.resistencia (si la tienes en MPa) y búsqueda de texto.
  // Asumimos que props.resistencia es el límite de fluencia o tracción en MPa.
  // El umbral de 355 MPa es común para "alta resistencia", pero ajústalo si es necesario.
  const esAltaResistencia = (props.resistencia && props.resistencia >= 355) || texto.includes('alta resistencia');

  const esAceroRapido = texto.includes('acero rapido') || texto.includes('high-speed steel');
  const esGradoHerramienta = texto.includes('grado herramienta') || texto.includes('tool steel');
  const esParaTubosOleoductos = texto.includes('para fabricacion de tubos') || texto.includes('oleoducto') || texto.includes('gasoducto');

  // NICO 05: Acero rápido.
  if (esAceroRapido) return '05';

  // NICO 07: Acero de grado herramienta.
  // Es importante verificar esto antes de los NICOs 01-04 debido a la cláusula "excepto de grado herramienta".
  if (esGradoHerramienta) return '07';

  // NICOs 01-04: Basados en Boro y espesor (y NO siendo grado herramienta)
  if (boro >= 0.0008) { // Contenido de Boro igual o superior a 0.0008%
    if (espesor > 10) return '01'; // NICO 01
    if (espesor >= 4.75 && espesor <= 10) return '02'; // NICO 02
    if (espesor >= 3 && espesor < 4.75) return '03'; // NICO 03
    if (espesor < 3) return '04'; // NICO 04
  }

  // NICO 06: Acero de alta resistencia.
  if (esAltaResistencia) return '06';

  // NICO 08: Acero para la fabricacion de tubos de los tipos utilizados en oleoductos o gasoductos.
  if (esParaTubosOleoductos) return '08';

  // NICO 91: Los demas de espesor inferior a 4.75 mm.
  // (Si no cumplió ninguna de las condiciones anteriores Y el espesor es < 4.75mm)
  if (espesor < 4.75) return '91';
  
  // NICO 99: Los demas.
  return '99';
}

// Dentro de tu función determinarNICO_Cap72(fraccion, props)

if (fraccion === '72255091') {
  const boro = props.composicion?.boro || 0; // Ejemplo: 0.0002 para 0.0002%
  const espesor = props.espesor || 0; // en mm
  const esEnrollado = props.esEnrollado === true; // Asegurarse de que sea un booleano explícito
  const texto = `${props.descripcion || ''} ${props.usoTecnico || ''} ${props.observaciones || ''}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const esAceroRapido = texto.includes('acero rapido') || texto.includes('high-speed steel');
  const esGradoHerramienta = texto.includes('grado herramienta') || texto.includes('tool steel');
  const esParaPorcelanizar = texto.includes('para porcelanizar') || texto.includes('for porcelain enameling'); // Ajustar keywords según sea necesario
  
  // Asumimos que props.resistencia es el límite de fluencia o tracción en MPa.
  // El umbral de 355 MPa es común para "alta resistencia", pero ajústalo si es necesario.
  const esAltaResistencia = (props.resistencia && props.resistencia >= 355) || texto.includes('alta resistencia');

  // NICO 08: De acero rápido.
  if (esAceroRapido) return '08';

  // NICO 09: De acero grado herramienta.
  // Se verifica antes de los NICOs 01-07 por la cláusula "excepto de acero grado herramienta".
  if (esGradoHerramienta) return '09';

  // Si NO es Acero Rápido NI Grado Herramienta, entonces se evalúan los NICOs 01-07 basados en Boro, espesor y si está enrollado.
  if (boro >= 0.0008) { // Contenido de Boro igual o superior a 0.0008%
    if (esEnrollado) { // ENROLLADA
      if (espesor > 1 && espesor < 3) return '01';    // NICO 01
      if (espesor >= 0.5 && espesor <= 1) return '02'; // NICO 02
      if (espesor < 0.5) return '03';                 // NICO 03
      if (espesor >= 3) return '04';                  // NICO 04 (Según la imagen, este es >= 3mm, podría haber un límite superior implícito o es el más grueso de los enrollados con boro)
      if (espesor >= 4.75) return '05';               // NICO 05
      // Nota: La lógica de espesor para 04 y 05 (ambos enrollados con boro) necesita ser clara.
      // La imagen para 04 dice "superior o igual a 3 mm" y para 05 dice "superior o igual a 4.75mm".
      // Si es >= 4.75mm, cumple para 05. Si es >=3mm pero <4.75mm, cumpliría para 04.
      // El orden de arriba (01,02,03, luego 04, luego 05) podría necesitar ajuste si hay superposición.
      // Una forma más segura si las condiciones de espesor son rangos exactos:
      // if (espesor > 1 && espesor < 3) return '01';
      // if (espesor >= 0.5 && espesor <= 1) return '02';
      // if (espesor < 0.5) return '03';
      // if (espesor >= 4.75) return '05'; // NICO 05 (más específico por espesor mayor)
      // if (espesor >= 3 && espesor < 4.75) return '04'; // NICO 04 (rango restante)

    } else { // SIN ENROLLAR
      if (espesor < 4.75) return '06';                 // NICO 06
      if (espesor >= 4.75) return '07';                // NICO 07
    }
  }

  // Si no es Acero Rápido, ni Grado Herramienta, y no cumplió las condiciones de Boro (01-07):
  // NICO 10: De acero para porcelanizar, de espesor superior o igual a 4.75 mm.
  if (esParaPorcelanizar) {
    if (espesor >= 4.75) return '10';
    // NICO 92: Los demas de acero para porcelanizar. (Implica < 4.75mm si NICO 10 es para >=4.75mm)
    return '92'; 
  }

  // NICO 11: De acero de alta resistencia.
  if (esAltaResistencia) return '11';

  // NICO 91: Los demas de espesor superior o igual a 4.75 mm.
  // (No es rápido, ni herramienta, ni boro alto, ni porcelanizar, ni alta resistencia)
  if (espesor >= 4.75) return '91';
  
  // NICO 99: Los demas.
  // (Cubre, por ejemplo, los de espesor < 4.75 mm que no son para porcelanizar ni de alta resistencia, etc.)
  return '99';
}




// ... continuar con la lógica para otras fracciones ...



  // Laminados planos, otros aceros aleados, <600mm - Partida 72.26
  if (fraccion.startsWith('72261')) return defaultNICO; // Acero al silicio (magnético)
  if (fraccion === '72262001') return defaultNICO; // De acero rápido
  if (fraccion === '72269107' || fraccion === '72269206') { // Caliente o Frío
    // Lógica similar a 72.25 basada en Boro, espesor, uso (herramienta), enrollado.
    // Ejemplo simplificado para 7226.91.07 (Caliente)
    // NICO 08: De acero grado herramienta (excepto de acero rápido).
    if (texto.includes('grado herramienta') && !texto.includes('acero rapido')) return '08';
    return '99'; // Fallback
  }
  if (fraccion === '72269999') { // Los demás (revestidos)
    // NICO 01: Cincados electrolíticamente.
    // NICO 02: Cincados de otro modo.
    // NICO 99: Los demás.
    if (props.recubrimiento?.toLowerCase().includes('electrolitico') && props.recubrimiento?.toLowerCase().includes('cincado')) return '01';
    if (props.recubrimiento?.toLowerCase().includes('cincado')) return '02'; // Asume inmersión si no es electrolítico
    return '99';
  }

  // Alambrón, otros aceros aleados - Partida 72.27
  if (fraccion === '72271001') return defaultNICO; // De acero rápido
  if (fraccion === '72272001') { // De acero silicomanganeso
    // NICO 01: Con diámetro inferior a 10 mm, C<0.20%, S<0.040%, P<0.040%.
    // NICO 99: Los demás.
    if (diametro < 10 && (carbono !== undefined && carbono < 0.0020) && (composicion.azufre !== undefined && composicion.azufre < 0.00040) && (composicion.fosforo !== undefined && composicion.fosforo < 0.00040)) return '01';
    return '99';
  }
  if (fraccion === '72279099') { // Los demás
    // NICO 01: De acero grado herramienta.
    // NICO 02: Con diámetro inferior a 10 mm, C<0.20%, S<0.040%, P<0.040%.
    // NICO 03: De sección circular, diámetro < 19 mm, excepto grado herramienta.
    // NICO 04: Con Boro o Cromo como elemento de aleación característico.
    // NICO 99: Los demás.
    if (texto.includes('grado herramienta')) return '01';
    if (diametro < 10 && (carbono !== undefined && carbono < 0.0020) && (composicion.azufre !== undefined && composicion.azufre < 0.00040) && (composicion.fosforo !== undefined && composicion.fosforo < 0.00040)) return '02';
    if ((formaTransversal.includes('circular') || formaTransversal.includes('redonda')) && diametro < 19) return '03';
    if ((composicion.boro !== undefined && composicion.boro > 0) || (composicion.cromo !== undefined && composicion.cromo > 0.005)) return '04'; // Cromo > 0.5%
    return '99';
  }

  // Barras y perfiles, otros aceros aleados; barras huecas para perforación - Partida 72.28
  if (fraccion === '72281002' || fraccion === '72282002') { // Barras de acero rápido o silicomanganeso
    // NICO 01: Acabadas en caliente.
    // NICO 99: Las demás.
    if (props.acabado?.toLowerCase().includes('caliente')) return '01';
    return '99';
  }
  if (fraccion === '72283001') return defaultNICO; // Demás barras, caliente, grado herramienta
  if (fraccion === '72283099') { // Demás barras, caliente, no herramienta
    // NICO 01: Para fabricación de varillas para hormigón.
    // NICO 99: Las demás.
    if (texto.includes('para varilla hormigon') || texto.includes('fabricacion varilla')) return '01';
    return '99';
  }
  if (fraccion === '72284091' || fraccion === '72285091' || fraccion === '72286091') { // Demás barras, forjadas / frío / otras
    // NICO 01: De acero grado herramienta.
    // NICO (para 72286091) 02: Laminadas en caliente, excepto grado herramienta.
    // NICO 99: Las demás.
    if (texto.includes('grado herramienta')) return '01';
    if (fraccion === '72286091' && props.procesoLaminado?.toLowerCase() === 'caliente') return '02';
    return '99';
  }
  if (fraccion === '72287001') { // Perfiles, otros aceros aleados
    // NICO 01: De peralte (altura) inferior a 76 mm.
    // NICO 99: Los demás.
    if (peralte < 76) return '01';
    return '99';
  }
  if (fraccion === '72288001') return defaultNICO; // Barras huecas para perforación

  // Alambre, otros aceros aleados - Partida 72.29
  if (fraccion === '72292001') { // De acero silicomanganeso (para soldadura)
    // NICOs 01-06, 91, 92, 99 dependen del tipo de soldadura (SAW, TIG), revestimiento (cobre), presentación (tambor, carrete).
    // Lógica muy específica.
    if (norma.includes('saw') || texto.includes('saw')) return '01'; // Ejemplo simplificado
    return '99'; // Fallback
  }
  if (fraccion === '72299099') { // Los demás alambres
    // NICOs 01-04, 99 dependen de uso (electrodos, rayos X), grado herramienta, templado, acero rápido.
    // Lógica muy específica.
    if (texto.includes('grado herramienta')) return '02'; // Ejemplo simplificado
    return '99'; // Fallback
  }

  if (DEBUG) console.warn(`[NICO Cap72] Fracción ${fraccion} no tiene reglas NICO específicas implementadas. Retornando ${defaultNICO}.`);
  return defaultNICO;
}

module.exports = { determinarNICO_Cap72 };
