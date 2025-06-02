// asignarSubpartidaCap72.js

/**
 * Determina la subpartida (6 dígitos) para una partida del capítulo 72, ya conocida.
 * Cubre partidas 7201 a 7229.
 */

const DEBUG = process.env.DEBUG === 'true'; // Use environment variable for DEBUG

export function determinarSubpartida(props, partida) {
  const {
    espesor, // en mm
    ancho, // en mm
    recubrimiento = '',
    acabado = '', // 'caliente', 'frio'
    tipoProducto = '',
    composicion = {},
    observaciones = '',
    descripcion = '', // Asegurarse que 'descripcion' también se pase y se use
    formaFisica = '', // 'plana', 'rollo', 'barra', etc.
    formaTransversal = '' // 'circular', 'rectangular', etc.
  } = props;

  if (DEBUG) {
    console.log('🧩 Partida evaluada para subpartidaCap72:', partida, 'Props:', props);
  }

  const rec = recubrimiento.toLowerCase();
  const obs = observaciones.toLowerCase();
  const desc = descripcion.toLowerCase();
  const textoGeneral = `${tipoProducto} ${rec} ${obs} ${desc} ${acabado} ${formaFisica} ${formaTransversal}`.toLowerCase();

  const carbono = composicion?.carbono || 0; // Porcentaje, e.g., 0.25
  const fosforo = composicion?.fosforo || 0; // Porcentaje, e.g., 0.05
  const silicio = composicion?.silicio || 0; // Porcentaje, e.g., 0.3
  // const niquel = composicion?.niquel || 0; // No se usa directamente en este nivel de subpartida, más para tipo de acero
  // const cromo = composicion?.cromo || 0;   // Idem
  // const manganeso = composicion?.manganeso || 0; // Idem

  // Estas propiedades ya deberían estar determinadas antes de llamar a esta función
  const esInoxidable = (props.tipoAcero || '').toLowerCase() === 'inoxidable';
  const esAleadoNoInox = (props.tipoAcero || '').toLowerCase() === 'aleado';
  // const esSinAlear = !esInoxidable && !esAleadoNoInox; // Se puede inferir

  let justificacion = '';

  switch (partida) {
    case '7201': // Fundición en bruto y hierro especular, en lingotes, bloques o demás formas primarias.
      justificacion = 'Fundición en bruto, ';
      // Nota 1 a) de subpartida Cap 72: Fundición en bruto sin alear con un contenido de fósforo...
      if (!esAleadoNoInox && !esInoxidable) { // Sin alear
        if (fosforo !== null && fosforo <= 0.005) { // 0.5% = 0.005 si la entrada es decimal directa (e.g. 0.005 para 0.5%)
                                                 // Si la entrada es 0.5 para 0.5%, entonces comparar con 0.5
                                                 // Asumiendo que props.composicion.fosforo es un valor como 0.04 para 0.04%
                                                 // entonces la comparación correcta con 0.5% es props.composicion.fosforo <= 0.005 (si está normalizado a 1)
                                                 // o props.composicion.fosforo <= 0.5 (si está como porcentaje directo, ej. 0.5 para 0.5%)
                                                 // Generalmente los análisis químicos dan 0.04% como 0.04. Por tanto, comparamos con 0.5 (no 0.005).
                                                 // Ajustando esto: si fósforo es 0.04 (para 0.04%), y el límite es 0.5%.
          justificacion += 'sin alear, con fósforo ≤ 0.5%.';
          return { subpartida: '720110', justificacion };
        }
        if (fosforo !== null && fosforo > 0.5) { // Asumiendo fósforo = 0.6 para 0.6%
          justificacion += 'sin alear, con fósforo > 0.5%.';
          return { subpartida: '720120', justificacion };
        }
      }
      // Fundición en bruto aleada; fundición especular.
      justificacion += 'aleada o fundición especular.';
      return { subpartida: '720150', justificacion };

    case '7202': // Ferroaleaciones.
      justificacion = 'Ferroaleación: ';
      if (textoGeneral.includes('ferromanganeso')) {
        if (carbono > 0.02) return { subpartida: '720211', justificacion: justificacion + 'ferromanganeso, C > 2%.' }; // 2% = 0.02
        return { subpartida: '720219', justificacion: justificacion + 'ferromanganeso, C ≤ 2%.' };
      }
      if (textoGeneral.includes('ferrosilicio')) {
        if (silicio > 0.55) return { subpartida: '720221', justificacion: justificacion + 'ferrosilicio, Si > 55%.' }; // 55% = 0.55
        return { subpartida: '720229', justificacion: justificacion + 'ferrosilicio, Si ≤ 55%.' };
      }
      if (textoGeneral.includes('ferrosilicomanganeso')) return { subpartida: '720230', justificacion: justificacion + 'ferrosilicomanganeso.' };
      if (textoGeneral.includes('ferrocromo')) {
        if (carbono > 0.04) return { subpartida: '720241', justificacion: justificacion + 'ferrocromo, C > 4%.' }; // 4% = 0.04
        return { subpartida: '720249', justificacion: justificacion + 'ferrocromo, C ≤ 4%.' };
      }
      if (textoGeneral.includes('ferrosilicocromo')) return { subpartida: '720250', justificacion: justificacion + 'ferrosilicocromo.' };
      if (textoGeneral.includes('ferroniquel')) return { subpartida: '720260', justificacion: justificacion + 'ferroníquel.' };
      if (textoGeneral.includes('ferromolibdeno')) return { subpartida: '720270', justificacion: justificacion + 'ferromolibdeno.' };
      if (textoGeneral.includes('ferrovolframio') || textoGeneral.includes('ferrosilicovolframio')) return { subpartida: '720280', justificacion: justificacion + 'ferrovolframio y ferrosilicovolframio.' };
      if (textoGeneral.includes('ferrotitanio') || textoGeneral.includes('ferrosilicotitanio')) return { subpartida: '720291', justificacion: justificacion + 'ferrotitanio y ferrosilicotitanio.' };
      if (textoGeneral.includes('ferrovanadio')) return { subpartida: '720292', justificacion: justificacion + 'ferrovanadio.' };
      if (textoGeneral.includes('ferroniobio')) return { subpartida: '720293', justificacion: justificacion + 'ferroniobio.' };
      return { subpartida: '720299', justificacion: justificacion + 'las demás.' };

    case '7203': // Productos férreos obtenidos por reducción directa de los minerales de hierro y demás productos férreos esponjosos...
      justificacion = 'Producto férreo: ';
      if (desc.includes('reduccion directa') || tipoProducto.includes('direct reduced iron')) {
        return { subpartida: '720310', justificacion: justificacion + 'obtenido por reducción directa de minerales de hierro.' };
      }
      return { subpartida: '720390', justificacion: justificacion + 'esponjoso (los demás) o hierro pureza ≥ 99.94%.' };

    case '7204': // Desperdicios y desechos (chatarra), de fundición, hierro o acero; lingotes de chatarra.
      justificacion = 'Desperdicios y desechos: ';
      if (desc.includes('fundicion')) return { subpartida: '720410', justificacion: justificacion + 'de fundición.' };
      if (esInoxidable || desc.includes('acero inoxidable')) return { subpartida: '720421', justificacion: justificacion + 'de acero inoxidable.' };
      if (esAleadoNoInox || (desc.includes('acero aleado') && !desc.includes('inoxidable'))) return { subpartida: '720429', justificacion: justificacion + 'de los demás aceros aleados.' };
      if (desc.includes('estañado')) return { subpartida: '720430', justificacion: justificacion + 'de hierro o acero estañados.' };
      if (desc.includes('torneadura') || desc.includes('viruta') || desc.includes('esquirla') || desc.includes('limadura') || desc.includes('recorte')) {
        return { subpartida: '720441', justificacion: justificacion + 'torneaduras, virutas, esquirlas, limaduras, recortes de estampado o de corte, incluso en paquetes.' };
      }
      if (formaFisica.includes('lingote') && desc.includes('chatarra')) return { subpartida: '720450', justificacion: 'Lingotes de chatarra.' };
      // Los demás desperdicios y desechos (no estañados, no aleados/inox)
      return { subpartida: '720449', justificacion: justificacion + 'los demás (de hierro o acero sin alear, no estañados).' };

    case '7205': // Granallas y polvo, de fundición en bruto, de hierro especular, de hierro o acero.
      justificacion = '';
      if (tipoProducto.includes('granalla')) {
        justificacion = 'Granallas de fundición en bruto, hierro especular o acero.';
        return { subpartida: '720510', justificacion };
      }
      if (tipoProducto.includes('polvo')) {
        justificacion = 'Polvo: ';
        if (esAleadoNoInox || esInoxidable) return { subpartida: '720521', justificacion: justificacion + 'de aceros aleados (incluido inoxidable).' };
        return { subpartida: '720529', justificacion: justificacion + 'los demás (de fundición, hierro especular, o acero sin alear).' };
      }
      return { subpartida: null, justificacion: 'Tipo de producto no es granalla ni polvo para 7205.' };

    case '7206': // Hierro y acero sin alear en lingotes o demás formas primarias (excepto el hierro de la partida 72.03).
      justificacion = 'Hierro o acero sin alear: ';
      if (formaFisica.includes('lingote') || tipoProducto.includes('lingote')) {
        return { subpartida: '720610', justificacion: justificacion + 'en lingotes.' };
      }
      return { subpartida: '720690', justificacion: justificacion + 'en las demás formas primarias.' };

    case '7207': // Productos intermedios de hierro o acero sin alear (Semiproductos).
      justificacion = 'Semiproducto de hierro o acero sin alear, ';
      // Nota 1 k) Cap 72 define semiproductos. La distinción de subpartida es por contenido de Carbono.
      if (carbono < 0.0025) { // C < 0.25%
        justificacion += 'C < 0.25%, ';
        // y luego por forma y dimensiones según Nota 1 l)
        if (formaTransversal.includes('rectangular') && (!formaTransversal.includes('cuadrada'))) {
           // Para 7207.11, la anchura debe ser inferior al doble del espesor.
           // Necesitaríamos 'espesorSemiproducto' y 'anchoSemiproducto'
           // Asumimos que 'ancho' y 'espesor' en props se refieren a esto para semiproductos.
           if (ancho && espesor && ancho < (2 * espesor)) {
             return { subpartida: '720711', justificacion: justificacion + 'de sección cuadrada o rectangular (anchura < 2 * espesor).' };
           }
           return { subpartida: '720712', justificacion: justificacion + 'los demás, de sección rectangular (anchura >= 2 * espesor).' };
        }
        return { subpartida: '720719', justificacion: justificacion + 'los demás (e.g. sección circular, perfiles esbozados).' };
      }
      // C >= 0.25%
      justificacion += 'C ≥ 0.25%.';
      return { subpartida: '720720', justificacion };

    // --- PRODUCTOS LAMINADOS PLANOS ---
    // Partidas 7208 a 7212 (sin alear), 7219-7220 (inox), 7225-7226 (otros aleados)

// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7208': // Laminados planos s/alear, >=600mm, caliente, sin chapar/revestir
      justificacion = 'Laminado plano s/alear, ≥600mm, caliente, s/revestir, ';
      // ANTERIOR: if (formaFisica.includes('rollo') || tipoProducto.includes('coil')) {
      if (props.esEnrollado) { // <--- CAMBIO AQUÍ: Usar props.esEnrollado
        justificacion += 'enrollado, ';
        if (desc.includes('relieve') || obs.includes('relieve')) {
          return { subpartida: '720810', justificacion: justificacion + 'con motivos en relieve.' };
        }
        // El producto está enrollado y sin motivos en relieve.
        // Ahora se verifica si está decapado. props.acabado puede ser 'decapado'.
        if (acabado.includes('decapado')) {
          justificacion += 'decapado, ';
          if (espesor >= 4.75) return { subpartida: '720825', justificacion: justificacion + 'espesor ≥ 4.75 mm.' };
          if (espesor >= 3) return { subpartida: '720826', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
          return { subpartida: '720827', justificacion: justificacion + 'espesor < 3 mm.' };
        }
        // Los demás enrollados (sin relieve, sin decapar)
        justificacion += 'los demás (sin motivos en relieve, sin decapar), ';
        if (espesor > 10) return { subpartida: '720836', justificacion: justificacion + 'espesor > 10 mm.' };
        if (espesor >= 4.75) return { subpartida: '720837', justificacion: justificacion + 'espesor ≥ 4.75 mm y ≤ 10 mm.' };
        if (espesor >= 3) return { subpartida: '720838', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
        return { subpartida: '720839', justificacion: justificacion + 'espesor < 3 mm.' };
      } else { // Sin enrollar
        justificacion += 'sin enrollar, ';
        if (desc.includes('relieve') || obs.includes('relieve')) {
          return { subpartida: '720840', justificacion: justificacion + 'con motivos en relieve.' };
        }
        // Los demás sin enrollar (sin motivos en relieve).
        // Para productos no enrollados, la tarifa generalmente no subdivide por "decapado"
        // a este nivel de subpartida (7208.51 a 7208.54), ya que "simplemente laminado en caliente"
        // puede incluir el decapado.
        justificacion += 'los demás (sin motivos en relieve), ';
        if (espesor > 10) return { subpartida: '720851', justificacion: justificacion + 'espesor > 10 mm.' };
        if (espesor >= 4.75) return { subpartida: '720852', justificacion: justificacion + 'espesor ≥ 4.75 mm y ≤ 10 mm.' };
        if (espesor >= 3) return { subpartida: '720853', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
        return { subpartida: '720854', justificacion: justificacion + 'espesor < 3 mm.' };
      }
      // Nota: La subpartida 7208.90 es para "Los demás" (trabajados posteriormente de maneras no cubiertas arriba,
      // pero aún sin chapar ni revestir metálicamente). El decapado por sí solo usualmente no
      // mueve el producto a 7208.90 si por lo demás es "simplemente laminado en caliente".
      // Si tuvieras lógica para 7208.90, iría después de estas condiciones si ninguna se cumple.
      // Por ahora, el código no tiene un camino explícito hacia 7208.90.

// ... (continuar con el resto de las partidas en el switch) ...






    case '7209': // Laminados planos s/alear, >=600mm, frío, sin chapar/revestir
      justificacion = 'Laminado plano s/alear, ≥600mm, frío, s/revestir, ';
     // if (formaFisica.includes('rollo') || tipoProducto.includes('coil')) {
if (props.esEnrollado){   //  agregado
     


        justificacion += 'enrollado, ';
        if (espesor >= 3) return { subpartida: '720915', justificacion: justificacion + 'espesor ≥ 3 mm.' };
        if (espesor > 1) return { subpartida: '720916', justificacion: justificacion + 'espesor > 1 mm y < 3 mm.' };
        if (espesor >= 0.5) return { subpartida: '720917', justificacion: justificacion + 'espesor ≥ 0.5 mm y ≤ 1 mm.' };
        return { subpartida: '720918', justificacion: justificacion + 'espesor < 0.5 mm.' };
      } else { // Sin enrollar
        justificacion += 'sin enrollar, ';
        if (espesor >= 3) return { subpartida: '720925', justificacion: justificacion + 'espesor ≥ 3 mm.' };
        if (espesor > 1) return { subpartida: '720926', justificacion: justificacion + 'espesor > 1 mm y < 3 mm.' };
        if (espesor >= 0.5) return { subpartida: '720927', justificacion: justificacion + 'espesor ≥ 0.5 mm y ≤ 1 mm.' };
        return { subpartida: '720928', justificacion: justificacion + 'espesor < 0.5 mm.' };
      }
      // La subpartida 7209.90 es para "Los demás" (trabajados posteriormente)
      // return { subpartida: '720990', justificacion: justificacion + 'trabajados posteriormente.' };

    case '7210': // Laminados planos s/alear, >=600mm, chapados o revestidos
      justificacion = 'Laminado plano s/alear, ≥600mm, revestido: ';
      if (rec.includes('estaño') || rec.includes('hojalata')) {
        if (espesor >= 0.5) return { subpartida: '721011', justificacion: justificacion + 'estañado, espesor ≥ 0.5 mm.' };
        return { subpartida: '721012', justificacion: justificacion + 'estañado, espesor < 0.5 mm.' };
      }
      if (rec.includes('plomo')) return { subpartida: '721020', justificacion: justificacion + 'emplomado.' };
      if (rec.includes('galvanizado_electrolitico') || rec.includes('electrocincado')) {
        return { subpartida: '721030', justificacion: justificacion + 'cincado electrolíticamente.' };
      }
      // "Cincados de otro modo" (usualmente inmersión en caliente)
      if (rec.includes('galvanizado_inmersion') || (rec.includes('galvanizado') && !rec.includes('electrolitico'))) {
        if (formaFisica.includes('ondulado') || desc.includes('corrugado')) { // "ondulados" en la tarifa
          return { subpartida: '721041', justificacion: justificacion + 'cincado por inmersión, corrugado/ondulado.' };
        }
        return { subpartida: '721049', justificacion: justificacion + 'cincado por inmersión, los demás (no corrugados).' };
      }
      if (rec.includes('oxido de cromo') || (rec.includes('cromo') && rec.includes('oxido'))) {
        return { subpartida: '721050', justificacion: justificacion + 'revestido de óxidos de cromo o cromo y óxidos de cromo.' };
      }
      if (rec.includes('aluminio') && rec.includes('zinc')) return { subpartida: '721061', justificacion: justificacion + 'revestido de aleaciones aluminio-cinc.' };
      if (rec.includes('aluminio')) return { subpartida: '721069', justificacion: justificacion + 'revestido de aluminio (los demás).' };
      if (rec.includes('pintado') || rec.includes('barnizado') || rec.includes('plastico') || rec.includes('plastificado')) {
        return { subpartida: '721070', justificacion: justificacion + 'pintado, barnizado o revestido de plástico.' };
      }
      // "Chapados" u "Otros revestimientos" si no coincide con los anteriores.
      // 7210.90 es para "Los demás" (incluye chapados)
      return { subpartida: '721090', justificacion: justificacion + 'los demás (e.g. chapados).' };


// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7211': // Laminados planos s/alear, <600mm, sin chapar/revestir
      justificacion = 'Laminado plano s/alear, <600mm, s/revestir, ';

      // ANTERIOR: if (acabado.includes('caliente')) {
      if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
        justificacion += 'simplemente laminado en caliente, '; // "Simplemente" se asume si no hay más información

        // 7211.13 "Laminados en las cuatro caras o en acanaladuras cerradas (fleje universal)... sin enrollar"
        // ANTERIOR: !formaFisica.includes('rollo')
        if ((desc.includes('cuatro caras') || desc.includes('acanaladura cerrada') || tipoProducto.includes('fleje universal')) &&
            (ancho > 150 && ancho < 600) && // Asegurar que el ancho esté dentro del rango para fleje universal
            espesor >= 4 &&
            !props.esEnrollado && // <--- CAMBIO AQUÍ
            !desc.includes('relieve') // La subpartida también especifica "sin motivos en relieve"
           ) {
            return { subpartida: '721113', justificacion: justificacion + 'laminado en 4 caras/acanaladura cerrada (fleje universal), ancho > 150mm y < 600mm, esp. ≥ 4mm, sin enrollar y sin motivos en relieve.' };
        }

        // 7211.14 "Los demás (laminados en caliente), de espesor >= 4.75 mm"
        // (No incluye los de 7211.13)
        if (espesor >= 4.75) {
          return { subpartida: '721114', justificacion: justificacion + 'los demás, espesor ≥ 4.75 mm.' };
        }
        
        // 7211.19 "Los demás (laminados en caliente)" (espesor < 4.75mm y no 7211.13)
        return { subpartida: '721119', justificacion: justificacion + 'los demás, espesor < 4.75 mm.' };
      }

      // ANTERIOR: if (acabado.includes('frio')) {
      if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ
        justificacion += 'simplemente laminado en frío, '; // "Simplemente" se asume

        // 7211.23 "Con un contenido de carbono inferior al 0.25 % en peso"
        if (carbono < 0.0025) { // Asumiendo que `carbono` es un valor como 0.0020 para 0.20%
          return { subpartida: '721123', justificacion: justificacion + 'C < 0.25%.' };
        }
        // 7211.29 "Los demás" (C >= 0.25%)
        return { subpartida: '721129', justificacion: justificacion + 'los demás (C ≥ 0.25%).' };
      }
      
      // 7211.90 "Los demás"
      // Esto cubriría productos de la partida 7211 que no son simplemente laminados en caliente o en frío
      // (por ejemplo, si estuvieran trabajados posteriormente de alguna manera que no los mueva a otra partida,
      // aunque 7211 es específicamente "sin chapar ni revestir").
      // O si props.procesoLaminado no es ni 'caliente' ni 'frio'.
      return { subpartida: '721190', justificacion: justificacion + 'los demás (e.g., trabajados posteriormente o proceso no especificado como caliente/frío).' };

            

    case '7212': // Laminados planos s/alear, <600mm, chapados o revestidos
      justificacion = 'Laminado plano s/alear, <600mm, revestido: ';
      if (rec.includes('estaño') || rec.includes('hojalata')) return { subpartida: '721210', justificacion: justificacion + 'estañado.' };
      if (rec.includes('galvanizado_electrolitico') || rec.includes('electrocincado')) return { subpartida: '721220', justificacion: justificacion + 'cincado electrolíticamente.' };
      if (rec.includes('galvanizado_inmersion') || (rec.includes('galvanizado') && !rec.includes('electrolitico'))) {
        return { subpartida: '721230', justificacion: justificacion + 'cincado de otro modo (inmersión).' };
      }
      if (rec.includes('pintado') || rec.includes('barnizado') || rec.includes('plastico') || rec.includes('plastificado')) {
        return { subpartida: '721240', justificacion: justificacion + 'pintado, barnizado o revestido de plástico.' };
      }
      if (rec.includes('chapado')) return { subpartida: '721260', justificacion: justificacion + 'chapado.' };
      // "Revestidos de otro modo"
      return { subpartida: '721250', justificacion: justificacion + 'revestido de otro modo (e.g. cromo, aluminio).' };

    // --- ALAMBRÓN, BARRAS, PERFILES, ALAMBRE ---
    // Partidas 7213-7217 (sin alear), 7221-7223 (inox), 7227-7229 (otros aleados)

    case '7213': // Alambrón s/alear
      justificacion = 'Alambrón s/alear, ';
      if (desc.includes('muesca') || desc.includes('cordon') || desc.includes('surco') || desc.includes('relieve')) {
        return { subpartida: '721310', justificacion: justificacion + 'con muescas, cordones, surcos o relieves (para hormigón).' };
      }
      if (desc.includes('facil mecanizacion') || obs.includes('acero de facil maquinado')) {
        return { subpartida: '721320', justificacion: justificacion + 'de acero de fácil mecanización.' };
      }
      // "Los demás"
      justificacion += 'los demás, ';
      // Necesitamos diámetro para 7213.91 vs 7213.99
      const diametroAlambron = props.diametroExterior || 0; // Asumiendo que diametroExterior se usa para alambrón
      if (formaTransversal.includes('circular') && diametroAlambron < 14) {
        return { subpartida: '721391', justificacion: justificacion + 'de sección circular, diámetro < 14 mm.' };
      }
      return { subpartida: '721399', justificacion: justificacion + 'los demás (e.g. no circular, o circular D >= 14mm).' };

    case '7214': // Barras s/alear, simplemente forjadas, laminadas/extrudidas en caliente, o torsionadas post-laminado
      justificacion = 'Barra s/alear, ';
      if (acabado.includes('forjado')) return { subpartida: '721410', justificacion: justificacion + 'simplemente forjada.' };
      if (desc.includes('muesca') || desc.includes('cordon') || desc.includes('surco') || desc.includes('relieve') || desc.includes('torsion')) {
        return { subpartida: '721420', justificacion: justificacion + 'con muescas/relieves o sometidas a torsión post-laminado.' };
      }
      if (desc.includes('facil mecanizacion') || obs.includes('acero de facil maquinado')) {
        return { subpartida: '721430', justificacion: justificacion + 'de acero de fácil mecanización (no forjadas, sin relieves/torsión).' };
      }
      // "Las demás" (simplemente laminadas/extrudidas en caliente, sin las características anteriores)
      justificacion += 'simplemente laminada/extrudida en caliente (sin forjar, sin relieves/torsión, no fácil mec.), ';
      if (formaTransversal.includes('rectangular') && !formaTransversal.includes('cuadrada')) {
        return { subpartida: '721491', justificacion: justificacion + 'de sección rectangular.' };
      }
      return { subpartida: '721499', justificacion: justificacion + 'las demás secciones (e.g. circular, cuadrada).' };

    case '7215': // Las demás barras s/alear (no clasificadas en 72.14)
      justificacion = 'Barra s/alear (no clasificada en 72.14), ';
      if (desc.includes('facil mecanizacion') || obs.includes('acero de facil maquinado')) {
        // Y "simplemente obtenidas o acabadas en frío"
        if (acabado.includes('frio') || desc.includes('obtenida en frio') || desc.includes('acabada en frio')) {
          return { subpartida: '721510', justificacion: justificacion + 'de acero de fácil mecanización, simplemente obtenida/acabada en frío.' };
        }
      }
      // "Simplemente obtenidas o acabadas en frío" (no de fácil mecanización)
      if (acabado.includes('frio') || desc.includes('obtenida en frio') || desc.includes('acabada en frio')) {
        return { subpartida: '721550', justificacion: justificacion + 'simplemente obtenida/acabada en frío (no fácil mec.).' };
      }
      // "Las demás" (e.g. forjadas y obtenidas/acabadas en frío, o revestidas/chapadas y no entran en las anteriores)
      return { subpartida: '721590', justificacion: justificacion + 'las demás.' };

    case '7216': // Perfiles s/alear
      justificacion = 'Perfil s/alear, ';
      const alturaPerfil = props.altura || 0; // 'altura' es el término de la tarifa para perfiles

      if (formaTransversal.includes('u') || formaTransversal.includes('i') || formaTransversal.includes('h')) {
        if (acabado.includes('caliente') || acabado.includes('extrudido')) { // Asumimos "simplemente"
          if (alturaPerfil < 80) return { subpartida: '721610', justificacion: justificacion + 'U, I o H, simplemente laminado/extrudido en caliente, altura < 80 mm.' };
          // Altura >= 80mm
          if (formaTransversal.includes('u')) return { subpartida: '721631', justificacion: justificacion + 'U, simplemente laminado/extrudido en caliente, altura ≥ 80 mm.' };
          if (formaTransversal.includes('i')) return { subpartida: '721632', justificacion: justificacion + 'I, simplemente laminado/extrudido en caliente, altura ≥ 80 mm.' };
          if (formaTransversal.includes('h')) return { subpartida: '721633', justificacion: justificacion + 'H, simplemente laminado/extrudido en caliente, altura ≥ 80 mm.' };
        }
      }
      if (formaTransversal.includes('l') || formaTransversal.includes('t')) {
        if (acabado.includes('caliente') || acabado.includes('extrudido')) { // Asumimos "simplemente"
          if (alturaPerfil < 80) {
            if (formaTransversal.includes('l')) return { subpartida: '721621', justificacion: justificacion + 'L, simplemente laminado/extrudido en caliente, altura < 80 mm.' };
            if (formaTransversal.includes('t')) return { subpartida: '721622', justificacion: justificacion + 'T, simplemente laminado/extrudido en caliente, altura < 80 mm.' };
          } else { // Altura >= 80mm
            return { subpartida: '721640', justificacion: justificacion + 'L o T, simplemente laminado/extrudido en caliente, altura ≥ 80 mm.' };
          }
        }
      }
      // "Los demás perfiles, simplemente laminados o extrudidos en caliente" (e.g. Z, omega)
      if (acabado.includes('caliente') || acabado.includes('extrudido')) {
        return { subpartida: '721650', justificacion: justificacion + 'los demás (e.g. Z), simplemente laminados/extrudidos en caliente.' };
      }
      // Perfiles obtenidos o acabados en frío
      if (acabado.includes('frio') || desc.includes('obtenido en frio') || desc.includes('acabado en frio')) {
        if (desc.includes('a partir de laminado plano') || tipoProducto.includes('formado de lamina')) { // "conformados en frío a partir de productos laminados planos"
          return { subpartida: '721661', justificacion: justificacion + 'obtenido/acabado en frío, a partir de laminados planos.' };
        }
        // "Los demás" obtenidos/acabados en frío
        return { subpartida: '721669', justificacion: justificacion + 'los demás, obtenidos/acabados en frío (no a partir de laminados planos).' };
      }
      // "Los demás" (e.g. soldados, remachados, etc.)
      // 7216.91 "Obtenidos o acabados en frío, a partir de productos laminados planos" (esta subpartida parece redundante con 7216.61 si se refiere a "simplemente", pero si es para "trabajados posteriormente" como soldados, etc.)
      // 7216.99 "Los demás"
      // Esta parte es confusa sin más detalles del proceso. Si es soldado a partir de perfiles, es diferente.
      // Si es "trabajado posteriormente" pero no encaja en frío.
      if (desc.includes('soldado') || tipoProducto.includes('perfil soldado')) {
         // La tarifa puede tener "perfiles obtenidos por soldadura" en 7301.20
         // O "construcciones y sus partes" en 7308
         // Si son perfiles simples soldados, y no en 7301, pueden ir aquí bajo ciertas interpretaciones.
         // No obstante, los perfiles de la 7216 son generalmente monolíticos.
         // "Los demás" (perfiles trabajados posteriormente que no son obtenidos en frío)
         // Por ahora, si llega aquí y no es claro, es "Los demás"
         if (desc.includes('a partir de laminado plano')) {
             return { subpartida: '721691', justificacion: justificacion + 'los demás, obtenidos/acabados en frío a partir de laminados planos (trabajados posteriormente).' };
         }
         return { subpartida: '721699', justificacion: justificacion + 'los demás perfiles (trabajados posteriormente, no en frío de laminados planos).' };
      }
      return { subpartida: '721699', justificacion: justificacion + 'los demás perfiles (lógica no cubierta).' };


    case '7217': // Alambre s/alear
      justificacion = 'Alambre s/alear, ';
      if (!rec || rec === '-' || rec === 'sin recubrimiento' || desc.includes('pulido')) {
        return { subpartida: '721710', justificacion: justificacion + 'sin revestir, incluso pulido.' };
      }
      if (rec.includes('galvanizado') || rec.includes('cincado')) return { subpartida: '721720', justificacion: justificacion + 'cincado.' };
      if (rec !== '-' && !rec.includes('galvanizado') && !rec.includes('plastico')) { // "Revestidos de los demás metales comunes"
        return { subpartida: '721730', justificacion: justificacion + 'revestido de otros metales comunes (no cinc).' };
      }
      // "Los demás" (e.g. revestidos de plástico)
      return { subpartida: '721790', justificacion: justificacion + 'los demás (e.g. revestido de plástico).' };

    // --- ACERO INOXIDABLE ---
    case '7218': // Acero inoxidable en lingotes/formas primarias; semiproductos de acero inoxidable
      justificacion = 'Acero inoxidable: ';
      if (formaFisica.includes('lingote') || tipoProducto.includes('lingote') || formaFisica.includes('primaria')) {
        return { subpartida: '721810', justificacion: justificacion + 'en lingotes o demás formas primarias.' };
      }
      // Semiproductos
      justificacion += 'semiproducto, ';
      if (formaTransversal.includes('rectangular') && (!formaTransversal.includes('cuadrada'))) {
        return { subpartida: '721891', justificacion: justificacion + 'de sección rectangular.' };
      }
      return { subpartida: '721899', justificacion: justificacion + 'los demás (e.g. sección circular, cuadrada).' };

// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7219': // Laminados planos inox, >=600mm
      justificacion = 'Laminado plano inox, ≥600mm, ';

      // ANTERIOR: if (acabado.includes('caliente')) {
      if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
        justificacion += 'simplemente laminado en caliente, '; // "Simplemente" se asume

        // ANTERIOR: if (formaFisica.includes('rollo') || tipoProducto.includes('coil')) {
        if (props.esEnrollado) { // <--- CAMBIO AQUÍ (Productos enrollados - corresponden a 7219.1x)
          justificacion += 'enrollado, ';
          if (espesor > 10) return { subpartida: '721911', justificacion: justificacion + 'espesor > 10 mm.' };
          if (espesor >= 4.75) return { subpartida: '721912', justificacion: justificacion + 'espesor ≥ 4.75 mm y ≤ 10 mm.' };
          if (espesor >= 3) return { subpartida: '721913', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
          return { subpartida: '721914', justificacion: justificacion + 'espesor < 3 mm.' };
        } else { // Sin enrollar (Productos no enrollados - corresponden a 7219.2x)
          justificacion += 'sin enrollar, ';
          if (espesor > 10) return { subpartida: '721921', justificacion: justificacion + 'espesor > 10 mm.' };
          if (espesor >= 4.75) return { subpartida: '721922', justificacion: justificacion + 'espesor ≥ 4.75 mm y ≤ 10 mm.' };
          if (espesor >= 3) return { subpartida: '721923', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
          return { subpartida: '721924', justificacion: justificacion + 'espesor < 3 mm.' };
        }
      }

      // ANTERIOR: if (acabado.includes('frio')) {
      if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ (Productos laminados en frío - corresponden a 7219.3x)
        justificacion += 'simplemente laminado en frío, '; // "Simplemente" se asume
        // Para el acero inoxidable laminado en frío (7219.3), la distinción enrollado/no enrollado
        // no define las subpartidas principales a 6 dígitos; se basan en el espesor.
        if (espesor >= 4.75) return { subpartida: '721931', justificacion: justificacion + 'espesor ≥ 4.75 mm.' };
        if (espesor >= 3) return { subpartida: '721932', justificacion: justificacion + 'espesor ≥ 3 mm y < 4.75 mm.' };
        if (espesor > 1) return { subpartida: '721933', justificacion: justificacion + 'espesor > 1 mm y < 3 mm.' };
        if (espesor >= 0.5) return { subpartida: '721934', justificacion: justificacion + 'espesor ≥ 0.5 mm y ≤ 1 mm.' };
        return { subpartida: '721935', justificacion: justificacion + 'espesor < 0.5 mm.' };
      }
      
      // 7219.90 "Los demás"
      // Cubre productos de acero inoxidable laminados planos de la partida 7219 que no son
      // simplemente laminados en caliente o en frío (e.g., trabajados posteriormente como perforados,
      // conformados de manera especial, etc., pero sin llegar a ser manufacturas de otra partida).
      // O si props.procesoLaminado no es ni 'caliente' ni 'frio'.
      return { subpartida: '721990', justificacion: justificacion + 'los demás (e.g., trabajados posteriormente o proceso no especificado como caliente/frío).' };



// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7220': // Laminados planos inox, <600mm
      justificacion = 'Laminado plano inox, <600mm, ';

      // ANTERIOR: if (acabado.includes('caliente')) {
      if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
        justificacion += 'simplemente laminado en caliente, '; // "Simplemente" se asume

        // Para 7220.1 (laminados en caliente), la distinción es por espesor.
        // No se suele distinguir por "enrollado" vs "sin enrollar" a este nivel de subpartida para <600mm.
        if (espesor >= 4.75) {
          return { subpartida: '722011', justificacion: justificacion + 'espesor ≥ 4.75 mm.' };
        }
        return { subpartida: '722012', justificacion: justificacion + 'espesor < 4.75 mm.' };
      }

      // ANTERIOR: if (acabado.includes('frio')) {
      if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ
        justificacion += 'simplemente laminado en frío.'; // "Simplemente" se asume
        return { subpartida: '722020', justificacion }; // 7220.20 es una subpartida única para laminados en frío.
      }
      
      // 7220.90 "Los demás"
      // Cubre productos de la partida 7220 que no son simplemente laminados en caliente o en frío
      // (e.g., trabajados posteriormente, pero aún <600mm y de acero inoxidable).
      // O si props.procesoLaminado no es ni 'caliente' ni 'frio'.
      return { subpartida: '722090', justificacion: justificacion + 'los demás (e.g., trabajados posteriormente o proceso no especificado como caliente/frío).' };

// ... (continuar con el resto de las partidas en el switch) ...



    case '7221': // Alambrón de acero inoxidable
      return { subpartida: '722100', justificacion: 'Alambrón de acero inoxidable.' };

// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7222': // Barras y perfiles, de acero inoxidable
      justificacion = 'De acero inoxidable: ';

      // Primero, identificar los perfiles, ya que tienen su propia subpartida (7222.40)
      if (tipoProducto.includes('perfil') || tipoProducto.includes('angulo') || tipoProducto.includes('forma') || tipoProducto.includes('seccion')) {
        // La partida 7222.40 es para "Perfiles". No se subdivide más por acabado en caliente/frío a este nivel.
        return { subpartida: '722240', justificacion: justificacion + 'perfil.' };
      }

      // Si no es un perfil, entonces es una barra.
      // La lógica para barras sigue:
      if (props.tipoProducto && (props.tipoProducto.includes('barra') || props.tipoProducto.includes('varilla') || props.tipoProducto.includes('rod'))) {
        // "Barras simplemente laminadas o extrudidas en caliente" (o acabadas en caliente) - Corresponde a 7222.1x
        // ANTERIOR: if (acabado.includes('caliente') || acabado.includes('extrudido')) {
        if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
          justificacion += 'barra, simplemente obtenida/acabada en caliente (laminada, estirada o extrudida), ';
          if (formaTransversal.includes('circular') || formaTransversal.includes('redonda')) {
            return { subpartida: '722211', justificacion: justificacion + 'de sección circular.' }; // 7222.11
          }
          return { subpartida: '722219', justificacion: justificacion + 'de las demás secciones.' }; // 7222.19
        }

        // "Barras simplemente obtenidas o acabadas en frío" - Corresponde a 7222.20
        // ANTERIOR: if (acabado.includes('frio') || desc.includes('obtenida en frio') || desc.includes('acabada en frio')) {
        if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ
          justificacion += 'barra, simplemente obtenida/acabada en frío, ';
          return { subpartida: '722220', justificacion }; // 7222.20 es una subpartida única para barras acabadas en frío.
        }

        // "Las demás barras" (e.g., forjadas, o trabajadas más allá del simple acabado en caliente/frío) - Corresponde a 7222.30
        // Esto incluye barras forjadas. Si props.acabado puede ser "forjado", se podría usar.
        // De lo contrario, se puede inferir si no es ni caliente ni frío y es una barra.
        // O si `desc` o `textoGeneral` indican "forjado".
        if (desc.includes('forjada') || textoGeneral.includes('forged bar')) {
            justificacion += 'barra, forjada, ';
        } else {
            justificacion += 'barra, las demás (ni simplemente acabada en caliente ni en frío), ';
        }
        return { subpartida: '722230', justificacion };
      }
      
      // Fallback si es de la partida 7222 pero no se identifica claramente como perfil o barra con proceso.
      // Esto podría ser un perfil si `tipoProducto` no fue lo suficientemente específico.
      // O podría ser una barra donde el proceso no se pudo determinar.
      // Es mejor tener un fallback específico para perfiles si aún es posible, o a "demás barras".
      if (DEBUG) console.warn(`[asignarSubpartidaCap72] Producto en 7222 no claramente identificable como perfil o barra con proceso definido. Props: ${JSON.stringify(props)}`);
      // Si `tipoProducto` era ambiguo, pero por el contexto de la partida es probable que sea una barra o perfil.
      // Si es un perfil pero la palabra "perfil" no estaba en tipoProducto:
      if (formaTransversal.match(/^(u|i|h|l|t|angulo|viga|canal)$/i) && !tipoProducto.includes('barra')) {
         return { subpartida: '722240', justificacion: justificacion + 'perfil (inferido).' };
      }
      // Por defecto, si no es perfil y no se pudo determinar el proceso para barra, va a "demás barras".
      return { subpartida: '722230', justificacion: justificacion + 'las demás barras (proceso no determinado claramente).' };

