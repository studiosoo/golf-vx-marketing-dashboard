import 'dotenv/config';

const token = process.env.BOOMERANG_API_TOKEN;
const BASE = 'https://app.boomerangme.cards/api/v1';

async function api(method, body = {}) {
  const url = `${BASE}/${method}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': token,
      'x-access-token': token,
    },
    body: JSON.stringify({ token, ...body }),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

// 1. Get all templates
console.log('\n=== TEMPLATES ===');
const templates = await api('getTemplates');
console.log(JSON.stringify(templates, null, 2));
