// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const { createObjectCsvWriter } = require('csv-writer');
const Tesseract = require('tesseract.js');
const { execFile } = require('child_process'); // Para llamar a utilidades de línea de comando
const util = require('util'); // Para promisify

const execFileAsync = util.promisify(execFile); // Promisify execFile

const clasificarMTR = require('./src/clasificarMTR');

const app = express(); // <<<< INITIALIZE APP HERE
const PORT = process.env.PORT || 8080;
const IS_DEBUG_ACTIVE = process.env.DEBUG === 'true' || true; // Default to true if not set
const UPLOADS_DIR = path.join(__dirname, 'uploads');

app.use(cors());
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(err => {
    if (IS_DEBUG_ACTIVE) console.error("Error creando directorio de subidas (puede que ya exista):", err.message);
});
const upload = multer({ dest: UPLOADS_DIR });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// server.js
// ... other code ...

const logFilePath = path.join(__dirname, 'clasificaciones_log.csv');
const csvWriter = createObjectCsvWriter({
    path: logFilePath,
    header: [
        { id: 'fecha', title: 'Fecha' },
        { id: 'userEmail', title: 'Email Usuario' },
        { id: 'userIP', title: 'IP Usuario' },
        { id: 'archivo', title: 'Archivo' },
        { id: 'fraccionSugerida', title: 'Fracción Sugerida (Sistema)' },
        { id: 'fraccionCorregida', title: 'Fracción Corregida (Usuario)' },
        { id: 'diferencia', title: 'Diferencia' },
        { id: 'comentarios', title: 'Comentarios (Usuario)' },
        { id: 'extractionMethod', title: 'Método Extracción' },
        { id: 'heatNumber', title: 'Heat Number' },
        { id: 'molino', title: 'Molino' },
        { id: 'material', title: 'Material' },
        { id: 'tipo', title: 'Tipo Producto' },
        { id: 'acabado', title: 'Acabado' },
        { id: 'procesoLaminado', title: 'Proceso Laminado'},
        { id: 'tratamiento', title: 'Tratamiento'},
        { id: 'costura', title: 'Costura'},
        { id: 'ancho', title: 'Ancho (mm)' },
        { id: 'espesor', title: 'Espesor (mm)' },
        { id: 'diametroExterior', title: 'DE (mm)' },
        { id: 'espesorPared', title: 'EP (mm)' },
        { id: 'longitud', title: 'Longitud (m)' },
        { id: 'recubrimiento', title: 'Recubrimiento' },
        { id: 'esEnrollado', title: 'Enrollado' },
        { id: 'aleado', title: 'Aleado (Sistema)' },
        { id: 'justificacionAleado', title: 'Justificación Aleado (Sistema)' },
        { id: 'justificacionSistema', title: 'Justificación Clasificación (Sistema)' },
    ],
    append: true, // Keep append: true for subsequent writes
    encoding: 'utf8',
    fieldDelimiter: ';'
});

async function asegurarEncabezadosLog() {
    if (IS_DEBUG_ACTIVE) console.log('🗒️  DEBUG: Iniciando asegurarEncabezadosLog...');
    try {
        // FOR DEBUGGING: Attempt to delete the log file on every startup
        // This ensures we test the creation logic thoroughly.
        // REMOVE OR COMMENT THIS OUT FOR PRODUCTION.
        if (IS_DEBUG_ACTIVE) { // Only do this aggressive delete in debug mode
            console.log(`🗒️  DEBUG: Intentando eliminar ${logFilePath} para forzar recreación de encabezados.`);
            await fs.unlink(logFilePath);
            console.log(`🗒️  DEBUG: ${logFilePath} eliminado (o no existía).`);
        }
    } catch (err) {
        // If fs.unlink fails because the file doesn't exist (ENOENT), that's fine.
        // Log other errors if they occur during unlink.
        if (err.code !== 'ENOENT') {
            console.warn(`⚠️ DEBUG: No se pudo eliminar ${logFilePath} (puede que no existiera o error):`, err.message);
        } else {
            if (IS_DEBUG_ACTIVE) console.log(`🗒️  DEBUG: ${logFilePath} no existía antes del intento de eliminación (ENOENT).`);
        }
    }

    // After attempting deletion (or if it didn't exist), try to write headers by writing an empty array.
    // csv-writer should create the file with headers if it doesn't exist.
    try {
        await csvWriter.writeRecords([]); // This specific call is intended to write headers to a new/empty file
        if (IS_DEBUG_ACTIVE) console.log(`✅ Archivo de log CSV ${logFilePath} (re)creado/asegurado con encabezados.`);
    } catch (writeError) {
        console.error(`❌ ERROR CRÍTICO al escribir encabezados en ${logFilePath}:`, writeError);
    }
}

