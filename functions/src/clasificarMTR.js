// src/clasificarMTR.js

// Importar la función principal para extraer todas las propiedades
const { extraerTodasLasPropiedades } = require('./utils/propiedadesExtractor.js');

// Importar la función para detectar la composición química
const { detectarComposicionQuimica } = require('./utils/leerComposicionQuimica.js');

// Importar la función principal para determinar la partida (4 dígitos)
const { determinarPartida } = require('./logic/determinarPartidaLogica.js');

// Imports para la lógica de subpartida (6 dígitos)
const { determinarSubpartida: determinarSubpartidaCap72 } = require('./logic/asignarSubpartidaCap72.js');
const { determinarSubpartidaCap73 } = require('./logic/asignarSubpartidaCap73.js');

// Importar la función para determinar la fracción final (8 dígitos) y el NICO si es posible
const determinarFraccionFinal = require('./logic/determinarFraccionFinal.js');

// Imports para la lógica de NICO (2 dígitos)
const { determinarNICO_Cap72 } = require('./logic/determinarNICO_cap72.js');
const { determinarNICO_Cap73 } = require('./logic/determinarNICO_cap73.js');

// Utilidades que se pasarán a extraerTodasLasPropiedades
const extraerHeatYCoil = require('./utils/extraerHeatYCoil.js');
const detectarAcabado = require('./utils/acabadoDetector.js');
const extraerMedidasFisicas = require('./utils/extraerMedidasFisicas.js');

const DEBUG = true; // Forzado a true para asegurar logs durante esta depuración

/**
 * Determina la subpartida arancelaria (6 dígitos) basada en las propiedades y la partida.
 * Esta función actúa como un dispatcher para la lógica específica de cada capítulo.
 * @param {Object} props - Propiedades extraídas y analizadas.
 * @param {string} partida - Partida arancelaria (4 dígitos).
 * @returns {Object} - { subpartida: string, justificacion: string }
 */
function determinarSubpartida(props, partida) {
  if (!partida || partida.length !== 4) {
    return { subpartida: null, justificacion: 'Partida inválida o no proporcionada para determinar subpartida.' };
  }
  if (!props.observaciones && props.descripcion) {
    props.observaciones = props.descripcion;
  } else if (!props.observaciones && !props.descripcion) {
    props.observaciones = '';
  }

  if (DEBUG) console.log('🔎 Determinando Subpartida para Partida:', partida);
  // if (DEBUG) console.log('🔎 Props para Subpartida:', JSON.stringify(props, null, 2)); // Log muy verboso

  const capitulo = partida.substring(0, 2);

  if (capitulo === '72') {
    return determinarSubpartidaCap72(props, partida);
  }
  if (capitulo === '73') {
    return determinarSubpartidaCap73(props, partida);
  }

  return { subpartida: null, justificacion: `Capítulo ${capitulo} no reconocido o sin lógica de subpartida implementada.` };
}


/**
 * Función principal para clasificar un MTR.
 * @param {Object} params - Parámetros de entrada.
 * @param {string} params.texto - El texto extraído del MTR.
 * @param {string} params.nombreArchivo - El nombre del archivo original.
 * @param {Object} [params.initialProps] - Propiedades iniciales opcionales (como fraccionCorregida, comentarios).
 * @param {string} [params.userEmail] - Email del usuario.
 * @param {string} [params.userIP] - IP del usuario.
 * @returns {Promise<Object>} - El objeto con el resultado de la clasificación.
 */