// ... (continuar con el resto




    case '7223': // Alambre de acero inoxidable
      return { subpartida: '722300', justificacion: 'Alambre de acero inoxidable.' };

    // --- LOS DEMÁS ACEROS ALEADOS ---
    case '7224': // Los demás aceros aleados en lingotes/formas primarias; semiproductos de los demás aceros aleados
      justificacion = 'De los demás aceros aleados: ';
      if (formaFisica.includes('lingote') || tipoProducto.includes('lingote') || formaFisica.includes('primaria')) {
        return { subpartida: '722410', justificacion: justificacion + 'en lingotes o demás formas primarias.' };
      }
      // Semiproductos
      return { subpartida: '722490', justificacion: justificacion + 'semiproducto.' }; // Subpartida única para semiproductos de otros aleados


// Dentro de asignarSubpartidaCap72.js

// ... (otras partes de la función)

    case '7225': // Laminados planos de los demás aceros aleados, >=600mm
      justificacion = 'Laminado plano de otros aceros aleados, ≥600mm: ';
      if (desc.includes('acero al silicio') || obs.includes('acero magnetico')) {
        if (desc.includes('grano orientado')) return { subpartida: '722511', justificacion: justificacion + 'de acero al silicio de grano orientado.' };
        return { subpartida: '722519', justificacion: justificacion + 'de acero al silicio (no grano orientado).' };
      }
      // "Los demás" (no acero al silicio)
      // ANTERIOR: if (acabado.includes('caliente')) {
      if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ: Usar props.procesoLaminado
        justificacion += 'simplemente laminado en caliente, ';
        // Asegurarse de usar props.esEnrollado como se discutió para robustez
        if (props.esEnrollado) { // <--- CAMBIO AQUÍ (si no se hizo antes, usar props.esEnrollado)
            return { subpartida: '722530', justificacion: justificacion + 'enrollado.' };
        }
        return { subpartida: '722540', justificacion: justificacion + 'sin enrollar.' };
      }
      // ANTERIOR: if (acabado.includes('frio')) return { subpartida: '722550', justificacion: justificacion + 'simplemente laminado en frío.' };
      if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ: Usar props.procesoLaminado
          return { subpartida: '722550', justificacion: justificacion + 'simplemente laminado en frío.' };
      }
      // "Los demás" (revestidos o trabajados posteriormente)
      // Esta parte del bloque para 7225.9x no necesita cambiar, ya que maneja revestimientos.
      // Un producto decapado (pickled) no se considera "revestido" o "trabajado posteriormente"
      // en el sentido que lo clasificaría aquí si es simplemente laminado en caliente o frío.
      if (rec.includes('galvanizado_electrolitico') || rec.includes('electrocincado')) {
        return { subpartida: '722591', justificacion: justificacion + 'cincado electrolíticamente.' };
      }
      if (rec.includes('galvanizado_inmersion') || (rec.includes('galvanizado') && !rec.includes('electrolitico'))) {
        return { subpartida: '722592', justificacion: justificacion + 'cincado de otro modo (inmersión).' };
      }
      return { subpartida: '722599', justificacion: justificacion + 'los demás (e.g. otros revestimientos, trabajados).' };

