// Simple Cloudbeds OAuth + availability test script
// Usage:
//   CLOUDBEDS_CLIENT_ID=... CLOUDBEDS_CLIENT_SECRET=... node scripts/cloudbeds-test.js
// Optional:
//   CLOUDBEDS_PROPERTY_ID=319424 CLOUDBEDS_TOKEN_URL=... CLOUDBEDS_API_BASE=...

const TOKEN_URL = process.env.CLOUDBEDS_TOKEN_URL || 'https://hotels.cloudbeds.com/connect/token';
const API_BASE_URL = process.env.CLOUDBEDS_API_BASE || 'https://hotels.cloudbeds.com/api/v1.1';
const CLIENT_ID = process.env.CLOUDBEDS_CLIENT_ID;
const CLIENT_SECRET = process.env.CLOUDBEDS_CLIENT_SECRET;
const PROPERTY_ID = process.env.CLOUDBEDS_PROPERTY_ID || '319424';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing CLOUDBEDS_CLIENT_ID or CLOUDBEDS_CLIENT_SECRET env vars');
  process.exit(1);
}

async function getToken() {
  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', CLIENT_ID);
  body.set('client_secret', CLIENT_SECRET);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Token error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json.access_token || json.token || json.accessToken;
}

async function getAvailability(accessToken) {
  const startDate = '2026-03-15';
  const endDate = '2026-03-18';
  const adults = 2;

  const url = new URL(`${API_BASE_URL}/getAvailability`);
  url.searchParams.set('propertyID', PROPERTY_ID);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('adults', String(adults));
  url.searchParams.set('children', '0');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Availability error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

(async () => {
  try {
    console.log('Requesting access token...');
    const token = await getToken();
    console.log('Access token OK');

    console.log('Querying availability...');
    const avail = await getAvailability(token);
    // Print a concise summary
    const roomTypes = avail?.data?.roomTypes || [];
    console.log(`Room types returned: ${roomTypes.length}`);
    roomTypes.slice(0, 5).forEach((r, i) => {
      console.log(`#${i + 1} ${r.roomTypeName} | available=${r.available} | avgPrice=${r.averagePrice}`);
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
