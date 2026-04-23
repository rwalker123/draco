import pg from 'pg';

const SAFE_DB_URL = /^postgresql:\/\/[^:@\/]+@localhost(:\d+)?\//;

if (!SAFE_DB_URL.test(process.env.DATABASE_URL || '')) {
  console.error('REFUSING TO REAP: DATABASE_URL does not match localhost-no-password pattern');
  process.exit(1);
}

const accountIdRaw = process.env.E2E_TEST_ACCOUNT_ID;
if (!accountIdRaw || !/^\d+$/.test(accountIdRaw)) {
  console.error('REFUSING TO REAP: E2E_TEST_ACCOUNT_ID must be set to a numeric account id');
  process.exit(1);
}
const accountId = accountIdRaw;

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
  console.log(`Reaping E2E data for account ${accountId}`);

  await reap(
    'contacts',
    "(firstname LIKE 'E2E%' OR lastname LIKE 'E2E%') AND creatoraccountid = $1",
    [accountId],
  );

  await reap(
    'teamsseason',
    `name LIKE 'E2E %' AND leagueseasonid IN (
       SELECT ls.id FROM leagueseason ls
       JOIN season s ON s.id = ls.seasonid
       WHERE s.accountid = $1
     )`,
    [accountId],
  );

  await reap(
    'leagueseason',
    `leagueseason.id IN (
       SELECT ls.id FROM leagueseason ls
       JOIN league l ON l.id = ls.leagueid
       WHERE l.name LIKE 'E2E %' AND l.accountid = $1
     )`,
    [accountId],
  );

  await reap('league', "name LIKE 'E2E %' AND accountid = $1", [accountId]);

  await reap('season', "name LIKE 'E2E %' AND accountid = $1", [accountId]);

  await pool.end();
  console.log('Done.');
}

main().catch((err: unknown) => {
  console.error('Reap failed:', err);
  pool.end().catch(() => undefined);
  process.exit(1);
});
