const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'postgres'),
  database: process.env.PG_DATABASE || 'fortaa',
});

async function createAccountTypesTable() {
  const client = await pool.connect();
  try {
    console.log('🔄 Creating account_types table in PostgreSQL...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS account_types (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_account_types_active ON account_types(is_active);
      CREATE INDEX IF NOT EXISTS idx_account_types_order ON account_types(display_order ASC);
    `);

    // Check if initial seed is needed
    const countRes = await client.query('SELECT COUNT(*) FROM account_types');
    const count = parseInt(countRes.rows[0].count, 10);
    
    if (count === 0) {
      console.log('🌱 Seeding default 4 Account Types...');
      await client.query(`
        INSERT INTO account_types (title, description, icon, is_active, display_order)
        VALUES 
          ('Individual / Professional', 'I want to explore opportunities, connect with leaders and grow my network.', 'user', true, 1),
          ('Business / Company', 'I represent a company, brand or direct selling business.', 'building', true, 2),
          ('Distributor / Partner', 'I want to become a distributor of partner with a company.', 'briefcase', true, 3),
          ('Team Leader', 'i manage a team and work to build and grow my organiation.', 'users', true, 4);
      `);
      console.log('✅ Successfully seeded default Account Types!');
    } else {
      console.log(`ℹ️ Account types table already contains ${count} records.`);
    }

    const currentRows = await client.query('SELECT id, title, icon, is_active, display_order FROM account_types ORDER BY display_order ASC');
    console.log('📋 Current Account Types in DB:', currentRows.rows);

  } catch (err) {
    console.error('❌ Error setting up account_types table:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createAccountTypesTable();
