// test_composicion.js
const fs = require('node:fs'); // Usar 'node:fs' para módulos nativos
const path = require('node:path'); // Usar 'node:path'

// Asegúrate que la ruta a leerComposicionQuimica.js sea correcta desde la ubicación de test_composicion.js
// Si test_composicion.js está en la carpeta raíz del proyecto y leerComposicionQuimica.js está en src/utils/
// const { detectarComposicionQuimica } = require('./src/utils/leerComposicionQuimica.js');
// Si ambos están en la misma carpeta (ej. src/utils/):
const { detectarComposicionQuimica } = require('./leerComposicionQuimica.js');


// Simular la variable de entorno DEBUG para que se impriman los logs internos
process.env.DEBUG = 'true';

// Ruta al archivo de texto OCRizado que guardaste en el paso 1
// Ajusta esta ruta si es necesario. Asume que está en la carpeta raíz del proyecto.
const rutaTextoOCR = path.join(__dirname, '..', 'ocr_output_amns_calvert.txt'); // Sube un nivel si test_composicion.js está en src/utils

console.log(`🧪 Leyendo texto OCR desde: ${rutaTextoOCR}`);

let textoOCRizado;
try {
    textoOCRizado = fs.readFileSync(rutaTextoOCR, 'utf8');
    console.log(`👍 Texto OCRizado cargado, longitud: ${textoOCRizado.length} caracteres.`);
} catch (error) {
    console.error(`❌ Error al leer el archivo de texto OCR (${rutaTextoOCR}):`, error.message);
    console.error("Asegúrate de haber generado y guardado 'ocr_output_amns_calvert.txt' en la carpeta raíz de tu proyecto.");
    process.exit(1); // Salir si no se puede leer el archivo de prueba
}

console.log("\n--- INICIANDO PRUEBA AISLADA DE detectarComposicionQuimica ---");
// Puedes simular el tipo de producto si tu función lo usa para algo específico al inicio
const tipoProductoSimulado = "lamina"; 
const resultadoComposicion = detectarComposicionQuimica(textoOCRizado, tipoProductoSimulado);

console.log("\n--- RESULTADO FINAL DE PRUEBA AISLADA ---");
console.log(JSON.stringify(resultadoComposicion, null, 2));

// Opcional: Imprimir valores específicos para verificar
if (resultadoComposicion) {
    console.log("\n--- Verificación Rápida de Elementos Clave ---");
    console.log(`Carbono (C): ${resultadoComposicion.carbono}`);
    console.log(`Silicio (Si): ${resultadoComposicion.silicio}`);
    console.log(`Manganeso (Mn): ${resultadoComposicion.manganeso}`);
    console.log(`Fósforo (P): ${resultadoComposicion.fosforo}`);
    console.log(`Azufre (S): ${resultadoComposicion.azufre}`);
    console.log(`Aluminio (Al): ${resultadoComposicion.aluminio}`);
    console.log(`Valores Descartados: ${resultadoComposicion.valoresDescartados.join(', ')}`);
    console.log(`Es Aleado: ${resultadoComposicion.aleado}`);
    console.log(`Tipo de Acero: ${resultadoComposicion.tipoAcero}`);
    console.log(`Justificación Aleado: ${resultadoComposicion.justificacionAleado}`);
}