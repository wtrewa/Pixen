import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Vendor } from './src/modules/vendors/entities/vendor.entity';
import { VendorService } from './src/modules/vendors/entities/vendor-service.entity';
import { BookingType } from './src/common/enums/booking-type.enum';

dotenv.config({ path: './.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pixen_db',
  entities: ['./src/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function run() {
  await AppDataSource.initialize();
  const vendorRepo = AppDataSource.getRepository(Vendor);
  const serviceRepo = AppDataSource.getRepository(VendorService);

  const priya = await vendorRepo.findOne({ 
    where: { businessName: 'Priya Nair Visuals' } 
  });

  if (!priya) {
    console.error('Priya Nair Visuals not found');
    process.exit(1);
  }

  console.log(`Found Priya Nair Visuals: ${priya.id}`);

  const sampleServices = [
    {
      vendorId: priya.id,
      name: 'Portrait Session (Hourly)',
      description: 'Perfect for lifestyle, editorial, or individual portraits.',
      price: 5000,
      duration: 1,
      bookingType: BookingType.HOURLY,
      minHours: 2,
      maxHours: 6,
      tier: 'SILVER',
      features: ['1 Photographer', 'High-res images', 'Basic retouching'],
      isActive: true,
    },
    {
      vendorId: priya.id,
      name: 'Traditional Multi-Day',
      description: 'Ideal for Haldi, Mehendi, and Sangeet ceremonies.',
      price: 45000,
      duration: 8,
      bookingType: BookingType.MULTI_DATE,
      maxDates: 3,
      tier: 'GOLD',
      features: ['2 Photographers', 'Traditional Edit', 'Highlight Reel'],
      isActive: true,
    },
    {
      vendorId: priya.id,
      name: 'Signature Range Coverage',
      description: 'Full range coverage for extended destination weddings.',
      price: 35000,
      duration: 12,
      bookingType: BookingType.DATE_RANGE,
      maxDays: 5,
      tier: 'PLATINUM',
      features: ['Team of 3', 'Cinematic Film', 'Luxury Album'],
      isActive: true,
    }
  ];

  for (const svc of sampleServices) {
    const existing = await serviceRepo.findOne({ where: { vendorId: priya.id, name: svc.name } });
    if (existing) {
      console.log(`Service ${svc.name} already exists, skipping.`);
      continue;
    }
    await serviceRepo.save(serviceRepo.create(svc as any));
    console.log(`Added service: ${svc.name}`);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
