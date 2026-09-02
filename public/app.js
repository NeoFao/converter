// Converter Suite - State Management
let currentTool = 'dashboard';
let currentSubTab = 'files';
let fileQueue = [];
let activePreviewFile = null;
let editorDebounceTimeout = null;
let cachedSampleMarkdown = '';
let currentZoom = 1.0;
let currentModalZoom = 1.0;

// State for tools
let wordCurrentFile = null;
let wordArrayBuffer = null;
let imagesQueue = [];
let scannerQueue = [];
let pdf2mdCurrentFile = null;
let excelCurrentData = null;

// --- 7-Tool Navigation Router ---
window.goToDashboard = function() {
  currentTool = 'dashboard';
  const tools = ['markdown', 'word', 'images', 'scanner-ocr', 'pdf2md', 'html', 'excel'];
  tools.forEach(t => {
    const el = document.getElementById('view-tool-' + t);
    if (el) el.classList.add('hidden');
  });

  const viewDashboard = document.getElementById('view-dashboard');
  const btnNavDashboard = document.getElementById('btn-nav-dashboard');
  const mdToolTabs = document.getElementById('md-tool-tabs');

  if (viewDashboard) viewDashboard.classList.remove('hidden');
  if (btnNavDashboard) btnNavDashboard.classList.add('hidden');
  if (mdToolTabs) mdToolTabs.classList.add('hidden');
};

window.openTool = function(toolName) {
  currentTool = toolName;
  const viewDashboard = document.getElementById('view-dashboard');
  const btnNavDashboard = document.getElementById('btn-nav-dashboard');
  const mdToolTabs = document.getElementById('md-tool-tabs');

  if (viewDashboard) viewDashboard.classList.add('hidden');
  if (btnNavDashboard) btnNavDashboard.classList.remove('hidden');

  const tools = ['markdown', 'word', 'images', 'scanner_ocr', 'pdf2md', 'html', 'excel'];
  tools.forEach(t => {
    const elementId = t === 'scanner_ocr' ? 'view-tool-scanner-ocr' : ('view-tool-' + t);
    const el = document.getElementById(elementId);
    if (!el) return;
    if (t === toolName) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  if (toolName === 'markdown') {
    if (mdToolTabs) mdToolTabs.classList.remove('hidden');
    switchToolTab(currentSubTab || 'files');
  } else {
    if (mdToolTabs) mdToolTabs.classList.add('hidden');
  }

  // Auto-init specific tools
  if (toolName === 'html') {
    const htmlArea = document.getElementById('html-textarea');
    if (htmlArea && !htmlArea.value.trim()) {
      loadSampleHtml();
    }
  } else if (toolName === 'excel') {
    const excelArea = document.getElementById('excel-textarea');
    if (excelArea && !excelArea.value.trim()) {
      loadSampleExcelData();
    }
  }
};

window.switchToolTab = function(tabName) {
  currentSubTab = tabName;
  const tabs = [
    { id: 'files', btn: document.getElementById('tab-btn-files'), pane: document.getElementById('tool-subtab-files') },
    { id: 'editor', btn: document.getElementById('tab-btn-editor'), pane: document.getElementById('tool-subtab-editor') },
    { id: 'ai', btn: document.getElementById('tab-btn-ai'), pane: document.getElementById('tool-subtab-ai') }
  ];

  tabs.forEach(t => {
    if (!t.btn || !t.pane) return;
    if (t.id === tabName) {
      t.btn.className = 'tab-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all bg-indigo-600 text-white shadow-md shadow-indigo-600/30';
      t.pane.classList.remove('hidden');
    } else {
      t.btn.className = 'tab-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all text-slate-400 hover:text-white';
      t.pane.classList.add('hidden');
    }
  });

  if (tabName === 'editor') {
    const editor = document.getElementById('editor-textarea');
    if (editor && !editor.value.trim()) {
      getSampleMarkdown().then(sample => {
        if (!editor.value.trim()) {
          editor.value = sample;
          updateWordCount();
          updateEditorPreview();
        }
      });
    } else {
      updateEditorPreview();
    }
  }
};

// --- Common Sample Fetch ---
async function getSampleMarkdown() {
  if (cachedSampleMarkdown) return cachedSampleMarkdown;
  try {
    const res = await fetch('/api/sample');
    if (res.ok) {
      cachedSampleMarkdown = await res.text();
      return cachedSampleMarkdown;
    }
  } catch (e) {
    console.warn('Fallback sample');
  }
  return '# Documento Tecnico\n\nEste es un documento Markdown de prueba con formulas como $$E=mc^2$$.';
}

// --- Zoom & Theme Sync ---
window.syncTheme = function(themeName) {
  const configSelect = document.getElementById('config-theme');
  if (configSelect) configSelect.value = themeName;
  updateEditorPreview();
};

window.changeZoom = function(delta) {
  currentZoom = Math.max(0.5, Math.min(1.8, Math.round((currentZoom + delta) * 10) / 10));
  const label = document.getElementById('preview-zoom-label');
  if (label) label.textContent = Math.round(currentZoom * 100) + '%';
  applyZoomToFrame('editor-preview-frame', currentZoom);
};

window.changeModalZoom = function(delta) {
  currentModalZoom = Math.max(0.5, Math.min(1.8, Math.round((currentModalZoom + delta) * 10) / 10));
  const label = document.getElementById('modal-zoom-label');
  if (label) label.textContent = Math.round(currentModalZoom * 100) + '%';
  applyZoomToFrame('modal-preview-frame', currentModalZoom);
};

function applyZoomToFrame(frameId, zoomLevel) {
  const frame = document.getElementById(frameId);
  if (!frame || !frame.contentDocument) return;
  try {
    const body = frame.contentDocument.body;
    if (body) body.style.zoom = zoomLevel;
  } catch (e) {
    console.warn('Zoom error', e);
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ==========================================
// TOOL 1: MARKDOWN A PDF LOGIC
// ==========================================
async function generateClientPdf(markdownText, filename, options = {}) {
  let html = '';
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: markdownText, theme: options.theme || 'github', title: filename })
    });
    if (res.ok) html = await res.text();
  } catch (e) {
    console.warn('API preview error', e);
  }

  if (!html) throw new Error('No se pudo renderizar el contenido.');

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = options.landscape ? '1120px' : '820px';
  tempDiv.style.backgroundColor = options.theme === 'dark' ? '#0f172a' : '#ffffff';
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  const elementToRender = tempDiv.querySelector('.markdown-body') || tempDiv;
  const format = (options.format || 'a4').toLowerCase();
  const orientation = options.landscape ? 'landscape' : 'portrait';
  let marginVal = 14;
  if (options.margin === 'compact') marginVal = 8;
  if (options.margin === 'wide') marginVal = 20;
  if (options.margin === 'none') marginVal = 0;

  const opt = {
    margin: [marginVal, marginVal, marginVal, marginVal],
    filename: filename.endsWith('.pdf') ? filename : filename + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: format, orientation: orientation },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    if (options.returnBlob) {
      return await html2pdf().set(opt).from(elementToRender).output('blob');
    } else {
      await html2pdf().set(opt).from(elementToRender).save();
    }
  } finally {
    document.body.removeChild(tempDiv);
  }
}

