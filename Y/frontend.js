// frontend.js
const loginSection = document.getElementById('loginSection');
const emailInput = document.getElementById('emailInput');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const appContent = document.getElementById('appContent');

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const resultsBody = document.getElementById('resultsBody');
const exportButton = document.getElementById('exportButton');
const guardarLogTablaButton = document.getElementById('guardarLogTablaButton');
const overallStatusDisplayContainer = document.getElementById('overallStatusDisplayContainer'); // Added

let resultados = []; // This will store objects including their status and ID
let userEmail = '';

// Function to update the overall status display area
function updateOverallStatus(message, isError = false) {
    if (overallStatusDisplayContainer) {
        let statusHTML = '';
        if (message) {
            const textColorClass = isError ? 'text-red-600 font-semibold' : 'text-slate-700';
            statusHTML = `<span class="font-semibold">Estado:</span> <span class="${textColorClass}">${message}</span>`;
        } else {
            statusHTML = `<span class="font-semibold">Estado:</span> <span class="text-slate-700">Listo.</span>`; // Default message
        }
        overallStatusDisplayContainer.innerHTML = statusHTML;
    }
}

// Lógica de Login
if (loginButton) {
    loginButton.addEventListener('click', () => {
        const email = emailInput.value.trim().toLowerCase();
        if (email.endsWith('@aduax.com')) {
            userEmail = email;
            if (loginSection) loginSection.classList.add('hidden');
            if (appContent) appContent.classList.remove('hidden');
            if (loginError) loginError.textContent = '';
            updateOverallStatus("Listo para cargar archivos."); // Update status
        } else {
            if (loginError) loginError.textContent = 'Por favor, ingresa un correo electrónico válido de @aduax.com.';
            updateOverallStatus("Error: Email inválido.", true); // Update status
        }
    });
} else {
    console.warn("El botón de login no se encontró.");
    if (appContent) appContent.classList.remove('hidden');
    if (loginSection) loginSection.classList.add('hidden');
    updateOverallStatus("Listo para cargar archivos (modo desarrollo)."); // Update status for dev
}

// Lógica de Carga de Archivos
if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('bg-slate-200', 'border-blue-500'); });
    uploadArea.addEventListener('dragleave', () => { uploadArea.classList.remove('bg-slate-200', 'border-blue-500'); });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('bg-slate-200', 'border-blue-500');
        handleFiles(e.dataTransfer.files);
    });
}
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = null;
    });
}

