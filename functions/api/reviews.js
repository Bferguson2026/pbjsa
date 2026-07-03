// Static fallback reviews — shown when the live Google Places API is unavailable
// (e.g. billing disabled). Populate `reviews` with REAL Google reviews only.
const FALLBACK = {
  rating: null,
  user_ratings_total: null,
  reviews: [
    // { author_name: "Full Name", rating: 5, text: "Review text...", relative_time_description: "a month ago", profile_photo_url: "" },
  ],
};

function fallbackResponse() {
  if (!FALLBACK.reviews.length) {
    return new Response(JSON.stringify({ error: 'Reviews unavailable' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  return new Response(JSON.stringify({ ...FALLBACK, source: 'fallback' }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequest(context) {
  const key = context.env.GOOGLE_PLACES_KEY;
  if (!key) return fallbackResponse();

  try {
    // Step 1: Resolve Place ID by name
    const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
      + '?input=' + encodeURIComponent('Precision Balance and Just-In-Time Strategic Accounting')
      + '&inputtype=textquery'
      + '&fields=place_id'
      + '&key=' + key;

    const findData = await (await fetch(findUrl)).json();
    if (!findData.candidates || !findData.candidates.length) return fallbackResponse();

    const placeId = findData.candidates[0].place_id;

    // Step 2: Fetch place details + reviews
    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
      + '?place_id=' + placeId
      + '&fields=name,rating,user_ratings_total,reviews'
      + '&reviews_sort=newest'
      + '&key=' + key;

    const detailsData = await (await fetch(detailsUrl)).json();
    const result = detailsData.result;

    // If Google returns no usable reviews, fall back
    if (!result || !result.reviews || !result.reviews.length) return fallbackResponse();

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return fallbackResponse();
  }
}