window.triggerFileSelect = function() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.click();
};

async function handleFilesAdded(files) {
  if (!files || files.length === 0) return;
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) continue;
    const text = await readFileAsText(file);
    fileQueue.push({
      id: 'file_' + Math.random().toString(36).substring(2, 9),
      file, name: file.name, size: file.size, text, status: 'ready'
    });
  }
  renderFileList();
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function renderFileList() {
  const container = document.getElementById('file-list-container');
  const badge = document.getElementById('file-count-badge');
  const list = document.getElementById('file-list');
  if (!container || !badge || !list) return;

  if (fileQueue.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  badge.textContent = fileQueue.length + (fileQueue.length > 1 ? ' archivos' : ' archivo');
  list.innerHTML = '';

  fileQueue.forEach(item => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition';
    let statusBadge = item.status === 'ready' ? '<span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Listo</span>' :
                      item.status === 'converting' ? '<span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Convirtiendo...</span>' :
                      item.status === 'done' ? '<span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"><i class="fa-solid fa-check mr-1"></i>Completado</span>' :
                      '<span class="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Error</span>';

    row.innerHTML = `
      <div class="flex items-center space-x-3.5 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          <i class="fa-brands fa-markdown text-base"></i>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white truncate">${escapeHtml(item.name)}</p>
          <div class="flex items-center space-x-2 text-xs text-slate-400">
            <span>${formatBytes(item.size)}</span><span>&bull;</span>${statusBadge}
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
        <button onclick="previewFile('${item.id}')" title="Vista Previa" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"><i class="fa-regular fa-eye"></i></button>
        <button onclick="convertSingleFile('${item.id}')" title="Descargar PDF" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"><i class="fa-solid fa-file-arrow-down"></i><span>PDF</span></button>
        <button onclick="removeFile('${item.id}')" title="Eliminar" class="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;
    list.appendChild(row);
  });
}

window.loadSampleDoc = async function() {
  const sample = await getSampleMarkdown();
  const blob = new Blob([sample], { type: 'text/markdown' });
  const sampleFile = new File([blob], 'ejemplo_tecnico.md', { type: 'text/markdown' });
  handleFilesAdded([sampleFile]);
};

window.clearAllFiles = function() { fileQueue = []; renderFileList(); };
window.removeFile = function(id) { fileQueue = fileQueue.filter(f => f.id !== id); renderFileList(); };

window.previewFile = async function(id) {
  const item = fileQueue.find(f => f.id === id);
  if (!item) return;
  activePreviewFile = item;
  const modal = document.getElementById('preview-modal');
  const filenameEl = document.getElementById('modal-filename');
  const frame = document.getElementById('modal-preview-frame');
  const themeEl = document.getElementById('config-theme');

  if (filenameEl) filenameEl.textContent = item.name;
  if (modal) modal.classList.remove('hidden');

  const theme = themeEl ? themeEl.value : 'github';
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: item.text, theme, title: item.name })
    });
    const html = await res.text();
    if (frame) {
      frame.srcdoc = html;
      frame.onload = () => applyZoomToFrame('modal-preview-frame', currentModalZoom);
    }
  } catch (err) {
    if (frame) frame.srcdoc = '<p style="color:red;padding:20px;">Error: ' + err.message + '</p>';
  }
};

window.closeModal = function() {
  const modal = document.getElementById('preview-modal');
  if (modal) modal.classList.add('hidden');
  activePreviewFile = null;
};

window.downloadActiveModalFile = function() {
  if (activePreviewFile) convertSingleFile(activePreviewFile.id);
};

window.convertSingleFile = async function(id) {
  const item = fileQueue.find(f => f.id === id);
  if (!item) return;
  item.status = 'converting';
  renderFileList();

  const themeEl = document.getElementById('config-theme');
  const formatEl = document.getElementById('config-format');
  const marginEl = document.getElementById('config-margin');
  const landscapeEl = document.getElementById('config-landscape');

  try {
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    await generateClientPdf(item.text, baseName + '.pdf', {
      theme: themeEl ? themeEl.value : 'github',
      format: formatEl ? formatEl.value : 'a4',
      margin: marginEl ? marginEl.value : 'normal',
      landscape: landscapeEl ? landscapeEl.checked : false
    });
    item.status = 'done';
  } catch (err) {
    item.status = 'error';
    alert('Error al convertir: ' + err.message);
  } finally {
    renderFileList();
  }
};

window.handleBatchConvert = async function() {
  if (fileQueue.length === 0) return;
  const btn = document.getElementById('btn-convert-all');
  const btnText = document.getElementById('btn-convert-all-text');
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generando PDFs...';

  fileQueue.forEach(f => f.status = 'converting');
  renderFileList();

  const themeEl = document.getElementById('config-theme');
  const formatEl = document.getElementById('config-format');
  const marginEl = document.getElementById('config-margin');
  const landscapeEl = document.getElementById('config-landscape');

  try {
    if (fileQueue.length === 1) {
      const item = fileQueue[0];
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      await generateClientPdf(item.text, baseName + '.pdf', {
        theme: themeEl ? themeEl.value : 'github',
        format: formatEl ? formatEl.value : 'a4',
        margin: marginEl ? marginEl.value : 'normal',
        landscape: landscapeEl ? landscapeEl.checked : false
      });
      item.status = 'done';
    } else {
      const zip = new JSZip();
      for (const item of fileQueue) {
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        const pdfBlob = await generateClientPdf(item.text, baseName + '.pdf', {
          theme: themeEl ? themeEl.value : 'github',
          format: formatEl ? formatEl.value : 'a4',
          margin: marginEl ? marginEl.value : 'normal',
          landscape: landscapeEl ? landscapeEl.checked : false,
          returnBlob: true
        });
        zip.file(baseName + '.pdf', pdfBlob);
        item.status = 'done';
        renderFileList();
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'documentos_pdf.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    }
  } catch (err) {
    alert('Error durante la conversion: ' + err.message);
    fileQueue.forEach(f => f.status = 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>Convertir Todo a PDF</span>';
    renderFileList();
  }
};

window.loadEditorSample = async function() {
  const textarea = document.getElementById('editor-textarea');
  if (textarea) {
    textarea.value = await getSampleMarkdown();
    updateWordCount();
    updateEditorPreview();
  }
};

window.clearEditor = function() {
  const textarea = document.getElementById('editor-textarea');
  if (textarea) {
    textarea.value = '';
    updateWordCount();
    updateEditorPreview();
  }
};

window.convertFromEditor = async function() {
  const textarea = document.getElementById('editor-textarea');
  const btn = document.getElementById('btn-editor-convert');
  const btnText = document.getElementById('btn-editor-convert-text');
  const themeEl = document.getElementById('config-theme');
  const formatEl = document.getElementById('config-format');
  const marginEl = document.getElementById('config-margin');
  const landscapeEl = document.getElementById('config-landscape');

  const markdown = textarea ? textarea.value.trim() : '';
  if (!markdown) {
    alert('Por favor escribe o pega contenido Markdown.');
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando...';

  try {
    await generateClientPdf(markdown, 'Documento_Editor.pdf', {
      theme: themeEl ? themeEl.value : 'github',
      format: formatEl ? formatEl.value : 'a4',
      margin: marginEl ? marginEl.value : 'normal',
      landscape: landscapeEl ? landscapeEl.checked : false
    });
  } catch (err) {
    alert('Error al generar PDF: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerHTML = '<i class="fa-solid fa-file-pdf mr-1.5"></i><span>Generar y Descargar PDF</span>';
  }
};

function updateWordCount() {
  const textarea = document.getElementById('editor-textarea');
  const countEl = document.getElementById('editor-word-count');
  if (!textarea || !countEl) return;
  const text = textarea.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  countEl.textContent = words + ' palabras';
}

async function updateEditorPreview() {
  const textarea = document.getElementById('editor-textarea');
  const frame = document.getElementById('editor-preview-frame');
  const themeEl = document.getElementById('config-theme');
  if (!textarea || !frame) return;

  const markdown = textarea.value.trim();
  if (!markdown) {
    frame.srcdoc = '<p style="font-family:sans-serif;color:#94a3b8;padding:24px;text-align:center;">Escribe Markdown a la izquierda para ver la vista previa aquí.</p>';
    return;
  }

  const theme = themeEl ? themeEl.value : 'github';
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown, theme, title: 'Vista Previa' })
    });
    const html = await res.text();
    frame.srcdoc = html;
    frame.onload = () => applyZoomToFrame('editor-preview-frame', currentZoom);
  } catch (err) {
    console.error('Error vista previa:', err);
  }
}

// ==========================================
// TOOL 2: WORD (.docx) A PDF LOGIC (HD OPENXML)
// ==========================================
function setupWordListener() {
  const input = document.getElementById('word-file-input');
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    wordCurrentFile = file;

    const nameEl = document.getElementById('word-doc-name');
    const container = document.getElementById('word-result-container');
    const preview = document.getElementById('word-html-preview');

    if (nameEl) nameEl.textContent = file.name;
    if (preview) {
      preview.innerHTML = '<div class="p-8 text-center text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-blue-500"></i><p>Procesando estructura y diseno de Word...</p></div>';
    }
    if (container) container.classList.remove('hidden');

    try {
      wordArrayBuffer = await file.arrayBuffer();
      if (preview) preview.innerHTML = '';
      
      await window.docx.renderAsync(wordArrayBuffer, preview, null, {
        className: 'docx',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        experimental: true,
        trimXmlDeclaration: true,
        useBase64URL: true
      });
    } catch (err) {
      alert('Error al leer el archivo Word: ' + err.message);
      if (preview) preview.innerHTML = '<p class="text-red-500 p-4">Error: ' + err.message + '</p>';
    }
  });
}

window.downloadWordAsPdf = async function() {
  if (!wordCurrentFile) return;
  const preview = document.getElementById('word-html-preview');
  const btn = document.getElementById('btn-word-download-pdf');
  if (!preview) return;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando PDF...';
  }

  const baseName = wordCurrentFile.name.replace(/\.[^/.]+$/, '');
  const opt = {
    margin: [10, 10, 10, 10],
    filename: baseName + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    const targetEl = preview.querySelector('.docx-wrapper') || preview;
    await html2pdf().set(opt).from(targetEl).save();
  } catch (e) {
    alert('Error al exportar Word a PDF: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-arrow-down mr-1.5"></i><span>Descargar PDF</span>';
    }
  }
};

window.printWordDirectly = function() {
  const preview = document.getElementById('word-html-preview');
  if (!preview || !wordCurrentFile) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHtml(wordCurrentFile.name)}</title>
      ${styleSheets}
      <style>
        @page { size: auto; margin: 15mm; }
        body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
        .docx-wrapper { background: transparent !important; padding: 0 !important; }
        .docx { box-shadow: none !important; margin: 0 auto !important; width: 100% !important; }
      </style>
    </head>
    <body>
      ${preview.innerHTML}
      <script>
        setTimeout(() => { window.focus(); window.print(); window.close(); }, 500);
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

// ==========================================
// TOOL 3: IMAGENES A PDF (DIRECTO / SIN OCR)
// ==========================================
function setupImagesListener() {
  const input = document.getElementById('images-file-input');
  if (!input) return;

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      imagesQueue.push({ id: 'img_' + Math.random().toString(36).substring(2, 9), file, url, rotation: 0 });
    });
    renderImagesGrid();
    input.value = '';
  });
}

function renderImagesGrid() {
  const container = document.getElementById('images-list-container');
  const countLabel = document.getElementById('images-count-label');
  const grid = document.getElementById('images-grid');

  if (!container || !grid) return;
  if (imagesQueue.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  if (countLabel) countLabel.textContent = imagesQueue.length + (imagesQueue.length > 1 ? ' imágenes cargadas' : ' imagen cargada');
  grid.innerHTML = '';

  imagesQueue.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-2 shadow-lg';
    card.innerHTML = `
      <img src="${item.url}" class="max-w-full max-h-full object-contain rounded-lg">
      <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px]">${index + 1}</span>
      <button onclick="removeImage('${item.id}')" class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/90 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    `;
    grid.appendChild(card);
  });
}

window.removeImage = function(id) {
  imagesQueue = imagesQueue.filter(img => img.id !== id);
  renderImagesGrid();
};

window.clearImagesQueue = function() {
  imagesQueue = [];
  renderImagesGrid();
};

window.convertImagesToPdf = async function() {
  if (imagesQueue.length === 0) return;
  const btn = document.getElementById('btn-convert-images');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando PDF...';
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const maxW = pageWidth - (margin * 2);
    const maxH = pageHeight - (margin * 2);

    for (let i = 0; i < imagesQueue.length; i++) {
      if (i > 0) pdf.addPage();
      const item = imagesQueue[i];

      const img = new Image();
      img.src = item.url;
      await new Promise(r => { img.onload = r; });

      let w = img.width;
      let h = img.height;
      const ratio = w / h;

      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }

      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;

      pdf.addImage(img, 'JPEG', x, y, drawW, drawH);
    }

    pdf.save('imagenes_combinadas.pdf');
  } catch (err) {
    alert('Error al crear PDF de imágenes: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-pdf mr-1.5"></i><span>Combinar y Descargar PDF</span>';
    }
  }
};
// ==========================================
// TOOL 4: ESCANER CAMSCANNER & OCR LOGIC
// ==========================================
function setupScannerListener() {
  const input = document.getElementById('scanner-file-input');
  if (!input) return;

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      scannerQueue.push({ id: 'scan_' + Math.random().toString(36).substring(2, 9), file, url, rotation: 0 });
    });
    renderScannerGrid();
    input.value = '';
  });
}

function renderScannerGrid() {
  const contentArea = document.getElementById('scanner-content-area');
  const countLabel = document.getElementById('scanner-count-label');
  const grid = document.getElementById('scanner-grid');
  const filter = (document.getElementById('scanner-filter-select') || {}).value || 'magic';

  if (!contentArea || !grid) return;
  if (scannerQueue.length === 0) {
    contentArea.classList.add('hidden');
    return;
  }

  contentArea.classList.remove('hidden');
  if (countLabel) countLabel.textContent = scannerQueue.length + (scannerQueue.length > 1 ? ' páginas cargadas' : ' página cargada');
  grid.innerHTML = '';

  scannerQueue.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'relative group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-2 shadow-lg';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'max-w-full max-h-full object-contain rounded-lg';
    card.appendChild(canvas);

    drawFilteredImage(item, canvas, filter);

    const badge = document.createElement('span');
    badge.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-emerald-400 font-mono text-[10px]';
    badge.textContent = `Pág. ${index + 1}`;
    card.appendChild(badge);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition';
    btnGroup.innerHTML = `
      <button onclick="rotateScannerImage('${item.id}')" title="Rotar 90°" class="w-6 h-6 rounded-md bg-slate-800/90 text-slate-200 flex items-center justify-center text-[10px] hover:bg-slate-700 shadow-md">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
      <button onclick="removeScannerImage('${item.id}')" title="Eliminar" class="w-6 h-6 rounded-md bg-red-600/90 text-white flex items-center justify-center text-[10px] hover:bg-red-500 shadow-md">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    `;
    card.appendChild(btnGroup);

    grid.appendChild(card);
  });
}

function drawFilteredImage(item, canvas, filter) {
  const img = new Image();
  img.src = item.url;
  img.onload = () => {
    const rads = (item.rotation || 0) * Math.PI / 180;
    const isRotated = (item.rotation % 180 !== 0);
    const w = isRotated ? img.height : img.width;
    const h = isRotated ? img.width : img.height;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rads);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    if (filter === 'magic') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i+1], b = d[i+2];
        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness > 165) {
          d[i] = Math.min(255, r * 1.25 + 30);
          d[i+1] = Math.min(255, g * 1.25 + 30);
          d[i+2] = Math.min(255, b * 1.25 + 30);
        } else {
          d[i] = Math.max(0, r * 0.8 - 15);
          d[i+1] = Math.max(0, g * 0.8 - 15);
          d[i+2] = Math.max(0, b * 0.8 - 15);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filter === 'bw') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        let gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        let val = gray > 140 ? 255 : 0;
        d[i] = val; d[i+1] = val; d[i+2] = val;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filter === 'gray') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        let gray = Math.min(255, (0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]) * 1.15);
        d[i] = gray; d[i+1] = gray; d[i+2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }
  };
}

window.applyFilterToScannerImages = function() {
  renderScannerGrid();
};

window.rotateScannerImage = function(id) {
  const item = scannerQueue.find(i => i.id === id);
  if (item) {
    item.rotation = ((item.rotation || 0) + 90) % 360;
    renderScannerGrid();
  }
};

window.removeScannerImage = function(id) {
  scannerQueue = scannerQueue.filter(i => i.id !== id);
  renderScannerGrid();
};

window.clearScannerQueue = function() {
  scannerQueue = [];
  const ocrTextarea = document.getElementById('scanner-ocr-textarea');
  if (ocrTextarea) ocrTextarea.value = '';
  renderScannerGrid();
};

window.runOcrOnScannerImages = async function() {
  if (scannerQueue.length === 0) return alert('Por favor sube al menos una imagen para escanear.');

  const lang = (document.getElementById('ocr-lang-select') || {}).value || 'spa';
  const progressContainer = document.getElementById('ocr-progress-container');
  const progressBar = document.getElementById('ocr-progress-bar');
  const progressText = document.getElementById('ocr-progress-text');
  const progressPercent = document.getElementById('ocr-progress-percent');
  const ocrTextarea = document.getElementById('scanner-ocr-textarea');
  const btn = document.getElementById('btn-run-ocr');

  if (progressContainer) progressContainer.classList.remove('hidden');
  if (btn) btn.disabled = true;
  if (ocrTextarea) ocrTextarea.value = '';

  let fullExtractedText = '';
  const total = scannerQueue.length;

  try {
    for (let i = 0; i < total; i++) {
      const item = scannerQueue[i];
      if (progressText) progressText.textContent = `Analizando página ${i + 1} de ${total}...`;

      const offscreenCanvas = document.createElement('canvas');
      const filter = (document.getElementById('scanner-filter-select') || {}).value || 'magic';
      await new Promise(res => {
        drawFilteredImage(item, offscreenCanvas, filter);
        setTimeout(res, 200);
      });

      const workerRes = await Tesseract.recognize(offscreenCanvas, lang, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pagePct = (m.progress || 0);
            const totalPct = Math.round(((i + pagePct) / total) * 100);
            if (progressBar) progressBar.style.width = totalPct + '%';
            if (progressPercent) progressPercent.textContent = totalPct + '%';
          }
        }
      });

      const pageText = workerRes.data.text.trim();
      fullExtractedText += `=== PÁGINA ${i + 1} ===\n\n` + pageText + '\n\n';
      if (ocrTextarea) ocrTextarea.value = fullExtractedText;
    }

    if (progressText) progressText.textContent = '¡Escaneo OCR completado con éxito!';
    if (progressBar) progressBar.style.width = '100%';
    if (progressPercent) progressPercent.textContent = '100%';
  } catch (err) {
    alert('Error durante el OCR: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.copyScannerOcrText = function() {
  const textarea = document.getElementById('scanner-ocr-textarea');
  if (textarea && textarea.value.trim()) {
    navigator.clipboard.writeText(textarea.value);
    alert('¡Texto OCR copiado al portapapeles!');
  } else {
    alert('Primero ejecuta el escaneo OCR.');
  }
};

window.downloadScannerOcrText = function() {
  const textarea = document.getElementById('scanner-ocr-textarea');
  if (!textarea || !textarea.value.trim()) return alert('No hay texto OCR para descargar.');

  const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'texto_escaneado_ocr.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

window.downloadScannedPdf = async function() {
  if (scannerQueue.length === 0) return alert('Por favor sube al menos una imagen.');
  const btn = document.getElementById('btn-download-scanned-pdf');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando PDF...';
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const maxW = pageWidth - (margin * 2);
    const maxH = pageHeight - (margin * 2);

    const filter = (document.getElementById('scanner-filter-select') || {}).value || 'magic';

    for (let i = 0; i < scannerQueue.length; i++) {
      if (i > 0) pdf.addPage();
      const item = scannerQueue[i];

      const canvas = document.createElement('canvas');
      await new Promise(res => {
        drawFilteredImage(item, canvas, filter);
        setTimeout(res, 200);
      });

      let w = canvas.width;
      let h = canvas.height;
      const ratio = w / h;

      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }

      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
    }

    pdf.save('documento_escaneado_camscanner.pdf');
  } catch (err) {
    alert('Error al exportar PDF: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-pdf mr-1.5"></i><span>Descargar PDF Escaneado</span>';
    }
  }
};

// ==========================================
// TOOL 5: PDF A MARKDOWN (HIGH-ACCURACY GEOMETRIC + OCR FALLBACK)
// ==========================================
function setupPdf2MdListener() {
  const input = document.getElementById('pdf2md-file-input');
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pdf2mdCurrentFile = file;

    const nameEl = document.getElementById('pdf2md-doc-name');
    const container = document.getElementById('pdf2md-result-container');
    const textarea = document.getElementById('pdf2md-textarea');
    const statusLabel = document.getElementById('pdf2md-status-label');
    const ocrFallback = document.getElementById('pdf2md-ocr-fallback');
    const ocrLang = (document.getElementById('pdf2md-lang') || {}).value || 'spa';

    if (nameEl) nameEl.textContent = file.name.replace(/\.pdf$/i, '.md');
    if (statusLabel) {
      statusLabel.classList.remove('hidden');
      statusLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Analizando documento...';
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullMarkdown = '# ' + file.name.replace(/\.pdf$/i, '') + '\n\n';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (statusLabel) {
          statusLabel.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i>Procesando página ${pageNum} de ${pdf.numPages}...`;
        }

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items || [];

        // Check if page has native text or is scanned
        const totalChars = items.reduce((sum, it) => sum + (it.str || '').trim().length, 0);

        let pageMarkdown = '';

        if (totalChars < 20 && ocrFallback && ocrFallback.checked) {
          // Scanned page: Render to Canvas and run Tesseract OCR
          if (statusLabel) {
            statusLabel.innerHTML = `<i class="fa-solid fa-bolt mr-1 text-amber-400"></i>Ejecutando OCR en página ${pageNum}...`;
          }
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          const ocrRes = await Tesseract.recognize(canvas, ocrLang);
          pageMarkdown = ocrRes.data.text.trim();
        } else {
          // Native text page: Group lines geometrically to prevent dropping lines or mixing columns
          const linesMap = [];

          items.forEach(item => {
            if (!item.str || item.str.trim() === '') return;
            const x = item.transform[4];
            const y = item.transform[5];
            const height = Math.hypot(item.transform[2], item.transform[3]) || item.height || 10;

            let line = linesMap.find(l => Math.abs(l.y - y) <= 4);
            if (!line) {
              line = { y, maxHeight: height, items: [] };
              linesMap.push(line);
            } else {
              line.maxHeight = Math.max(line.maxHeight, height);
            }
            line.items.push({ x, str: item.str, height });
          });

          // Sort lines from Top to Bottom
          linesMap.sort((a, b) => b.y - a.y);

          let prevLineY = null;
          let prevMaxHeight = 10;

          linesMap.forEach(line => {
            // Sort items in this line from Left to Right
            line.items.sort((a, b) => a.x - b.x);

            let lineText = '';
            line.items.forEach((it, idx) => {
              if (idx > 0) {
                const prevIt = line.items[idx - 1];
                const charWidthApprox = 4.5;
                const distance = it.x - (prevIt.x + (prevIt.str.length * charWidthApprox));
                if (distance > 3) lineText += ' ';
              }
              lineText += it.str;
            });

            const trimmed = lineText.trim();
            if (!trimmed) return;

            const isH1 = line.maxHeight >= 16;
            const isH2 = line.maxHeight >= 13 && line.maxHeight < 16;

            if (prevLineY !== null && Math.abs(prevLineY - line.y) > 18) {
              pageMarkdown += '\n\n';
            } else if (prevLineY !== null) {
              pageMarkdown += '\n';
            }

            if (isH1) {
              pageMarkdown += '\n# ' + trimmed + '\n';
            } else if (isH2) {
              pageMarkdown += '\n## ' + trimmed + '\n';
            } else {
              pageMarkdown += trimmed;
            }

            prevLineY = line.y;
            prevMaxHeight = line.maxHeight;
          });
        }

        if (pdf.numPages > 1) {
          fullMarkdown += `## Página ${pageNum}\n\n` + pageMarkdown.trim() + '\n\n---\n\n';
        } else {
          fullMarkdown += pageMarkdown.trim() + '\n\n';
        }
      }

      if (textarea) textarea.value = fullMarkdown;
      if (container) container.classList.remove('hidden');
      if (statusLabel) {
        statusLabel.innerHTML = '<i class="fa-solid fa-check mr-1 text-emerald-400"></i>Completado';
      }
    } catch (err) {
      alert('Error al extraer texto del PDF: ' + err.message);
      if (statusLabel) statusLabel.classList.add('hidden');
    }
  });
}