function handleFiles(filesList) {
    if (!filesList || filesList.length === 0) {
        console.warn("No se seleccionaron archivos o 'filesList' es undefined.");
        updateOverallStatus("No se seleccionaron archivos.", true);
        return;
    }
    if (!userEmail && loginSection && !loginSection.classList.contains('hidden')) {
        alert("Por favor, primero ingresa tu correo electrónico.");
        updateOverallStatus("Identificación requerida. Por favor, ingresa tu correo.", true);
        return;
    }

    const filesArray = Array.from(filesList).slice(0, 50);
    updateOverallStatus(`Cargando ${filesArray.length} archivo(s)...`);

    if (uploadArea) uploadArea.style.pointerEvents = 'none';
    if (fileInput) fileInput.disabled = true;

    const newFileEntries = filesArray.map(file => {
        const tempId = `file-${Date.now()}-${file.name}-${Math.random().toString(36).substring(2, 9)}`;
        return {
            id: tempId,
            archivo: file.name,
            status: "Cargando...", // Internal status for row styling and logic
            fraccionSugerida: '-',
            fraccionCorregida: '',
            Dif: '',
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            molino: '-',
            comentario: '',
            material: '-',
            tipo: '-',
            acabado: '-',
            ancho: null,
            espesor: null,
            recubrimiento: '-',
            justificacion: '-',
            heatNumber: '-',
            diametroExterior: null,
            espesorPared: null,
            longitud: null,
            esEnrollado: 'No',
            aleado: 'No',
            extractionMethod: 'Pendiente',
            userEmail: userEmail,
            userIP: '-',
            _rawDataParaLog: {}
        };
    });

    resultados.unshift(...newFileEntries);
    renderTable(); // Render immediately to show "Cargando..." rows

    let processedCount = 0;
    const totalFiles = newFileEntries.length;

    let promises = newFileEntries.map((newFileEntry, index) => {
        const fileToUpload = filesArray.find(f => f.name === newFileEntry.archivo);
        if (!fileToUpload) return Promise.resolve(null);

        const entryIndexInResultados = resultados.findIndex(r => r.id === newFileEntry.id);
        if (entryIndexInResultados !== -1) {
            resultados[entryIndexInResultados].status = "Procesando...";
        }
        // Update overall status more frequently
        updateOverallStatus(`Procesando archivo ${index + 1} de ${totalFiles}: ${newFileEntry.archivo}`);
        renderTable(); // Re-render to show "Procesando..." for the specific row

        const formData = new FormData();
        formData.append('archivo', fileToUpload);
        if (userEmail) {
            formData.append('userEmail', userEmail);
        }

        return fetch('/procesarArchivo', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    const errorMessage = errData.details || errData.error || `Error del servidor: ${response.status}`;
                    return Promise.reject({ id: newFileEntry.id, archivo: newFileEntry.archivo, message: errorMessage });
                }).catch(() => {
                    const errorMessage = `Error del servidor: ${response.status} ${response.statusText}. (Respuesta no JSON)`;
                    return Promise.reject({ id: newFileEntry.id, archivo: newFileEntry.archivo, message: errorMessage });
                });
            }
            return response.json();
        })
        .then(responseDataArray => {
            if (Array.isArray(responseDataArray) && responseDataArray.length > 0) {
                const serverData = responseDataArray[0];
                if (serverData.error) {
                    return Promise.reject({ id: newFileEntry.id, archivo: newFileEntry.archivo, message: serverData.error });
                }
                return { ...mapData(newFileEntry.archivo, serverData), id: newFileEntry.id };
            } else {
                return Promise.reject({ id: newFileEntry.id, archivo: newFileEntry.archivo, message: "Respuesta inesperada o vacía del backend." });
            }
        })
        .catch(errorInfo => {
            const resultIndex = resultados.findIndex(r => r.id === errorInfo.id);
            if (resultIndex !== -1) {
                resultados[resultIndex].status = `Error: ${errorInfo.message || 'Desconocido'}`;
            }
            console.error(`Error en fetch o procesamiento para ${errorInfo.archivo}:`, errorInfo.message);
            return null;
        });
    });

    Promise.allSettled(promises)
        .then(settledResults => {
            let successCount = 0;
            let errorInProcessingCount = 0;

            settledResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    successCount++;
                    const mappedDataWithId = result.value;
                    const resultIndex = resultados.findIndex(r => r.id === mappedDataWithId.id);
                    if (resultIndex !== -1) {
                        const currentUserInputs = {
                            fraccionCorregida: resultados[resultIndex].fraccionCorregida,
                            comentario: resultados[resultIndex].comentario
                        };
                        resultados[resultIndex] = {
                            ...resultados[resultIndex],
                            ...mappedDataWithId,
                            status: `Finalizado (${mappedDataWithId.extractionMethod || 'N/A'})`,
                            fraccionCorregida: currentUserInputs.fraccionCorregida || mappedDataWithId.fraccionCorregida || '',
                            comentario: currentUserInputs.comentario || mappedDataWithId.comentario || ''
                        };
                        if (resultados[resultIndex].fraccionSugerida !== '-' && resultados[resultIndex].fraccionCorregida) {
                             calcularDiferencia(resultIndex); // This will call renderTable
                        }
                    }
                } else { // fulfilled but null, or rejected
                    errorInProcessingCount++;
                     // Status should have already been set in individual promise catch
                }
            });
            updateOverallStatus(`Procesamiento de lote finalizado. ${successCount} con éxito, ${errorInProcessingCount} con error/vacío.`);
            renderTable(); // Final render
        })
        .finally(() => {
            if (uploadArea) uploadArea.style.pointerEvents = 'auto';
            if (fileInput) fileInput.disabled = false;
            if (filesArray.length > 0 && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        });
}

