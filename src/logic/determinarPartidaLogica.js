// src/logic/determinarPartidaLogica.js

const DEBUG = process.env.DEBUG === 'true';

/**
 * Determina la partida arancelaria (4 dígitos) dentro del Capítulo 72.
 * @param {Object} props
 * @returns {Object} { partida: string, justificacion: string }
 */
function _determinarPartidaCapitulo72(props) { // Renombrada con _ para indicar que es "privada" del módulo
  let partida = null;
  let justificacion = '';

  const tipoProducto = props.tipoProducto?.toLowerCase() || '';
  const descripcion = props.descripcion?.toLowerCase() || '';
  const formaFisica = props.formaFisica?.toLowerCase() || '';

  const tipoAcero = props.tipoAcero?.toLowerCase() || 'sin definir';
  const esInoxidable = tipoAcero === 'inoxidable';
  const esAleadoNoInox = tipoAcero === 'aleado';

  const ancho = props.ancho || 0;

  if (tipoProducto.includes('fundicion en bruto') || descripcion.includes('pig iron')) {
    partida = '7201'; justificacion = 'Fundición en bruto.';
  } else if (tipoProducto.includes('ferroaleacion') || descripcion.includes('ferroalloy')) {
    partida = '7202'; justificacion = 'Ferroaleación.';
  } else if (descripcion.includes('esponjoso') || descripcion.includes('reducción directa') || tipoProducto.includes('direct reduced iron')) {
    partida = '7203'; justificacion = 'Producto férreo esponjoso o de reducción directa.';
  } else if (descripcion.includes('desperdicio') || tipoProducto.includes('scrap') || tipoProducto.includes('chatarra')) {
    partida = '7204'; justificacion = 'Desperdicio o desecho de hierro o acero.';
  } else if (tipoProducto.includes('granalla_polvo') || descripcion.includes('granalla') || descripcion.includes('polvo')) {
    partida = '7205'; justificacion = 'Granalla o polvo de hierro o acero.';
  }
  else if (tipoProducto.includes('lingote') || formaFisica.includes('maciza_primaria') || tipoProducto.includes('semiproducto') || formaFisica.includes('intermedio')) {
    if (esInoxidable) { partida = '7218'; justificacion = 'Acero inoxidable en lingotes/semiproductos.'; }
    else if (esAleadoNoInox) { partida = '7224'; justificacion = 'Otros aceros aleados en lingotes/semiproductos.'; }
    else {
      if (tipoProducto.includes('lingote') || formaFisica.includes('maciza_primaria')) { partida = '7206'; justificacion = 'Hierro/acero s/alear en lingotes u otras formas primarias.'; }
      else { partida = '7207'; justificacion = 'Semiproducto de hierro/acero s/alear.'; }
    }
  }
  else if (tipoProducto.includes('lamina') || tipoProducto.includes('placa') || tipoProducto.includes('chapa') || tipoProducto.includes('fleje') || tipoProducto.includes('hoja') || props.esEnrollado || formaFisica.includes('plana')) {
    if (esInoxidable) { partida = (ancho && ancho >= 600) ? '7219' : '7220'; justificacion = `Laminado plano inox, ancho ${ancho ? (ancho >= 600 ? '≥600mm' : '<600mm') : 'desconocido'}.`; }
    else if (esAleadoNoInox) { partida = (ancho && ancho >= 600) ? '7225' : '7226'; justificacion = `Laminado plano otros aleados, ancho ${ancho ? (ancho >= 600 ? '≥600mm' : '<600mm') : 'desconocido'}.`; }
    else {
      if (props.recubrimiento && props.recubrimiento !== '-' && props.recubrimiento !== 'sin recubrimiento') {
        partida = (ancho && ancho >= 600) ? '7210' : '7212'; justificacion = `Laminado plano s/alear, revestido, ancho ${ancho ? (ancho >= 600 ? '≥600mm' : '<600mm') : 'desconocido'}.`;
      } else {
        if (ancho && ancho >= 600) {
            partida = (props.procesoLaminado === 'frio') ? '7209' : '7208';
            justificacion = `Laminado plano s/alear, s/revestir, ≥600mm, ${props.procesoLaminado || 'proceso desconocido'}.`;
        } else {
            partida = '7211';
            justificacion = `Laminado plano s/alear, s/revestir, <600mm (o ancho desc.), ${props.procesoLaminado || 'proceso desconocido'}.`;
        }
      }
    }
  }
  else if (tipoProducto.includes('alambron')) {
    if (esInoxidable) { partida = '7221'; justificacion = 'Alambrón de acero inoxidable.'; }
    else if (esAleadoNoInox) { partida = '7227'; justificacion = 'Alambrón de otros aceros aleados.'; }
    else { partida = '7213'; justificacion = 'Alambrón de hierro/acero s/alear.'; }
  }
  else if (tipoProducto.includes('barra') || tipoProducto.includes('perfil')) {
    const esPerfil = tipoProducto.includes('perfil');
    if (esInoxidable) { partida = '7222'; justificacion = esPerfil ? 'Perfil de acero inoxidable.' : 'Barra de acero inoxidable.'; }
    else if (esAleadoNoInox) { partida = '7228'; justificacion = esPerfil ? 'Perfil de otros aceros aleados.' : 'Barra de otros aceros aleados.'; }
    else {
      if (esPerfil) { partida = '7216'; justificacion = 'Perfil de hierro/acero s/alear.'; }
      else {
        if (props.acabado?.includes('frio') || props.descripcion?.toLowerCase().includes('estirada en frio') || props.procesoLaminado === 'frio') {
            partida = '7215'; justificacion = 'Barra s/alear, principalmente obtenida/acabada en frío.';
        } else {
            partida = '7214'; justificacion = 'Barra s/alear, principalmente forjada o laminada/extrudida en caliente.';
        }
      }
    }
  }
  else if (tipoProducto.includes('alambre')) {
    if (esInoxidable) { partida = '7223'; justificacion = 'Alambre de acero inoxidable.'; }
    else if (esAleadoNoInox) { partida = '7229'; justificacion = 'Alambre de otros aceros aleados.'; }
    else { partida = '7217'; justificacion = 'Alambre de hierro/acero s/alear.'; }
  }

  if (!partida) {
    justificacion = 'No se pudo determinar la partida específica en Cap. 72. Revisar tipo de producto y características.';
    if (DEBUG) console.warn(justificacion, props);
  }
  return { partida, justificacion };
}

