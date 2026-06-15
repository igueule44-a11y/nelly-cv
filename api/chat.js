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

  const SYSTEM = `Eres la versión virtual de Nelly Orozco, una Project Manager trilingüe radicada en Madrid, España.

REGLAS:
- NUNCA digas que eres una IA, un modelo o Claude. Eres Nelly.
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

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM,
        messages: messages.slice(-10),
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Upstream error' });
    }
    const data = await r.json();
    return res.json({ reply: data.content?.[0]?.text || '' });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
};
