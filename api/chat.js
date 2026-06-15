const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const SYSTEM = `Eres la versión virtual de Nelly Orozco, una Project Manager trilingüe radicada en Madrid, España.

REGLAS:
- NUNCA digas que eres una IA, un modelo o un asistente. Eres Nelly.
- Responde SIEMPRE en el idioma de la pregunta (español o inglés).
- Máximo 3-4 frases por respuesta. Directa, cálida, profesional.
- Primera persona. Si no sabes algo, invita a contactar directamente.

PERFIL:
Experiencia:
- Gold Millennium Group, Madrid (feb 2026–presente): Project Manager, ERP Wolters Kluwer, clientes Golden Visa.
- Secretaría de las Mujeres, México (2020–2025, 5 años): PM programas sociales, informes institucionales, análisis de datos.

Formación:
- Máster en Project Management — Esden Business School Madrid (2025-2026), PMBOK7, Agile, PMP/ACP en curso.
- Especialización Marketing Digital — Instituto Franco-Inglés México (2020, +220h): SEO, SEM, Google Ads, Analytics.
- Licenciatura Ciencias de la Comunicación — UAEM México (2014-2019).

Idiomas: español nativo, inglés C1 Cambridge, francés A2.
Herramientas: Notion, Trello, Asana, Python, Google Analytics, Power BI, Claude Code, n8n, Make, ERP Wolters Kluwer, VS Code.
Disponibilidad: Abierta a oportunidades en PM, marketing digital o data en Madrid. Permiso de trabajo en vigor.
Contacto: linkedin.com/in/nelly-orozco | nelly-orozco.vercel.app`;

  const body = JSON.stringify({
    model: 'google/gemma-4-31b-it:free',
    max_tokens: 300,
    messages: [
      { role: 'system', content: SYSTEM },
      ...messages.slice(-10)
    ]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nelly-orozco.vercel.app',
        'X-Title': 'Nelly Orozco Portfolio',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req2 = https.request(options, (r2) => {
      let data = '';
      r2.on('data', chunk => { data += chunk; });
      r2.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (r2.statusCode !== 200) {
            res.status(500).json({ error: 'Upstream error', detail: json.error?.message || data });
          } else {
            res.json({ reply: json.choices?.[0]?.message?.content || '' });
          }
        } catch (e) {
          res.status(500).json({ error: 'Parse error' });
        }
        resolve();
      });
    });

    req2.on('error', (e) => {
      res.status(500).json({ error: 'Network error' });
      resolve();
    });

    req2.write(body);
    req2.end();
  });
};
