const path = require('path');
const backendDir = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(backendDir, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'postgres'),
  database: process.env.PG_DATABASE || 'fortaa',
});

async function cleanDatabase() {
  const wipeAll = process.argv.includes('--all');

  console.log(`\n======================================================`);
  console.log(`🧹 Fortaa Database Cleanup Script`);
  console.log(`Mode: ${wipeAll ? 'FULL WIPE (All tables)' : 'Implemented Features Wipe (Users, Posts, Likes, Follows, Chat, Notifications)'}`);
  console.log(`Database: ${process.env.PG_DATABASE || 'fortaa'}`);
  console.log(`======================================================\n`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (wipeAll) {
      await client.query(`
        TRUNCATE TABLE 
          notifications,
          messages,
          post_likes,
          posts,
          follow_requests,
          follows,
          users,
          opportunities,
          events,
          groups,
          services,
          trainers
        RESTART IDENTITY CASCADE;
      `);
      console.log('✅ ALL tables truncated and IDs reset to 1.');
    } else {
      await client.query(`
        TRUNCATE TABLE 
          notifications,
          messages,
          post_likes,
          posts,
          follow_requests,
          follows,
          users
        RESTART IDENTITY CASCADE;
      `);
      console.log('✅ Implemented feature tables truncated (users, posts, post_likes, follows, follow_requests, messages, notifications).');
      console.log('ℹ️ Static showcase tables (events, groups, opportunities, services, trainers) kept intact.');
    }

    await client.query('COMMIT');

    // Report remaining counts
    const tables = ['users', 'posts', 'post_likes', 'follows', 'follow_requests', 'messages', 'notifications'];
    console.log('\n--- Verified Table Counts ---');
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`  • ${t}: ${res.rows[0].count} rows`);
    }
    console.log('-----------------------------\n');
    console.log('✨ Cleanup complete! Database is fresh and ready for live users.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