asegurarEncabezadosLog(); // Call the function at startup

// ... rest of your server.js code ...




// Si siempre es 1 MTR por archivo PDF, esta función debe devolver el texto completo como un único elemento en un array.
function dividirTextoEnCertificados(textoCompletoPDF) {
    return textoCompletoPDF && typeof textoCompletoPDF === 'string' ? [textoCompletoPDF] : [''];
}

app.post('/procesarArchivo', upload.single('archivo'), async (req, res) => {
    const archivo = req.file;
    const userEmail = req.body.userEmail || 'No especificado';
    const userIP = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'IP no disponible';

    if (IS_DEBUG_ACTIVE) {
        console.log(`📧 (Procesar) Email: ${userEmail}, IP: ${userIP}, Archivo: ${archivo ? archivo.originalname : 'No File'}`);
    }
    if (!archivo || !archivo.path || typeof archivo.path !== 'string') {
        console.error("❌ No se recibió archivo o archivo.path es inválido:", archivo);
        return res.status(400).json({ error: 'No se recibió ningún archivo o la ruta del archivo es inválida' });
    }

    const filePath = archivo.path;
    let textoCompletoExtraido = '';
    const tempImageFilesCreated = [];
    let extractionMethodUsed = 'Indeterminado'; // Para enviar al frontend

    try {
        let textoParseadoDirectamente = '';
        let usarTextoParseado = false;
        try {
            if (IS_DEBUG_ACTIVE) console.log('📄 (Procesar) Intentando extracción directa de texto con pdftotext para:', archivo.originalname);

/// modificar

           // const { stdout: stdoutPdftotext, stderr: stderrPdftotext } = await execFileAsync('pdftotext', [filePath, '-']);
            
// Change this:
// const { stdout: stdoutPdftotext, stderr: stderrPdftotext } = await execFileAsync('pdftotext', [filePath, '-']);
// To this:
const { stdout: stdoutPdftotext, stderr: stderrPdftotext } = await execFileAsync('pdftotext', ['-layout', filePath, '-']);


            if (stderrPdftotext && IS_DEBUG_ACTIVE) {
                console.warn('⚠️ (pdftotext) stderr:', stderrPdftotext);
            }
            textoParseadoDirectamente = stdoutPdftotext;

            if (textoParseadoDirectamente && textoParseadoDirectamente.trim().length > 300) { // Umbral ajustado
                if (IS_DEBUG_ACTIVE) console.log('✅ (Procesar) Extracción directa de texto exitosa para:', archivo.originalname);
                textoCompletoExtraido = textoParseadoDirectamente;
                usarTextoParseado = true;
                extractionMethodUsed = 'Parseo Directo';
            } else {
                if (IS_DEBUG_ACTIVE) console.warn('⚠️ (Procesar) Texto parseado directamente es muy corto o nulo. Se procederá con OCR para:', archivo.originalname);
            }
        } catch (parseError) {
            if (IS_DEBUG_ACTIVE) console.warn(`⚠️ (Procesar) Falló la extracción directa de texto (pdftotext) para ${archivo.originalname}. Se procederá con OCR. Error:`, parseError.message);
             if (parseError.code === 'ENOENT' && IS_DEBUG_ACTIVE) {
                 console.error("🔥 SUGERENCIA: El error 'ENOENT' para 'pdftotext' significa que no se encontró. Asegúrate de que Poppler esté instalado y en el PATH.");
             }
        }

        if (!usarTextoParseado) {
            extractionMethodUsed = 'OCR';
            if (IS_DEBUG_ACTIVE) console.log(`⚙️ (Procesar) Iniciando flujo OCR (pdftocairo + Tesseract) para:`, archivo.originalname);
            const outputBasename = path.join(UPLOADS_DIR, path.basename(filePath, path.extname(filePath)) + "_page");
            const pdftocairoArgs = ['-png', filePath, outputBasename];

            if (IS_DEBUG_ACTIVE) console.log(`⚙️ (Procesar) Ejecutando pdftocairo con args: ${pdftocairoArgs.join(' ')}`);

            // modificar
            const { stdout, stderr } = await execFileAsync('pdftocairo', pdftocairoArgs);

            if (IS_DEBUG_ACTIVE) {
                if (stdout) console.log('ℹ️ (pdftocairo) stdout:', stdout);
                if (stderr) console.warn('⚠️ (pdftocairo) stderr:', stderr);
            }
            if (IS_DEBUG_ACTIVE) console.log('✅ (Procesar) Conversión PDF a imágenes con pdftocairo completada.');

            const dirContents = await fs.readdir(UPLOADS_DIR);
            const generatedImageFiles = dirContents
                .filter(f => f.startsWith(path.basename(outputBasename)) && f.endsWith('.png'))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/-(\d+)\.png$/)?.[1] || "0");
                    const numB = parseInt(b.match(/-(\d+)\.png$/)?.[1] || "0");
                    return numA - numB;
                })
                .map(f => path.join(UPLOADS_DIR, f));

            tempImageFilesCreated.push(...generatedImageFiles);

            if (IS_DEBUG_ACTIVE) console.log(`🖼️ (Procesar) ${generatedImageFiles.length} imágenes encontradas después de pdftocairo.`);
            if (generatedImageFiles.length === 0) { // No se generaron imágenes
                throw new Error('pdftocairo no generó imágenes y el parseo directo falló. Verifica Poppler y que el PDF no esté vacío/corrupto.');
            }

            let pageTexts = [];
            for (let i = 0; i < generatedImageFiles.length; i++) {
                const imagePath = generatedImageFiles[i];
                if (IS_DEBUG_ACTIVE) console.log(`🔄 (Procesar) OCR en imagen ${i + 1}/${generatedImageFiles.length}: ${imagePath}`);
                try {
                    const { data: { text } } = await Tesseract.recognize(
                        imagePath,
                        'spa+eng', // Cambiado a spa+eng, puedes ajustarlo
                        { logger: m => { if (IS_DEBUG_ACTIVE && m.status === 'recognizing text') console.log(`  (Tesseract) Progreso: ${(m.progress * 100).toFixed(2)}%`); }}
                    );
                    pageTexts.push(text);
                } catch (ocrError) {
                    console.error(`❌ (Procesar) Error de OCR en imagen ${imagePath}:`, ocrError.message);
                    pageTexts.push("");
                }
            }
            textoCompletoExtraido = pageTexts.join('\n\n');
        }

        if (IS_DEBUG_ACTIVE && archivo.originalname) {
            const debugTextOutputPath = path.join(__dirname, `final_text_output_${path.basename(archivo.originalname, path.extname(archivo.originalname))}.txt`);
            try {
                await fs.writeFile(debugTextOutputPath, textoCompletoExtraido);
                console.log(`📝 Texto final (${extractionMethodUsed}) guardado en ${debugTextOutputPath}`);
            } catch (err) {
                console.error('❌ Error al guardar el texto final:', err);
            }
        }

        if (IS_DEBUG_ACTIVE) {
            console.log(`📄 (Procesar) Texto final a procesar para ${archivo.originalname} (${extractionMethodUsed}), longitud:`, textoCompletoExtraido.length);
            if (textoCompletoExtraido.trim().length < 100 && IS_DEBUG_ACTIVE) {
                 console.warn(`⚠️ (Procesar) El texto final para ${archivo.originalname} es muy corto. Revisar calidad del PDF/escaneo/parseo.`);
            }
        }


        const textosDeCertificados = dividirTextoEnCertificados(textoCompletoExtraido);
        if (IS_DEBUG_ACTIVE) console.log(`📄 (Procesar) Número de "segmentos" de texto a procesar (debería ser 1): ${textosDeCertificados.length} para ${archivo.originalname}`);

        const resultadosClasificacion = [];
        for (let i = 0; i < textosDeCertificados.length; i++) {
            const textoCertificado = textosDeCertificados[i];
            if (textoCertificado.trim().length === 0 && textosDeCertificados.length > 0) {
                if (IS_DEBUG_ACTIVE) console.log(`⏭️ (Procesar) El texto del certificado ${i + 1} está vacío para ${archivo.originalname}, saltando.`);
                continue;
            }
            const nombreArchivoParaClasificar = archivo.originalname;
            if (IS_DEBUG_ACTIVE) console.log(`⚙️  (Procesar) Clasificando: ${nombreArchivoParaClasificar} (obtenido por ${extractionMethodUsed})`);

            const resultadoIndividual = await clasificarMTR({
                texto: textoCertificado,
                nombreArchivo: nombreArchivoParaClasificar,
                initialProps: {},
                userEmail: userEmail,
                userIP: userIP
            });
            
            resultadoIndividual.extractionMethod = extractionMethodUsed; 
            resultadosClasificacion.push(resultadoIndividual);
        }
        res.json(resultadosClasificacion);

    } catch (error) {
        console.error(`❌ (Procesar) Error general en /procesarArchivo para ${archivo ? archivo.originalname : 'archivo desconocido'}:`, error);
        if (error.code === 'ENOENT' && (error.message.includes('pdftocairo') || error.message.includes('pdftotext'))) {
            console.error("🔥 SUGERENCIA: El error 'ENOENT' significa que un comando de Poppler no se encontró. Asegúrate de que Poppler esté instalado y que su directorio 'bin' esté en el PATH.");
            res.status(500).json({ error: 'Error interno: Fallo en herramienta de PDF. Comando de Poppler no encontrado.', details: error.message });
        } else if (error.stderr && typeof error.stderr === 'string' && (error.stderr.includes('Syntax Error') || error.stderr.includes('pdftocairo') || error.stderr.includes('pdftotext'))) {
             console.error("🔥 (Poppler) Error Output:", error.stderr);
             res.status(500).json({ error: 'Error interno: Fallo durante el procesamiento del PDF con Poppler.', details: error.stderr });
        } else {
            res.status(500).json({ error: 'Error interno al procesar el archivo', details: error.message });
        }
    } finally {
        if (filePath && await fs.access(filePath).then(() => true).catch(() => false) ) {
          try { await fs.unlink(filePath); } catch (e) { console.error("Error eliminando archivo PDF temporal:", e.message); }
        }
        for (const tempImage of tempImageFilesCreated) {
            if (await fs.access(tempImage).then(() => true).catch(() => false)) {
                try { await fs.unlink(tempImage); } catch (e) { console.error("Error eliminando imagen temporal OCR:", tempImage, e.message); }
            }
        }
        if (IS_DEBUG_ACTIVE) console.log('🧹 (Procesar) Limpieza de archivos temporales intentada.');
    }
});