function mapData(nombreArchivo, dataFromServer) {
    const fecha = new Date();
    const fechaActual = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + fecha.toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fraccionSugerida = dataFromServer.fraccionSugerida || '-';

    return {
        archivo: nombreArchivo,
        fraccionSugerida: fraccionSugerida,
        fraccionCorregida: dataFromServer.fraccionCorregida || '',
        diferencia: '',
        fecha: fechaActual,
        userEmail: dataFromServer.userEmail || userEmail || '-',
        userIP: dataFromServer.userIP || '-',
        molino: dataFromServer.molino || '-',
        comentario: dataFromServer.comentarios || '',
        material: dataFromServer.material || '-',
        tipo: dataFromServer.tipoProducto || dataFromServer.tipo || '-',
        acabado: dataFromServer.acabado || '-',
        ancho: dataFromServer.ancho !== null && typeof dataFromServer.ancho === 'number' ? dataFromServer.ancho.toFixed(1) : null,
        espesor: dataFromServer.espesor !== null && typeof dataFromServer.espesor === 'number' ? Number(dataFromServer.espesor).toFixed(3) : null,
        recubrimiento: dataFromServer.recubrimiento || '-',
        justificacion: dataFromServer.justificacion || '-',
        heatNumber: dataFromServer.heatNumber || '-',
        diametroExterior: dataFromServer.diametroExterior !== null && typeof dataFromServer.diametroExterior === 'number' ? dataFromServer.diametroExterior.toFixed(2) : null,
        espesorPared: dataFromServer.espesorPared !== null && typeof dataFromServer.espesorPared === 'number' ? dataFromServer.espesorPared.toFixed(3) : null,
        longitud: dataFromServer.longitud !== null && typeof dataFromServer.longitud === 'number' ? (dataFromServer.longitud / 1000).toFixed(2) : null,
        esEnrollado: dataFromServer.esEnrollado === true || String(dataFromServer.esEnrollado).toLowerCase() === 'sí' || dataFromServer.esEnrollado === 'Sí' ? 'Sí' : 'No',
        aleado: dataFromServer.aleado === true || String(dataFromServer.aleado).toLowerCase() === 'sí'
          ? `Sí – ${dataFromServer.justificacionAleado || ''}`
          : (dataFromServer.aleado === false || String(dataFromServer.aleado).toLowerCase() === 'no' ? 'No' : (dataFromServer.aleado || '-')),
        extractionMethod: dataFromServer.extractionMethod || 'Indeterminado',
        _rawDataParaLog: { ...dataFromServer }
    };
}

