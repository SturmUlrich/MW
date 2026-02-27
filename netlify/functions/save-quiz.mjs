import { neon } from "@netlify/neon";

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const sql = neon();
    const data = await req.json();

    await sql`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id             SERIAL PRIMARY KEY,
        course         TEXT,
        total_questions INT,
        round_stats    JSONB,
        played_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO quiz_results (course, total_questions, round_stats)
      VALUES (
        ${data.course || ''},
        ${data.totalQuestions || 0},
        ${JSON.stringify(data.roundStats || [])}
      )
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    console.error('save-quiz error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
};

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

export const config = { path: '/api/save-quiz' };
