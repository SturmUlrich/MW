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
    const d = await req.json();

    await sql`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id            SERIAL PRIMARY KEY,
        session_id    TEXT,
        course        TEXT,
        round         INT,
        phase         TEXT,
        question_id   INT,
        question_text TEXT,
        selected_idx  INT,
        correct_idx   INT,
        is_correct    BOOLEAN,
        answered_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO quiz_answers
        (session_id, course, round, phase, question_id, question_text, selected_idx, correct_idx, is_correct)
      VALUES
        (${d.sessionId || ''}, ${d.course || ''}, ${d.round || 1}, ${d.phase || 'initial'},
         ${d.questionId || 0}, ${d.questionText || ''}, ${d.selectedIdx ?? -1},
         ${d.correctIdx ?? -1}, ${d.isCorrect ?? false})
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    console.error('save-answer error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
};

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
}

export const config = { path: '/api/save-answer' };
