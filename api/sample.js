const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const samplePath = path.join(process.cwd(), 'samples', 'ejemplo.md');
  if (fs.existsSync(samplePath)) {
    return res.send(fs.readFileSync(samplePath, 'utf8'));
  }
  res.send('# Reporte Tecnico\n\nEste es un documento Markdown de prueba.');
};