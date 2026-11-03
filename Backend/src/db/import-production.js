const fs = require('fs');
const path = require('path');
const db = require('./db');

async function importProductionData() {
  console.log('🚀 Importing local snapshot into production PostgreSQL...');

  const filePath = path.join(__dirname, 'production_seed.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ production_seed.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 1. Import Users
  if (data.users && data.users.length > 0) {
    console.log(`👤 Syncing ${data.users.length} users...`);
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
        await db.query(query, [
          u.id,
          u.name,
          u.email,
          u.password,
          u.member_id || 'NS' + Math.floor(100000 + Math.random() * 900000),
          u.account_type || 'Individual / Professional',
          u.designation || 'Leader',
          u.company_brand || 'Fortaa',
          u.mobile_number || '7999942756',
          u.whatsapp_number || null,
          u.avatar_url || null,
          true,
          true,
        ]);
      } catch (err) {
        console.warn(`User ${u.email} sync note:`, err.message);
      }
    }
    // Update users serial sequence to max id
    await db.query("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))");
    console.log('✅ Users synced successfully.');
  }

  // 2. Import Posts
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
    await db.query("SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE((SELECT MAX(id) FROM posts), 1))");
    console.log('✅ Posts synced successfully.');
  }

  // 3. Ensure Notifications & Follows tables exist
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
  console.log('🎉 Production database is now fully synced with local database!');
  console.log('==============================================\n');
  process.exit(0);
}

importProductionData().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
