const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function generateGeminiReply(text) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }]
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  try {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (e) {
    return '';
  }
}

module.exports = { generateGeminiReply };
