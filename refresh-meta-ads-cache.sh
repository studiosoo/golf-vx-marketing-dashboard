#!/bin/bash
# Refresh Meta Ads cache by fetching data via MCP server
# This script is called by server/refreshMetaAdsCache.ts

set -e

ACCOUNT_ID="${META_ADS_ACCOUNT_ID:-823266657015117}"
CACHE_DIR=".meta-ads-cache"
CACHE_FILE="$CACHE_DIR/insights.json"

mkdir -p "$CACHE_DIR"

echo "[Meta Ads Refresh] Fetching campaign insights for account $ACCOUNT_ID..."

# Fetch campaign-level insights with all needed fields via MCP
RESULT=$(manus-mcp-cli tool call meta_marketing_get_insights \
  --server meta-marketing \
  --input "{\"object_type\": \"ad_account\", \"object_id\": \"act_${ACCOUNT_ID}\", \"date_preset\": \"last_30d\", \"fields\": [\"campaign_name\", \"campaign_id\", \"spend\", \"impressions\", \"clicks\", \"ctr\", \"cpc\", \"cpm\", \"reach\", \"frequency\", \"actions\", \"cost_per_action_type\"], \"level\": \"campaign\"}" 2>&1)

# Extract the JSON file path from the MCP output
JSON_FILE=$(echo "$RESULT" | grep -oP '/tmp/manus-mcp/mcp_result_[a-f0-9]+\.json' | head -1)

if [ -z "$JSON_FILE" ] || [ ! -f "$JSON_FILE" ]; then
  echo "[Meta Ads Refresh] ERROR: Failed to get MCP result file"
  echo "$RESULT"
  exit 1
fi

# Extract the insights data array from the MCP result and write to cache
python3 -c "
import json, sys

with open('$JSON_FILE', 'r') as f:
    result = json.load(f)

if not result.get('success'):
    print('[Meta Ads Refresh] ERROR: MCP call failed')
    sys.exit(1)

insights = result.get('result', {}).get('data', [])
if not insights:
    # Try alternate structure
    insights = result.get('result', {}).get('insights', [])

if not insights:
    print('[Meta Ads Refresh] WARNING: No insights data found in result')
    # Write empty array
    with open('$CACHE_FILE', 'w') as f:
        json.dump([], f, indent=2)
    sys.exit(0)

# Write the insights array directly to cache
with open('$CACHE_FILE', 'w') as f:
    json.dump(insights, f, indent=2)

print(f'[Meta Ads Refresh] Successfully cached {len(insights)} campaign insights')
"

# Also fetch campaign list for metadata
echo "[Meta Ads Refresh] Fetching campaign list..."
CAMPAIGNS_RESULT=$(manus-mcp-cli tool call meta_marketing_get_campaigns \
  --server meta-marketing \
  --input "{\"ad_account_id\": \"act_${ACCOUNT_ID}\", \"limit\": 50}" 2>&1)

CAMPAIGNS_FILE=$(echo "$CAMPAIGNS_RESULT" | grep -oP '/tmp/manus-mcp/mcp_result_[a-f0-9]+\.json' | head -1)

if [ -n "$CAMPAIGNS_FILE" ] && [ -f "$CAMPAIGNS_FILE" ]; then
  cp "$CAMPAIGNS_FILE" "$CACHE_DIR/campaigns.json"
  echo "[Meta Ads Refresh] Campaign list cached"
fi

echo "[Meta Ads Refresh] Cache refresh complete"
