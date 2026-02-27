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
  let quizSessions = [];

  // Matches (checklist completions)
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
    console.error('matches error:', e.message);
  }

  // Quiz: group answers by session_id
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY, session_id TEXT, course TEXT,
        round INT, phase TEXT, question_id INT, question_text TEXT,
        selected_idx INT, correct_idx INT, is_correct BOOLEAN,
        answered_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // One row per session with aggregated stats + last answer time
    const sessions = await sql`
      SELECT
        session_id,
        course,
        MIN(answered_at)                              AS started_at,
        MAX(answered_at)                              AS last_answered_at,
        COUNT(*)                                      AS total_answered,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)  AS total_correct,
        MAX(round)                                    AS max_round,
        json_agg(
          json_build_object(
            'id',            id,
            'round',         round,
            'phase',         phase,
            'question_id',   question_id,
            'question_text', question_text,
            'selected_idx',  selected_idx,
            'correct_idx',   correct_idx,
            'is_correct',    is_correct,
            'answered_at',   answered_at
          )
          ORDER BY answered_at
        ) AS answers
      FROM quiz_answers
      GROUP BY session_id, course
      ORDER BY MAX(answered_at) DESC
      LIMIT 50
    `;

    quizSessions = sessions;
  } catch (e) {
    console.error('quiz error:', e.message);
  }

  return new Response(JSON.stringify({ matches, quizSessions }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
};

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

export const config = { path: '/api/get-history' };
