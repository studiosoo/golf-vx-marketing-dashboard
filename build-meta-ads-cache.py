#!/usr/bin/env python3
"""
Build Meta Ads cache by merging campaigns and insights from MCP results.
Writes to /tmp/golf-vx-meta-ads-insights.json (same path as metaAdsCache.ts)
"""
import json
import os
import sys
from datetime import datetime

CAMPAIGNS_FILE = '/tmp/manus-mcp/mcp_result_3ffebdd9f6b045ef855830464d017453.json'
INSIGHTS_FILE = '/tmp/manus-mcp/mcp_result_5920e661eb8a465a87fd48cdd8037d5f.json'
CACHE_FILE = '/tmp/golf-vx-meta-ads-insights.json'

# Also write to .meta-ads-cache/insights.json in the project directory
PROJECT_CACHE_DIR = '/home/ubuntu/golf-vx-marketing-dashboard/.meta-ads-cache'
PROJECT_CACHE_FILE = os.path.join(PROJECT_CACHE_DIR, 'insights.json')

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

campaigns_data = load_json(CAMPAIGNS_FILE)
insights_data = load_json(INSIGHTS_FILE)

campaigns = campaigns_data.get('result', {}).get('campaigns', [])
insights = insights_data.get('result', {}).get('insights', [])

print(f'[Meta Ads Cache] Found {len(campaigns)} campaigns, {len(insights)} insight records')

# Build campaign metadata map by name
campaign_meta = {}
for c in campaigns:
    campaign_meta[c['name']] = c

# Merge insights with campaign metadata
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

# Write to /tmp cache
with open(CACHE_FILE, 'w') as f:
    json.dump(all_insights, f, indent=2)
print(f'[Meta Ads Cache] Written {len(all_insights)} campaigns to {CACHE_FILE}')

# Also write to project .meta-ads-cache directory
os.makedirs(PROJECT_CACHE_DIR, exist_ok=True)
with open(PROJECT_CACHE_FILE, 'w') as f:
    json.dump(all_insights, f, indent=2)
print(f'[Meta Ads Cache] Written {len(all_insights)} campaigns to {PROJECT_CACHE_FILE}')

# Summary
total_spend = sum(float(c.get('spend', '0')) for c in all_insights)
print(f'[Meta Ads Cache] Total spend across all campaigns: ${total_spend:.2f}')
print(f'[Meta Ads Cache] Cache refreshed at {datetime.utcnow().isoformat()}Z')

# Print per-campaign summary
print('\nCampaign Summary:')
for c in all_insights:
    print(f"  [{c['effective_status']}] {c['campaign_name']}")
    print(f"    Spend: ${float(c['spend']):.2f} | Impressions: {c['impressions']} | Clicks: {c['clicks']} | CTR: {float(c['ctr']):.2f}%")
