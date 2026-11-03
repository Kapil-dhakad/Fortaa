const path = require('path');
const fs = require('fs');
const db = require('./db');

async function syncData() {
  const backupPath = path.join(__dirname, 'local_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('local_backup.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  console.log('🔄 Syncing local data into target database...');

  // 1. Sync Users
  if (data.users && data.users.length > 0) {
    for (const u of data.users) {
      await db.query(
        `INSERT INTO users (
          id, member_id, account_type, name, email, password,
          mobile_number, whatsapp_number, dob, gender, referral_id,
          business_name, company_brand, business_category,
          designation, experience, website_social,
          mobile_verified, email_verified, avatar_url, bio, location, skills
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20, $21, $22, $23
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          designation = EXCLUDED.designation,
          company_brand = EXCLUDED.company_brand,
          avatar_url = EXCLUDED.avatar_url`,
        [
          u.id, u.member_id, u.account_type, u.name, u.email, u.password,
          u.mobile_number, u.whatsapp_number, u.dob, u.gender, u.referral_id,
          u.business_name, u.company_brand, u.business_category,
          u.designation, u.experience, u.website_social,
          u.mobile_verified, u.email_verified, u.avatar_url, u.bio, u.location, u.skills
        ]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users`);
    console.log(`✅ Synced ${data.users.length} users.`);
  }

  // 2. Sync Posts
  if (data.posts && data.posts.length > 0) {
    for (const p of data.posts) {
      await db.query(
        `INSERT INTO posts (
          id, user_id, author_name, author_role, author_avatar,
          content, tags, image_url, likes_count, comments_count, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          author_name = EXCLUDED.author_name,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          image_url = EXCLUDED.image_url`,
        [
          p.id, p.user_id, p.author_name, p.author_role, p.author_avatar,
          p.content, p.tags, p.image_url, p.likes_count, p.comments_count, p.created_at
        ]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE(MAX(id), 1)) FROM posts`);
    console.log(`✅ Synced ${data.posts.length} posts.`);
  }

  // 3. Sync Trainers
  if (data.trainers && data.trainers.length > 0) {
    for (const t of data.trainers) {
      await db.query(
        `INSERT INTO trainers (id, name, role, network, followers, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name, t.role, t.network, t.followers, t.avatar_url]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('trainers', 'id'), COALESCE(MAX(id), 1)) FROM trainers`);
    console.log(`✅ Synced ${data.trainers.length} trainers.`);
  }

  // 4. Sync Services
  if (data.services && data.services.length > 0) {
    for (const s of data.services) {
      await db.query(
        `INSERT INTO services (id, title, description, location, thumb_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.title, s.description, s.location, s.thumb_url]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE(MAX(id), 1)) FROM services`);
    console.log(`✅ Synced ${data.services.length} services.`);
  }

  // 5. Sync Events
  if (data.events && data.events.length > 0) {
    for (const e of data.events) {
      await db.query(
        `INSERT INTO events (id, date, month, title, type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.date, e.month, e.title, e.type]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(MAX(id), 1)) FROM events`);
    console.log(`✅ Synced ${data.events.length} events.`);
  }

  // 6. Sync Groups
  if (data.groups && data.groups.length > 0) {
    for (const g of data.groups) {
      await db.query(
        `INSERT INTO groups (id, name, members, sub)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.name, g.members, g.sub]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('groups', 'id'), COALESCE(MAX(id), 1)) FROM groups`);
    console.log(`✅ Synced ${data.groups.length} groups.`);
  }

  // 7. Sync Opportunities
  if (data.opportunities && data.opportunities.length > 0) {
    for (const o of data.opportunities) {
      await db.query(
        `INSERT INTO opportunities (id, title, is_new, tags, price, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [o.id, o.title, o.is_new, o.tags, o.price, o.image_url]
      );
    }
    await db.query(`SELECT setval(pg_get_serial_sequence('opportunities', 'id'), COALESCE(MAX(id), 1)) FROM opportunities`);
    console.log(`✅ Synced ${data.opportunities.length} opportunities.`);
  }

  console.log('🎉 All local database tables successfully synced to target database!');
  process.exit(0);
}

syncData().catch((err) => {
  console.error('Sync error:', err);
  process.exit(1);
});
