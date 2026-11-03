const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function importProductionData() {
  console.log('🚀 Syncing database for live production...');

  // 1. Ensure all columns exist on users table
  console.log('🔧 Ensuring all users table columns exist...');
  const alterColumns = [
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(100) DEFAULT \'Individual / Professional\';',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_id VARCHAR(100);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(150);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS company_brand VARCHAR(150);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS experience VARCHAR(100);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS website_social VARCHAR(255);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT TRUE;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS govt_id_url TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS business_doc_url TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS catalog_url TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(150);',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);',
  ];

  for (const q of alterColumns) {
    try {
      await db.query(q);
    } catch (err) {
      console.warn('Column note:', err.message);
    }
  }

  // 2. Read snapshot
  const filePath = path.join(__dirname, 'production_seed.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ production_seed.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Standard universal password hash for Kapil@123
  const kapil123Hash = await bcrypt.hash('Kapil@123', 10);

  // 3. Import Users
  if (data.users && data.users.length > 0) {
    console.log(`👤 Syncing ${data.users.length} users with password Kapil@123...`);
    for (const u of data.users) {
      try {
        const query = `
          INSERT INTO users (
            id, name, email, password, member_id, account_type, designation, company_brand,
            mobile_number, whatsapp_number, avatar_url, mobile_verified, email_verified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (email) 
          DO UPDATE SET 
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            designation = EXCLUDED.designation,
            company_brand = EXCLUDED.company_brand,
            mobile_number = EXCLUDED.mobile_number,
            avatar_url = EXCLUDED.avatar_url;
        `;

        // Use Kapil@123 for all users so any user can be logged into with Kapil@123
        const userPassword = kapil123Hash;

        await db.query(query, [
          u.id,
          u.name,
          u.email.toLowerCase().trim(),
          userPassword,
          u.member_id || 'NS' + Math.floor(100000 + Math.random() * 900000),
          u.account_type || 'Individual / Professional',
          u.designation || 'Leader',
          u.company_brand || 'Fortaa',
          u.mobile_number || '7999942756',
          u.whatsapp_number || '7999942756',
          u.avatar_url || null,
          true,
          true,
        ]);
      } catch (err) {
        console.warn(`User ${u.email} sync note:`, err.message);
      }
    }
    try {
      await db.query("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))");
    } catch (_) {}
    console.log('✅ Users synced successfully.');
  }

  // 4. Ensure Posts table & import
  if (data.posts && data.posts.length > 0) {
    console.log(`📝 Syncing ${data.posts.length} posts...`);
    for (const p of data.posts) {
      try {
        const query = `
          INSERT INTO posts (
            id, user_id, author_name, author_role, author_avatar, content, tags, image_url, likes_count, comments_count, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            author_name = EXCLUDED.author_name,
            content = EXCLUDED.content;
        `;
        await db.query(query, [
          p.id,
          p.user_id,
          p.author_name,
          p.author_role,
          p.author_avatar,
          p.content,
          p.tags,
          p.image_url,
          p.likes_count || 0,
          p.comments_count || 0,
          p.created_at || new Date(),
        ]);
      } catch (err) {
        console.warn(`Post ${p.id} sync note:`, err.message);
      }
    }
    try {
      await db.query("SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1))");
    } catch (_) {}
    console.log('✅ Posts synced successfully.');
  }

  // 5. Ensure Follows & Notifications tables
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'accepted',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (follower_id, following_id)
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_name VARCHAR(100),
        actor_avatar TEXT,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        ref_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Follows & notifications tables verified.');
  } catch (err) {
    console.warn('Tables check note:', err.message);
  }

  console.log('\n==============================================');
  console.log('🎉 Production database is now fully populated!');
  console.log('👉 Users can login with password: Kapil@123');
  console.log('==============================================\n');
  process.exit(0);
}

importProductionData().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
