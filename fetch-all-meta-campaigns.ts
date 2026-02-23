import axios from 'axios';
import fs from 'fs';
import path from 'path';

const ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN;
const ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID;

if (!ACCESS_TOKEN || !ACCOUNT_ID) {
  console.error('Missing META_ADS_ACCESS_TOKEN or META_ADS_ACCOUNT_ID');
  process.exit(1);
}

const accountId = ACCOUNT_ID.startsWith('act_') ? ACCOUNT_ID : `act_${ACCOUNT_ID}`;

async function fetchAllCampaigns() {
  try {
    console.log(`Fetching campaigns for account: ${accountId}...`);
    
    // Fetch all campaigns with insights
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${accountId}/insights`,
      {
        params: {
          access_token: ACCESS_TOKEN,
          level: 'campaign',
          fields: 'campaign_id,campaign_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions,cost_per_action_type',
          date_preset: 'maximum',
          limit: 100,
        },
      }
    );

    const insights = response.data.data || [];
    console.log(`\nFound ${insights.length} campaigns with insights:`);
    
    insights.forEach((campaign: any, index: number) => {
      console.log(`\n${index + 1}. ${campaign.campaign_name}`);
      console.log(`   Campaign ID: ${campaign.campaign_id}`);
      console.log(`   Spend: $${campaign.spend}`);
      console.log(`   Impressions: ${campaign.impressions}`);
      console.log(`   Clicks: ${campaign.clicks}`);
    });

    // Save to cache file
    const cacheDir = path.join(process.cwd(), '.meta-ads-cache');
    const cacheFile = path.join(cacheDir, 'insights.json');
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cacheFile, JSON.stringify(insights, null, 2));
    console.log(`\n✅ Cache updated: ${cacheFile}`);
    console.log(`Total campaigns cached: ${insights.length}`);

  } catch (error: any) {
    console.error('Error fetching campaigns:', error.response?.data || error.message);
    process.exit(1);
  }
}

fetchAllCampaigns();
