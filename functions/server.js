// server.js (Adaptado para Google Cloud Run con Docker)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises'); // Usando fs/promises
const os = require('os'); // Para el directorio temporal
// const { createObjectCsvWriter } = require('csv-writer'); // Eliminado - no usar para logging persistente en Cloud Run
const Tesseract = require('tesseract.js');
const { execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);

// Asume que server.js y la carpeta src/ están en el mismo nivel dentro del directorio /app del contenedor Docker
// Esto es gracias a "COPY . ." en tu Dockerfile si la estructura es correcta en tu contexto de build.
const clasificarMTR = require('./src/clasificarMTR');

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run inyectará la variable PORT
const IS_DEBUG_ACTIVE = process.env.DEBUG === 'true' || true;

// Usar el directorio temporal del sistema operativo para las subidas
const UPLOADS_DIR = os.tmpdir();
const upload = multer({ dest: UPLOADS_DIR });

app.use(cors()); // Habilita CORS. Considera configuraciones más específicas en producción.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde 'public' generalmente no es necesario si Firebase Hosting
// se encarga del frontend. Si tienes assets específicos del API que deben ser servidos por Express,
// asegúrate que la carpeta 'public' se copie a tu imagen Docker y la ruta sea correcta.
// Por ahora, lo comentaremos asumiendo que Firebase Hosting maneja el frontend.
// app.use(express.static(path.join(__dirname, 'public')));


// --- INICIO: LÓGICA DE LOGGING A CSV ELIMINADA ---
// La escritura a un archivo CSV local (clasificaciones_log.csv) no es adecuada para Cloud Run.
// Cada instancia tendría su propio archivo, y el sistema de archivos es efímero.
// En su lugar, usa Cloud Logging (console.log) para logs y una base de datos (Firestore)
// o Cloud Storage para persistencia de datos.

// const logFilePath = path.join(os.tmpdir(), 'clasificaciones_log_temp.csv'); // Ya no se usa así
// const csvWriter = createObjectCsvWriter({ ... }); // Eliminado
// async function asegurarEncabezadosLog() { ... } // Eliminado
// asegurarEncabezadosLog(); // Eliminado
// --- FIN: LÓGICA DE LOGGING A CSV ELIMINADA ---


function dividirTextoEnCertificados(textoCompletoPDF) {
    return textoCompletoPDF && typeof textoCompletoPDF === 'string' ? [textoCompletoPDF] : [''];
}

