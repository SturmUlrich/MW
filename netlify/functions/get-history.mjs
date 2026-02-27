import { neon } from "@netlify/neon";

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(req.url);
  const pwd = url.searchParams.get('pwd') || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

  if (!ADMIN_PASSWORD || pwd !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }

  const sql = neon();
  let matches = [];
  let quizResults = [];

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS match_completions (
        id SERIAL PRIMARY KEY, spielnummer TEXT, spielart TEXT, datum TEXT,
        anstoss TEXT, spielort TEXT, heimverein TEXT, gastverein TEXT,
        kategorie TEXT, spielklasse TEXT, feldtyp TEXT, hinweise TEXT,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    matches = await sql`SELECT * FROM match_completions ORDER BY completed_at DESC LIMIT 100`;
  } catch (e) {
    console.error('matches fetch error:', e.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY, course TEXT, total_questions INT,
        round_stats JSONB, played_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    quizResults = await sql`SELECT * FROM quiz_results ORDER BY played_at DESC LIMIT 100`;
  } catch (e) {
    console.error('quiz fetch error:', e.message);
  }

  return new Response(JSON.stringify({ matches, quizResults }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
};

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

export const config = { path: '/api/get-history' };
