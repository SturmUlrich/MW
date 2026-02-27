import { neon } from "@netlify/neon";

export default async () => {
  const info = {
    hasDbUrl: !!process.env.NETLIFY_DATABASE_URL,
    hasAdminPwd: !!process.env.ADMIN_PASSWORD,
    dbConnected: false,
    tables: {},
    error: null
  };

  try {
    const sql = neon();

    const timeRes = await sql`SELECT NOW() as t, current_database() as db`;
    info.dbConnected = true;
    info.db = timeRes[0].db;
    info.time = timeRes[0].t;

    // Удаляем тестовые строки от ping-тестов
    await sql`DELETE FROM quiz_answers WHERE session_id = 'ping-test'`.catch(() => {});

    // Точные счётчики строк
    const tables = ['match_completions', 'quiz_answers'];
    for (const t of tables) {
      try {
        if (t === 'match_completions') {
          const r = await sql`SELECT COUNT(*) as n FROM match_completions`;
          info.tables[t] = Number(r[0].n);
        } else {
          const r = await sql`SELECT COUNT(*) as n FROM quiz_answers`;
          info.tables[t] = Number(r[0].n);
        }
      } catch { info.tables[t] = 'table not found'; }
    }

    // Sessions count
    try {
      const s = await sql`SELECT COUNT(DISTINCT session_id) as n FROM quiz_answers`;
      info.quiz_sessions = Number(s[0].n);
    } catch { info.quiz_sessions = 0; }

  } catch (err) {
    info.error = err.message;
  }

  return new Response(JSON.stringify(info, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};

export const config = { path: '/api/ping' };
