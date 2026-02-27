import { neon } from "@netlify/neon";

export default async () => {
  const info = {
    hasDbUrl: !!process.env.NETLIFY_DATABASE_URL,
    hasAdminPwd: !!process.env.ADMIN_PASSWORD,
    dbConnected: false,
    tables: [],
    error: null
  };

  try {
    const sql = neon();
    const timeRes = await sql`SELECT NOW() as t, current_database() as db`;
    info.dbConnected = true;
    info.db = timeRes[0].db;
    info.time = timeRes[0].t;

    const tablesRes = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    info.tables = tablesRes.map(r => r.tablename);

    for (const t of info.tables) {
      const cnt = await sql`SELECT COUNT(*) as n FROM ${sql(t)}`;
      info[t + '_count'] = Number(cnt[0].n);
    }
  } catch (err) {
    info.error = err.message;
  }

  return new Response(JSON.stringify(info, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
};

export const config = { path: '/api/ping' };
