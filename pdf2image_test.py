from pdf2image import convert_from_path
import os

# Cambia la ruta al archivo PDF que deseas procesar
archivo_pdf = r'C:\Users\ricar\CLASIFICAR\mtr_de_prueba.pdf'

# Ruta donde tienes Poppler
poppler_path = r'C:\Apps\poppler\poppler-24.08.0\Library\bin'  # ajusta si es diferente

# Convertir PDF a imágenes
paginas = convert_from_path(archivo_pdf, dpi=300, poppler_path=poppler_path)

# Guardar como imágenes individuales
for i, pagina in enumerate(paginas):
    nombre_archivo = f'pagina_{i+1}.png'
    pagina.save(nombre_archivo, 'PNG')
    print(f'✅ Imagen guardada: {nombre_archivo}')
