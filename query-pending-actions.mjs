import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  `SELECT id, actionType, title, description, expectedImpact, actionParams, campaignName, riskLevel, status, confidence 
   FROM autonomous_actions 
   WHERE status IN ('pending_approval', 'pending') 
   ORDER BY createdAt DESC LIMIT 20`
);

rows.forEach(r => {
  console.log('\n' + '='.repeat(60));
  console.log(`ID: ${r.id} | Type: ${r.actionType} | Risk: ${r.riskLevel} | Confidence: ${r.confidence}%`);
  console.log(`Campaign: ${r.campaignName}`);
  console.log(`Title: ${r.title}`);
  console.log(`Description: ${r.description}`);
  console.log(`Expected Impact: ${r.expectedImpact}`);
  console.log(`Action Params: ${JSON.stringify(r.actionParams, null, 2)}`);
});

console.log(`\nTotal pending: ${rows.length}`);
await conn.end();
