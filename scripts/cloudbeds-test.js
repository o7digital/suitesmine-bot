// Simple Cloudbeds API key + rates/availability test script
// Usage:
//   CLOUDBEDS_API_KEY=... node scripts/cloudbeds-test.js
// Optional:
//   CLOUDBEDS_PROPERTY_ID=319424 CHECK_IN=2026-06-09 CHECK_OUT=2026-06-12 GUESTS=2

const API_BASE_URL = process.env.CLOUDBEDS_API_BASE || 'https://api.cloudbeds.com/api/v1.2';
const API_KEY = process.env.CLOUDBEDS_API_KEY;
const PROPERTY_ID = process.env.CLOUDBEDS_PROPERTY_ID || '319424';
const CHECK_IN = process.env.CHECK_IN || '2026-06-09';
const CHECK_OUT = process.env.CHECK_OUT || '2026-06-12';
const GUESTS = Number(process.env.GUESTS || '2');

if (!API_KEY) {
  console.error('Missing CLOUDBEDS_API_KEY env var');
  process.exit(1);
}

async function cloudbedsGet(path, params = {}) {
  const url = new URL(`${API_BASE_URL}/${path}`);
  url.searchParams.set('propertyID', PROPERTY_ID);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY }
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`${path} error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function getRatePlans() {
  return cloudbedsGet('getRatePlans', {
    startDate: CHECK_IN,
    endDate: CHECK_OUT,
    detailedRates: true
  });
}

(async () => {
  try {
    console.log(`Cloudbeds property ${PROPERTY_ID}`);
    console.log(`Checking ${CHECK_IN} -> ${CHECK_OUT} for ${GUESTS} guest(s)`);

    const rates = await getRatePlans();
    const roomTypes = Array.isArray(rates?.data) ? rates.data : rates?.data?.propertyRates?.[0]?.roomTypes || [];

    console.log(`Room types returned: ${roomTypes.length}`);
    roomTypes.forEach((room, index) => {
      const ratePlan = room.ratePlans?.[0];
      const total = room.totalRate ?? ratePlan?.totalRate ?? 'n/a';
      const nightly = room.roomRateDetailed?.[0]?.rate ?? ratePlan?.roomRates?.[0]?.rate ?? 'n/a';
      console.log(
        `#${index + 1} ${room.roomTypeName} | id=${room.roomTypeID} | available=${room.roomsAvailable} | nightly=${nightly} | total=${total}`
      );
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
