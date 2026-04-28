import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'pixen_db',
});

async function debug() {
  await client.connect();
  console.log('Connected to database.');

  console.log('\n--- CHECKING FOR VENDOR: PRIYA NAIR ---');
  const vendorRes = await client.query("SELECT * FROM vendors WHERE business_name ILIKE '%Priya Nair%'");
  console.table(vendorRes.rows.map(v => ({ id: v.id, name: v.business_name, userId: v.user_id })));

  if (vendorRes.rows.length > 0) {
    const vid = vendorRes.rows[0].id;
    console.log(`\n--- CHECKING BOOKINGS FOR VENDOR ID: ${vid} ---`);
    const bookingRes = await client.query("SELECT b.id, b.status, u.full_name as customer FROM bookings b JOIN users u ON b.customer_id = u.id WHERE b.vendor_id = $1", [vid]);
    console.table(bookingRes.rows);
  }

  console.log('\n--- CHECKING ALL RECENT BOOKINGS ---');
  const recentRes = await client.query("SELECT b.id, b.vendor_id, u.full_name as customer, b.status FROM bookings b JOIN users u ON b.customer_id = u.id ORDER BY b.created_at DESC LIMIT 5");
  console.table(recentRes.rows);

  await client.end();
}

debug().catch(console.error);
