const { Pool, Client } = require('pg');
require('dotenv').config();

let isConnected = false;

const dbConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'postgres'),
  database: process.env.PG_DATABASE || 'fortaa',
};

let pool = new Pool(dbConfig);

// Comprehensive users table schema matching Figma registration & onboarding
const CREATE_TABLE_QUERY = `
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
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);
`;

/**
 * Auto-ensures database exists, then connects and creates tables
 */
async function connectDB() {
  const targetDb = dbConfig.database;

  // 1. Try connecting directly to target DB
  try {
    const client = await pool.connect();
    await client.query(CREATE_TABLE_QUERY);
    client.release();
    isConnected = true;
    console.log(`\n==============================================`);
    console.log(`✅ [PostgreSQL] Connected to '${targetDb}' database successfully!`);
    console.log(`✅ [PostgreSQL] 'users' table is ready.`);
    console.log(`==============================================\n`);
    return;
  } catch (err) {
    // If database does not exist (PostgreSQL error 3D000)
    if (err.code === '3D000') {
      console.log(`ℹ️  Database '${targetDb}' not found. Creating it automatically...`);
      try {
        const rootClient = new Client({
          ...dbConfig,
          database: 'postgres',
        });
        await rootClient.connect();
        await rootClient.query(`CREATE DATABASE "${targetDb}";`);
        await rootClient.end();
        console.log(`✅ Database '${targetDb}' created successfully!`);

        // Reconnect with new pool
        pool = new Pool(dbConfig);
        const newClient = await pool.connect();
        await newClient.query(CREATE_TABLE_QUERY);
        newClient.release();
        isConnected = true;
        console.log(`✅ [PostgreSQL] Connected to database '${targetDb}'!`);
        console.log(`✅ [PostgreSQL] 'users' table is ready.\n`);
        return;
      } catch (createErr) {
        console.error('⚠️ Could not auto-create database:', createErr.message);
      }
    }

    isConnected = false;
    console.log(`\n⚠️  [PostgreSQL Notice]: ${err.message}`);
    console.log(`👉 To connect: In Backend/.env, change PG_PASSWORD to the password you set for user '${dbConfig.user}'.`);
    console.log(`ℹ️  Your current PG_USER is '${dbConfig.user}' and current PG_PASSWORD is '${dbConfig.password}'.`);
    console.log(`ℹ️  In the meantime, the backend APIs are running in fallback mode so your frontend works right now!\n`);
  }
}

function query(text, params) {
  return pool.query(text, params);
}

module.exports = connectDB;
module.exports.pool = pool;
module.exports.query = query;
module.exports.isConnected = () => isConnected;
