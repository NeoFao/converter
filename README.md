# 📄 MD to PDF Converter Pro

> Aplicación local de alto rendimiento para convertir archivos Markdown (`.md`) a documentos PDF de calidad profesional con soporte para tablas, código resaltado, ecuaciones matemáticas ($\LaTeX$), gráficos y múltiples temas visuales.

Diseñada tanto para **usuarios finales** (con una interfaz web visual, drag & drop y vista previa) como para **Inteligencias Artificiales y scripts automatizados** (mediante CLI y API REST local).

---

## 🚀 Inicio Rápido (1 Clic)

Para abrir la aplicación con su interfaz visual:
- Haz doble clic sobre el archivo **`iniciar-app.bat`** (abrirá automáticamente la aplicación en tu navegador web en `http://localhost:3000`).

O desde la terminal en esta carpeta:
```bash
npm start
```

---

## 🎨 Características Principales

1. **Interfaz Gráfica Intuitiva (Web UI)**:
   - **Arrastrar y soltar (Drag & Drop)**: Sube uno o decenas de archivos `.md` simultáneamente.
   - **Vista previa en tiempo real**: Revisa cómo se ve el documento antes de exportarlo.
   - **Editor rápido**: Pega o escribe Markdown y descarga el PDF al instante.
   - **Modos de descarga en lote**:
     - Descarga individual por archivo.
     - Descarga de todos los PDFs comprimidos en un archivo `.zip`.
     - **Combinar todos los `.md`** en un único PDF continuo.

2. **Temas Visuales Disponibles**:
   - `github`: Estilo limpio de GitHub para documentación técnica y READMEs.
   - `academic`: Tipografía serif formal (Georgia / Merriweather), texto justificado y diseño tipo paper universitario.
   - `executive`: Diseño corporativo profesional con acentos en azul marino y tablas estilizadas.
   - `minimal`: Estilo suizo minimalista y aireado.
   - `dark`: Tema oscuro con contraste Slate.

3. **Elementos Avanzados Soportados**:
   - Resaltado de sintaxis para más de 190 lenguajes de programación (Python, JS, C++, Rust, Go, SQL, Bash, etc.).
   - Fórmulas matemáticas completas vía KaTeX ($\LaTeX$ inline `$E=mc^2$` y en bloque `$$\int_0^\infty f(x)dx$$`).
   - Tablas estilizadas, blockquotes, listas de verificación (checklists).
   - Encabezados y pies de página con paginación automática ("Página 1 de 5").

4. **100% Local y Privado**:
   - Todo el procesamiento se realiza en tu computadora. Tus datos nunca se envían a servidores externos ni a la nube.

---

## 🤖 Guía para Inteligencias Artificiales y Scripts

### 1. Uso mediante Línea de Comandos (CLI)

El CLI es la forma más rápida para que una IA o terminal procese archivos:

```bash
# Convertir un archivo simple a PDF (genera documento.pdf)
node cli.js documento.md

# Especificar archivo o carpeta de salida
node cli.js documento.md -o ./salidas/reporte_final.pdf

# Especificar tema, formato de hoja y orientación horizontal
node cli.js reporte.md --theme executive --format Letter --landscape

# Convertir todos los .md de un directorio y combinarlos en 1 solo PDF
node cli.js ./mis-notas/ -o todo_junto.pdf --merge

# Entrada por standard input (STDIN) (ideal para pipelines de IA)
echo "# Reporte Generado por IA" | node cli.js --stdin -o reporte.pdf
```

**Parámetros CLI soportados**:
- `-o, --output <path>`: Ruta de salida o directorio destino.
- `-t, --theme <theme>`: `github` (default), `academic`, `executive`, `minimal`, `dark`.
- `-f, --format <format>`: `A4` (default), `Letter`, `Legal`, `A3`.
- `-m, --margin <margin>`: `normal` (18mm), `compact` (10mm), `wide` (25mm), `none` (0mm).
- `-l, --landscape`: Orientación horizontal.
- `--no-header-footer`: Ocultar encabezados y pie de página.
- `--merge`: Combinar todos los archivos en un único PDF.
- `--stdin`: Leer Markdown desde stdin.
- `--list-themes`: Muestra los temas disponibles.

---

### 2. Uso mediante API REST Local

Con el servidor corriendo en `http://localhost:3000`:

#### A) cURL
```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Titulo\nTexto generado por IA.", "theme": "executive"}' \
  --output salida.pdf
```

#### B) Python (`requests`)
```python
import requests

payload = {
    "markdown": """# Análisis Trimestral
| Métrica | Valor |
| --- | --- |
| Ventas | $150,000 |

$$\\sigma = \\sqrt{\\frac{1}{N}\\sum (x_i - \\mu)^2}$$
""",
    "theme": "academic",
    "format": "A4"
}

response = requests.post("http://localhost:3000/api/convert", json=payload)

with open("analisis.pdf", "wb") as f:
    f.write(response.content)

print("PDF generado exitosamente.")
```

#### C) Node.js / JavaScript (`fetch`)
```javascript
import fs from 'fs';

const res = await fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    markdown: '# Documento Técnico\nContenido...',
    theme: 'github',
    format: 'Letter'
  })
});

const buffer = Buffer.from(await res.arrayBuffer());
fs.writeFileSync('documento.pdf', buffer);
```

---

## 📁 Estructura del Proyecto

```
md-to-pdf-app/
├── package.json              # Dependencias del proyecto
├── server.js                 # Servidor Express (API REST y servidor web estático)
├── cli.js                    # CLI autónomo para usuarios e IAs
├── iniciar-app.bat            # Lanzador rápido en 1 clic para Windows
├── README.md                 # Documentación técnica
├── engine/
│   ├── converter.js          # Motor central Markdown -> HTML -> PDF
│   ├── themes.js             # Definición de estilos CSS y temas
│   └── browser.js            # Detección de navegadores instalados (Edge / Chrome)
├── public/
│   ├── index.html            # Interfaz gráfica moderna (Tailwind CSS)
│   ├── app.js                # Lógica del frontend (Lote, Drag&Drop, Preview)
│   └── styles.css            # Estilos personalizados y animaciones
└── samples/
    ├── ejemplo.md            # Archivo de ejemplo con tablas, código y fórmulas
    └── ejemplo.pdf           # PDF generado de prueba
```