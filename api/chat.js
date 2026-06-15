const https = require('https');

const MODELS = [
  'deepseek/deepseek-v4-flash',
];

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
Contacto: linkedin.com/in/nelly-orozco | nelly-orozco.vercel.app

CITAS / MEETINGS:
- Si el usuario muestra interés en conocerte, contratarte, hablar más o saber cuándo estás disponible, sugiere siempre reservar una cita usando uno de estos enlaces:
  · Llamada rápida 15 min (primer contacto): https://calendly.com/nellyorozcocontreras/llamada-rapida-quick-call
  · Entrevista 30 min (para profundizar): https://calendly.com/nellyorozcocontreras/entrevista-interview
- Pon el enlace al final de tu respuesta en este formato exacto (sin espacios extra):
  [BOOK|https://calendly.com/nellyorozcocontreras/llamada-rapida-quick-call|📅 Reservar llamada 15 min]
  o en inglés:
  [BOOK|https://calendly.com/nellyorozcocontreras/llamada-rapida-quick-call|📅 Book a 15-min call]
- Elige el enlace de 15 min para primer contacto y el de 30 min si ya hay interés concreto.
- No incluyas el marcador [BOOK|...|...] si la pregunta es puramente informativa.`;

function callModel(model, messages, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM },
        ...messages.slice(-10)
      ]
    });

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

    const req = https.request(options, (r) => {
      let data = '';
      r.on('data', chunk => { data += chunk; });
      r.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (r.statusCode !== 200) {
            reject(new Error(json.error?.message || `HTTP ${r.statusCode}`));
          } else {
            const reply = json.choices?.[0]?.message?.content;
            if (!reply) reject(new Error('Empty reply'));
            else resolve(reply);
          }
        } catch (e) {
          reject(new Error('Parse error'));
        }
      });
    });

    req.on('error', (e) => reject(new Error('Network error')));
    req.write(body);
    req.end();
  });
}

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
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  let lastError = '';
  for (const model of MODELS) {
    try {
      const reply = await callModel(model, messages, apiKey);
      return res.json({ reply });
    } catch (e) {
      lastError = e.message;
      // try next model
    }
  }

  return res.status(500).json({ error: 'All models failed', detail: lastError });
};