/**
 * Determina la partida (4 dígitos) dentro del Capítulo 73.
 * @param {Object} props
 * @returns {Object} { partida: string, justificacion: string }
 */
function _determinarPartidaCapitulo73(props) { // Renombrada con _
  let partida = null;
  let justificacion = '';

  const tipo = (props.tipoProducto || '').toLowerCase();
  const descripcion = (props.descripcion || '').toLowerCase();
  const usoTecnico = (props.usoTecnico || '').toLowerCase();

  if (tipo.includes('tubo') || tipo.includes('pipe') || descripcion.includes('tuberia')) {
    if (descripcion.includes('fundicion') || props.material?.toLowerCase().includes('fundicion')) {
        partida = '7303'; justificacion = 'Tubo de fundición.';
    } else if (props.costura === 'sin costura') {
        partida = '7304'; justificacion = 'Tubo sin costura (hierro/acero, no fundición).';
    } else if (props.costura === 'con costura' || props.costura === 'soldado') {
        if (props.diametroExterior && props.diametroExterior > 406.4) {
            partida = '7305'; justificacion = 'Tubo soldado, DE > 406.4mm.';
        } else {
            partida = '7306'; justificacion = 'Tubo soldado, DE <= 406.4mm (o DE desconocido).';
        }
    } else {
        partida = '7306';
        justificacion = 'Tubo (costura no especificada claramente), asignado a 73.06 como fallback.';
    }
  } else if (tipo.includes('accesorio') || descripcion.includes('brida') || descripcion.includes('codo') || descripcion.includes('fitting')) {
    partida = '7307'; justificacion = 'Accesorio de tubería.';
  } else if (tipo.includes('estructura') || descripcion.includes('torre') || descripcion.includes('puente') || descripcion.includes('andamio') || descripcion.includes('castillete') || descripcion.includes('compuerta') || descripcion.includes('techumbre') || descripcion.includes('puerta') || descripcion.includes('ventana')) {
    partida = '7308'; justificacion = 'Construcción o parte de construcción.';
  } else if (tipo.includes('deposito') || tipo.includes('tanque') || tipo.includes('cisterna') || tipo.includes('bidon') || tipo.includes('barril')) {
    const capacidad = props.capacidadLitros || 0;
    const paraGasComprimido = descripcion.includes('gas comprimido') || descripcion.includes('gas licuado');
    if (paraGasComprimido) {
        partida = '7311'; justificacion = 'Recipiente para gas comprimido/licuado.';
    } else if (capacidad > 300) {
        partida = '7309'; justificacion = 'Depósito/tanque > 300L (no para gas comprimido).';
    } else {
        partida = '7310'; justificacion = 'Depósito/tanque/bidón <= 300L (no para gas comprimido).';
    }
  } else if (tipo.includes('tablestaca') || descripcion.includes('tablestaca')) {
    partida = '7301'; justificacion = 'Tablestaca.';
  } else if (tipo.includes('riel') || descripcion.includes('riel') || descripcion.includes('carril') || descripcion.includes('aguja') || descripcion.includes('eclisa')) {
    partida = '7302'; justificacion = 'Material para vías férreas.';
  } else if (tipo.includes('cable') || descripcion.includes('cable') || tipo.includes('trenza') || descripcion.includes('trenza') || tipo.includes('eslinga') || descripcion.includes('eslinga')) {
    partida = '7312'; justificacion = 'Cable, trenza o eslinga.';
  } else if ((tipo.includes('alambre') && (descripcion.includes('puas') || descripcion.includes('espinoso'))) || (descripcion.includes('concertina'))) {
    partida = '7313'; justificacion = 'Alambre de púas o concertina.';
  } else if (tipo.includes('tela metalica') || descripcion.includes('tela metalica') || tipo.includes('malla') || descripcion.includes('malla') || tipo.includes('red') || descripcion.includes('red') || tipo.includes('rejilla') || descripcion.includes('rejilla')) {
    partida = '7314'; justificacion = 'Tela metálica, malla o rejilla.';
  } else if (tipo.includes('cadena') || descripcion.includes('cadena')) {
    partida = '7315'; justificacion = 'Cadena y sus partes.';
  } else if (tipo.includes('tornillo') || descripcion.includes('tornillo') || tipo.includes('perno') || descripcion.includes('perno') || tipo.includes('tuerca') || descripcion.includes('tuerca') || tipo.includes('arandela') || descripcion.includes('arandela') || tipo.includes('remache') || descripcion.includes('remache') || tipo.includes('pasador') || descripcion.includes('chaveta')) {
    partida = '7318'; justificacion = 'Tornillos, pernos, tuercas, etc.';
  } else if (tipo.includes('aguja') || descripcion.includes('aguja') || tipo.includes('alfiler') || descripcion.includes('alfiler')) {
    partida = '7319'; justificacion = 'Agujas, alfileres, etc.';
  } else if (tipo.includes('resorte') || descripcion.includes('resorte') || tipo.includes('muelle') || descripcion.includes('muelle')) {
    partida = '7320'; justificacion = 'Resortes (muelles).';
  } else if (tipo.includes('estufa') || descripcion.includes('estufa') || tipo.includes('calefactor') || descripcion.includes('calefactor') || (descripcion.includes('caldera') && usoTecnico !== 'termico_caldera' && usoTecnico !== 'oleogas')) {
    justificacion = 'Aparato de cocción, calefacción o caldera de calefacción central (no industrial).';
    if (descripcion.includes('radiador')) partida = '7322'; else partida = '7321';
  } else if (tipo.includes('articulo de uso domestico') || descripcion.includes('olla') || descripcion.includes('sarten') || descripcion.includes('esponja metalica')) {
    partida = '7323'; justificacion = 'Artículo de uso doméstico.';
  } else if (tipo.includes('articulo sanitario') || descripcion.includes('fregadero') || descripcion.includes('lavabo') || descripcion.includes('banera')) {
    partida = '7324'; justificacion = 'Artículo sanitario.';
  } else if (tipo.includes('manufactura moldeada') || descripcion.includes('pieza moldeada')) {
    partida = '7325'; justificacion = 'Las demás manufacturas moldeadas de fundición, hierro o acero.';
  } else {
    partida = '7326';
    justificacion = 'Otras manufacturas de hierro o acero no especificadas anteriormente.';
  }

  if (!partida) {
    justificacion = 'No se pudo determinar la partida específica en Cap. 73. Revisar tipo de producto y características.';
     if (DEBUG) console.warn(justificacion, props);
  }
  return { partida, justificacion };
}


