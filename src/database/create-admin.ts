import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Error: Please set ADMIN_EMAIL and ADMIN_PASSWORD in your environment variables or .env file.');
    process.exit(1);
  }

  console.log(`🌱 Connecting to database at ${process.env.DB_HOST}...`);
  await AppDataSource.initialize();
  
  const userRepo = AppDataSource.getRepository('users');
  
  const existingUser = await userRepo.findOne({ where: { email } });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  if (existingUser) {
    console.log(`ℹ️  User ${email} already exists. Promoting to SUPER_ADMIN...`);
    await userRepo.update(existingUser.id, {
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`✅ User ${email} has been promoted to SUPER_ADMIN.`);
  } else {
    console.log(`🌱 Creating new SUPER_ADMIN account: ${email}...`);
    await userRepo.save(userRepo.create({
      fullName: 'System Administrator',
      email: email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
      provider: 'local',
    }));
    console.log(`✅ SUPER_ADMIN account created successfully.`);
  }

  await AppDataSource.destroy();
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err);
  process.exit(1);
});