window.copyPdf2MdText = function() {
  const textarea = document.getElementById('pdf2md-textarea');
  if (textarea && textarea.value.trim()) {
    navigator.clipboard.writeText(textarea.value);
    alert('¡Markdown copiado al portapapeles!');
  }
};

window.downloadPdf2MdFile = function() {
  const textarea = document.getElementById('pdf2md-textarea');
  if (!textarea || !textarea.value.trim()) return;

  const blob = new Blob([textarea.value], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (pdf2mdCurrentFile ? pdf2mdCurrentFile.name.replace(/\.pdf$/i, '') : 'documento') + '.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// ==========================================
// TOOL 6: HTML A PDF LOGIC
// ==========================================
function setupHtmlListener() {
  const textarea = document.getElementById('html-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateHtmlPreview();
    });
  }
}

function updateHtmlPreview() {
  const textarea = document.getElementById('html-textarea');
  const frame = document.getElementById('html-preview-frame');
  if (textarea && frame) {
    frame.srcdoc = textarea.value;
  }
}

window.loadSampleHtml = function() {
  const textarea = document.getElementById('html-textarea');
  if (!textarea) return;
  textarea.value = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
    h1 { color: #312e81; margin: 0; }
    .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; color: #475569; }
    .total { font-weight: bold; text-align: right; margin-top: 15px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">FACTURA / REPORTE</span>
    <h1>Reporte Ejecutivo 2026</h1>
    <p>Fecha: 01 de Septiembre, 2026 | ID: #EXP-88912</p>
  </div>
  <p>Resumen de actividades y metricas clave registradas en el periodo:</p>
  <table>
    <tr><th>Modulo</th><th>Estado</th><th>Usuarios</th><th>Efectividad</th></tr>
    <tr><td>Markdown a PDF</td><td>Activo</td><td>1,420</td><td>99.8%</td></tr>
    <tr><td>Word a PDF</td><td>Activo</td><td>850</td><td>99.4%</td></tr>
    <tr><td>Excel Suite</td><td>Activo</td><td>620</td><td>99.9%</td></tr>
  </table>
  <div class="total">Total Procesado: 2,890 documentos</div>
</body>
</html>`;
  updateHtmlPreview();
};

window.convertHtmlToPdf = async function() {
  const textarea = document.getElementById('html-textarea');
  const html = textarea ? textarea.value.trim() : '';
  if (!html) return alert('Por favor ingresa codigo HTML primero.');

  const btn = document.getElementById('btn-html-convert');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando PDF...';
  }

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '820px';
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'documento_html.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempDiv).save();
  } catch (e) {
    alert('Error al exportar HTML a PDF: ' + e.message);
  } finally {
    document.body.removeChild(tempDiv);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-pdf mr-1.5"></i><span>Descargar PDF</span>';
    }
  }
};

// ==========================================
// TOOL 7: JSON / CSV A EXCEL LOGIC
// ==========================================
function setupExcelListener() {
  const input = document.getElementById('excel-file-input');
  const textarea = document.getElementById('excel-textarea');

  if (input) {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      if (textarea) textarea.value = text;
      parseAndPreviewExcelData(text);
      input.value = '';
    });
  }

  if (textarea) {
    textarea.addEventListener('input', () => {
      parseAndPreviewExcelData(textarea.value);
    });
  }
}

function parseAndPreviewExcelData(rawText) {
  const text = rawText.trim();
  const table = document.getElementById('excel-preview-table');
  const badge = document.getElementById('excel-rows-badge');
  if (!table) return;

  if (!text) {
    table.innerHTML = '';
    if (badge) badge.textContent = '0 filas';
    excelCurrentData = null;
    return;
  }

  try {
    let rows = [];
    if (text.startsWith('[') || text.startsWith('{')) {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const rowObj = {};
          headers.forEach((h, idx) => { rowObj[h] = vals[idx] || ''; });
          rows.push(rowObj);
        }
      }
    }

    excelCurrentData = rows;
    if (badge) badge.textContent = rows.length + (rows.length > 1 ? ' filas' : ' fila');

    if (rows.length === 0) {
      table.innerHTML = '<p class="p-3 text-slate-500">Sin datos.</p>';
      return;
    }

    const headers = Object.keys(rows[0]);
    let html = '<thead><tr class="border-b border-slate-700 bg-slate-900">';
    headers.forEach(h => {
      html += `<th class="p-2 font-semibold text-teal-400 font-mono text-xs">${escapeHtml(h)}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.slice(0, 50).forEach(r => {
      html += '<tr class="border-b border-slate-800/60 hover:bg-slate-900/50">';
      headers.forEach(h => {
        html += `<td class="p-2 text-slate-300 font-mono text-xs">${escapeHtml(String(r[h] || ''))}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
  } catch (err) {
    table.innerHTML = '<p class="p-3 text-amber-400">Escribe o sube JSON o CSV valido para ver la tabla.</p>';
  }
}

window.loadSampleExcelData = function() {
  const textarea = document.getElementById('excel-textarea');
  if (!textarea) return;
  textarea.value = JSON.stringify([
    { "ID": 101, "Nombre": "Carlos Mendoza", "Departamento": "Tecnologia", "Salario": 4200, "Estado": "Activo" },
    { "ID": 102, "Nombre": "Laura Garcia", "Departamento": "Marketing", "Salario": 3800, "Estado": "Activo" },
    { "ID": 103, "Nombre": "Andres Rios", "Departamento": "Desarrollo", "Salario": 4900, "Estado": "Activo" },
    { "ID": 104, "Nombre": "Sofia Valenzuela", "Departamento": "Diseno", "Salario": 3950, "Estado": "Activo" }
  ], null, 2);
  parseAndPreviewExcelData(textarea.value);
};

window.exportToExcel = function() {
  if (!excelCurrentData || excelCurrentData.length === 0) {
    return alert('Por favor ingresa o sube datos JSON/CSV primero.');
  }

  try {
    const ws = XLSX.utils.json_to_sheet(excelCurrentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, 'datos_exportados.xlsx');
  } catch (err) {
    alert('Error al generar Excel: ' + err.message);
  }
};

// --- Setup Drag and Drop Listeners ---
function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFilesAdded(files);
      fileInput.value = '';
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.add('border-indigo-500', 'bg-indigo-950/30');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.remove('border-indigo-500', 'bg-indigo-950/30');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown'));
      handleFilesAdded(files);
    });
  }

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
}

function setupEditorListeners() {
  const textarea = document.getElementById('editor-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateWordCount();
      clearTimeout(editorDebounceTimeout);
      editorDebounceTimeout = setTimeout(updateEditorPreview, 350);
    });
  }
}

function initApp() {
  setupDragAndDrop();
  setupEditorListeners();
  setupWordListener();
  setupImagesListener();
  setupScannerListener();
  setupPdf2MdListener();
  setupHtmlListener();
  setupExcelListener();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}