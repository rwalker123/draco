import pg from 'pg';

const SAFE_DB_URL = /^postgresql:\/\/[^:@\/]+@localhost(:\d+)?\//;

if (!SAFE_DB_URL.test(process.env.DATABASE_URL || '')) {
  console.error('REFUSING TO REAP: DATABASE_URL does not match localhost-no-password pattern');
  process.exit(1);
}

const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function reap(table: string, where: string, params: unknown[]): Promise<void> {
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`,
    params,
  );
  const count = parseInt(countResult.rows[0].count, 10);
  if (count === 0) {
    console.log(`${table}: 0 rows to reap`);
    return;
  }
  await pool.query(`DELETE FROM ${table} WHERE ${where}`, params);
  console.log(`${table}: reaped ${count} rows`);
}

async function main(): Promise<void> {
  console.log(`Reaping E2E data older than ${cutoff.toISOString()}`);

  await reap('contacts', "(firstname LIKE 'E2E%' OR lastname LIKE 'E2E%')", []);

  await reap('teamsseason', "name LIKE 'E2E %'", []);

  await reap(
    'leagueseason',
    "leagueseason.id IN (SELECT ls.id FROM leagueseason ls JOIN league l ON l.id = ls.leagueid WHERE l.name LIKE 'E2E %')",
    [],
  );

  await reap('league', "name LIKE 'E2E %'", []);

  await reap('season', "name LIKE 'E2E %'", []);

  await pool.end();
  console.log('Done.');
}

main().catch((err: unknown) => {
  console.error('Reap failed:', err);
  pool.end().catch(() => undefined);
  process.exit(1);
});
