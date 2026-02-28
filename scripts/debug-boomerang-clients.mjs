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
  console.log('RAW RESPONSE:', text.slice(0, 500));
  try { return JSON.parse(text); } catch { return text; }
}

// Try getClientList for Swing Savers (340717)
console.log('\n=== getClientList for Swing Savers (340717) ===');
const result = await api('getClientList', { idTemplate: 340717, page: 1 });
console.log('\nPARSED:', JSON.stringify(result, null, 2));

// Also try getClientsList (plural)
console.log('\n=== getClientsList (plural) for Swing Savers ===');
const result2 = await api('getClientsList', { idTemplate: 340717, page: 1 });
console.log('\nPARSED:', JSON.stringify(result2, null, 2));

// Try getAllMembers
console.log('\n=== getAllMembers ===');
const result3 = await api('getAllMembers', {});
console.log('\nPARSED:', JSON.stringify(result3, null, 2));
