import { neon } from "@netlify/neon";

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const sql = neon();
    const data = await req.json();

    await sql`
      CREATE TABLE IF NOT EXISTS match_completions (
        id        SERIAL PRIMARY KEY,
        spielnummer TEXT,
        spielart    TEXT,
        datum       TEXT,
        anstoss     TEXT,
        spielort    TEXT,
        heimverein  TEXT,
        gastverein  TEXT,
        kategorie   TEXT,
        spielklasse TEXT,
        feldtyp     TEXT,
        hinweise    TEXT,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO match_completions
        (spielnummer, spielart, datum, anstoss, spielort, heimverein, gastverein, kategorie, spielklasse, feldtyp, hinweise)
      VALUES
        (${data.spielnummer || ''}, ${data.spielart || ''}, ${data.datum || ''},
         ${data.anstoss || ''}, ${data.spielort || ''}, ${data.heimverein || ''},
         ${data.gastverein || ''}, ${data.kategorie || ''}, ${data.spielklasse || ''},
         ${data.feldtyp || ''}, ${data.hinweise || ''})
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    console.error('save-match error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
};

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

export const config = { path: '/api/save-match' };
