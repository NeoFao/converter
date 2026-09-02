// State Management
let currentTool = 'dashboard';
let currentSubTab = 'files';
let fileQueue = [];
let activePreviewFile = null;
let editorDebounceTimeout = null;
let cachedSampleMarkdown = '';
let currentZoom = 1.0;
let currentModalZoom = 1.0;

// Fetch sample markdown
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
  return '# Documento de Prueba\n\nEste es un documento Markdown de prueba.';
}

// --- Navigation View Controllers ---
window.goToDashboard = function() {
  currentTool = 'dashboard';
  const viewDashboard = document.getElementById('view-dashboard');
  const viewMarkdown = document.getElementById('view-tool-markdown');
  const btnNavDashboard = document.getElementById('btn-nav-dashboard');
  const mdToolTabs = document.getElementById('md-tool-tabs');

  if (viewDashboard) viewDashboard.classList.remove('hidden');
  if (viewMarkdown) viewMarkdown.classList.add('hidden');
  if (btnNavDashboard) btnNavDashboard.classList.add('hidden');
  if (mdToolTabs) mdToolTabs.classList.add('hidden');
};

window.openTool = function(toolName) {
  if (toolName === 'markdown') {
    currentTool = 'markdown';
    const viewDashboard = document.getElementById('view-dashboard');
    const viewMarkdown = document.getElementById('view-tool-markdown');
    const btnNavDashboard = document.getElementById('btn-nav-dashboard');
    const mdToolTabs = document.getElementById('md-tool-tabs');

    if (viewDashboard) viewDashboard.classList.add('hidden');
    if (viewMarkdown) viewMarkdown.classList.remove('hidden');
    if (btnNavDashboard) btnNavDashboard.classList.remove('hidden');
    if (mdToolTabs) mdToolTabs.classList.remove('hidden');

    switchToolTab('files');
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

// --- Sync Theme Dropdowns ---
window.syncTheme = function(themeName) {
  const configSelect = document.getElementById('config-theme');
  const previewSelect = document.getElementById('preview-theme-select');
  if (configSelect) configSelect.value = themeName;
  if (previewSelect) previewSelect.value = themeName;
  updateEditorPreview();
};

// --- Zoom Controls ---
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
    if (body) {
      body.style.zoom = zoomLevel;
    }
  } catch (e) {
    console.warn('Zoom error', e);
  }
}

// --- Client-Side PDF Generation Engine ---
async function generateClientPdf(markdownText, filename, options = {}) {
  // 1. Fetch styled HTML from preview endpoint
  let html = '';
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown: markdownText,
        theme: options.theme || 'github',
        title: filename
      })
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch (e) {
    console.warn('API error', e);
  }

  if (!html) {
    throw new Error('No se pudo renderizar el contenido.');
  }

  // 2. Create offscreen container
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
      const blob = await html2pdf().set(opt).from(elementToRender).output('blob');
      return blob;
    } else {
      await html2pdf().set(opt).from(elementToRender).save();
    }
  } finally {
    document.body.removeChild(tempDiv);
  }
}

// --- File Trigger ---
window.triggerFileSelect = function() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.click();
  }
};

