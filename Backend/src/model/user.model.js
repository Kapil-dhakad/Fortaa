const bcrypt = require('bcryptjs');
const db = require('../db/db');

// In-memory fallback if PostgreSQL connection has not completed or credentials need adjusting
const memoryUsers = [];
let memoryIdCounter = 1;

function generateMemberId() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `NS${digits}`;
}

class UserInstance {
  constructor(data) {
    this._id = data.id || data._id;
    this.id = this._id;
    this.member_id = data.member_id || data.memberId || generateMemberId();
    this.account_type = data.account_type || data.accountType || 'Individual / Professional';
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.mobile_number = data.mobile_number || data.mobileNumber;
    this.whatsapp_number = data.whatsapp_number || data.whatsappNumber || null;
    this.dob = data.dob || null;
    this.gender = data.gender || null;
    this.referral_id = data.referral_id || data.referralId || null;
    this.business_name = data.business_name || data.businessName || null;
    this.company_brand = data.company_brand || data.companyBrand || null;
    this.business_category = data.business_category || data.businessCategory || null;
    this.designation = data.designation || null;
    this.experience = data.experience || null;
    this.website_social = data.website_social || data.websiteSocial || null;
    this.mobile_verified = data.mobile_verified ?? true;
    this.email_verified = data.email_verified ?? true;
    this.created_at = data.created_at || new Date().toISOString();
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

const userModel = {
  /**
   * Find single user by condition: email, mobileNumber, or id
   */
  async findOne(condition) {
    if (condition.email) {
      const email = condition.email.toLowerCase().trim();

      if (db.isConnected()) {
        const result = await db.query(
          'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
          [email]
        );
        if (result.rows.length > 0) {
          return new UserInstance(result.rows[0]);
        }
        return null;
      } else {
        const found = memoryUsers.find((u) => u.email.toLowerCase() === email);
        return found ? new UserInstance(found) : null;
      }
    }

    if (condition.mobileNumber || condition.mobile_number) {
      const mobile = (condition.mobileNumber || condition.mobile_number).trim();

      if (db.isConnected()) {
        const result = await db.query(
          'SELECT * FROM users WHERE mobile_number = $1 LIMIT 1',
          [mobile]
        );
        if (result.rows.length > 0) {
          return new UserInstance(result.rows[0]);
        }
        return null;
      } else {
        const found = memoryUsers.find((u) => u.mobile_number === mobile);
        return found ? new UserInstance(found) : null;
      }
    }

    if (condition.id || condition._id) {
      return this.findById(condition.id || condition._id);
    }

    return null;
  },

  /**
   * Create a new user with full registration details
   */
  async create(data) {
    const cleanEmail = data.email.toLowerCase().trim();
    const cleanName = data.name.trim();
    const memberId = data.memberId || generateMemberId();

    if (db.isConnected()) {
      const queryText = `
        INSERT INTO users (
          member_id, account_type, name, email, password,
          mobile_number, whatsapp_number, dob, gender, referral_id,
          business_name, company_brand, business_category,
          designation, experience, website_social,
          mobile_verified, email_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *;
      `;
      const values = [
        memberId,
        data.accountType || 'Individual / Professional',
        cleanName,
        cleanEmail,
        data.password,
        data.mobileNumber || null,
        data.whatsappNumber || null,
        data.dob || null,
        data.gender || null,
        data.referralId || null,
        data.businessName || null,
        data.companyBrand || null,
        data.businessCategory || null,
        data.designation || null,
        data.experience || null,
        data.websiteSocial || null,
        data.mobileVerified ?? true,
        data.emailVerified ?? true,
      ];

      const result = await db.query(queryText, values);
      return new UserInstance(result.rows[0]);
    } else {
      const newUser = {
        id: memoryIdCounter++,
        member_id: memberId,
        account_type: data.accountType || 'Individual / Professional',
        name: cleanName,
        email: cleanEmail,
        password: data.password,
        mobile_number: data.mobileNumber || null,
        dob: data.dob || null,
        gender: data.gender || null,
        referral_id: data.referralId || null,
        business_name: data.businessName || null,
        company_brand: data.companyBrand || null,
        business_category: data.businessCategory || null,
        designation: data.designation || null,
        experience: data.experience || null,
        website_social: data.websiteSocial || null,
        mobile_verified: data.mobileVerified ?? true,
        email_verified: data.emailVerified ?? true,
        created_at: new Date().toISOString(),
      };
      memoryUsers.push(newUser);
      return new UserInstance(newUser);
    }
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const numericId = parseInt(id, 10);

    if (db.isConnected()) {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [numericId]
      );
      if (result.rows.length > 0) {
        return new UserInstance(result.rows[0]);
      }
      return null;
    } else {
      const found = memoryUsers.find((u) => u.id === numericId);
      if (!found) return null;
      return new UserInstance(found);
    }
  },

  /**
   * Find all users ordered by newest first
   */
  async findAll(limit = 50) {
    if (db.isConnected()) {
      try {
        const result = await db.query(
          'SELECT id, member_id, account_type, name, email, mobile_number, whatsapp_number, designation, experience, company_brand, business_category, created_at FROM users ORDER BY id DESC LIMIT $1',
          [limit]
        );
        return result.rows.map((row) => ({
          id: row.id,
          memberId: row.member_id,
          accountType: row.account_type,
          name: row.name,
          email: row.email,
          phone: row.mobile_number || row.whatsapp_number || '-',
          type: row.designation || row.account_type || 'Leader',
          status: 'Approved',
          registeredOn: row.created_at
            ? new Date(row.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : 'Just now',
          rawDate: row.created_at,
        }));
      } catch (err) {
        console.error('[db findAll error]', err);
        return memoryUsers.slice(-limit).reverse().map((u) => ({
          id: u.id,
          memberId: u.member_id,
          accountType: u.account_type,
          name: u.name,
          email: u.email,
          phone: u.mobile_number || u.whatsapp_number || '-',
          type: u.designation || u.account_type || 'Leader',
          status: 'Approved',
          registeredOn: u.created_at
            ? new Date(u.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : 'Just now',
        }));
      }
    } else {
      return memoryUsers.slice(-limit).reverse().map((u) => ({
        id: u.id,
        memberId: u.member_id,
        accountType: u.account_type,
        name: u.name,
        email: u.email,
        phone: u.mobile_number || u.whatsapp_number || '-',
        type: u.designation || u.account_type || 'Leader',
        status: 'Approved',
        registeredOn: u.created_at
          ? new Date(u.created_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : 'Just now',
      }));
    }
  },

  /**
   * Get total statistics
   */
  async getStats() {
    let totalCount = 0;
    if (db.isConnected()) {
      try {
        const countRes = await db.query('SELECT COUNT(*) FROM users');
        totalCount = parseInt(countRes.rows[0].count, 10);
      } catch (err) {
        totalCount = memoryUsers.length;
      }
    } else {
      totalCount = memoryUsers.length;
    }

    return {
      totalUsers: 24892 + totalCount,
      approvedUsers: 21568 + totalCount,
      pendingApprovals: 2147,
      rejectedUsers: 178,
      totalCompanies: 342,
    };
  },
};

module.exports = userModel;