module.exports = async function clasificarMTR({
    texto,
    nombreArchivo,
    initialProps, // Recibe el objeto initialProps completo
    userEmail,
    userIP
}) {
  const utilsParaExtractor = {
      detectarAcabado,
      extraerHeatYCoil,
      extraerMedidasFisicas
  };

  // 1. Extracción Inicial de Propiedades del Texto
  let props = extraerTodasLasPropiedades(texto, utilsParaExtractor); // propsBase ahora es solo props

  // Fusionar initialProps si existen (fraccionCorregida, comentarios desde el inicio si se reimplementara así)
  // y añadir userEmail y userIP a props para que estén disponibles en todo el flujo y en el resultado.
  props = { ...props, ...(initialProps || {}) };
  props.userEmail = userEmail || 'No especificado';
  props.userIP = userIP || 'No disponible';

  if (DEBUG) {
    console.log(`👤 Usuario procesando: Email: ${props.userEmail}, IP: ${props.userIP}`);
  }

  // 2. Detección y Análisis de Composición Química
  const composicionCompleta = detectarComposicionQuimica(texto, props.tipoProducto);
  props.composicion = {}; // Objeto para agrupar elementos químicos individuales

  for (const key in composicionCompleta) {
    if (Object.prototype.hasOwnProperty.call(composicionCompleta, key)) {
      const valor = composicionCompleta[key];
      if (['aleado', 'tipoAcero', 'justificacionAleado', 'elementosAleantes', 'valoresDescartados'].includes(key)) {
        props[key] = valor;
      }
      else if ((typeof valor === 'number' && !isNaN(valor)) || valor === null) {
        props[key] = valor;
        props.composicion[key] = valor;
      }
    }
  }
  props.aleado = props.aleado || false;
  props.tipoAcero = props.tipoAcero || (props.aleado ? 'aleado' : 'sin alear');
  props.justificacionAleado = props.justificacionAleado || (props.aleado ? 'Aleado según elementos detectados.' : 'No cumple criterios de aleado.');
  props.elementosAleantes = props.elementosAleantes || [];
  props.valoresDescartados = props.valoresDescartados || [];

  if (DEBUG && props.valoresDescartados && props.valoresDescartados.length > 0) {
    console.warn('⚠️ Valores de composición química descartados:', props.valoresDescartados);
  }
  if (DEBUG) {
    console.log('🔬 Composición Química Integrada en Props:', {
        // Mostrar solo algunos elementos clave para brevedad o el objeto props.composicion
        // Ejemplo: C: props.carbono, Cr: props.cromo, Ni: props.niquel, Mo: props.molibdeno,
        composicionDetallada: props.composicion,
        aleado: props.aleado,
        tipoAcero: props.tipoAcero,
        justificacionAleado: props.justificacionAleado,
    });
  }

  // 3. Determinación de Partida (4 dígitos)
  const { partida, justificacion: justPartida } = determinarPartida(props);
  props.partida = partida;
  props.justificacionPartida = justPartida;

  // 4. Determinación de Subpartida (6 dígitos)
  let subpartida = null;
  let justSubpartida = null;

  if (partida) {
    const subResult = determinarSubpartida(props, partida);
    subpartida = subResult.subpartida;
    justSubpartida = subResult.justificacion;
  } else {
    justSubpartida = 'No se pudo determinar la partida, por lo tanto no se puede determinar la subpartida.';
  }
  props.subpartida = subpartida;
  props.justificacionSubpartida = justSubpartida;

  if (DEBUG) console.log(`🎯 Partida Determinada: ${partida}, Subpartida Determinada: ${subpartida}`);

  // 5. Determinación de Fracción (8 dígitos) y NICO (si es posible desde fracción)
  const { fraccion, justificacion: justFraccion, nico: nicoDeterminadoEnFraccion } = determinarFraccionFinal(props);

  // 6. Determinación de NICO (2 dígitos) si no vino de la fracción
  let nicoFinal = nicoDeterminadoEnFraccion;
  if (!nicoFinal && fraccion && fraccion.length === 8) {
    const capFraccion = fraccion.substring(0, 2);
    if (capFraccion === '72') {
      nicoFinal = determinarNICO_Cap72(fraccion, props);
    } else if (capFraccion === '73') {
      nicoFinal = determinarNICO_Cap73(fraccion, props);
    }
  }
  nicoFinal = nicoFinal || '00';

  const fraccionCompleta = fraccion && nicoFinal ? `${fraccion}${nicoFinal}` : (fraccion ? `${fraccion}00` : null) ;

  // 7. Construcción del Resultado Final
  const resultadoFinal = {
    ...props, // Incluye todas las propiedades extraídas, calculadas, y también userEmail, userIP de props
    partida,
    subpartida,
    fraccion,
    nico: nicoFinal,
    fraccionSugerida: fraccionCompleta,
    material: props.tipoAcero && props.tipoAcero !== 'sin definir' && props.tipoAcero !== 'sin alear' ? 'acero' : (props.material || 'acero'), // Asegurar que sea 'acero' si es tipoAcero conocido
    tipo: props.tipoProducto,
    diametroExterior: typeof props.diametroExterior === 'number' ? props.diametroExterior : null,
    espesorPared: typeof props.espesorPared === 'number' ? props.espesorPared : null,
    espesor: typeof props.espesor === 'number' ? props.espesor : null,
    ancho: typeof props.ancho === 'number' ? props.ancho : null,
    longitud: typeof props.longitud === 'number' ? props.longitud : null,
    esEnrollado: typeof props.esEnrollado === 'boolean' ? props.esEnrollado : false,
    aleado: typeof props.aleado === 'boolean' ? props.aleado : false,
    fuente: 'texto_extraido_mtr',
    archivo: nombreArchivo
    // La justificación se ensambla a continuación
  };

  let justFinalParts = [];
  if(props.justificacionPartida && !justFinalParts.includes(props.justificacionPartida)) justFinalParts.push(props.justificacionPartida);
  if(props.justificacionSubpartida && !justFinalParts.includes(props.justificacionSubpartida)) justFinalParts.push(props.justificacionSubpartida);
  if(justFraccion && !justFinalParts.includes(justFraccion)) justFinalParts.push(justFraccion);
  if(props.justificacionAleado && !justFinalParts.includes(props.justificacionAleado)) justFinalParts.push(props.justificacionAleado);

  resultadoFinal.justificacion = justFinalParts.filter(Boolean).join(' | ') || 'Clasificación completada.';

  if (DEBUG) console.log('🧾 Resultado completo de clasificarMTR:', JSON.stringify(resultadoFinal, null, 2));
  return resultadoFinal;
};