// --- Process Files Added ---
async function handleFilesAdded(files) {
  if (!files || files.length === 0) return;

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) {
      continue;
    }
    const text = await readFileAsText(file);
    fileQueue.push({
      id: 'file_' + Math.random().toString(36).substring(2, 9),
      file: file,
      name: file.name,
      size: file.size,
      text: text,
      status: 'ready'
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

// --- Render File List ---
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
  fileQueue.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition';

    let statusBadge = '';
    if (item.status === 'ready') {
      statusBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Listo</span>';
    } else if (item.status === 'converting') {
      statusBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Convirtiendo...</span>';
    } else if (item.status === 'done') {
      statusBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"><i class="fa-solid fa-check mr-1"></i>Completado</span>';
    } else if (item.status === 'error') {
      statusBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Error</span>';
    }

    row.innerHTML = `
      <div class="flex items-center space-x-3.5 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          <i class="fa-brands fa-markdown text-base"></i>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white truncate">${escapeHtml(item.name)}</p>
          <div class="flex items-center space-x-2 text-xs text-slate-400">
            <span>${formatBytes(item.size)}</span>
            <span>&bull;</span>
            ${statusBadge}
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
        <button onclick="previewFile('${item.id}')" title="Vista Previa" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition">
          <i class="fa-regular fa-eye"></i>
        </button>
        <button onclick="convertSingleFile('${item.id}')" title="Descargar PDF" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition">
          <i class="fa-solid fa-file-arrow-down"></i>
          <span>PDF</span>
        </button>
        <button onclick="removeFile('${item.id}')" title="Eliminar" class="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    list.appendChild(row);
  });
}

// --- Sample Doc Load ---
window.loadSampleDoc = async function() {
  const sample = await getSampleMarkdown();
  const blob = new Blob([sample], { type: 'text/markdown' });
  const sampleFile = new File([blob], 'ejemplo_tecnico.md', { type: 'text/markdown' });
  handleFilesAdded([sampleFile]);
};

// --- Clear All Files ---
window.clearAllFiles = function() {
  fileQueue = [];
  renderFileList();
};

// --- Remove Single File ---
window.removeFile = function(id) {
  fileQueue = fileQueue.filter(f => f.id !== id);
  renderFileList();
};

// --- Preview Modal ---
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
    if (frame) frame.srcdoc = '<p style="color:red;padding:20px;">Error en vista previa: ' + err.message + '</p>';
  }
};

window.closeModal = function() {
  const modal = document.getElementById('preview-modal');
  if (modal) modal.classList.add('hidden');
  activePreviewFile = null;
};

window.printActiveModalFrame = function() {
  const frame = document.getElementById('modal-preview-frame');
  if (frame && frame.contentWindow) {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }
};

window.downloadActiveModalFile = function() {
  if (activePreviewFile) {
    convertSingleFile(activePreviewFile.id);
  }
};

// --- Single File Convert ---
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
    console.error(err);
    item.status = 'error';
    alert('Error al convertir el archivo: ' + err.message);
  } finally {
    renderFileList();
  }
};

// --- Batch Convert ---
window.handleBatchConvert = async function() {
  if (fileQueue.length === 0) return;

  const btn = document.getElementById('btn-convert-all');
  const btnText = document.getElementById('btn-convert-all-text');

  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  }
  if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generando PDFs...';

  fileQueue.forEach(f => f.status = 'converting');
  renderFileList();

  const themeEl = document.getElementById('config-theme');
  const formatEl = document.getElementById('config-format');
  const marginEl = document.getElementById('config-margin');
  const landscapeEl = document.getElementById('config-landscape');
  const isZip = true;

  try {
    if (fileQueue.length === 1) {
      // Single file direct download
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
      // Multiple files -> Bundle in ZIP
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
    console.error(err);
    alert('Error durante la conversi?n: ' + err.message);
    fileQueue.forEach(f => f.status = 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
    if (btnText) btnText.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>Convertir Todo a PDF</span>';
    renderFileList();
  }
};

// --- Editor Functions ---
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
    alert('Por favor escribe o pega contenido Markdown primero.');
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
  const chars = text.length;
  countEl.textContent = words + ' palabras | ' + chars + ' caracteres';
}

async function updateEditorPreview() {
  const textarea = document.getElementById('editor-textarea');
  const frame = document.getElementById('editor-preview-frame');
  const themeEl = document.getElementById('config-theme');
  if (!textarea || !frame) return;

  const markdown = textarea.value.trim();
  if (!markdown) {
    frame.srcdoc = '<p style="font-family:sans-serif;color:#94a3b8;padding:24px;text-align:center;">Escribe Markdown a la izquierda para ver la vista previa en vivo aqu&iacute;.</p>';
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
    console.error('Error al actualizar vista previa:', err);
  }
}

// --- Health Check ---
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const badge = document.getElementById('server-status-text');
    if (badge && data.status === 'ok') {
      badge.textContent = 'Online';
    }
  } catch (err) {
    console.warn('Offline');
  }
}

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
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('border-indigo-500', 'bg-indigo-950/30');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
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

// --- Setup Editor Listeners ---
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

// --- Main Init ---
function initApp() {
  checkServerHealth();
  setupDragAndDrop();
  setupEditorListeners();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
