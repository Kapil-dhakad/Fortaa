const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'Kapil@123'),
  database: process.env.PG_DATABASE || 'fortaa',
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(200) DEFAULT 'General Support',
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'New',
        admin_reply TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_support_queries_created ON support_queries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_support_queries_is_read ON support_queries(is_read);
    `);
    console.log('✅ support_queries table created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err);
    process.exit(1);
  }
}

run();
