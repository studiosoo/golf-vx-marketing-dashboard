import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const key = process.env.CLICKFUNNELS_API_KEY;
const subdomain = process.env.CLICKFUNNELS_SUBDOMAIN;
const base = `https://${subdomain}.myclickfunnels.com/api/v2`;
const headers = { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' };

const wsId = 421845;

// Get all contacts with pagination to find giveaway applicants
console.log('Fetching all contacts...');
let allContacts = [];
let page = 1;
let hasMore = true;

while (hasMore && page <= 10) {
  try {
    const cRes = await axios.get(`${base}/workspaces/${wsId}/contacts`, { 
      headers,
      params: { per_page: 100, page }
    });
    const contacts = Array.isArray(cRes.data) ? cRes.data : [];
    allContacts = allContacts.concat(contacts);
    console.log(`Page ${page}: ${contacts.length} contacts`);
    hasMore = contacts.length === 100;
    page++;
  } catch (e) {
    console.log('Error on page', page, ':', e.response?.status, e.message);
    break;
  }
}

console.log(`\nTotal contacts: ${allContacts.length}`);

// Show contacts with tags (likely giveaway applicants)
const withTags = allContacts.filter(c => c.tags && c.tags.length > 0);
console.log(`Contacts with tags: ${withTags.length}`);
withTags.slice(0, 5).forEach(c => {
  console.log(`  ${c.email_address} | Tags: ${c.tags.map(t => t.name).join(', ')}`);
});

// Show all unique tags
const allTags = new Set();
allContacts.forEach(c => (c.tags || []).forEach(t => allTags.add(t.name)));
console.log('\nAll tags:', [...allTags]);

// Show contacts created after Jan 1 2026 (likely giveaway applicants)
const recentContacts = allContacts.filter(c => new Date(c.created_at) > new Date('2026-01-01'));
console.log(`\nContacts created after Jan 1 2026: ${recentContacts.length}`);
recentContacts.slice(0, 5).forEach(c => {
  console.log(`  ${c.first_name} ${c.last_name} | ${c.email_address} | Tags: ${(c.tags || []).map(t => t.name).join(', ')} | Created: ${c.created_at}`);
});

// Try to get funnel pages with visit counts
console.log('\n--- Funnel Pages ---');
try {
  const pRes = await axios.get(`${base}/workspaces/${wsId}/pages`, { headers, params: { per_page: 50 } });
  const pages = Array.isArray(pRes.data) ? pRes.data : [];
  console.log('Pages count:', pages.length);
  pages.slice(0, 5).forEach(p => {
    console.log(`  [${p.id}] ${p.name} | visits: ${p.visits_count} | unique: ${p.unique_visits_count}`);
  });
} catch (e) {
  console.log('Pages error:', e.response?.status, e.message);
}
