export async function onRequest(context) {
  const key = context.env.GOOGLE_PLACES_KEY;

  if (!key) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Step 1: Resolve Place ID by name
  const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
    + '?input=' + encodeURIComponent('Precision Balance and Just-In-Time Strategic Accounting')
    + '&inputtype=textquery'
    + '&fields=place_id'
    + '&key=' + key;

  const findRes  = await fetch(findUrl);
  const findData = await findRes.json();

  if (!findData.candidates || !findData.candidates.length) {
    return new Response(JSON.stringify({ error: 'Business not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const placeId = findData.candidates[0].place_id;

  // Step 2: Fetch place details + reviews
  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
    + '?place_id=' + placeId
    + '&fields=name,rating,user_ratings_total,reviews'
    + '&reviews_sort=newest'
    + '&key=' + key;

  const detailsRes  = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  return new Response(JSON.stringify(detailsData.result || {}), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // re-fetch at most once per hour
      'Access-Control-Allow-Origin': '*',
    },
  });
}
