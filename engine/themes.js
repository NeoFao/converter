const themes = {
  github: {
    name: 'GitHub Modern',
    description: 'Estilo clásico y limpio inspirado en GitHub. Ideal para documentación técnica y notas.',
    css: `
      .markdown-body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.65;
        color: #1e293b;
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        line-height: 1.3;
        color: #0f172a;
        margin-top: 24px;
        margin-bottom: 12px;
        letter-spacing: -0.01em;
      }
      h1 { font-size: 23px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; margin-top: 0; }
      h2 { font-size: 17px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; margin-top: 22px; }
      h3 { font-size: 14.5px; }
      p { margin-top: 0; margin-bottom: 14px; }
      a { color: #2563eb; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
      blockquote {
        margin: 16px 0;
        padding: 12px 18px;
        color: #475569;
        border-left: 4px solid #6366f1;
        background: #f8fafc;
        border-radius: 0 8px 8px 0;
        font-size: 13.5px;
      }
      blockquote > :first-child { margin-top: 0; }
      blockquote > :last-child { margin-bottom: 0; }
      ul, ol { padding-left: 1.8em; margin-bottom: 14px; }
      li { margin-bottom: 4px; }
      table {
        border-spacing: 0;
        border-collapse: separate;
        width: 100%;
        margin: 18px 0;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        font-size: 13px;
      }
      table th, table td {
        padding: 9px 14px;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
      }
      table th:last-child, table td:last-child {
        border-right: none;
      }
      table tr:last-child td {
        border-bottom: none;
      }
      table th {
        font-weight: 600;
        background-color: #f8fafc;
        color: #0f172a;
        text-align: left;
      }
      table tr:nth-child(even) {
        background-color: #fafbfc;
      }
      hr {
        height: 1px;
        margin: 24px 0;
        background-color: #e2e8f0;
        border: 0;
      }
      code:not(pre code) {
        padding: 2px 6px;
        font-size: 85%;
        background-color: #f1f5f9;
        color: #4f46e5;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 500;
      }
      pre {
        padding: 14px 18px;
        overflow-x: auto;
        font-size: 12.5px;
        line-height: 1.5;
        background-color: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        border: 1px solid #334155;
        margin: 16px 0;
      }
      pre code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        color: inherit;
      }
    `
  },

  academic: {
    name: 'Academic Paper',
    description: 'Estilo formal con tipografía serif, texto justificado y diseño clásico universitario.',
    css: `
      .markdown-body {
        font-family: "Merriweather", "Georgia", "Times New Roman", Times, serif;
        font-size: 13px;
        line-height: 1.75;
        color: #1a1a1a;
        text-align: justify;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: "Georgia", serif;
        font-weight: 700;
        color: #000000;
        text-align: left;
        margin-top: 24px;
        margin-bottom: 12px;
      }
      h1 { font-size: 22px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 0; margin-bottom: 24px; }
      h2 { font-size: 16px; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-top: 20px; }
      h3 { font-size: 14px; font-style: italic; }
      p { margin-bottom: 12px; text-indent: 1.5em; }
      h1 + p, h2 + p, h3 + p, blockquote p, table + p { text-indent: 0; }
      blockquote {
        margin: 16px 2em;
        padding-left: 1.2em;
        border-left: 3px solid #000;
        font-style: italic;
        color: #333;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;
        font-size: 12px;
      }
      table th, table td {
        padding: 8px 12px;
        border-top: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
      }
      table th {
        font-weight: bold;
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
        background: transparent;
      }
      pre {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 11.5px;
        text-align: left;
      }
      code:not(pre code) {
        background: #f1f5f9;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: "Courier New", Courier, monospace;
        font-size: 90%;
      }
    `
  },

  executive: {
    name: 'Executive Report',
    description: 'Estilo corporativo profesional con acentos en azul marino, encabezados destacados y tablas ejecutivas.',
    css: `
      .markdown-body {
        font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-size: 13.5px;
        line-height: 1.65;
        color: #334155;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #0f2d59;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin-top: 24px;
        margin-bottom: 12px;
      }
      h1 {
        font-size: 23px;
        color: #0f2d59;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 8px;
        margin-top: 0;
        margin-bottom: 20px;
      }
      h2 {
        font-size: 17px;
        color: #1e40af;
        border-bottom: 1px solid #bfdbfe;
        padding-bottom: 6px;
        margin-top: 22px;
      }
      h3 { font-size: 14.5px; color: #1d4ed8; }
      blockquote {
        background: #eff6ff;
        border-left: 4px solid #2563eb;
        padding: 12px 18px;
        border-radius: 0 8px 8px 0;
        color: #1e3a8a;
        margin: 16px 0;
        font-size: 13px;
      }
      blockquote > :first-child { margin-top: 0; }
      blockquote > :last-child { margin-bottom: 0; }
      table {
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        margin: 18px 0;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        overflow: hidden;
        font-size: 13px;
      }
      table th {
        background: #1e3a8a;
        color: #ffffff;
        font-weight: 600;
        padding: 10px 14px;
        border: none;
        text-align: left;
      }
      table td {
        padding: 9px 14px;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #f1f5f9;
        color: #334155;
      }
      table td:last-child { border-right: none; }
      table tr:last-child td { border-bottom: none; }
      table tr:nth-child(even) {
        background: #f8fafc;
      }
      pre {
        background: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        padding: 14px 18px;
        font-size: 12.5px;
        border: 1px solid #1e293b;
      }
      code:not(pre code) {
        background: #e0e7ff;
        color: #3730a3;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
    `
  },

  minimal: {
    name: 'Minimalist Clean',
    description: 'Tipografía suiza refinada, espacios generosos y diseño minimalista contemporáneo.',
    css: `
      .markdown-body {
        font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
        font-size: 13.5px;
        line-height: 1.7;
        color: #27272a;
        letter-spacing: -0.01em;
      }
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        color: #09090b;
        margin-top: 28px;
        margin-bottom: 12px;
        letter-spacing: -0.02em;
      }
      h1 { font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
      h2 { font-size: 16px; margin-top: 24px; }
      h3 { font-size: 14px; }
      blockquote {
        margin: 18px 0;
        padding: 6px 16px;
        border-left: 2px solid #09090b;
        color: #71717a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 13px;
      }
      table th, table td {
        padding: 9px 12px;
        border-bottom: 1px solid #e4e4e7;
        text-align: left;
      }
      table th {
        font-weight: 600;
        border-bottom: 2px solid #09090b;
        color: #09090b;
      }
      pre {
        background: #fafafa;
        border: 1px solid #e4e4e7;
        padding: 14px;
        border-radius: 6px;
        font-size: 12px;
      }
      code:not(pre code) {
        background: #f4f4f5;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 85%;
      }
    `
  },

  dark: {
    name: 'Modern Dark',
    description: 'Tema oscuro elegante con fondo Slate y acentos modernos en azul y esmeralda.',
    css: `
      body {
        background-color: #020617 !important;
      }
      .markdown-body {
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13.5px;
        line-height: 1.65;
        color: #e2e8f0;
        background-color: #0f172a !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px #334155 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #f8fafc;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-top: 24px;
        margin-bottom: 12px;
      }
      h1 { font-size: 22px; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-top: 0; }
      h2 { font-size: 16.5px; color: #818cf8; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-top: 22px; }
      h3 { font-size: 14px; color: #34d399; }
      a { color: #38bdf8; text-decoration: none; }
      blockquote {
        border-left: 4px solid #38bdf8;
        background: #1e293b;
        padding: 12px 18px;
        border-radius: 0 8px 8px 0;
        color: #94a3b8;
        margin: 16px 0;
      }
      table {
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        margin: 18px 0;
        border: 1px solid #334155;
        border-radius: 8px;
        overflow: hidden;
        font-size: 13px;
      }
      table th, table td {
        padding: 9px 14px;
        border-bottom: 1px solid #334155;
        border-right: 1px solid #334155;
      }
      table th:last-child, table td:last-child { border-right: none; }
      table tr:last-child td { border-bottom: none; }
      table th {
        background: #1e293b;
        color: #f8fafc;
        text-align: left;
      }
      table tr:nth-child(even) {
        background: #1e293b55;
      }
      hr { border: 0; height: 1px; background: #334155; margin: 24px 0; }
      code:not(pre code) {
        background: #1e293b;
        color: #f472b6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 85%;
        border: 1px solid #334155;
      }
      pre {
        background: #030712;
        border: 1px solid #334155;
        padding: 14px 18px;
        border-radius: 8px;
        overflow-x: auto;
        color: #f8fafc;
        font-size: 12.5px;
      }
    `
  }
};

