import { neon } from "@netlify/neon";

export default async () => {
  const info = {
    hasDbUrl: !!process.env.NETLIFY_DATABASE_URL,
    hasAdminPwd: !!process.env.ADMIN_PASSWORD,
    dbConnected: false,
    tables: {},
    testInsert: null,
    error: null
  };

  try {
    const sql = neon();

    // Basic connection test
    const timeRes = await sql`SELECT NOW() as t, current_database() as db`;
    info.dbConnected = true;
    info.db = timeRes[0].db;
    info.time = timeRes[0].t;

    // Row counts via pg_stat_user_tables (avoids identifier interpolation issue)
    const countRes = await sql`
      SELECT relname AS tbl, n_live_tup AS cnt
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY relname
    `;
    for (const r of countRes) {
      info.tables[r.tbl] = Number(r.cnt);
    }

    // Test INSERT into quiz_answers
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY, session_id TEXT, course TEXT,
        round INT, phase TEXT, question_id INT, question_text TEXT,
        selected_idx INT, correct_idx INT, is_correct BOOLEAN,
        answered_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO quiz_answers
        (session_id, course, round, phase, question_id, question_text, selected_idx, correct_idx, is_correct)
      VALUES
        ('ping-test', 'test', 1, 'initial', 0, 'Ping-Test-Frage', 0, 0, true)
    `;
    info.testInsert = 'OK — Testzeile erfolgreich eingefügt';

    // Count again after insert
    const afterRes = await sql`SELECT COUNT(*) as n FROM quiz_answers`;
    info.quiz_answers_count = Number(afterRes[0].n);

  } catch (err) {
    info.error = err.message;
  }

  return new Response(JSON.stringify(info, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};

export const config = { path: '/api/ping' };
