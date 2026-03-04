#!/usr/bin/env bash
# refresh-meta-ads-cache.sh
# Fetches latest Meta Ads insights data via MCP and updates the cache files:
#   - /tmp/golf-vx-meta-ads-insights.json  (runtime cache used by the server)
#   - .meta-ads-cache/insights.json        (project-level persistent cache)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_ID="act_823266657015117"
CAMPAIGNS_TMP=""
INSIGHTS_TMP=""

echo "[Meta Ads Cache Refresh] Starting MCP-based refresh at $(date -u '+%Y-%m-%dT%H:%M:%SZ')..."

# Step 1: Fetch campaigns
echo "[Meta Ads Cache Refresh] Fetching campaigns..."
CAMPAIGNS_OUT=$(manus-mcp-cli tool call meta_marketing_get_campaigns \
  --server meta-marketing \
  --input "{\"ad_account_id\": \"${ACCOUNT_ID}\", \"limit\": 50}" 2>&1)

CAMPAIGNS_TMP=$(echo "$CAMPAIGNS_OUT" | grep -oP '/tmp/manus-mcp/mcp_result_[a-f0-9]+\.json' | head -1)
if [ -z "$CAMPAIGNS_TMP" ]; then
  echo "[Meta Ads Cache Refresh] ERROR: Failed to get campaigns result file path"
  exit 1
fi
echo "[Meta Ads Cache Refresh] Campaigns result: $CAMPAIGNS_TMP"

# Step 2: Fetch insights at campaign level (maximum date range)
echo "[Meta Ads Cache Refresh] Fetching insights..."
INSIGHTS_OUT=$(manus-mcp-cli tool call meta_marketing_get_insights \
  --server meta-marketing \
  --input "{\"object_id\": \"${ACCOUNT_ID}\", \"object_type\": \"ad_account\", \"date_preset\": \"maximum\", \"level\": \"campaign\"}" 2>&1)

INSIGHTS_TMP=$(echo "$INSIGHTS_OUT" | grep -oP '/tmp/manus-mcp/mcp_result_[a-f0-9]+\.json' | head -1)
if [ -z "$INSIGHTS_TMP" ]; then
  echo "[Meta Ads Cache Refresh] ERROR: Failed to get insights result file path"
  exit 1
fi
echo "[Meta Ads Cache Refresh] Insights result: $INSIGHTS_TMP"

# Step 3: Merge and write cache using Python
python3.11 - <<PYEOF
import json, os, sys
from datetime import datetime

campaigns_data = json.load(open('$CAMPAIGNS_TMP'))
insights_data = json.load(open('$INSIGHTS_TMP'))

campaigns = campaigns_data.get('result', {}).get('campaigns', [])
insights = insights_data.get('result', {}).get('insights', [])

print(f'[Meta Ads Cache] Found {len(campaigns)} campaigns, {len(insights)} insight records')

campaign_meta = {c['name']: c for c in campaigns}

all_insights = []
for ins in insights:
    meta = campaign_meta.get(ins.get('campaign_name', ''), {})
    merged = {
        'campaign_id': meta.get('id', ins.get('campaign_id', '')),
        'campaign_name': ins.get('campaign_name', ''),
        'status': meta.get('status', meta.get('effective_status', 'ACTIVE')),
        'effective_status': meta.get('effective_status', meta.get('status', 'ACTIVE')),
        'objective': meta.get('objective', ''),
        'daily_budget': meta.get('daily_budget', None),
        'created_time': meta.get('created_time', ''),
        'updated_time': meta.get('updated_time', ''),
        'impressions': ins.get('impressions', '0'),
        'clicks': ins.get('clicks', '0'),
        'spend': ins.get('spend', '0'),
        'reach': ins.get('reach', '0'),
        'cpc': ins.get('cpc', '0'),
        'cpm': ins.get('cpm', '0'),
        'ctr': ins.get('ctr', '0'),
        'date_start': ins.get('date_start', ''),
        'date_stop': ins.get('date_stop', ''),
        'actions': ins.get('actions', []),
        'cost_per_action_type': ins.get('cost_per_action_type', []),
        'purchase_roas': ins.get('purchase_roas', []),
        'quality_ranking': ins.get('quality_ranking', ''),
        'engagement_rate_ranking': ins.get('engagement_rate_ranking', ''),
        'conversion_rate_ranking': ins.get('conversion_rate_ranking', ''),
        'frequency': ins.get('frequency', ''),
        'inline_link_clicks': ins.get('inline_link_clicks', '0'),
        'inline_link_click_ctr': ins.get('inline_link_click_ctr', '0'),
        'video_30_sec_watched_actions': ins.get('video_30_sec_watched_actions', []),
    }
    all_insights.append(merged)

# Write to /tmp runtime cache
with open('/tmp/golf-vx-meta-ads-insights.json', 'w') as f:
    json.dump(all_insights, f, indent=2)
print(f'[Meta Ads Cache] Written {len(all_insights)} campaigns to /tmp/golf-vx-meta-ads-insights.json')

# Write to project .meta-ads-cache directory
cache_dir = '${SCRIPT_DIR}/.meta-ads-cache'
os.makedirs(cache_dir, exist_ok=True)
project_cache = os.path.join(cache_dir, 'insights.json')
with open(project_cache, 'w') as f:
    json.dump(all_insights, f, indent=2)
print(f'[Meta Ads Cache] Written {len(all_insights)} campaigns to {project_cache}')

total_spend = sum(float(c.get('spend', '0')) for c in all_insights)
print(f'[Meta Ads Cache] Total spend: \${total_spend:.2f}')
print(f'[Meta Ads Cache] Refreshed at {datetime.utcnow().isoformat()}Z')
print()
print('Campaign Summary:')
for c in all_insights:
    print(f"  [{c['effective_status']}] {c['campaign_name']}")
    print(f"    Spend: \${float(c['spend']):.2f} | Impressions: {c['impressions']} | Clicks: {c['clicks']} | CTR: {float(c['ctr']):.2f}%")
PYEOF

echo "[Meta Ads Cache Refresh] Done."
