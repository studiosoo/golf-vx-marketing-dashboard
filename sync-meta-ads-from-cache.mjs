/**
 * Sync Meta Ads data from cache file into the campaigns database table
 * This links Meta Ads campaigns to programs and updates metaAdsSpend
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const CACHE_FILE = path.join(process.cwd(), '.meta-ads-cache', 'insights.json');

// Known mappings: Meta Ads campaign name → DB program name(s)
const CAMPAIGN_MAPPINGS = {
  'JUNIOR GOLF SUMMER CAMP 2026': ['PBGA Junior Summer Camp'],
  'Golf VX Annual Giveaway - A1 Local Awareness': ['Annual Giveaway', 'Golf VX Annual Giveaway'],
  'Golf VX Annual Giveaway - A2 Social/Family': ['Annual Giveaway', 'Golf VX Annual Giveaway'],
  'IG_$100 Giveaway_Feb2026': ['Annual Giveaway', 'Golf VX Annual Giveaway'],
  'Superbowl Watch Party_Feb2026': ['Superbowl Watch Party'],
};

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Read cache
  if (!fs.existsSync(CACHE_FILE)) {
    console.error('Cache file not found:', CACHE_FILE);
    process.exit(1);
  }

  const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  console.log(`Found ${cacheData.length} Meta Ads campaigns in cache`);

  // Connect to DB
  const connection = await mysql.createConnection(dbUrl);

  // Get all programs from DB
  const [programs] = await connection.execute('SELECT id, name, metaAdsCampaignId, metaAdsSpend FROM campaigns');
  console.log(`Found ${programs.length} programs in database`);

  for (const metaCampaign of cacheData) {
    const metaName = metaCampaign.campaign_name;
    const metaId = metaCampaign.campaign_id;
    const spend = metaCampaign.spend || '0';

    console.log(`\nProcessing: ${metaName} (ID: ${metaId}, Spend: $${spend})`);

    // Try exact mapping first
    let matchedPrograms = [];
    for (const [pattern, dbNames] of Object.entries(CAMPAIGN_MAPPINGS)) {
      if (metaName === pattern || metaName.toLowerCase().includes(pattern.toLowerCase())) {
        for (const dbName of dbNames) {
          const match = programs.find(p => 
            p.name.toLowerCase().includes(dbName.toLowerCase()) ||
            dbName.toLowerCase().includes(p.name.toLowerCase())
          );
          if (match && !matchedPrograms.find(m => m.id === match.id)) {
            matchedPrograms.push(match);
          }
        }
      }
    }

    // Fallback: fuzzy match by name
    if (matchedPrograms.length === 0) {
      const match = programs.find(p => {
        const pName = p.name.toLowerCase();
        const mName = metaName.toLowerCase();
        return pName.includes(mName) || mName.includes(pName) ||
          // Check for significant word overlap
          pName.split(/\s+/).some(word => word.length > 3 && mName.includes(word));
      });
      if (match) matchedPrograms.push(match);
    }

    if (matchedPrograms.length > 0) {
      // Split spend across matched programs if multiple
      const spendPerProgram = (parseFloat(spend) / matchedPrograms.length).toFixed(2);
      
      for (const program of matchedPrograms) {
        console.log(`  → Linking to program: ${program.name} (ID: ${program.id}), Spend: $${spendPerProgram}`);
        
        await connection.execute(
          'UPDATE campaigns SET metaAdsCampaignId = ?, metaAdsSpend = ?, actualSpend = ? WHERE id = ?',
          [metaId, spendPerProgram, spendPerProgram, program.id]
        );
      }
    } else {
      console.log(`  → No matching program found`);
    }
  }

  // Handle Giveaway campaigns: combine A1 + A2 + IG spend for Annual Giveaway
  const giveawaySpend = cacheData
    .filter(c => c.campaign_name.includes('Giveaway') || c.campaign_name.includes('IG_$100'))
    .reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0);
  
  const giveawayProgram = programs.find(p => p.name.includes('Annual Giveaway') || p.name.includes('Giveaway'));
  if (giveawayProgram) {
    console.log(`\nUpdating Annual Giveaway total Meta Ads spend: $${giveawaySpend.toFixed(2)}`);
    await connection.execute(
      'UPDATE campaigns SET metaAdsSpend = ?, actualSpend = ? WHERE id = ?',
      [giveawaySpend.toFixed(2), giveawaySpend.toFixed(2), giveawayProgram.id]
    );
  }

  await connection.end();
  console.log('\nSync complete!');
}

main().catch(console.error);
