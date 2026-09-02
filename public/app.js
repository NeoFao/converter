// Converter Suite - State Management
let currentTool = 'dashboard';
let currentSubTab = 'files';
let fileQueue = [];
let activePreviewFile = null;
let editorDebounceTimeout = null;
let cachedSampleMarkdown = '';
let currentZoom = 1.0;
let currentModalZoom = 1.0;

// State for other tools
let wordCurrentFile = null;
let wordCurrentHtml = '';
let imagesQueue = [];
let pdf2mdCurrentFile = null;
let excelCurrentData = null;

// --- Navigation Router ---
window.goToDashboard = function() {
  currentTool = 'dashboard';
  const tools = ['markdown', 'word', 'images', 'pdf2md', 'html', 'excel'];
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

  const tools = ['markdown', 'word', 'images', 'pdf2md', 'html', 'excel'];
  tools.forEach(t => {
    const el = document.getElementById('view-tool-' + t);
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
  return '# Documento Tecnico\\n\\nEste es un documento Markdown de prueba con formulas como $$E=mc^2$$.';
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

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
// TOOL 2: WORD (.docx) A PDF LOGIC
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

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      wordCurrentHtml = result.value;

      if (preview) preview.innerHTML = wordCurrentHtml;
      if (container) container.classList.remove('hidden');
    } catch (err) {
      alert('Error al leer el archivo Word: ' + err.message);
    }
  });
}

window.downloadWordAsPdf = async function() {
  if (!wordCurrentHtml || !wordCurrentFile) return;

  const btn = document.getElementById('btn-word-download-pdf');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Generando PDF...';
  }

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '820px';
  tempDiv.style.padding = '30px';
  tempDiv.style.fontFamily = 'Calibri, Arial, sans-serif';
  tempDiv.style.color = '#1e293b';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.innerHTML = wordCurrentHtml;
  document.body.appendChild(tempDiv);

  const baseName = wordCurrentFile.name.replace(/\.[^/.]+$/, '');
  const opt = {
    margin: [15, 15, 15, 15],
    filename: baseName + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(tempDiv).save();
  } catch (e) {
    alert('Error al exportar Word a PDF: ' + e.message);
  } finally {
    document.body.removeChild(tempDiv);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-arrow-down mr-1.5"></i><span>Descargar como PDF</span>';
    }
  }
};

// ==========================================
// TOOL 3: IMAGENES A PDF LOGIC
// ==========================================
function setupImagesListener() {
  const input = document.getElementById('images-file-input');
  if (!input) return;

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      imagesQueue.push({ id: 'img_' + Math.random().toString(36).substring(2, 9), file, url });
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
// TOOL 4: PDF A MARKDOWN LOGIC
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

    if (nameEl) nameEl.textContent = file.name.replace(/\.pdf$/i, '.md');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullMarkdown = '# ' + file.name.replace(/\.pdf$/i, '') + '\n\n';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        let lastY = null;
        let pageText = '';

        textContent.items.forEach(item => {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 10) {
            pageText += '\n';
          }
          pageText += item.str + ' ';
          lastY = item.transform[5];
        });

        if (pdf.numPages > 1) {
          fullMarkdown += '## Pagina ' + pageNum + '\n\n' + pageText.trim() + '\n\n---\n\n';
        } else {
          fullMarkdown += pageText.trim() + '\n\n';
        }
      }

      if (textarea) textarea.value = fullMarkdown;
      if (container) container.classList.remove('hidden');
    } catch (err) {
      alert('Error al leer PDF: ' + err.message);
    }
  });
}

window.copyPdf2MdText = function() {
  const textarea = document.getElementById('pdf2md-textarea');
  if (textarea) {
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
// TOOL 5: HTML A PDF LOGIC
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
// TOOL 6: JSON / CSV A EXCEL LOGIC
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
      // Parse CSV
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
  setupPdf2MdListener();
  setupHtmlListener();
  setupExcelListener();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}