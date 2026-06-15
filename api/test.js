module.exports = (req, res) => {
  res.json({
    ok: true,
    apiKey: process.env.ANTHROPIC_API_KEY ? '✅ définie' : '❌ MANQUANTE',
    node: process.version,
  });
};
