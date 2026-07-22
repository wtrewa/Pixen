import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

let url = process.env.DATABASE_URL;
if (url && url.startsWith('//')) url = 'postgresql:' + url;

const common = {
  type: 'postgres' as const,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
};

export default new DataSource(
  url
    ? { ...common, url, extra: { ssl: { rejectUnauthorized: false }, family: 4 } }
    : {
        ...common,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'pixen_db',
      },
);
