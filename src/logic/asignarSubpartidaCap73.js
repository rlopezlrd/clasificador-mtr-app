// src/logic/asignarSubpartidaCap73.js

// DEBUG flag now uses environment variable
const DEBUG = process.env.DEBUG === 'true';

export function determinarSubpartidaCap73(props, partida) {
  partida = (partida || '').substring(0, 4);
  if (DEBUG) console.log('🧩 Partida evaluada para subpartidaCap73:', partida, 'Props:', props);

  const tipoProducto = (props.tipoProducto || '').toLowerCase();
  const recubrimiento = (props.recubrimiento || '').toLowerCase();
  const observaciones = (props.observaciones || '').toLowerCase(); // Considerar usar props.descripcion también si es relevante aquí
  const composicion = props.composicion || {};
  const costura = (props.costura || '').toLowerCase();
  const norma = (props.norma || '').toLowerCase();
  const formaTransversal = (props.formaTransversal || '').toLowerCase(); // Podría ser 'circular', 'cuadrada', 'rectangular', etc.
  const procesoLaminado = (props.procesoLaminado || '').toLowerCase(); // 'frio', 'caliente'
  const diametroExterior = props.diametroExterior || 0;
  // const espesor = props.espesor || 0; // 'espesor' es más para láminas, para tubos es 'espesorPared'
  const espesorPared = props.espesorPared || 0;
  const aleado = props.aleado || false; // Directamente de props.aleado (boolean)
  const descripcion = (props.descripcion || '').toLowerCase();
  const usoTecnico = (props.usoTecnico || '').toLowerCase();

  // Usar una combinación más robusta de texto para las búsquedas generales
  const textoGeneral = `${tipoProducto} ${descripcion} ${observaciones} ${norma} ${usoTecnico} ${costura} ${recubrimiento}`.trim();
  const esInoxidable = (props.tipoAcero || '').toLowerCase().includes('inoxidable');

  // Lógica de esSoldado y esSinCostura mejorada para usar props.costura directamente
  const esSoldadoDeterminado = costura.includes('soldado') || costura.includes('con costura') || costura.includes('erw') || costura.includes('saw') || costura.includes('hfi');
  const esSinCosturaDeterminado = costura.includes('sin costura') || costura.includes('smls');

  // Criterios para oleoductos/gasoductos y perforación (más centralizados)
  const esParaOleoductoGasoducto = /line\s*pipe|oleoducto|gasoducto/i.test(textoGeneral) || (norma.includes('api') && norma.includes('5l'));
  const esParaPerforacion = /casing|tubing|perforaci[oó]n|drill\s*pipe/i.test(textoGeneral) || (norma.includes('api') && (norma.includes('5ct') || norma.includes('5dp')));


  if (DEBUG) {
    console.log('[DEBUG Cap73] Variables de decisión:', {
        partida, tipoProducto, esInoxidable, aleado, costura, esSoldadoDeterminado, esSinCosturaDeterminado,
        norma, formaTransversal, procesoLaminado, usoTecnico, esParaOleoductoGasoducto, esParaPerforacion, textoGeneral
    });
  }

  switch (partida) {
    case '7301':
      if (textoGeneral.includes('tablestaca')) {
        return { subpartida: '730110', justificacion: 'Tablestacas de hierro o acero.' };
      }
      // Los demás son perfiles obtenidos por soldadura
      return { subpartida: '730120', justificacion: 'Perfiles de hierro o acero obtenidos por soldadura.' };

    case '7302': // Material para vías férreas
      if (textoGeneral.includes('riel') || textoGeneral.includes('carril')) {
        return { subpartida: '730210', justificacion: 'Carriles (rieles).' };
      }
      if (textoGeneral.includes('aguja') || textoGeneral.includes('punta') && textoGeneral.includes('corazon') || textoGeneral.includes('cruzamiento') || textoGeneral.includes('varilla') && textoGeneral.includes('mando')) {
        return { subpartida: '730230', justificacion: 'Agujas, puntas de corazón, varillas para mando de agujas y otros elementos para cruzamiento y cambio de vía.' };
      }
      if (textoGeneral.includes('brida') || (textoGeneral.includes('placa') && textoGeneral.includes('asiento')) || textoGeneral.includes('eclisa')) { // Eclisa es fish plate
        return { subpartida: '730240', justificacion: 'Bridas y placas de asiento (eclisas).' };
      }
      return { subpartida: '730290', justificacion: 'Los demás materiales para vías férreas.' };

    case '7303': // Tubos y perfiles huecos, de fundición
      // Esta partida no tiene subpartidas de 6 dígitos en muchas nomenclaturas (ej. HS), la subpartida es 7303.00
      // Si tu sistema requiere 6 dígitos, puede ser '730300'
      return { subpartida: '730300', justificacion: 'Tubos y perfiles huecos, de fundición.' };

    case '7304': { // Tubos y perfiles huecos, sin costura, de hierro o acero (excepto fundición)
      let justificacionDetallada = 'Tubo/perfil hueco s/costura, ';

      if (esParaOleoductoGasoducto) {
        justificacionDetallada += 'para oleoducto/gasoducto (line pipe), ';
        if (esInoxidable) return { subpartida: '730411', justificacion: justificacionDetallada + 'de acero inoxidable.' };
        // Para 7304.19 (los demás aceros para line pipe)
        return { subpartida: '730419', justificacion: justificacionDetallada + 'de los demás aceros.' };
      }

      if (esParaPerforacion) {
        justificacionDetallada += 'para perforación (casing, tubing, drill pipe), ';
        if (esInoxidable) return { subpartida: '730422', justificacion: justificacionDetallada + 'de acero inoxidable.' };
        if (aleado && !esInoxidable) return { subpartida: '730423', justificacion: justificacionDetallada + 'de los demás aceros aleados.' };
        // Para 7304.29 (los demás aceros para perforación)
        return { subpartida: '730429', justificacion: justificacionDetallada + 'de los demás aceros (no aleados).' };
      }

      // Los demás tubos y perfiles huecos, sin costura
      justificacionDetallada = 'Los demás tubos/perfiles huecos s/costura, de sección circular, ';
      if (formaTransversal === 'circular' || tipoProducto.includes('tubo')) { // Asumimos tubo es circular si no se especifica otra forma
        if (esInoxidable) {
          justificacionDetallada += 'de acero inoxidable, ';
          if (procesoLaminado.includes('frio') || descripcion.includes('estirado en frio') || descripcion.includes('cold drawn')) {
            return { subpartida: '730441', justificacion: justificacionDetallada + 'estirados o laminados en frío.' };
          }
          return { subpartida: '730449', justificacion: justificacionDetallada + 'los demás (no estirados/laminados en frío).' };
        }
        if (aleado && !esInoxidable) {
          justificacionDetallada += 'de los demás aceros aleados (excepto inoxidable), ';
          if (procesoLaminado.includes('frio') || descripcion.includes('estirado en frio') || descripcion.includes('cold drawn')) {
            return { subpartida: '730451', justificacion: justificacionDetallada + 'estirados o laminados en frío.' };
          }
          return { subpartida: '730459', justificacion: justificacionDetallada + 'los demás (no estirados/laminados en frío).' };
        }
        // Aceros sin alear (los demás)
        justificacionDetallada += 'de hierro o acero sin alear, ';
        if (procesoLaminado.includes('frio') || descripcion.includes('estirado en frio') || descripcion.includes('cold drawn')) {
          return { subpartida: '730431', justificacion: justificacionDetallada + 'estirados o laminados en frío.' };
        }
        return { subpartida: '730439', justificacion: justificacionDetallada + 'los demás (no estirados/laminados en frío).' };
      }

      // Si no es circular o no es tubo (perfiles huecos no circulares sin costura)
      // Esta categoría va a 7304.90 "Los demás"
      return { subpartida: '730490', justificacion: 'Los demás tubos y perfiles huecos, sin costura (e.g., no circulares).' };
    }

    case '7305': { // Los demás tubos (por ejemplo: soldados o sin costura de diámetro exterior > 406,4 mm), de hierro o acero.
                   // Esta partida se centra en tubos de gran diámetro.
      let justificacionDetallada = 'Tubo de gran diámetro (>406.4mm ext.), ';

      if (esParaOleoductoGasoducto) {
        justificacionDetallada += 'para oleoducto/gasoducto (line pipe), ';
        if (costura.includes('arco sumergido') || descripcion.includes('submerged arc welded') || descripcion.includes('saw')) {
          return { subpartida: '730511', justificacion: justificacionDetallada + 'soldados longitudinalmente por arco sumergido.' };
        }
        if (esSoldadoDeterminado) { // Otros soldados longitudinalmente (no arco sumergido)
          return { subpartida: '730512', justificacion: justificacionDetallada + 'soldados longitudinalmente (excepto arco sumergido).' };
        }
        // "Los demás" line pipe de gran diámetro (podría ser helicoidal, sin costura si aplica)
        return { subpartida: '730519', justificacion: justificacionDetallada + 'los demás (e.g. soldados helicoidalmente, sin costura).' };
      }

      if (esParaPerforacion) { // Tubos de entubación (casing) de los utilizados para la extracción de petróleo o gas
        justificacionDetallada += 'para perforación (casing), ';
        // No hay distinción por tipo de soldadura en la subpartida 7305.20
        return { subpartida: '730520', justificacion: justificacionDetallada + 'utilizados para la extracción de petróleo o gas.' };
      }

      // Los demás tubos de la partida 73.05
      justificacionDetallada = 'Los demás tubos de gran diámetro (>406.4mm ext.), ';
      if (esSoldadoDeterminado) { // Incluye soldados longitudinalmente y helicoidalmente
         return { subpartida: '730531', justificacion: justificacionDetallada + 'soldados.' }; // Simplificado, HS no distingue aquí entre long. y helic.
      }
      // "Los demás" (e.g., sin costura de gran diámetro si no son line pipe o casing)
      return { subpartida: '730539', justificacion: justificacionDetallada + 'los demás (e.g. sin costura no clasificados anteriormente).' };
    }

    case '7306': { // Los demás tubos y perfiles huecos (por ejemplo: soldados, excepto los de la partida 73.05), de hierro o acero.
      let justificacionDetallada = 'Tubo/perfil hueco (no gran diámetro), ';

      if (esParaOleoductoGasoducto) {
        justificacionDetallada += 'para oleoducto/gasoducto (line pipe), ';
        if (esInoxidable) return { subpartida: '730611', justificacion: justificacionDetallada + 'de acero inoxidable.' };
        return { subpartida: '730619', justificacion: justificacionDetallada + 'de los demás aceros.' };
      }

      if (esParaPerforacion) { // Tubos de entubación (casing) o de producción (tubing)
        justificacionDetallada += 'para perforación (casing/tubing), ';
        if (esInoxidable) return { subpartida: '730621', justificacion: justificacionDetallada + 'de acero inoxidable.' };
        return { subpartida: '730629', justificacion: justificacionDetallada + 'de los demás aceros.' };
      }

      // Los demás, soldados, de sección circular
      if (formaTransversal === 'circular' || tipoProducto.includes('tubo')) {
        justificacionDetallada += 'soldado, de sección circular, ';
        if (esInoxidable) return { subpartida: '730640', justificacion: justificacionDetallada + 'de acero inoxidable.' };
        if (aleado && !esInoxidable) return { subpartida: '730650', justificacion: justificacionDetallada + 'de los demás aceros aleados (excepto inoxidable).' };
        // Aceros sin alear (los demás)
        return { subpartida: '730630', justificacion: justificacionDetallada + 'de hierro o acero sin alear.' };
      }

      // Los demás, soldados, de sección no circular (cuadrada, rectangular, etc.)
      justificacionDetallada += 'soldado, de sección no circular, ';
      if (formaTransversal === 'cuadrada' || formaTransversal === 'rectangular') {
        // La subpartida 7306.61 es para "de sección cuadrada o rectangular"
        return { subpartida: '730661', justificacion: justificacionDetallada + 'cuadrada o rectangular.' };
      }
      // La subpartida 7306.69 es para "de las demás secciones no circulares"
      return { subpartida: '730669', justificacion: justificacionDetallada + 'de las demás secciones no circulares.' };
    }

    case '7307': { // Accesorios de tubería (por ejemplo: empalmes (rácores), codos, manguitos), de hierro o acero.
      let justificacionDetallada = 'Accesorio de tubería, ';
      // Moldeados
      if (descripcion.includes('moldeado') || tipoProducto.includes('fundicion')) { // Asumiendo "fundicion" implica moldeado para accesorios
        justificacionDetallada += 'moldeado, ';
        if (descripcion.includes('no maleable')) {
          return { subpartida: '730711', justificacion: justificacionDetallada + 'de fundición no maleable.' };
        }
        return { subpartida: '730719', justificacion: justificacionDetallada + 'los demás (de fundición maleable, acero moldeado).' };
      }

      // Los demás (no moldeados), de acero inoxidable
      if (esInoxidable) {
        justificacionDetallada += 'de acero inoxidable (no moldeado), ';
        if (descripcion.includes('brida')) return { subpartida: '730721', justificacion: justificacionDetallada + 'bridas.' };
        if (descripcion.includes('roscado') && (descripcion.includes('codo') || descripcion.includes('curva') || descripcion.includes('manguito'))) {
          return { subpartida: '730722', justificacion: justificacionDetallada + 'codos, curvas y manguitos, roscados.' };
        }
        if (descripcion.includes('soldar') && descripcion.includes('tope')) {
          return { subpartida: '730723', justificacion: justificacionDetallada + 'accesorios para soldar a tope.' };
        }
        return { subpartida: '730729', justificacion: justificacionDetallada + 'los demás.' };
      }

      // Los demás (no moldeados, no inoxidables)
      justificacionDetallada += 'de los demás aceros (no moldeado, no inoxidable), ';
      if (descripcion.includes('brida')) return { subpartida: '730791', justificacion: justificacionDetallada + 'bridas.' };
      if (descripcion.includes('roscado') && (descripcion.includes('codo') || descripcion.includes('curva') || descripcion.includes('manguito'))) {
        return { subpartida: '730792', justificacion: justificacionDetallada + 'codos, curvas y manguitos, roscados.' };
      }
      if (descripcion.includes('soldar') && descripcion.includes('tope')) {
        return { subpartida: '730793', justificacion: justificacionDetallada + 'accesorios para soldar a tope.' };
      }
      return { subpartida: '730799', justificacion: justificacionDetallada + 'los demás.' };
    }
    // ... Casos para otras partidas del capítulo 73 (7308 a 7326) ...
    // Estos requerirían una lógica similar basada en las descripciones de las subpartidas.
    // Por ahora, si no es 7301-7307, retornamos null o una subpartida base si es posible.

    default:
      if (DEBUG) console.log(`❌ Partida ${partida} no cubierta en switch de Cap73, retornando null para subpartida.`);
      // Si la partida es conocida y tiene una estructura ".00" común, se podría retornar eso.
      if (partida && partida.length === 4) {
        // Esto es un fallback muy genérico, verificar si es apropiado.
        // Algunas partidas no tienen subpartida '.00' (ej. 7303)
        // o tienen múltiples subpartidas que no se pueden determinar sin más info.
        // return { subpartida: partida + '00', justificacion: `Subpartida genérica para partida ${partida} (sin lógica específica).`};
      }
      return { subpartida: null, justificacion: `Partida ${partida} no tiene lógica de subpartida específica en Cap. 73 o información insuficiente.` };
  }
}