const commonPrintCss = `
  /* Screen Document Canvas Layout */
  html {
    background-color: #334155;
    min-height: 100%;
  }
  body {
    margin: 0;
    padding: 24px 16px;
    background-color: transparent;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .page-container {
    width: 100%;
    max-width: 820px;
    display: flex;
    justify-content: center;
  }
  .markdown-body {
    width: 100%;
    min-height: 1060px;
    padding: 48px 56px;
    box-sizing: border-box;
    background-color: #ffffff;
    border-radius: 6px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(0, 0, 0, 0.1);
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  /* Print PDF overrides */
  @media print {
    html, body {
      background-color: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      width: 100% !important;
      min-height: auto !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      max-width: 100% !important;
      width: 100% !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .markdown-body {
      max-width: 100% !important;
      width: 100% !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
    }
    table, figure, img, pre, blockquote {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    ul, ol {
      page-break-inside: auto;
    }
    li {
      page-break-inside: avoid;
    }
    a {
      text-decoration: none;
    }
  }

  /* Code Syntax Highlighting Colors */
  .hljs { background: transparent !important; }
  .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #d73a49; font-weight: bold; }
  .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition { color: #032f62; }
  .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #6a737d; font-style: italic; }
  .hljs-number, .hljs-regexp, .hljs-link { color: #005cc5; }
  .hljs-variable, .hljs-symbol, .hljs-bullet { color: #e36209; }
  .hljs-function { color: #6f42c1; }

  /* Math rendering */
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0;
    margin: 1em 0;
    text-align: center;
  }
`;

module.exports = {
  themes,
  commonPrintCss,
  getThemeList: () => Object.keys(themes).map(key => ({
    id: key,
    name: themes[key].name,
    description: themes[key].description
  }))
};