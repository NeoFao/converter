const { getThemeList } = require('../engine/themes');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    themes: getThemeList(),
    formats: ['A4', 'Letter', 'Legal', 'A3', 'Tabloid'],
    margins: ['normal', 'compact', 'wide', 'none']
  });
};