// ... (resto del switch)

// Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7226': // Laminados planos de los demás aceros aleados, <600mm
      justificacion = 'Laminado plano de otros aceros aleados, <600mm: ';

      // Primero, verificar tipos de acero específicos que tienen sus propias subpartidas.
      // Acero al silicio (eléctrico) - 7226.1x
      if (desc.includes('acero al silicio') || obs.includes('acero magnetico') || textoGeneral.includes('silicon-electrical steel')) {
        if (desc.includes('grano orientado') || textoGeneral.includes('grain-oriented')) {
          return { subpartida: '722611', justificacion: justificacion + 'de acero al silicio de grano orientado.' };
        }
        return { subpartida: '722619', justificacion: justificacion + 'de acero al silicio (eléctrico), los demás (no grano orientado).' };
      }

      // Acero rápido - 7226.20
      if (desc.includes('acero rapido') || obs.includes('acero rapido') || textoGeneral.includes('high-speed steel')) {
        return { subpartida: '722620', justificacion: justificacion + 'de acero rápido.' };
      }

      // "Los demás" aceros aleados (no de silicio eléctrico, no rápidos)
      // Aquí se diferencia por el proceso de laminado.
      // ANTERIOR: if (acabado.includes('caliente'))
      if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
        // 7226.91: Simplemente laminados en caliente
        return { subpartida: '722691', justificacion: justificacion + 'los demás, simplemente laminados en caliente.' };
      }

      // ANTERIOR: if (acabado.includes('frio'))
      if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ
        // 7226.92: Simplemente laminados en frío
        return { subpartida: '722692', justificacion: justificacion + 'los demás, simplemente laminados en frío.' };
      }
      
      // 7226.99: "Los demás"
      // Esto cubre productos de la partida 7226 que no son de acero al silicio, ni de acero rápido,
      // y no son simplemente laminados en caliente o en frío (e.g., revestidos, o trabajados posteriormente
      // de maneras que los excluyen de .91 o .92).
      // O si props.procesoLaminado no es ni 'caliente' ni 'frio'.
      if (rec && rec !== '-' && rec !== 'sin recubrimiento') {
        justificacion += `los demás, ${rec}, `;
      } else {
        justificacion += 'los demás (e.g. trabajados posteriormente o proceso no especificado como caliente/frío), ';
      }
      return { subpartida: '722699', justificacion };

