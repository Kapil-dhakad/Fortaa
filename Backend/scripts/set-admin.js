/**
 * Fortaa Admin User Management Script
 * Usage:
 *   node scripts/set-admin.js <email> <password> [name]
 * Example:
 *   node scripts/set-admin.js admin@fortaa.com Admin@Fortaa2026! "Super Admin"
 */
const bcrypt = require('bcryptjs');
const db = require('../src/db/db');
require('dotenv').config();

async function setAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@fortaa.com').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Admin@Fortaa2026!';
  const name = args[2] || 'Fortaa Admin';

  console.log(`\n========================================`);
  console.log(`Setting up Admin: ${email}`);
  console.log(`========================================\n`);

  try {
    await db(); // Connect to database

    // Ensure role column exists
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`);

    const existing = await db.query('SELECT id, email, role FROM users WHERE LOWER(email) = $1', [email]);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing.rows.length === 0) {
      await db.query(`
        INSERT INTO users (name, email, password, role, designation, account_type, member_id, mobile_verified, email_verified)
        VALUES ($1, $2, $3, 'admin', 'Super Admin', 'Administrator', 'ADMIN001', true, true)
      `, [name, email, hashedPassword]);
      console.log(`✅ Success! Created new Admin user.`);
    } else {
      await db.query(`
        UPDATE users 
        SET password = $1, role = 'admin', designation = 'Super Admin', account_type = 'Administrator'
        WHERE id = $2
      `, [hashedPassword, existing.rows[0].id]);
      console.log(`✅ Success! Updated password and confirmed 'admin' role for existing user.`);
    }

    console.log(`\n----------------------------------------`);
    console.log(`Admin Email   : ${email}`);
    console.log(`Admin Password: ${password}`);
    console.log(`Admin Role    : admin`);
    console.log(`----------------------------------------\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting admin user:', err.message);
    process.exit(1);
  }
}

setAdmin();