/**
 * Determina la partida arancelaria (4 dígitos) basada en las propiedades del material.
 * Esta es la función principal que se exportará.
 * @param {Object} props - Propiedades extraídas y analizadas.
 * @returns {Object} - { partida: string, justificacion: string }
 */
function determinarPartida(props) {
  let capitulo = null;
  let partida = null;
  let justificacionPartida = '';

  const tipo = (props.tipoProducto || '').toLowerCase();
  const descripcion = (props.descripcion || '').toLowerCase();
  const usoTecnico = (props.usoTecnico || '').toLowerCase();
  const formaFisica = (props.formaFisica || '').toLowerCase();

  const clavesCap73 = [
    'tubo', 'pipe', 'accesorio', 'fitting', 'brida', 'codo', 'estructura',
    'riel', 'aguja', 'traviesa', 'tablestaca',
    'deposito', 'tanque', 'cisterna', 'bidon', 'barril',
    'cable', 'trenza', 'eslinga',
    'alambre de puas', 'tela metalica', 'malla', 'red', 'rejilla',
    'cadena', 'ancla', 'clavo', 'chincheta', 'tornillo', 'tuerca', 'perno', 'arandela', 'remache',
    'aguja', 'alfiler', 'resorte', 'estufa', 'caldera', 'radiador', 'articulo de uso domestico', 'sanitario'
  ];

  const clavesCap72 = [
    'fundicion en bruto', 'lingote', 'ferroaleacion', 'esponjoso', 'chatarra', 'desperdicio', 'granalla', 'polvo',
    'semiproducto', 'palanquilla', 'tocho', 'bloom', 'slab',
    'laminado plano', 'lamina', 'placa', 'chapa', 'hoja', 'fleje', 'banda', 'coil', 'rollo',
    'alambron', 'barra', 'perfil', 'alambre'
  ];

  let esCap73 = false;
  let esCap72 = false;

  if (tipo.includes('tubo') || tipo.includes('accesorio') || usoTecnico === 'termico_caldera' || tipo === 'estructura' || tipo === 'tablestaca' ||
      clavesCap73.some(c => descripcion.includes(c) || tipo.includes(c))) {
      if(tipo === 'perfil' && ( (props.norma?.toLowerCase().includes('astm a36') || props.norma?.toLowerCase().includes('astm a572') || usoTecnico === 'estructural') && !(descripcion.includes('torre') || descripcion.includes('puente') || descripcion.includes('andamio')) ) ) {
          esCap72 = true;
      } else if (tipo === 'alambre' && (descripcion.includes('puas') || descripcion.includes('espinoso') || descripcion.includes('cerca'))) {
          esCap73 = true;
      } else if (tipo === 'alambre' && !(descripcion.includes('puas') || descripcion.includes('espinoso'))) {
          esCap72 = true;
      }
      else {
        esCap73 = true;
      }
  }

  if (!esCap73 && (clavesCap72.some(c => descripcion.includes(c) || tipo.includes(c) || formaFisica.includes(c)) || tipo === 'perfil' || tipo === 'barra' || tipo === 'alambron' || tipo === 'alambre')) {
    esCap72 = true;
  }


  if (esCap73 && !esCap72) {
    capitulo = '73';
    const resultadoPartida = _determinarPartidaCapitulo73(props); // Llama a la función interna _
    partida = resultadoPartida.partida;
    justificacionPartida = `Capítulo 73 – ${resultadoPartida.justificacion}`;
  } else if (esCap72) {
    capitulo = '72';
    const resultadoPartida = _determinarPartidaCapitulo72(props); // Llama a la función interna _
    partida = resultadoPartida.partida;
    justificacionPartida = `Capítulo 72 – ${resultadoPartida.justificacion}`;
  } else {
    justificacionPartida = 'No se pudo determinar el capítulo con la información disponible. Revisar tipo de producto y descripción.';
    if (DEBUG) console.warn(justificacionPartida, props);
  }

  if (DEBUG) console.log(`[Determinar Partida] Capítulo: ${capitulo}, Partida: ${partida}, Justificación: ${justificacionPartida}`);
  return { partida, justificacion: justificacionPartida };
}

module.exports = { determinarPartida };