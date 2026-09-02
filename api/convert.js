const { convertMarkdownToPdf } = require('../engine/converter');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      markdown = '',
      title = 'Documento',
      theme = 'github',
      format = 'A4',
      margin = 'normal',
      landscape = false,
      headerFooter = true
    } = req.body || {};

    if (!markdown) {
      return res.status(400).json({ error: 'Debes enviar el campo "markdown" en el cuerpo JSON.' });
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
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error en convert serverless:', err);
    res.status(500).json({ error: err.message });
  }
};