function renderTable() {
    if (!resultsBody) return;
    resultsBody.innerHTML = '';

    // Sorting to keep "Cargando..." and "Procesando..." at the top if desired
    const displayResultados = [...resultados].sort((a, b) => {
        const processingStates = ["Cargando...", "Procesando..."];
        const aIsProcessing = processingStates.includes(a.status);
        const bIsProcessing = processingStates.includes(b.status);

        if (aIsProcessing && !bIsProcessing) return -1;
        if (!aIsProcessing && bIsProcessing) return 1;
        // For other states, you might want to sort by date or file name, e.g.
        // return new Date(b.fechaOriginal || 0) - new Date(a.fechaOriginal || 0); // Assuming you add fechaOriginal
        return 0; 
    });

    displayResultados.forEach((row) => {
        const originalIndex = resultados.findIndex(r => r.id === row.id);
        const tr = document.createElement('tr');
        
        // Apply status-specific classes for row background
        if (row.status && row.status.startsWith("Error:")) {
            tr.classList.add('status-error');
        } else if (row.status === "Procesando..." || row.status === "Cargando...") {
            tr.classList.add('status-processing');
        }

        // Columns to display in the table - "Status" column removed
        // Removed whiteSpace: 'nowrap' from styles to allow CSS to handle wrapping
        const columnsToDisplay = [
             { value: row.archivo, style: { /* minWidth for Archivo can be useful */ } },
             // Status column was here, now removed.
             { value: row.fraccionSugerida, style: { fontWeight: '600' } },
             {
                 html: `<input type="text" value="${row.fraccionCorregida || ''}" onchange="updateFraccionCorregida(${originalIndex}, this.value)">`,
             },
             { value: row.diferencia }, // Removed nowrap
             { value: row.fecha }, // Removed nowrap
             { value: row.molino },
             {
                 html: `<input type="text" value="${row.comentario || ''}" onchange="updateComentario(${originalIndex}, this.value)">`,
             },
             { value: row.material },
             { value: row.tipo },
             { value: row.acabado },
             { value: row.ancho !== null ? row.ancho + ' mm' : '-' }, // Removed nowrap
             { value: row.espesor !== null ? row.espesor + ' mm' : '-' }, // Removed nowrap
             { value: row.recubrimiento },
             { value: row.justificacion, style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', fontSize: '0.8rem' } },
             { value: row.heatNumber }, // Removed nowrap
             { value: row.diametroExterior !== null ? row.diametroExterior + ' mm' : '-' }, // Removed nowrap
             { value: row.espesorPared !== null ? row.espesorPared + ' mm' : '-' }, // Removed nowrap
             { value: row.longitud !== null ? row.longitud + ' m' : '-' }, // Removed nowrap
             { value: row.esEnrollado }, // Removed nowrap
             { value: row.aleado, style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', fontSize: '0.8rem' } }
        ];

        columnsToDisplay.forEach(col => {
            const td = document.createElement('td');
            if (col.html) {
                td.innerHTML = col.html;
            } else {
                td.textContent = String(col.value === null || col.value === undefined || col.value === '' ? '-' : col.value);
            }
            if (col.style) { // Apply any specific JS styles that are still necessary
                for (const s in col.style) {
                    td.style[s] = col.style[s];
                }
            }
            tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
    });
}


function updateFraccionCorregida(index, value) {
    if (resultados[index]) {
        resultados[index].fraccionCorregida = value.trim();
        calcularDiferencia(index); // This will re-render
    }
}

function updateComentario(index, value) {
    if (resultados[index]) {
        resultados[index].comentario = value.trim();
        // Optionally, you could re-render if needed, but often not necessary for comments
        // renderTable(); 
    }
}

function calcularDiferencia(index) {
    if (resultados[index]) {
        const original = resultados[index].fraccionSugerida;
        const corregida = resultados[index].fraccionCorregida;
        if (original && original !== '-' && corregida && corregida.length >= 8) { // Assuming 8 is min length for comparison
            resultados[index].diferencia = original !== corregida ? "Sí" : "No";
        } else {
            resultados[index].diferencia = '';
        }
        renderTable(); // Re-render to show the updated diferencia
    }
}

if (exportButton) {
    exportButton.addEventListener('click', () => {
        if (resultados.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        const dataToExport = resultados.map(row => ({
            'Archivo': row.archivo,
            'Fracción Sugerida (Sistema)': row.fraccionSugerida,
            'Fracción Corregida (Usuario)': row.fraccionCorregida,
            'Diferencia': row.diferencia,
            'Fecha': row.fecha,
            'Email Usuario': row.userEmail,
            'IP Usuario': row.userIP,
            'Molino': row.molino,
            'Comentarios (Usuario)': row.comentario,
            'Material': row._rawDataParaLog.material,
            'Tipo Producto': row._rawDataParaLog.tipoProducto,
            'Acabado': row._rawDataParaLog.acabado,
            'Proceso Laminado': row._rawDataParaLog.procesoLaminado,
            'Tratamiento': row._rawDataParaLog.tratamiento,
            'Costura': row._rawDataParaLog.costura,
            'Ancho (mm)': row._rawDataParaLog.ancho,
            'Espesor (mm)': row._rawDataParaLog.espesor,
            'DE (mm)': row._rawDataParaLog.diametroExterior,
            'EP (mm)': row._rawDataParaLog.espesorPared,
            'Longitud (m)': row._rawDataParaLog.longitud !== null ? (row._rawDataParaLog.longitud / 1000) : null,
            'Recubrimiento': row._rawDataParaLog.recubrimiento,
            'Enrollado': typeof row._rawDataParaLog.esEnrollado === 'boolean' ? (row._rawDataParaLog.esEnrollado ? 'Sí' : 'No') : '-',
            'Aleado (Sistema)': typeof row._rawDataParaLog.aleado === 'boolean' ? (row._rawDataParaLog.aleado ? 'Sí' : 'No') : (row._rawDataParaLog.aleado || '-'),
            'Justificación Aleado (Sistema)': row._rawDataParaLog.justificacionAleado,
            'Justificación Clasificación (Sistema)': row._rawDataParaLog.justificacion,
            'Heat Number': row.heatNumber,
            'Método Extracción': row.extractionMethod
            // Note: The internal 'status' field (like "Procesando...") is not typically exported to Excel.
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados MTR");
        XLSX.writeFile(workbook, "Resultados_Clasificacion_MTR.xlsx");
    });
}

if (guardarLogTablaButton) {
    guardarLogTablaButton.addEventListener('click', () => {
        if (resultados.length === 0) {
            alert("No hay datos en la tabla para registrar en el log.");
            return;
        }
        if (!userEmail && loginSection && !loginSection.classList.contains('hidden')) {
            alert("Por favor, identifícate (email) antes de registrar el log.");
            return;
        }

        updateOverallStatus("Registrando datos en el log...");
        const logPromises = resultados.map(row => {
            const rawData = row._rawDataParaLog || {};
            const dataToLog = {
                fecha: row.fecha,
                userEmail: row.userEmail,
                userIP: row.userIP,
                archivo: row.archivo,
                fraccionSugerida: row.fraccionSugerida,
                fraccionCorregida: row.fraccionCorregida,
                diferencia: row.diferencia,
                comentarios: row.comentario,
                extractionMethod: row.extractionMethod, // This now includes the "Finalizado (method)" part
                statusOriginalServidor: row.status, // Could log the last internal status string
                heatNumber: rawData.heatNumber || row.heatNumber || '-',
                molino: rawData.molino || row.molino || '-',
                material: rawData.material || '-',
                tipo: rawData.tipoProducto || rawData.tipo || '-',
                acabado: rawData.acabado || '-',
                procesoLaminado: rawData.procesoLaminado || '-',
                tratamiento: rawData.tratamiento || '-',
                costura: rawData.costura || '-',
                ancho: rawData.ancho,
                espesor: rawData.espesor,
                diametroExterior: rawData.diametroExterior,
                espesorPared: rawData.espesorPared,
                longitud: rawData.longitud,
                recubrimiento: rawData.recubrimiento || '-',
                esEnrollado: rawData.esEnrollado,
                aleado: rawData.aleado,
                justificacionAleado: rawData.justificacionAleado || '-',
                justificacionSistema: rawData.justificacion || '-'
            };

            return fetch('/registrar-clasificacion-final', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToLog)
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject({ file: row.archivo, errorDetail: err.details || err.error, status: response.status }));
                }
                return response.json().then(data => ({ file: row.archivo, success: data.success, message: data.message }));
            }).catch(networkError => {
                 return Promise.reject({ file: row.archivo, errorDetail: networkError.message || "Error de Red/Fetch", status: "Network Error" });
            });
        });

        Promise.allSettled(logPromises)
            .then(resultsArray => {
                let successCount = 0;
                let errorCount = 0;
                let errorMessages = [];
                resultsArray.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        const file = result.status === 'fulfilled' ? result.value.file : result.reason?.file;
                        const detail = result.status === 'fulfilled' ? result.value.message : result.reason?.errorDetail;
                        errorMessages.push(`Archivo: ${file || 'N/A'} - Error: ${detail || 'Desconocido'}`);
                    }
                });
                let alertMessage = `Se procesaron ${successCount} registros de log con éxito.`;
                if (errorCount > 0) {
                    alertMessage += `\nHubo ${errorCount} errores al registrar. ${errorMessages.slice(0,3).join('\n')}`;
                }
                alert(alertMessage);
                updateOverallStatus(alertMessage, errorCount > 0);
            });
    });
}

// Initial status when script loads (if app content is visible)
if (appContent && !appContent.classList.contains('hidden')) {
    updateOverallStatus("Listo para cargar archivos.");
} else if (!loginButton) { // If no login button (dev mode always shows appContent)
    updateOverallStatus("Listo para cargar archivos (modo desarrollo).");
}