module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    service: 'md-to-pdf-api-cloud',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString()
  });
};