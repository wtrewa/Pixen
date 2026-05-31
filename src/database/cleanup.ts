import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pixen_db',
  synchronize: false,
  logging: true,
});

async function cleanup() {
  console.log('🧹 Connecting to database for cleanup...');
  await AppDataSource.initialize();
  
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🗑️ Dropping problematic tables and types...');
  try {
    await queryRunner.query('DROP TABLE IF EXISTS "payments" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "notifications" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "reviews" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "posts" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "bookings" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "vendor_services" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "service_addons" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "vendor_equipment" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "booking_type_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "booking_type_enum_old" CASCADE');
    console.log('✅ Cleanup successful.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

cleanup();
