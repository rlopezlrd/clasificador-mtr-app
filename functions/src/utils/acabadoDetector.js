// src/utils/acabadoDetector.js
function detectarAcabado(textoNormalizado) {
  const plain = textoNormalizado; // 'textoNormalizado' is already lowercased and whitespace-normalized

  // 🔹 Acabado en frío
  if (
    /cold[- ]?rolled/.test(plain) ||
    /\bcr\b/.test(plain) ||
    /laminado en fr[ií]o/.test(plain) ||
    /\btemper\b.*cold/.test(plain) ||
    /acabado en fr[ií]o/.test(plain) ||
    /annealed and pickled/.test(plain) ||
    /cold reduction/.test(plain) ||
    /2b finish/.test(plain)
  ) return 'frio';

  // 🔸 Acabado en caliente
  if (
    /hot[- ]?rolled/.test(plain) ||
    /\bhr\b/.test(plain) ||
    /laminado en caliente/.test(plain) ||
    /\bhot\b.*finish/.test(plain) ||
    /acabado en caliente/.test(plain) ||
    /black finish/.test(plain) ||
    /hot mill/.test(plain) ||
    /hot band/.test(plain)
  ) return 'caliente';

  // ❔ No detectado
  return '-';
}

module.exports = detectarAcabado;