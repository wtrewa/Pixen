import { Client } from 'pg';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testAll() {
  console.log('--- Connection Diagnostics ---');

  // 1. Test Database
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };

  console.log(`[DB] Testing connection to ${dbConfig.host}:${dbConfig.port}...`);
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ [DB] Database Connected!');
    await client.end();
  } catch (err) {
    console.error('❌ [DB] Failed:', err.message);
  }

  // 2. Test Redis
  console.log(`[Redis] Testing connection to ${process.env.REDIS_HOST}...`);
  const redis = new Redis(process.env.REDIS_URL || '');
  try {
    await redis.ping();
    console.log('✅ [Redis] Connected!');
    redis.disconnect();
  } catch (err) {
    console.error('❌ [Redis] Failed:', err.message);
  }
}

testAll();
