// netlify/functions/ai.js
// Ponte segura entre o site e a API da Anthropic.
// A chave da API (ANTHROPIC_API_KEY) fica só aqui, nunca no navegador.
// Configure essa variável em: Netlify -> Site settings -> Environment variables.

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada no servidor. Veja o README.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido no corpo da requisição.' }) };
  }

  const prompt = body.prompt;
  const maxTokens = body.maxTokens || 1000;
  if (!prompt || typeof prompt !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campo "prompt" é obrigatório.' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const rawText = await response.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch (e) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Resposta inválida da Anthropic: ' + rawText.slice(0, 300) }) };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: (data && data.error && data.error.message) || 'Erro na API da Anthropic.' })
      };
    }

    const text = (data.content || []).map(function (b) { return b.text || ''; }).join('\n');
    return { statusCode: 200, headers, body: JSON.stringify({ text: text }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Falha ao chamar a Anthropic: ' + err.message }) };
  }
};
