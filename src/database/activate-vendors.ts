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
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function activate() {
  console.log('🌱 Connecting to database…');
  await AppDataSource.initialize();
  console.log('✅ Connected.\n');

  const userRepo = AppDataSource.getRepository('users');
  
  console.log('⏳ Activating all Vendors and Admins…');
  const result = await userRepo.createQueryBuilder()
    .update('users')
    .set({ isActive: true })
    .where('role IN (:...roles)', { roles: ['VENDOR', 'ADMIN', 'SUPER_ADMIN'] })
    .execute();

  console.log(`🎉 Success! ${result.affected} accounts reactivated.`);
  await AppDataSource.destroy();
}

activate().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
