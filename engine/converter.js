const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const katex = require('katex');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { findBrowserPath } = require('./browser');
const { themes, commonPrintCss } = require('./themes');

// Configure marked with syntax highlighting
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// Process KaTeX math equations before markdown parsing
function renderMath(text) {
  if (typeof text !== 'string') {
    text = String(text || '');
  }

  // Block math: $$ ... $$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (e) {
      return `<pre class="katex-error">${math}</pre>`;
    }
  });

  // Inline math: $ ... $
  text = text.replace(/(?<!\\|\$)\$([^\$\n]+?)\$(?!\$)/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<code>${math}</code>`;
    }
  });

  return text;
}

// Read KaTeX CSS
let katexCss = '';
try {
  const katexPath = require.resolve('katex/dist/katex.min.css');
  katexCss = fs.readFileSync(katexPath, 'utf8');
} catch (err) {
  katexCss = '';
}

/**
 * Converts Markdown string to complete styled HTML
 */
function markdownToHtml(markdownText, options = {}) {
  const rawText = typeof markdownText === 'string' ? markdownText : (markdownText ? String(markdownText) : '');
  const themeName = options.theme || 'github';
  const theme = themes[themeName] || themes.github;
  const title = options.title || 'Documento PDF';

  // Math preprocessing
  const withMath = renderMath(rawText);
  // Markdown to HTML conversion
  const bodyHtml = marked.parse(withMath);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${katexCss}
    ${commonPrintCss}
    ${theme.css}
  </style>
</head>
<body class="theme-${themeName}">
  <div class="page-container">
    <main class="markdown-body">
      ${bodyHtml}
    </main>
  </div>
</body>
</html>`;

  return html;
}

function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Get margin preset
 */
function getMarginPreset(preset) {
  switch (preset) {
    case 'none':
      return { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' };
    case 'compact':
      return { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' };
    case 'wide':
      return { top: '25mm', bottom: '25mm', left: '25mm', right: '25mm' };
    case 'normal':
    default:
      return { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' };
  }
}

// Browser instance management
let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const browserPath = findBrowserPath();
  if (!browserPath) {
    throw new Error(
      'No se encontró ningún navegador compatible (Microsoft Edge o Google Chrome). ' +
      'Por favor instala Edge o Chrome o define la variable PUPPETEER_EXECUTABLE_PATH.'
    );
  }

  browserInstance = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium'
    ]
  });

  return browserInstance;
}

/**
 * Main conversion function: Markdown text -> PDF Buffer
 */
async function convertMarkdownToPdf(markdownText, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const html = markdownToHtml(markdownText, options);
    await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'] });

    const format = options.format || 'A4';
    const landscape = Boolean(options.landscape);
    const margin = typeof options.margin === 'object' ? options.margin : getMarginPreset(options.margin || 'normal');
    const displayHeaderFooter = options.headerFooter !== undefined ? Boolean(options.headerFooter) : true;
    const documentTitle = options.title || 'Documento';

    const headerTemplate = options.headerTemplate || `
      <div style="font-family: -apple-system, sans-serif; font-size: 8px; color: #888; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span>${escapeHtml(documentTitle)}</span>
        <span></span>
      </div>
    `;

    const footerTemplate = options.footerTemplate || `
      <div style="font-family: -apple-system, sans-serif; font-size: 8px; color: #888; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span>Generado con MD-to-PDF</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `;

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      printBackground: true,
      displayHeaderFooter,
      headerTemplate: displayHeaderFooter ? headerTemplate : '<span></span>',
      footerTemplate: displayHeaderFooter ? footerTemplate : '<span></span>'
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Convert file on disk to PDF file on disk
 */
async function convertFile(inputPath, outputPath, options = {}) {
  const markdownText = await fs.promises.readFile(inputPath, 'utf8');
  const title = options.title || path.basename(inputPath, path.extname(inputPath));
  const pdfBuffer = await convertMarkdownToPdf(markdownText, { ...options, title });

  const finalOutputPath = outputPath || inputPath.replace(/\.md$/i, '.pdf');
  await fs.promises.writeFile(finalOutputPath, pdfBuffer);
  return finalOutputPath;
}

module.exports = {
  convertMarkdownToPdf,
  convertFile,
  markdownToHtml,
  getBrowser
};