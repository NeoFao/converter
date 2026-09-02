# ⚡ Converter - Suite de Conversión Universal

[![Web App](https://img.shields.io/badge/Web%20App-En%20Línea-6366f1?style=for-the-badge&logo=vercel)](https://converter-blue-one.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Security: Protected PRs](https://img.shields.io/badge/Security-PRs%20Only-blueviolet?style=for-the-badge&logo=github)](CONTRIBUTING.md)

**Converter** es una plataforma moderna, rápida y modular para convertir documentos y archivos entre múltiples formatos con calidad profesional. Diseñada tanto para usuarios humanos mediante una interfaz web interactiva como para Inteligencias Artificiales y desarrolladores a través de CLI y API REST.

---

## 🌐 Aplicación en Línea (100% Gratis y Permanente)

👉 **Accede a la app en vivo:** [https://converter-blue-one.vercel.app](https://converter-blue-one.vercel.app)

---

## 🚀 Módulos de Conversión Activos

| # | Módulo | Entrada | Salida | Descripción |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Markdown (.md) a PDF** | `.md`, `.markdown` | PDF de alta resolución | Renderizado estilo hoja de papel con fórmulas KaTeX ($LaTeX$), resaltado de código (190+ lenguajes) y 5 temas. |
| **2** | **Word (.docx) a PDF** | `.docx` (Word) | PDF estructurado | Conversión fiel de documentos Word preservando tablas, listas, encabezados, estilos e imágenes. |
| **3** | **Imágenes a PDF** | PNG, JPG, WebP, GIF, SVG | PDF combinado | Agrupa una o múltiples fotos en un único documento PDF de alta calidad con autoajuste de proporciones. |
| **4** | **PDF a Markdown** | `.pdf` | `.md` (Markdown) | Extracción de texto y estructura completa a formato Markdown limpio con editor y descarga inmediata. |
| **5** | **HTML a PDF** | Código HTML o archivos `.html` | PDF con CSS | Editor y renderizado en tiempo real de código HTML completo a PDF. |
| **6** | **JSON / CSV a Excel** | `.json`, `.csv` | Libro Excel (`.xlsx`) | Conversión de conjuntos de datos y tablas a archivos de hoja de cálculo Excel reales con vista previa. |

---

## 🤖 Integración para Inteligencias Artificiales y Scripts

### cURL
```bash
curl -X POST https://converter-blue-one.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Mi Reporte\nGenerado por IA.", "theme": "executive"}' \
  --output reporte.pdf
```

### Python
```python
import requests

url = "https://converter-blue-one.vercel.app/api/convert"
data = {
    "markdown": "# Documento Técnico\nContenido generado dinámicamente.",
    "theme": "academic",
    "format": "A4"
}
response = requests.post(url, json=data)
with open("documento.pdf", "wb") as f:
    f.write(response.content)
```

---

## 💻 Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/NeoFao/converter.git
   cd converter
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación:
   ```bash
   npm start
   ```
   *(O haz doble clic en `iniciar-app.bat` en Windows)*.

---

## 🤝 Contribuciones y Seguridad

Las contribuciones de la comunidad son bienvenidas. Por motivos estrictos de seguridad e integridad del código:
- **No se permiten `pushes` directos a la rama principal (`main`)**.
- Todas las mejoras deben ser propuestas a través de un **Pull Request (PR)**.
- Solo el propietario del repositorio puede aprobar y fusionar (`merge`) cambios.
- Consulta nuestra [Guía de Contribución (CONTRIBUTING.md)](CONTRIBUTING.md) y nuestra [Política de Seguridad (SECURITY.md)](SECURITY.md).

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.
