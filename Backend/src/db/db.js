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
  govt_id_url TEXT,
  business_doc_url TEXT,
  catalog_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS govt_id_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_doc_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS catalog_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);

-- Posts Table for User Dashboard Feed
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(150) NOT NULL,
  author_role VARCHAR(100) DEFAULT 'Member',
  author_avatar TEXT,
  content TEXT NOT NULL,
  tags TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_data TEXT;

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(150) NOT NULL,
  author_role VARCHAR(100) DEFAULT 'Member',
  author_avatar TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(100) NOT NULL,
  network VARCHAR(50) DEFAULT '1.2K Network',
  followers VARCHAR(50) DEFAULT '2K Followers',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(150),
  thumb_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Upcoming Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  date VARCHAR(10) NOT NULL,
  month VARCHAR(10) NOT NULL,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Popular Groups Table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  members VARCHAR(50) DEFAULT '1 member',
  sub VARCHAR(100),
  description TEXT,
  category VARCHAR(100) DEFAULT 'Network Marketing',
  icon_url TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Network Marketing';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Group Members Table (Tracks which user joined which group)
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  is_new BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  price VARCHAR(100) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follows Table (Instagram-style follow relationship)
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted';

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Notifications Table (In-app notifications for follow requests, accepts, etc.)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  actor_name VARCHAR(150),
  actor_avatar TEXT,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  ref_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Post Likes Table (Tracks which user liked which post)
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Messages Table (Real-time Socket.io Chat)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by INTEGER[] DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for INTEGER[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`;

/**
 * Seed initial dashboard data if tables are empty
 */
async function seedDashboardData(client) {
  try {
    // 1. Posts seeding disabled - only real user-created posts will be stored and displayed.

    // 2. Seed Trainers (Static support until trainer module is built)
    const trainerCount = await client.query('SELECT COUNT(*) FROM trainers');
    if (parseInt(trainerCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO trainers (name, role, network, followers)
        VALUES 
        ('Neha Gupta', 'Diamond Leader', '1.2 Network', '2K Followers'),
        ('Amit Verma', 'Diamond Leader', '1.2 Network', '5K Followers'),
        ('Vikas Kumar', 'Diamond Leader', '1.2K Network', '1.1K Followers')
      `);
      console.log('✅ [PostgreSQL] Seeded initial trainers.');
    }

    // 3. Seed Services
    const serviceCount = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(serviceCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO services (title, description, location)
        VALUES 
        ('Digital Marketing Specialist', 'Digital Marketing | Graphic Designer | Video Editor | Software Engineer', 'Indore, Madhya Pradesh, India'),
        ('Team Leader', 'Team Management | Marketing / Training | Reporting | Compose Target', 'Rewa, Madhya Pradesh, India'),
        ('Franchise Partner', 'Franchise Opportunity | Business Set up Support | Marketing Support | Brand Licensing', 'France, Paris'),
        ('Wellness Products', 'Health Supplements | Personal Care Products | Herbal Products | Nutrition Products', 'Indore, Madhya Pradesh, India'),
        ('E - Commerce Business', 'Online Store Setup | Product Listing | Order Management | Payment Integration', 'Pune, Maharashtra India'),
        ('Training & Development', 'Professional Skills | Leadership | Sales Training | Career Development', 'Singapore')
      `);
      console.log('✅ [PostgreSQL] Seeded initial services.');
    }

    // 4. Seed Events
    const eventCount = await client.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO events (date, month, title, type)
        VALUES 
        ('20', 'NOV', 'Leadership Summit', 'Online'),
        ('25', 'NOV', 'Industry Networking Meet', 'New Delhi'),
        ('30', 'NOV', 'Business Growth Workshop', 'Online')
      `);
      console.log('✅ [PostgreSQL] Seeded initial events.');
    }

    // 5. Seed Groups
    const groupCount = await client.query('SELECT COUNT(*) FROM groups');
    if (parseInt(groupCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO groups (name, members, sub)
        VALUES 
        ('Success Mindset & Moti...', '12.4K members', '3.8K mindset'),
        ('Network Marketing Tips', '5.7K member', '8.6 mindset'),
        ('Health & Wellness Products', '8.2k member', '6.2K mindset')
      `);
      console.log('✅ [PostgreSQL] Seeded initial groups.');
    }

    // 6. Seed Opportunities
    const oppCount = await client.query('SELECT COUNT(*) FROM opportunities');
    if (parseInt(oppCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO opportunities (title, is_new, tags, price)
        VALUES 
        ('Digital Marketing Specialist', false, ARRAY['Work from Home', 'High Earning'], '₹ 25k - 75k / month'),
        ('Leadership Program', true, ARRAY['Build Team', 'Bonus'], '₹ 50k - 2L / month'),
        ('Health & Wellness Specialist', false, ARRAY['High Demand'], '₹ 10k - 50k / month')
      `);
      console.log('✅ [PostgreSQL] Seeded initial opportunities.');
    }
  } catch (seedErr) {
    console.error('⚠️ [PostgreSQL] Seeding error:', seedErr.message);
  }
}

/**
 * Auto-ensures database exists, then connects and creates tables
 */
async function connectDB() {
  const targetDb = dbConfig.database;

  // 1. Try connecting directly to target DB
  try {
    const client = await pool.connect();
    await client.query(CREATE_TABLE_QUERY);
    await seedDashboardData(client);
    client.release();
    isConnected = true;
    console.log(`\n==============================================`);
    console.log(`✅ [PostgreSQL] Connected to '${targetDb}' database successfully!`);
    console.log(`✅ [PostgreSQL] Dashboard tables & users table are ready.`);
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
module.exports.isDBConnected = () => isConnected;
module.exports.isConnected = () => isConnected;
