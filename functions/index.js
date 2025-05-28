/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// const admin = require("firebase-admin"); // Descomenta si necesitas el SDK de Admin
// admin.initializeApp(); // Descomenta si necesitas el SDK de Admin

const cors = require("cors")({origin: true}); // Configuración básica de CORS para permitir todas las origins. Ajusta 'origin' a tu dominio de Firebase Hosting para producción.
const busboy = require("busboy");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Función para procesar el archivo subido
exports.procesarArchivoAPI = onRequest({memory: "1GiB", timeoutSeconds: 300}, (request, response) => {
  cors(request, response, () => {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Método no permitido. Solo POST." });
    }

    const bb = busboy({ headers: request.headers });
    const tmpdir = os.tmpdir();
    let uploadPath;
    let originalFilename;
    let userEmail; // Para capturar el userEmail del FormData

    // Este objeto almacenará los campos de texto del formulario
    const fields = {};

    bb.on("file", (fieldname, file, MimeType) => { // El nombre del campo en FormData era 'archivo'
      originalFilename = MimeType.filename;
      const filepath = path.join(tmpdir, originalFilename);
      uploadPath = filepath;
      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      // Asegúrate de manejar los errores del stream de escritura también
      writeStream.on('error', (err) => {
        logger.error("Error en el stream de escritura del archivo:", err);
        // No envíes respuesta aquí si 'finish' podría seguirse ejecutando o ya se envió.
      });
    });

    bb.on("field", (fieldname, val) => {
        fields[fieldname] = val;
        if (fieldname === 'userEmail') {
            userEmail = val;
        }
    });

    bb.on("finish", () => {
      if (!uploadPath) {
        logger.error("No se subió ningún archivo o hubo un error antes de 'finish'.");
        return response.status(400).json({ error: "No se subió ningún archivo." });
      }

      logger.info(`Archivo [${originalFilename}] subido a [${uploadPath}] por usuario [${userEmail || 'No especificado'}]`);
      logger.info("Campos recibidos:", fields);


      // ----- INICIO DE TU LÓGICA DE PROCESAMIENTO DE ARCHIVO -----
      // Aquí es donde leerías y procesarías el archivo PDF desde 'uploadPath'.
      // Por ejemplo, usando una librería para leer PDFs y extraer la información.
      // Esta parte es específica de tu aplicación.
      //
      // Ejemplo de respuesta (debes reemplazar esto con tus datos reales):
      const datosExtraidos = {
        fraccionSugerida: "1234567890", // Ejemplo
        molino: "Molino Ejemplo",
        material: "Acero Ejemplo",
        tipoProducto: "Tubo Ejemplo",
        // ...otros campos que extraigas...
        userEmail: userEmail, // Puedes devolver el email si es necesario
        // userIP: request.ip // La IP del invocador de la función (puede ser la IP de Firebase)
      };
      // ----- FIN DE TU LÓGICA DE PROCESAMIENTO DE ARCHIVO -----

      fs.unlinkSync(uploadPath); // Limpia el archivo temporal
      response.status(200).json([datosExtraidos]); // El frontend espera un array
    });

    bb.on("error", (err) => {
        logger.error("Error de Busboy:", err);
        if (uploadPath) { // Intenta limpiar si el archivo ya fue creado
            try {
                fs.unlinkSync(uploadPath);
            } catch (unlinkErr) {
                logger.error("Error al limpiar archivo temporal después de error de busboy:", unlinkErr);
            }
        }
        response.status(500).json({ error: "Error al procesar la subida del archivo." });
    });

    // En Node.js v17+, request.pipe(bb) es el método correcto.
    // Para versiones anteriores o si tienes problemas, puedes usar request.rawBody si está disponible
    // o asegurarte de que el request stream se esté pasando correctamente a busboy.
    // En Cloud Functions v2, el stream del request se puede pasar directamente.
    if (request.rawBody) {
        bb.end(request.rawBody);
    } else {
        request.pipe(bb);
    }
  });
});

// Función para registrar la clasificación final
exports.registrarClasificacionFinalAPI = onRequest({memory: "256MiB"}, (request, response) => {
  cors(request, response, () => {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Método no permitido. Solo POST." });
    }

    // El cuerpo JSON es parseado automáticamente por Cloud Functions v2
    const dataToLog = request.body;
    logger.info("Datos recibidos para registrar en log:", {data: dataToLog});

    // ----- INICIO DE TU LÓGICA DE GUARDADO EN BASE DE DATOS -----
    // Aquí es donde guardarías 'dataToLog' en tu base de datos (ej. Firestore).
    // Ejemplo:
    // if (admin) { // Si has inicializado admin
    //   return admin.firestore().collection('clasificacionesLog').add(dataToLog)
    //     .then(docRef => {
    //       logger.info("Log registrado con ID:", docRef.id);
    //       return response.status(200).json({ success: true, message: "Log registrado con éxito.", id: docRef.id });
    //     })
    //     .catch(error => {
    //       logger.error("Error al registrar log en Firestore:", error);
    //       return response.status(500).json({ success: false, error: "Error interno al guardar el log." });
    //     });
    // } else {
    //   logger.warn("SDK de Admin no inicializado. El log no se guardará.");
    //   return response.status(500).json({ success: false, error: "SDK de Admin no configurado para guardar." });
    // }
    // ----- FIN DE TU LÓGICA DE GUARDADO EN BASE DE DATOS -----

    // Respuesta de ejemplo si no usas Firestore directamente aquí:
    response.status(200).json({ success: true, message: "Datos recibidos por registrarClasificacionFinalAPI (lógica de guardado pendiente)." });
  });
});