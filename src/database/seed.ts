import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Post, PostType } from '../modules/posts/entities/post.entity';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pixen_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
});

const VENDORS = [
  {
    fullName: 'Ansh Kapoor',
    email: 'ansh@pixentest.com',
    businessName: 'Ansh Kapoor Films',
    businessDescription: 'Award-winning cinematic wedding films. Specialising in luxury weddings across India and destination shoots.',
    category: 'Wedding',
    city: 'Mumbai',
    state: 'Maharashtra',
    rating: 4.9,
    totalReviews: 218,
    services: [
      { name: 'Silver Package', description: '1-day coverage, 300 edited photos, 10-min highlight film', price: 80000, duration: 10 },
      { name: 'Gold Package', description: '2-day coverage, 600 edited photos, 20-min cinematic film, drone shots', price: 120000, duration: 18 },
      { name: 'Platinum Package', description: '3-day full coverage, 1000+ photos, 40-min film, pre-wedding shoot included', price: 200000, duration: 30 },
    ],
  },
  {
    fullName: 'Shivani Mehta',
    email: 'shivani@pixentest.com',
    businessName: 'Shivani Mehta Photography',
    businessDescription: 'Documentary and editorial wedding photography with a fine-art aesthetic. Featured in Vogue India and WedMeGood.',
    category: 'Pre-Wedding',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.8,
    totalReviews: 174,
    services: [
      { name: 'Pre-Wedding Shoot', description: 'Half-day outdoor shoot, 100 edited images, 2 locations', price: 35000, duration: 5 },
      { name: 'Wedding Day', description: 'Full-day wedding coverage, 400 edited photos, same-week delivery', price: 95000, duration: 12 },
      { name: 'Complete Wedding', description: 'Mehendi + Sangeet + Wedding, 700+ photos, Instagram reels included', price: 150000, duration: 24 },
    ],
  },
  {
    fullName: 'Rahul Singhania',
    email: 'rahul@pixentest.com',
    businessName: 'The Wedding Frame',
    businessDescription: 'Capturing the raw emotion and candid moments of your special day. Traditional, candid and cinematic blended perfectly.',
    category: 'Wedding',
    city: 'Bangalore',
    state: 'Karnataka',
    rating: 4.7,
    totalReviews: 132,
    services: [
      { name: 'Candid Basic', description: '1 photographer, full wedding day, 250 edited images', price: 55000, duration: 10 },
      { name: 'Candid + Video', description: '1 photographer + videographer, 400 images, 15-min film', price: 85000, duration: 14 },
      { name: 'Ultimate Package', description: '2 photographers, 2 videographers, drone, 600+ images, 30-min film', price: 160000, duration: 20 },
    ],
  },
  {
    fullName: 'Priya Nair',
    email: 'priya@pixentest.com',
    businessName: 'Priya Nair Visuals',
    businessDescription: 'South Indian wedding specialist with 8+ years of experience. Expert in traditional ceremonies and vibrant colour grading.',
    category: 'Wedding',
    city: 'Chennai',
    state: 'Tamil Nadu',
    rating: 4.8,
    totalReviews: 98,
    services: [
      { name: 'Traditional Package', description: 'Coverage of all traditional rituals, 350 edited photos', price: 65000, duration: 12 },
      { name: 'Full Coverage', description: '2-day coverage with videography, 600 images, 20-min highlight', price: 110000, duration: 20 },
      { name: 'Destination Wedding', description: 'Outstation travel included, 3-day coverage, full film', price: 180000, duration: 30 },
    ],
  },
  {
    fullName: 'Rohan Verma',
    email: 'rohan@pixentest.com',
    businessName: 'Rohan Verma Studios',
    businessDescription: 'Luxury wedding photography studio based in Jaipur. Specialising in royal palace weddings and destination ceremonies in Rajasthan.',
    category: 'Wedding',
    city: 'Jaipur',
    state: 'Rajasthan',
    rating: 4.9,
    totalReviews: 156,
    services: [
      { name: 'Palace Wedding Basic', description: '1-day coverage, 300 photos, Jaipur location included', price: 90000, duration: 10 },
      { name: 'Royal Experience', description: '2-day coverage, 600 photos, 25-min cinematic film, aerial shots', price: 150000, duration: 18 },
      { name: 'Full Rajasthan Experience', description: '3-day multi-location, 900+ photos, full film, same-day edit reel', price: 250000, duration: 30 },
    ],
  },
  {
    fullName: 'Divya Sharma',
    email: 'divya@pixentest.com',
    businessName: 'Divya Sharma Photography',
    businessDescription: 'Specialising in Haldi, Mehendi and intimate wedding ceremonies. Known for vibrant colour work and emotional storytelling.',
    category: 'Haldi',
    city: 'Hyderabad',
    state: 'Telangana',
    rating: 4.6,
    totalReviews: 87,
    services: [
      { name: 'Haldi Ceremony', description: '3-hour coverage, 150 edited colourful images', price: 25000, duration: 3 },
      { name: 'Mehendi Night', description: '4-hour coverage, 200 edited images, Instagram story set', price: 30000, duration: 4 },
      { name: 'Haldi + Mehendi Combo', description: 'Both ceremonies, 350 images, reels included', price: 50000, duration: 8 },
    ],
  },
  {
    fullName: 'Karan Malhotra',
    email: 'karan@pixentest.com',
    businessName: 'Karan Malhotra Weddings',
    businessDescription: 'Destination wedding specialist. Covered weddings in Goa, Udaipur, Kerala backwaters and international destinations including Bali and Dubai.',
    category: 'Engagement',
    city: 'Mumbai',
    state: 'Maharashtra',
    rating: 4.7,
    totalReviews: 203,
    services: [
      { name: 'Engagement Shoot', description: 'Half-day shoot, 150 images, 1 location', price: 30000, duration: 5 },
      { name: 'Destination Package', description: 'Travel + 2-day coverage, 500 images, 20-min film', price: 175000, duration: 20 },
      { name: 'International Wedding', description: 'International travel, 3-day coverage, full luxury package', price: 350000, duration: 30 },
    ],
  },
  {
    fullName: 'Aisha Khan',
    email: 'aisha@pixentest.com',
    businessName: 'Aisha Khan Portraits',
    businessDescription: 'Maternity, baby shower, and intimate wedding photographer. Creating timeless portraits with a warm, editorial style.',
    category: 'Maternity',
    city: 'Pune',
    state: 'Maharashtra',
    rating: 4.9,
    totalReviews: 64,
    services: [
      { name: 'Maternity Shoot', description: '2-hour studio or outdoor session, 80 edited images', price: 20000, duration: 2 },
      { name: 'Baby Shower', description: '3-hour event coverage, 120 images, same-week delivery', price: 25000, duration: 3 },
      { name: 'Maternity + Newborn Bundle', description: 'Full maternity + newborn studio session, 150 images', price: 45000, duration: 5 },
    ],
  },
  {
    fullName: 'Vikram Reddy',
    email: 'vikram@pixentest.com',
    businessName: 'Vikram Reddy Cinematic',
    businessDescription: 'Cinematic wedding films and photography. Known for Bollywood-style films that tell your love story beautifully.',
    category: 'Wedding',
    city: 'Hyderabad',
    state: 'Telangana',
    rating: 4.8,
    totalReviews: 119,
    services: [
      { name: 'Cinematic Film Only', description: '1 videographer, 30-min wedding film, colour graded', price: 60000, duration: 10 },
      { name: 'Photo + Film Combo', description: '1 photographer + 1 videographer, 300 photos, 20-min film', price: 95000, duration: 14 },
      { name: 'Grand Celebration', description: '2 photographers + 2 videographers, drone, 500 photos, 40-min film', price: 175000, duration: 24 },
    ],
  },
  {
    fullName: 'Neha Kapoor',
    email: 'neha@pixentest.com',
    businessName: 'Neha Kapoor Photography',
    businessDescription: 'Corporate events, birthday parties, and social celebrations photographer based in Kolkata. Over 500 events covered.',
    category: 'Birthday Party',
    city: 'Kolkata',
    state: 'West Bengal',
    rating: 4.5,
    totalReviews: 73,
    services: [
      { name: 'Birthday Party', description: '3-hour event, 150 images, digital album', price: 18000, duration: 3 },
      { name: 'Corporate Event', description: 'Half-day coverage, 200 images, same-day preview', price: 30000, duration: 5 },
      { name: 'Full Day Event', description: 'Full-day coverage, 400+ images, highlight reel', price: 55000, duration: 10 },
    ],
  },
  {
    fullName: 'Sanjay Gupta',
    email: 'sanjay@pixentest.com',
    businessName: 'Sanjay Gupta Photography',
    businessDescription: 'Anniversary and couples portrait photographer. Specialising in golden hour shoots and luxury hotel settings in Delhi NCR.',
    category: 'Anniversary',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.6,
    totalReviews: 41,
    services: [
      { name: 'Anniversary Shoot', description: '2-hour golden hour session, 100 edited images', price: 22000, duration: 2 },
      { name: 'Surprise Anniversary', description: 'Surprise setup + photography, 150 images, same-day delivery', price: 35000, duration: 4 },
      { name: 'Anniversary Film', description: 'Photo + video, 200 images, 10-min love story film', price: 55000, duration: 6 },
    ],
  },
  {
    fullName: 'Meera Joshi',
    email: 'meera@pixentest.com',
    businessName: 'Meera Joshi Studios',
    businessDescription: 'Pre-wedding specialist creating cinematic narratives across Rajasthan, Kerala and the Himalayas. Featured in WeddingWire top 10.',
    category: 'Pre-Wedding',
    city: 'Ahmedabad',
    state: 'Gujarat',
    rating: 4.8,
    totalReviews: 88,
    services: [
      { name: 'Pre-Wedding Classic', description: 'Half-day shoot, 1 location, 120 edited images', price: 28000, duration: 5 },
      { name: 'Pre-Wedding Premium', description: 'Full-day shoot, 2 locations, 200 images + reel', price: 50000, duration: 10 },
      { name: 'Destination Pre-Wedding', description: 'Outstation travel, 2-day shoot, 300 images, cinematic film', price: 90000, duration: 16 },
    ],
  },
];

