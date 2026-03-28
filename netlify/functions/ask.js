exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-password',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Netlify normaliseert headers naar lowercase
  const appPassword = event.headers['x-app-password'] || event.headers['X-App-Password'] || '';
  const expectedPassword = (process.env.APP_PASSWORD || '').trim();

  if (!expectedPassword) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'APP_PASSWORD niet ingesteld' }) };
  }

  if (appPassword.trim() !== expectedPassword) {
    return { 
      statusCode: 401, 
      headers, 
      body: JSON.stringify({ 
        error: 'Ongeldig wachtwoord',
        debug: `ontvangen: "${appPassword.trim()}", verwacht lengte: ${expectedPassword.length}`
      }) 
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY niet ingesteld' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ongeldige JSON' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-haiku-4-5-20251001',
        max_tokens: body.max_tokens || 800,
        messages: body.messages,
      })
    });

    const data = await response.json();
    return { statusCode: response.status, headers, body: JSON.stringify(data) };

  } catch(e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Anthropic API niet bereikbaar: ' + e.message }) };
  }
};
