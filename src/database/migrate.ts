/**
 * Production migration runner — executed before the app starts (see Dockerfile /
 * nixpacks start command). Safe to run on every boot:
 *
 * 1. If the schema pre-exists (built by DB_SYNC=true) but the migrations table
 *    has no records, "baseline" the legacy migrations — mark them as applied
 *    without executing them, since synchronize already made those changes.
 * 2. Run any pending migrations.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Migrations that predate this runner. Their changes are already present in any
// database created by synchronize, so they must never be re-executed there.
const LEGACY_MIGRATIONS: { timestamp: number; name: string }[] = [
  { timestamp: 20260509163203, name: 'BookingTypeFields20260509163203' },
  { timestamp: 20260509164721, name: 'EquipmentAddonsCollaborators20260509164721' },
  { timestamp: 20260611120000, name: 'RefundsAndPasswordReset20260611120000' },
];

function buildDataSource(): DataSource {
  let url = process.env.DATABASE_URL;
  if (url && url.startsWith('//')) url = 'postgresql:' + url;

  const common = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: ['error', 'warn', 'migration'] as any,
  };

  if (url) {
    return new DataSource({
      ...common,
      url,
      extra: { ssl: { rejectUnauthorized: false }, family: 4 },
    });
  }

  return new DataSource({
    ...common,
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT, 10) || 5432,
    username: process.env.DB_USERNAME || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'pixen_db',
  });
}

async function main() {
  const ds = buildDataSource();
  await ds.initialize();

  try {
    const runner = ds.createQueryRunner();
    try {
      const schemaExists = await runner.hasTable('users');

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" BIGINT NOT NULL,
          "name" VARCHAR NOT NULL
        )
      `);

      if (schemaExists) {
        for (const m of LEGACY_MIGRATIONS) {
          const existing = await runner.query(
            `SELECT 1 FROM "migrations" WHERE "name" = $1`,
            [m.name],
          );
          if (existing.length === 0) {
            await runner.query(
              `INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`,
              [m.timestamp, m.name],
            );
            console.log(`[migrate] baselined legacy migration: ${m.name}`);
          }
        }
      }
    } finally {
      await runner.release();
    }

    const applied = await ds.runMigrations({ transaction: 'each' });
    if (applied.length === 0) {
      console.log('[migrate] no pending migrations');
    } else {
      for (const m of applied) console.log(`[migrate] applied: ${m.name}`);
    }
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err.message || err);
  process.exit(1);
});
