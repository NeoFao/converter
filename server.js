const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const archiver = require('archiver');
const { PDFDocument } = require('pdf-lib');
const { convertMarkdownToPdf, markdownToHtml, getBrowser } = require('./engine/converter');
const { getThemeList, themes } = require('./engine/themes');
const { findBrowserPath } = require('./engine/browser');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Security Hardening
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Multer memory storage for fast in-memory conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/samples', express.static(path.join(__dirname, 'samples')));

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#4f46e5"/><text x="50" y="68" font-family="sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle">PDF</text></svg>`);
});

// Health & System Info endpoint
app.get('/api/health', async (req, res) => {
  const browserPath = findBrowserPath();
  res.json({
    status: 'ok',
    service: 'md-to-pdf-api',
    version: '1.0.0',
    uptimeSeconds: process.uptime(),
    browserPath: browserPath || 'not_found',
    browserAvailable: Boolean(browserPath)
  });
});

// Sample markdown document
app.get('/api/sample', (req, res) => {
  const samplePath = path.join(__dirname, 'samples', 'ejemplo.md');
  if (fs.existsSync(samplePath)) {
    res.type('text/plain').send(fs.readFileSync(samplePath, 'utf8'));
  } else {
    res.type('text/plain').send('# Documento de Ejemplo\n\nEste es un archivo de prueba.');
  }
});

// List available themes and configurations
app.get('/api/themes', (req, res) => {
  res.json({
    themes: getThemeList(),
    formats: ['A4', 'Letter', 'Legal', 'A3', 'Tabloid'],
    margins: ['normal', 'compact', 'wide', 'none']
  });
});

// Live HTML preview endpoint
app.post('/api/preview', (req, res) => {
  try {
    const { markdown = '', theme = 'github', title = 'Vista Previa' } = req.body;
    const html = markdownToHtml(markdown, { theme, title });
    res.type('html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    let markdown = '';
    let title = 'Documento';
    const theme = req.body.theme || req.query.theme || 'github';
    const format = req.body.format || req.query.format || 'A4';
    const margin = req.body.margin || req.query.margin || 'normal';
    const landscape = req.body.landscape === 'true' || req.body.landscape === true;
    const headerFooter = req.body.headerFooter !== 'false' && req.body.headerFooter !== false;
    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

    if (req.file) {
      markdown = req.file.buffer.toString('utf8');
      title = path.basename(req.file.originalname, path.extname(req.file.originalname));
    } else if (req.body.markdown) {
      markdown = req.body.markdown;
      title = req.body.title || 'Documento';
    } else {
      return res.status(400).json({ error: 'Debes enviar un archivo .md o el campo "markdown" en el cuerpo JSON.' });
    }

    const pdfBuffer = await convertMarkdownToPdf(markdown, {
      theme,
      format,
      margin,
      landscape,
      headerFooter,
      title
    });

    const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9_-]/g, '_')) + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error en /api/convert:', err);
    res.status(500).json({ error: err.message });
  }
});

// Batch conversion endpoint
app.post('/api/convert-batch', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos.' });
    }

    const theme = req.body.theme || 'github';
    const format = req.body.format || 'A4';
    const margin = req.body.margin || 'normal';
    const landscape = req.body.landscape === 'true' || req.body.landscape === true;
    const headerFooter = req.body.headerFooter !== 'false' && req.body.headerFooter !== false;
    const merge = req.body.merge === 'true' || req.query.merge === 'true';

    const pdfResults = [];
    for (const file of req.files) {
      const markdown = file.buffer.toString('utf8');
      const baseName = path.basename(file.originalname, path.extname(file.originalname));
      const pdfBuffer = await convertMarkdownToPdf(markdown, {
        theme,
        format,
        margin,
        landscape,
        headerFooter,
        title: baseName
      });
      pdfResults.push({
        filename: baseName + '.pdf',
        buffer: pdfBuffer
      });
    }

    if (merge) {
      const mergedPdf = await PDFDocument.create();
      for (const item of pdfResults) {
        const doc = await PDFDocument.load(item.buffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }
      const mergedBytes = await mergedPdf.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="documentos_combinados.pdf"');
      return res.send(Buffer.from(mergedBytes));
    }

    // ZIP mode
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="documentos_pdf.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    for (const item of pdfResults) {
      archive.append(item.buffer, { name: item.filename });
    }

    await archive.finalize();
  } catch (err) {
    console.error('Error en /api/convert-batch:', err);
    res.status(500).json({ error: err.message });
  }
});

// Smart Port Binding with auto-fallback if port is in use
function startServer(port, attempts = 10) {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`\n===================================================`);
    console.log(`✨ Servidor MD-to-PDF iniciado exitosamente!`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log(`🤖 API REST: http://localhost:${port}/api/convert`);
    console.log(`===================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts > 0) {
      console.log(`⚠️ Puerto ${port} en uso. Intentando en http://localhost:${port + 1}...`);
      startServer(port + 1, attempts - 1);
    } else {
      console.error('❌ Error al iniciar el servidor:', err);
    }
  });
}

startServer(DEFAULT_PORT);

module.exports = app;