async function seed() {
  console.log('🌱 Connecting to database…');
  await AppDataSource.initialize();
  console.log('✅ Connected.\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pixen.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

  const userRepo = AppDataSource.getRepository('users');
  const vendorRepo = AppDataSource.getRepository('vendors');
  const serviceRepo = AppDataSource.getRepository('vendor_services');
  const portfolioRepo = AppDataSource.getRepository('portfolios');
  const mediaRepo = AppDataSource.getRepository('portfolio_media');
  const bookingRepo = AppDataSource.getRepository('bookings');
  const postRepo = AppDataSource.getRepository(Post);

  const passwordHash = await bcrypt.hash('Test@1234', 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  
  // 1. Create a sample admin
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = await userRepo.save(userRepo.create({
      fullName: 'Pixen Administrator',
      email: adminEmail,
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
      provider: 'local',
    }));
    console.log(`✅ Created Super Admin: ${adminEmail}`);
  }

  // 2. Create a sample customer
  let customer = await userRepo.findOne({ where: { email: 'customer@pixentest.com' } });
  if (!customer) {
    customer = await userRepo.save(userRepo.create({
      fullName: 'Priya Sharma',
      email: 'customer@pixentest.com',
      password: passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: true,
      provider: 'local',
    }));
    console.log('✅ Created sample customer: customer@pixentest.com');
  }

  let created = 0;
  let skipped = 0;

  for (const data of VENDORS) {
    const existing = await userRepo.findOne({ where: { email: data.email }, relations: ['vendor'] });
    let savedVendor;

    if (existing) {
      console.log(`ℹ️  User ${data.email} already exists, using existing profile...`);
      savedVendor = existing.vendor;
    } else {
      // Create vendor user
      const user = userRepo.create({
        fullName: data.fullName,
        email: data.email,
        password: passwordHash,
        role: 'VENDOR',
        isActive: true,
        isEmailVerified: true,
        provider: 'local',
      });
      const savedUser = await userRepo.save(user);

      // Create vendor profile
      const vendor = vendorRepo.create({
        userId: savedUser.id,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        category: data.category,
        city: data.city,
        state: data.state,
        country: 'India',
        isVerified: true,
        rating: data.rating,
        totalReviews: data.totalReviews,
      });
      savedVendor = await vendorRepo.save(vendor);
    }

    if (!savedVendor) {
      console.log(`⚠️  No vendor profile for ${data.email}, skipping.`);
      skipped++;
      continue;
    }

    // Create services
    const services = [];
    for (const svc of data.services) {
      const service = await serviceRepo.save(serviceRepo.create({
        vendorId: savedVendor.id,
        name: svc.name,
        description: svc.description,
        price: svc.price,
        duration: svc.duration,
        isActive: true,
      }));
      services.push(service);
    }

    // 2. Create Sample Portfolios
    const p1 = await portfolioRepo.save(portfolioRepo.create({
      vendorId: savedVendor.id,
      title: 'Recent Wedding Highlights',
      description: 'A collection of our favorite moments from the last season.',
    }));
    await mediaRepo.save(mediaRepo.create({
      portfolioId: p1.id,
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
      type: 'IMAGE',
    }));

    const p2 = await portfolioRepo.save(portfolioRepo.create({
      vendorId: savedVendor.id,
      title: 'Cinematic Portraits',
      description: 'Exploring light and emotion in intimate settings.',
    }));
    await mediaRepo.save(mediaRepo.create({
      portfolioId: p2.id,
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
      type: 'IMAGE',
    }));

    // 3. Create Sample Bookings (Leads)
    // One Confirmed (Revenue)
    await bookingRepo.save(bookingRepo.create({
      customerId: customer.id,
      vendorId: savedVendor.id,
      serviceId: services[0].id,
      status: 'CONFIRMED' as any,
      eventDate: new Date('2026-12-15T10:00:00Z'),
      eventLocation: 'Grand Palace, ' + data.city,
      totalAmount: services[0].price,
      notes: 'Please arrive by 9 AM.',
    }));

    // One Pending (New Inquiry)
    await bookingRepo.save(bookingRepo.create({
      customerId: customer.id,
      vendorId: savedVendor.id,
      serviceId: services[1].id,
      status: 'PENDING' as any,
      eventDate: new Date('2027-01-20T11:00:00Z'),
      eventLocation: 'Outdoor Resort, ' + data.city,
      totalAmount: services[1].price,
      notes: 'Waiting for your call to discuss the moodboard.',
    }));

    // One Completed (Past Revenue)
    await bookingRepo.save(bookingRepo.create({
      customerId: customer.id,
      vendorId: savedVendor.id,
      serviceId: services[0].id,
      status: 'COMPLETED' as any,
      eventDate: new Date('2026-03-10T09:00:00Z'),
      eventLocation: 'City Hotel, ' + data.city,
      totalAmount: services[0].price,
    }));

    // 4. Create Sample Trending Reels (Posts)
    const weddingVideos = [
      { id: '14268100', caption: 'Wedding Ceremony #PureLove', category: 'Wedding' },
      { id: '8776110', caption: 'Capturing the perfect walk. 💍', category: 'Wedding' },
      { id: '5617969', caption: 'At the altar. ✨', category: 'Wedding' },
      { id: '5617974', caption: 'The first walk together. ❤️', category: 'Wedding' },
      { id: '6939374', caption: 'Garden party vibes! 🎉', category: 'Wedding' },
      { id: '7148952', caption: 'Down the aisle...', category: 'Wedding' },
      { id: '5617983', caption: 'The moment of a lifetime.', category: 'Wedding' },
      { id: '7042877', caption: 'With this ring...', category: 'Wedding' },
    ];

    const engagementVideos = [
      { id: '3048327', caption: 'Holding hands forever.', category: 'Engagement' },
      { id: '6003565', caption: 'She said yes! 💍', category: 'Engagement' },
      { id: '3048322', caption: 'Warm hugs and kisses.', category: 'Engagement' },
      { id: '5328974', caption: 'Romantic date night.', category: 'Engagement' },
      { id: '4611967', caption: 'Beach walks.', category: 'Engagement' },
      { id: '5337146', caption: 'Kisses in the sun.', category: 'Engagement' },
      { id: '6003566', caption: 'The perfect proposal. ❤️', category: 'Engagement' },
    ];

    const babyVideos = [
      { id: '6248745', caption: 'Baby shower joy! 👶', category: 'Baby' },
      { id: '3648327', caption: 'A mother’s love.', category: 'Baby' },
      { id: '3049118', caption: 'Welcome to the world.', category: 'Baby' },
      { id: '3048199', caption: 'Sweet dreams.', category: 'Baby' },
      { id: '4473869', caption: 'A new family starts here.', category: 'Baby' },
    ];

    const birthdayVideos = [
      { id: '3048319', caption: 'Cheers to life! 🥂', category: 'Birthday' },
      { id: '3182799', caption: 'Make a wish. ✨', category: 'Birthday' },
      { id: '6787553', caption: 'Birthday glow!', category: 'Birthday' },
      { id: '3171655', caption: 'Family celebrations.', category: 'Birthday' },
      { id: '5247927', caption: 'Party time! 🎈', category: 'Birthday' },
    ];

    const indianWeddingVideos = [
      { url: 'https://cdn.pixabay.com/video/2022/10/23/136133-764371501_large.mp4', caption: 'Telugu South Wedding Rituals. 💒', category: 'Indian Wedding' },
      { url: 'https://cdn.pixabay.com/video/2022/10/23/136139-764371523_large.mp4', caption: 'The Sacred Garland Ceremony. 💍', category: 'Indian Wedding' },
      { url: 'https://cdn.pixabay.com/video/2022/10/23/136132-764371500_large.mp4', caption: 'Traditional Wedding Details. ✨', category: 'Indian Wedding' },
      { url: 'https://cdn.pixabay.com/video/2022/10/23/136134-764371502_large.mp4', caption: 'South Indian Wedding Magic. 🤴', category: 'Indian Wedding' },
    ];

    const haldiMehndiVideos = [
      { url: 'https://cdn.pixabay.com/video/2020/07/03/43699-436797154_large.mp4', caption: 'Bridal Mehndi (Henna) Art. 💛', category: 'Haldi/Mehndi' },
      { id: '4446324', caption: 'Intricate Mehndi details.', category: 'Haldi/Mehndi' },
      { id: '4446330', caption: 'Sangeet night dance! 💃', category: 'Haldi/Mehndi' },
    ];

    const engagementVideosIndian = [
      { id: '6003565', caption: 'The Ring Ceremony. 💍', category: 'Engagement' },
      { id: '6003566', caption: 'Indian couple goals.', category: 'Engagement' },
    ];

    const babyShowerIndian = [
      { id: '6248745', caption: 'Godh Bharai blessings. 👶', category: 'Godh Bharai' },
      { id: '4473869', caption: 'New beginnings.', category: 'Godh Bharai' },
    ];

    const celebrationVideosIndian = [
      { id: '5247927', caption: 'Baraat energy! 🥁', category: 'Celebration' },
      { id: '3171655', caption: 'Decor and festivities.', category: 'Celebration' },
    ];

    const allReels = [
      ...weddingVideos, 
      ...engagementVideos, 
      ...babyVideos, 
      ...birthdayVideos,
      ...indianWeddingVideos,
      ...haldiMehndiVideos,
      ...engagementVideosIndian,
      ...babyShowerIndian,
      ...celebrationVideosIndian
    ];

    // Refresh reels to ensure links are updated to the latest CDN format
    await postRepo.delete({ vendorId: savedVendor.id });
    
    for (const p of allReels) {
      // Use direct URL if provided, otherwise fallback to pexels pattern
      const videoUrl = (p as any).url || `https://videos.pexels.com/video-files/${(p as any).id}/${(p as any).id}-sd_640_360_25fps.mp4`; 

      await postRepo.save(postRepo.create({
        vendorId: savedVendor.id,
        type: PostType.VIDEO,
        url: videoUrl,
        caption: (p as any).caption,
        category: (p as any).category,
        likesCount: Math.floor(Math.random() * 500) + 50,
        viewsCount: Math.floor(Math.random() * 5000) + 1000,
      }));
    }

      console.log(`Done: ${data.businessName} with ${allReels.length} Reels`);
      created++;
    }

  await AppDataSource.destroy();

  console.log(`Seed complete - ${created} vendors created, ${skipped} skipped.`);
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