app.post('/registrar-clasificacion-final', async (req, res) => {
    const datosParaLog = req.body;

    if (IS_DEBUG_ACTIVE) {
        // Log más corto para la consola, evitar volcar todo el JSON si es muy grande
        const logPreview = {...datosParaLog};
        if (logPreview.justificacion) logPreview.justificacion = logPreview.justificacion.substring(0, 100) + "...";
        if (logPreview.justificacionAleado) logPreview.justificacionAleado = logPreview.justificacionAleado.substring(0, 100) + "...";

        console.log('✍️  Recibido para registrar en log (preview):', JSON.stringify(logPreview, null, 2));
    }

    if (!datosParaLog || !datosParaLog.archivo) {
        return res.status(400).json({ error: 'Datos incompletos para registrar.' });
    }

    try {
        const registroCSV = {
            fecha: datosParaLog.fecha || new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }), // Ajustar timezone si es necesario
            userEmail: datosParaLog.userEmail || '-',
            userIP: datosParaLog.userIP || '-',
            archivo: datosParaLog.archivo || '-',
            fraccionSugerida: datosParaLog.fraccionSugerida || '-',
            fraccionCorregida: datosParaLog.fraccionCorregida || '-',
            diferencia: datosParaLog.diferencia || '-',
            comentarios: datosParaLog.comentarios || '-',
            extractionMethod: datosParaLog.extractionMethod || '-', // Añadido al log
            heatNumber: datosParaLog.heatNumber || '-',
            molino: datosParaLog.molino || '-',
            material: datosParaLog.material || '-',
            tipo: datosParaLog.tipo || '-',
            acabado: datosParaLog.acabado || '-',
            procesoLaminado: datosParaLog.procesoLaminado || '-',
            tratamiento: datosParaLog.tratamiento || '-',
            costura: datosParaLog.costura || '-',
            ancho: datosParaLog.ancho !== null && datosParaLog.ancho !== undefined ? String(datosParaLog.ancho).replace('.',',') : '-',
            espesor: datosParaLog.espesor !== null && datosParaLog.espesor !== undefined ? String(datosParaLog.espesor).replace('.',',') : '-',
            diametroExterior: datosParaLog.diametroExterior !== null && datosParaLog.diametroExterior !== undefined ? String(datosParaLog.diametroExterior).replace('.',',') : '-',
            espesorPared: datosParaLog.espesorPared !== null && datosParaLog.espesorPared !== undefined ? String(datosParaLog.espesorPared).replace('.',',') : '-',
            longitud: datosParaLog.longitud !== null && datosParaLog.longitud !== undefined ? String(datosParaLog.longitud).replace('.',',') : '-',
            recubrimiento: datosParaLog.recubrimiento || '-',
            esEnrollado: typeof datosParaLog.esEnrollado === 'boolean' ? (datosParaLog.esEnrollado ? 'Sí' : 'No') : '-',
            aleado: typeof datosParaLog.aleado === 'boolean' ? (datosParaLog.aleado ? 'Sí' : 'No') : (datosParaLog.aleado || '-'),
            justificacionAleado: datosParaLog.justificacionAleado || '-',
            justificacionSistema: datosParaLog.justificacion || '-',
        };

        await csvWriter.writeRecords([registroCSV]);
        if (IS_DEBUG_ACTIVE) console.log(`✅ Registro añadido a ${logFilePath}`);
        res.json({ success: true, message: 'Clasificación registrada en el log.' });

    } catch (error) {
        console.error('❌ Error al registrar en el log CSV:', error);
        res.status(500).json({ error: 'Error interno al registrar el log.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Aduax corriendo en http://localhost:${PORT}`);
    if (IS_DEBUG_ACTIVE) {
        console.log('Modo DEBUG activado en server.js.');
        const popplerCmds = ['pdftotext', 'pdftocairo'];
        popplerCmds.forEach(cmd => {
            execFileAsync(cmd, ['-h'])
               .then(() => console.log(`✅ ${cmd} parece estar accesible al inicio del servidor.`))
               .catch((err) => {
                   if (err.code === 'ENOENT') {
                       console.error(`🔥 ${cmd} NO está accesible (ENOENT). Verifica la instalación de Poppler y el PATH del sistema.`);
                   } else {
                       // Solo mostrar el inicio del mensaje de error para brevedad si no es ENOENT
                       const errMsgShort = err.message ? err.message.split('\n')[0] : 'Error desconocido';
                       console.error(`🔥 Error al verificar ${cmd} al inicio: ${errMsgShort}`);
                   }
               });
        });
    }
});