app.post('/procesarArchivo', upload.single('archivo'), async (req, res) => {
    const archivo = req.file;
    const userEmail = req.body.userEmail || 'No especificado';
    const userIP = req.headers['x-forwarded-for'] || req.ip || 'IP no disponible';

    if (IS_DEBUG_ACTIVE) {
        console.log(`[INFO] /procesarArchivo: Email: ${userEmail}, IP: ${userIP}, Archivo: ${archivo ? archivo.originalname : 'No File'}`);
    }

    if (!archivo || !archivo.path) {
        console.error("[ERROR] /procesarArchivo: No se recibió archivo o archivo.path es inválido:", archivo);
        return res.status(400).json({ error: 'No se recibió ningún archivo o la ruta del archivo es inválida.' });
    }

    const filePath = archivo.path; // Esta es una ruta en os.tmpdir()
    let textoCompletoExtraido = '';
    const tempImageFilesCreated = [];
    let extractionMethodUsed = 'Indeterminado';

    try {
        let textoParseadoDirectamente = '';
        let usarTextoParseado = false;
        try {
            // **IMPORTANTE POPPLER**: 'pdftotext' debe estar instalado en tu imagen Docker.
            if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: Intentando extracción directa con pdftotext para: ${archivo.originalname}`);
            const { stdout: stdoutPdftotext, stderr: stderrPdftotext } = await execFileAsync('pdftotext', ['-layout', filePath, '-']);
            
            if (stderrPdftotext && IS_DEBUG_ACTIVE) {
                console.warn('[WARN] (pdftotext) stderr:', stderrPdftotext);
            }
            textoParseadoDirectamente = stdoutPdftotext;

            if (textoParseadoDirectamente && textoParseadoDirectamente.trim().length > 300) {
                if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: Extracción directa de texto exitosa para: ${archivo.originalname}`);
                textoCompletoExtraido = textoParseadoDirectamente;
                usarTextoParseado = true;
                extractionMethodUsed = 'Parseo Directo (Poppler)';
            } else {
                if (IS_DEBUG_ACTIVE) console.warn(`[WARN] /procesarArchivo: Texto parseado directamente es muy corto o nulo. Se procederá con OCR para: ${archivo.originalname}`);
            }
        } catch (parseError) {
            if (IS_DEBUG_ACTIVE) console.warn(`[WARN] /procesarArchivo: Falló la extracción directa de texto (pdftotext) para ${archivo.originalname}. Se procederá con OCR. Error:`, parseError.message);
             if (parseError.code === 'ENOENT' && IS_DEBUG_ACTIVE) {
                 console.error("[ERROR] SUGERENCIA: El error 'ENOENT' para 'pdftotext' significa que no se encontró. Asegúrate de que Poppler esté instalado en tu contenedor Docker.");
             }
        }

        if (!usarTextoParseado) {
            extractionMethodUsed = 'OCR (Tesseract)';
            if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: Iniciando flujo OCR (pdftocairo + Tesseract) para: ${archivo.originalname}`);
            // Usar os.tmpdir() para el nombre base de las imágenes de salida
            const outputBasename = path.join(os.tmpdir(), path.basename(filePath, path.extname(filePath)) + "_ocrpage_");
            const pdftocairoArgs = ['-png', filePath, outputBasename];

            if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: Ejecutando pdftocairo con args: ${pdftocairoArgs.join(' ')}`);
            // **IMPORTANTE POPPLER**: 'pdftocairo' debe estar instalado en tu imagen Docker.
            const { stdout, stderr } = await execFileAsync('pdftocairo', pdftocairoArgs);

            if (IS_DEBUG_ACTIVE) {
                if (stdout) console.log('[INFO] (pdftocairo) stdout:', stdout);
                if (stderr) console.warn('[WARN] (pdftocairo) stderr:', stderr);
            }
            if (IS_DEBUG_ACTIVE) console.log('[INFO] /procesarArchivo: Conversión PDF a imágenes con pdftocairo completada.');

            const dirContents = await fs.readdir(os.tmpdir()); // Leer desde el directorio temporal
            const generatedImageFiles = dirContents
                .filter(f => f.startsWith(path.basename(outputBasename)) && f.endsWith('.png'))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/-(\d+)\.png$/)?.[1] || "0");
                    const numB = parseInt(b.match(/-(\d+)\.png$/)?.[1] || "0");
                    return numA - numB;
                })
                .map(f => path.join(os.tmpdir(), f)); // Rutas completas a las imágenes en /tmp

            tempImageFilesCreated.push(...generatedImageFiles);

            if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: ${generatedImageFiles.length} imágenes encontradas después de pdftocairo.`);
            if (generatedImageFiles.length === 0) {
                throw new Error('pdftocairo no generó imágenes y el parseo directo falló. Verifica Poppler en el contenedor y que el PDF no esté vacío/corrupto.');
            }

            let pageTexts = [];
            for (let i = 0; i < generatedImageFiles.length; i++) {
                const imagePath = generatedImageFiles[i];
                if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: OCR en imagen ${i + 1}/${generatedImageFiles.length}: ${imagePath}`);
                try {
                    // **TESSERACT DATA**: Asegúrate que 'eng.traineddata' y 'spa.traineddata'
                    // estén disponibles en tu imagen Docker y que Tesseract.js pueda encontrarlos.
                    // Podrías necesitar configurar 'dataPath' o empaquetarlos en una carpeta 'tessdata'.
                    const { data: { text } } = await Tesseract.recognize(
                        imagePath,
                        'spa+eng',
                        { logger: m => { if (IS_DEBUG_ACTIVE && m.status === 'recognizing text') console.log(`  [INFO] (Tesseract) Progreso: ${(m.progress * 100).toFixed(2)}%`); }}
                    );
                    pageTexts.push(text);
                } catch (ocrError) {
                    console.error(`[ERROR] /procesarArchivo: Error de OCR en imagen ${imagePath}:`, ocrError.message);
                    pageTexts.push(""); // Añadir texto vacío en caso de error para no romper el flujo
                }
            }
            textoCompletoExtraido = pageTexts.join('\n\n');
        }

        if (IS_DEBUG_ACTIVE && archivo.originalname) {
            // No escribir archivos de depuración al disco en Cloud Run, usar logs.
            console.log(`[DEBUG] Texto final para ${archivo.originalname} (${extractionMethodUsed}), longitud: ${textoCompletoExtraido.length}. Inicio: ${textoCompletoExtraido.substring(0, 200)}...`);
        }

        if (textoCompletoExtraido.trim().length < 10 && IS_DEBUG_ACTIVE) { // Umbral más bajo para advertencia general
            console.warn(`[WARN] /procesarArchivo: El texto final extraído para ${archivo.originalname} es muy corto o vacío.`);
        }

        const textosDeCertificados = dividirTextoEnCertificados(textoCompletoExtraido);
        const resultadosClasificacion = [];
        for (let i = 0; i < textosDeCertificados.length; i++) {
            const textoCertificado = textosDeCertificados[i];
            if (textoCertificado.trim().length === 0 && textosDeCertificados.length > 0) {
                if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: El texto del certificado ${i + 1} está vacío para ${archivo.originalname}, saltando.`);
                continue;
            }
            const nombreArchivoParaClasificar = archivo.originalname;
            if (IS_DEBUG_ACTIVE) console.log(`[INFO] /procesarArchivo: Clasificando: ${nombreArchivoParaClasificar} (obtenido por ${extractionMethodUsed})`);

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
        console.error(`[ERROR] /procesarArchivo: Error general para ${archivo ? archivo.originalname : 'archivo desconocido'}:`, error);
        if (error.code === 'ENOENT' && (error.message.includes('pdftocairo') || error.message.includes('pdftotext'))) {
            console.error("[ERROR] SUGERENCIA: Comando de Poppler no encontrado en el contenedor Docker. Asegúrate de que `poppler-utils` esté instalado en tu Dockerfile.");
            res.status(500).json({ error: 'Error interno: Fallo en herramienta de PDF. Poppler no encontrado.', details: error.message });
        } else if (error.stderr && typeof error.stderr === 'string' && (error.stderr.includes('Syntax Error') || error.stderr.includes('pdftocairo') || error.stderr.includes('pdftotext'))) {
             console.error("[ERROR] (Poppler) Error Output:", error.stderr);
             res.status(500).json({ error: 'Error interno: Fallo durante el procesamiento del PDF con Poppler.', details: error.stderr });
        } else {
            res.status(500).json({ error: 'Error interno al procesar el archivo.', details: error.message });
        }
    } finally {
        if (filePath && await fs.access(filePath).then(() => true).catch(() => false) ) {
          try { await fs.unlink(filePath); } catch (e) { console.error("[ERROR] Eliminando archivo PDF temporal de Multer:", e.message); }
        }
        for (const tempImage of tempImageFilesCreated) {
            if (await fs.access(tempImage).then(() => true).catch(() => false)) {
                try { await fs.unlink(tempImage); } catch (e) { console.error("[ERROR] Eliminando imagen temporal OCR:", tempImage, e.message); }
            }
        }
        if (IS_DEBUG_ACTIVE) console.log('[INFO] /procesarArchivo: Limpieza de archivos temporales intentada.');
    }
});

app.post('/registrar-clasificacion-final', async (req, res) => {
    const datosParaLog = req.body;

    if (IS_DEBUG_ACTIVE) {
        const logPreview = {...datosParaLog};
        if (logPreview.justificacionSistema) logPreview.justificacionSistema = (logPreview.justificacionSistema || "").substring(0, 100) + "...";
        if (logPreview.justificacionAleado) logPreview.justificacionAleado = (logPreview.justificacionAleado || "").substring(0, 100) + "...";
        console.log('[INFO] /registrar-clasificacion-final: Recibido para registrar (preview):', JSON.stringify(logPreview, null, 2));
    }

    if (!datosParaLog || !datosParaLog.archivo) {
        console.error("[ERROR] /registrar-clasificacion-final: Datos incompletos para registrar.");
        return res.status(400).json({ error: 'Datos incompletos para registrar.' });
    }

    // --- INICIO: LÓGICA DE GUARDADO EN BASE DE DATOS (FIRESTORE O SIMILAR) ---
    // Reemplaza la escritura a CSV con una operación de base de datos.
    // Para Cloud Logging, simplemente loguea la información relevante.
    // Este console.log irá a Cloud Logging si tu app se ejecuta en Cloud Run.
    console.log('[INFO] Datos de Clasificación para Registro Persistente:', datosParaLog);
    
    // Ejemplo conceptual de cómo podrías guardar en Firestore (requiere firebase-admin):
    /*
    try {
        const admin = require('firebase-admin'); // Asegúrate que esté inicializado si lo usas
        // if (!admin.apps.length) { admin.initializeApp(); } // Inicializar si es necesario
        // const db = admin.firestore();
        // const docRef = await db.collection('clasificacionesRegistradas').add(datosParaLog);
        // console.log(`[INFO] Log registrado en Firestore con ID: ${docRef.id}`);
        // res.json({ success: true, message: 'Clasificación registrada exitosamente en Firestore.', id: docRef.id });
        res.json({ success: true, message: 'Datos recibidos y logueados en Cloud Logging (implementar DB persistente).' });

    } catch (error) {
        console.error('[ERROR] /registrar-clasificacion-final: Error al intentar registrar en base de datos:', error);
        res.status(500).json({ error: 'Error interno al registrar los datos.', details: error.message });
    }
    */
    // Por ahora, solo respondemos que se recibió y se logueó en Cloud Logging (consola)
    res.json({ success: true, message: 'Datos recibidos. Serán visibles en Cloud Logging. Implementar guardado en base de datos para persistencia.' });
    // --- FIN: LÓGICA DE GUARDADO EN BASE DE DATOS ---
});

// app.listen() es necesario para Cloud Run. Se ejecutará en el puerto que Cloud Run asigne.
app.listen(PORT, () => {
    console.log(`[INFO] Servidor Clasificador MTR corriendo en puerto ${PORT}`);
    if (IS_DEBUG_ACTIVE) {
        console.log('[INFO] Modo DEBUG activado en server.js.');
        // La verificación de Poppler al inicio es útil para depuración local,
        // pero en Cloud Run, si no está en el Dockerfile, fallará el build o la ejecución.
        // Si está en el Dockerfile, debería estar disponible.
        const popplerCmds = ['pdftotext', 'pdftocairo'];
        popplerCmds.forEach(cmd => {
            execFileAsync(cmd, ['-h']) // '-v' o '-h' para verificar
               .then(() => console.log(`[INFO] Verificación de Poppler: ${cmd} parece estar accesible.`))
               .catch((err) => {
                   if (err.code === 'ENOENT') {
                       console.error(`[ERROR] Verificación de Poppler: ${cmd} NO está accesible (ENOENT). Asegúrate que poppler-utils esté en tu Dockerfile.`);
                   } else {
                       const errMsgShort = err.message ? err.message.split('\n')[0] : 'Error desconocido';
                       console.error(`[ERROR] Verificación de Poppler: Error al verificar ${cmd}: ${errMsgShort}`);
                   }
               });
        });
    }
});

// NO necesitas module.exports = app; si este es el script principal para CMD ["node", "server.js"] en Docker.