// ... (continuar con el resto de las partidas en el switch) ...





    case '7227': // Alambrón de los demás aceros aleados
      justificacion = 'Alambrón de otros aceros aleados: ';
      if (desc.includes('acero rapido') || obs.includes('acero rapido')) return { subpartida: '722710', justificacion: justificacion + 'de acero rápido.' };
      if (desc.includes('acero silicomanganeso') || obs.includes('silicomanganeso')) return { subpartida: '722720', justificacion: justificacion + 'de acero silicomanganeso.' };
      return { subpartida: '722790', justificacion: justificacion + 'los demás.' };

    
    
  // Archivo: asignarSubpartidaCap72.js

// ... (resto de la función y otras partidas) ...

    case '7228': // Barras y perfiles, de los demás aceros aleados; barras huecas para perforación
      justificacion = 'De otros aceros aleados: ';

      // 1. Barras huecas para perforación (7228.80)
      if ( (tipoProducto.includes('barra hueca') || textoGeneral.includes('hollow drill bar')) && 
           (desc.includes('perforacion') || textoGeneral.includes('drill')) ) {
        // Nota: La tarifa indica "aceros aleados o sin alear" para 7228.80, pero la partida 7228 es de "otros aceros aleados".
        // Esto es una particularidad de la nomenclatura para esta subpartida específica.
        return { subpartida: '722880', justificacion: justificacion + 'barras huecas para perforación.' };
      }

      // 2. Perfiles (ángulos, formas, secciones) (7228.70)
      if (tipoProducto.includes('perfil') || tipoProducto.includes('angulo') || tipoProducto.includes('forma') || tipoProducto.includes('seccion') ||
          formaTransversal.match(/^(u|i|h|l|t|viga|canal)$/i) // Inferencia por forma transversal si tipoProducto es genérico
         ) {
        // La subpartida 7228.70 es para "Perfiles". No se subdivide más por acabado a este nivel.
        return { subpartida: '722870', justificacion: justificacion + 'perfiles.' };
      }

      // 3. Barras (si no es barra hueca de perforación ni perfil)
      if (tipoProducto.includes('barra') || tipoProducto.includes('varilla') || tipoProducto.includes('rod')) {
        // 3a. Barras de acero rápido (7228.10)
        if (desc.includes('acero rapido') || obs.includes('acero rapido') || textoGeneral.includes('high-speed steel')) {
          return { subpartida: '722810', justificacion: justificacion + 'barras de acero rápido.' };
        }
        // 3b. Barras de acero silicomanganeso (7228.20)
        if (desc.includes('acero silicomanganeso') || obs.includes('silicomanganeso') || textoGeneral.includes('silico-manganese steel')) {
          return { subpartida: '722820', justificacion: justificacion + 'barras de acero silicomanganeso.' };
        }

        // 3c. "Las demás barras" - diferenciadas por proceso/acabado
        justificacion += 'las demás barras de otros aceros aleados (no acero rápido ni silicomanganeso), ';

        // 7228.40: Simplemente forjadas
        // ANTERIORMENTE: if (acabado.includes('forjado'))
        if (desc.includes('forjada') || textoGeneral.includes('forged bar') || textoGeneral.includes('simply forged')) { // <--- CAMBIO AQUÍ
          return { subpartida: '722840', justificacion: justificacion + 'simplemente forjadas.' };
        }

        // 7228.30: Simplemente laminadas o extrudidas en caliente (o acabadas en caliente)
        // ANTERIORMENTE: if (acabado.includes('caliente') || acabado.includes('extrudido'))
        if (props.procesoLaminado === 'caliente') { // <--- CAMBIO AQUÍ
          return { subpartida: '722830', justificacion: justificacion + 'simplemente obtenidas/acabadas en caliente (laminadas, estiradas o extrudidas).' };
        }

        // 7228.50: Simplemente obtenidas o acabadas en frío
        // ANTERIORMENTE: if (acabado.includes('frio') || desc.includes('obtenida en frio') || desc.includes('acabada en frio'))
        if (props.procesoLaminado === 'frio') { // <--- CAMBIO AQUÍ
          return { subpartida: '722850', justificacion: justificacion + 'simplemente obtenidas/acabadas en frío.' };
        }
        
        // 7228.60: Las demás barras (trabajadas posteriormente o proceso no cubierto arriba)
        return { subpartida: '722860', justificacion: justificacion + 'las demás (e.g., trabajadas posteriormente al simple laminado/forjado/acabado en frío, o proceso no determinado).' };
      }
      
      // Fallback general para la partida 7228 si no encaja en ninguna categoría anterior
      // (debería ser menos probable si tipoProducto es claro).
      if (DEBUG) console.warn(`[asignarSubpartidaCap72] Producto en 7228 no clasificable con reglas actuales. Props: ${JSON.stringify(props)}`);
      return { subpartida: '722860', justificacion: justificacion + 'las demás barras de otros aceros aleados (clasificación residual, revisar información).' };


// ... (continuar con el resto de las partidas en el switch) ...





    case '7229': // Alambre de los demás aceros aleados
      justificacion = 'Alambre de otros aceros aleados: ';
      if (desc.includes('acero silicomanganeso') || obs.includes('silicomanganeso')) return { subpartida: '722920', justificacion: justificacion + 'de acero silicomanganeso.' };
      return { subpartida: '722990', justificacion: justificacion + 'los demás.' };

    default:
      return { subpartida: null, justificacion: `Partida ${partida} no tiene lógica de subpartida específica en Cap. 72 o información insuficiente.` };
  }
}
