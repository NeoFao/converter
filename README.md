# ? Converter - Suite de Conversi?n Universal

[![Live App](https://img.shields.io/badge/Web%20App-En%20L?nea-6366f1?style=for-the-badge&logo=vercel)](https://converter-blue-one.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Security: Protected PRs](https://img.shields.io/badge/Security-PRs%20Only-blueviolet?style=for-the-badge&logo=github)](CONTRIBUTING.md)

**Converter** es una plataforma moderna, r?pida y modular para convertir documentos y archivos entre m?ltiples formatos con calidad profesional. Dise?ada tanto para usuarios humanos mediante una interfaz web interactiva como para Inteligencias Artificiales y desarrolladores a trav?s de CLI y API REST.

---

## ?? Aplicaci?n en L?nea (100% Gratis y Permanente)

?? **Accede a la app en vivo:** [https://converter-blue-one.vercel.app](https://converter-blue-one.vercel.app)

---

## ?? M?dulos y Funcionalidades

### 1. ?? Markdown (.md) a PDF (Activo)
- **Renderizado de Alta Fidelidad**: Tipograf?a cuidada, saltos de p?gina inteligentes y maquetaci?n estilo hoja de papel f?sica.
- **F?rmulas Matem?ticas $\LaTeX$**: Soporte completo para ecuaciones matem?ticas en l?nea (`$..$`) y en bloque (`$$..$$`) con KaTeX.
- **Resaltado de Sintaxis**: Soporte para m?s de 190 lenguajes de programaci?n mediante Highlight.js.
- **5 Temas de Dise?o**: GitHub Modern, Academic Paper, Executive Report, Minimalist Clean y Modern Dark.
- **Opciones de P?gina**: Tama?os A4, Carta (Letter), Legal, A3, orientaci?n horizontal/vertical y m?rgenes personalizables.
- **Conversi?n por Lotes**: Convierte decenas de archivos a la vez y desc?rgalos empaquetados en un `.zip`.
- **Editor en Vivo con Zoom**: Editor interactivo con vista previa en tiempo real y controles de zoom (`[-] 100% [+]`).

### 2. ?? Pr?ximos M?dulos del Dashboard (En Desarrollo)
- **Word (.docx) a PDF**
- **Im?genes (PNG, JPG, WebP) a PDF**
- **PDF a Markdown / Texto**
- **HTML a PDF**
- **JSON / CSV a Excel (.xlsx)**

---

## ?? Integraci?n para Inteligencias Artificiales y Scripts

### REST API
```bash
curl -X POST https://converter-blue-one.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Reporte Autom?tico\nGenerado por IA.", "theme": "executive"}' \
  --output reporte.pdf
```

### Python
```python
import requests

url = "https://converter-blue-one.vercel.app/api/convert"
data = {
    "markdown": "# Documento T?cnico\nContenido generado din?micamente.",
    "theme": "academic",
    "format": "A4"
}
response = requests.post(url, json=data)
with open("documento.pdf", "wb") as f:
    f.write(response.content)
```

---

## ?? Ejecuci?n Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/NeoFao/converter.git
   cd converter
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicaci?n:
   ```bash
   npm start
   ```
   *(O haz doble clic en `iniciar-app.bat` en Windows)*.

---

## ?? Contribuciones y Seguridad

Las contribuciones de la comunidad son bienvenidas. Por motivos de seguridad y prevenci?n de c?digo malicioso:
- **No se permiten `pushes` directos a la rama principal (`main`)**.
- Todas las mejoras deben ser propuestas a trav?s de un **Pull Request (PR)**.
- Consulta nuestra [Gu?a de Contribuci?n (CONTRIBUTING.md)](CONTRIBUTING.md) y nuestra [Pol?tica de Seguridad (SECURITY.md)](SECURITY.md) para m?s detalles.

---

## ?? Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para m?s informaci?n.
