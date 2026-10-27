const { Client } = require('pg');

async function setupAndTest() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Kapil@123',
    database: 'fortaa',
  });

  try {
    await client.connect();
    console.log('✅ Connected to fortaa database!');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(50) UNIQUE,
        account_type VARCHAR(100) DEFAULT 'Individual / Professional',
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(50),
        dob VARCHAR(50),
        gender VARCHAR(50),
        referral_id VARCHAR(100),
        business_name VARCHAR(150),
        company_brand VARCHAR(150),
        business_category VARCHAR(100),
        designation VARCHAR(100),
        experience VARCHAR(100),
        website_social VARCHAR(255),
        mobile_verified BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ users table is ready!');

    // Count
    const count = await client.query('SELECT COUNT(*) FROM users');
    console.log('📊 Users currently in DB:', count.rows[0].count);

  } catch (err) {
    console.log('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

setupAndTest();
