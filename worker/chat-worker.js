/**
 * PBJ Strategic Accounting — Cloudflare Worker Chat Proxy
 *
 * DEPLOY INSTRUCTIONS:
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file into the editor
 * 3. Click Settings → Variables → Add Variable:
 *      Name:  ANTHROPIC_API_KEY
 *      Value: your-key-from-console.anthropic.com
 *      (click Encrypt before saving)
 * 4. Deploy → copy the worker URL (e.g. https://pbj-chat.yourname.workers.dev)
 * 5. Paste that URL into assets/js/chat.js where it says YOUR_CLOUDFLARE_WORKER_URL
 */

const ALLOWED_ORIGINS = [
  'https://pbjsa.com',
  'https://www.pbjsa.com',
  /* add your Cloudflare Pages preview domain here if needed */
  'http://localhost:3200', /* remove before going live */
];

const SYSTEM_PROMPT = `You are a friendly, concise navigation assistant for PBJ Strategic Accounting — a bookkeeping firm serving Clay County and surrounding areas in Florida, owned by Brittany Ferguson.

Your only job is to help website visitors find the right page or answer a quick question. Keep every response to 2-3 short sentences maximum.

SITE PAGES (use these exact paths when linking):
- /index.html        → Home: overview, trust signals, pricing summary, testimonials
- /about.html        → About Brittany: credentials, background, what to expect
- /services.html     → All 7 services in detail (interactive orbit)
- /pricing.html      → Package pricing and what's included
- /contact.html      → Contact form, phone, email, address, office hours
- /blog/index.html   → Blog: bookkeeping tips and articles

SERVICES OFFERED:
Bookkeeping, Fractional CFO Services, QuickBooks Clean-Up, Cash Flow Management, Budgeting & Forecasting, Financial Reporting, Tax Planning & Compliance.

BUSINESS INFO:
- Cash-pay only — no insurance accepted
- Phone: 904-708-2411
- Email: bferguson@pbjsa.com
- Address: 1845 Town Center Blvd Suite #205, Fleming Island, FL 32003
- Hours: Monday–Friday, 8:00 am–5:00 pm

RULES:
- Max 2-3 sentences per reply — never longer
- Format page links as Markdown: [Page Name](/path.html) — the site renders these as clickable
- Be warm, not salesy
- If you don't know something, send them to [Contact](/contact.html)
- Never make up pricing numbers — always direct to [Pricing](/pricing.html)`;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    /* CORS preflight */
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let messages;
    try {
      ({ messages } = await request.json());
      if (!Array.isArray(messages) || messages.length === 0) throw new Error('bad input');
    } catch {
      return new Response(JSON.stringify({ reply: 'Invalid request.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    /* Keep conversation history to last 10 turns to control cost */
    const trimmed = messages.slice(-10);

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: trimmed,
        }),
      });

      const data = await apiRes.json();
      const reply =
        data?.content?.[0]?.text ||
        'I had trouble with that. Please call us at 904-708-2411 or visit our [Contact page](/contact.html).';

      return new Response(JSON.stringify({ reply }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    } catch {
      return new Response(
        JSON.stringify({
          reply: 'Something went wrong on my end. Please call 904-708-2411 or visit our [Contact page](/contact.html).',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        }
      );
    }
  },
};
