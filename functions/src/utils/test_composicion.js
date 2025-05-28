// src/utils/test_composicion.js
const fs = require('node:fs');
const path = require('node:path');

// Path to leerComposicionQuimica.js (it's in the same directory as this test script)
const { detectarComposicionQuimica } = require('./leerComposicionQuimica.js');

// Simulate the DEBUG environment variable to activate logs in leerComposicionQuimica.js
process.env.DEBUG = 'true';

// Path to the OCR output text file.
// This script is in CLASIFICAR/src/utils/, so ocr_output_amns_calvert.txt is two levels up.
const rutaTextoOCR = path.join(__dirname, '..', '..', 'ocr_output_amns_calvert.txt');

console.log(`🧪 Leyendo texto OCR desde: ${rutaTextoOCR}`);

let textoOCRizado;
try {
    textoOCRizado = fs.readFileSync(rutaTextoOCR, 'utf8');
    console.log(`👍 Texto OCRizado cargado, longitud: ${textoOCRizado.length} caracteres.`);
    // You can print a snippet to verify
    // console.log("Snippet del Texto OCR:\n", textoOCRizado.substring(0, 500) + "...");
} catch (error) {
    console.error(`❌ Error al leer el archivo de texto OCR (${rutaTextoOCR}):`, error.message);
    console.error("Asegúrate de haber generado y guardado 'ocr_output_amns_calvert.txt' en la carpeta raíz de tu proyecto (CLASIFICAR).");
    process.exit(1); // Exit if the test file cannot be read
}

console.log("\n--- INICIANDO PRUEBA AISLADA DE detectarComposicionQuimica ---");
const tipoProductoSimulado = "lamina"; // Simulate based on the MTR being tested
const resultadoComposicion = detectarComposicionQuimica(textoOCRizado, tipoProductoSimulado);

console.log("\n--- RESULTADO FINAL DE PRUEBA AISLADA (desde test_composicion.js) ---");
console.log(JSON.stringify(resultadoComposicion, null, 2));

if (resultadoComposicion) {
    console.log("\n--- Verificación Rápida de Elementos Clave (desde test_composicion.js) ---");
    console.log(`Carbono (C): ${resultadoComposicion.carbono}`);
    console.log(`Silicio (Si): ${resultadoComposicion.silicio}`);
    console.log(`Manganeso (Mn): ${resultadoComposicion.manganeso}`);
    console.log(`Fósforo (P): ${resultadoComposicion.fosforo}`);
    console.log(`Azufre (S): ${resultadoComposicion.azufre}`);
    console.log(`Aluminio (Al): ${resultadoComposicion.aluminio}`);
    console.log(`Níquel (Ni): ${resultadoComposicion.niquel}`);
    console.log(`Niobio (Nb): ${resultadoComposicion.niobio}`);
    console.log(`Titanio (Ti): ${resultadoComposicion.titanio}`);
    console.log(`Boro (B): ${resultadoComposicion.boro}`);
    console.log(`Valores Descartados: [${(resultadoComposicion.valoresDescartados || []).join(', ')}]`);
    console.log(`Es Aleado: ${resultadoComposicion.aleado}`);
    console.log(`Tipo de Acero: ${resultadoComposicion.tipoAcero}`);
    console.log(`Justificación Aleado: ${resultadoComposicion.justificacionAleado}`);
}

console.log("\n--- FIN DE PRUEBA AISLADA ---");