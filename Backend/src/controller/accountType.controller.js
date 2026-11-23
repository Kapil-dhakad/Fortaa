const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: String(process.env.PG_PASSWORD || 'postgres'),
  database: process.env.PG_DATABASE || 'fortaa',
});

/**
 * 1. Public API: Get Active Account Types (for Signup Page Step 1)
 * GET /api/account-types
 */
async function getPublicAccountTypes(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, title, description, icon, is_active, display_order 
       FROM account_types 
       WHERE is_active = true 
       ORDER BY display_order ASC, id ASC;`
    );

    return res.status(200).json({
      success: true,
      accountTypes: result.rows,
    });
  } catch (err) {
    console.error('Error fetching public account types:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch account types.',
      error: err.message,
    });
  }
}

/**
 * 2. Admin API: Get All Account Types (including inactive)
 * GET /api/account-types/all
 */
async function getAllAccountTypes(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, title, description, icon, is_active, display_order, created_at, updated_at 
       FROM account_types 
       ORDER BY display_order ASC, id ASC;`
    );

    return res.status(200).json({
      success: true,
      accountTypes: result.rows,
    });
  } catch (err) {
    console.error('Error fetching admin account types:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all account types.',
      error: err.message,
    });
  }
}

/**
 * 3. Admin API: Create a New Account Type
 * POST /api/account-types
 */
async function createAccountType(req, res) {
  try {
    const { title, description, icon = 'user', is_active = true, display_order = 0 } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Account type title is required.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Account type description is required.',
      });
    }

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanIcon = (icon && icon.trim()) ? icon.trim().toLowerCase() : 'user';
    const isActiveBool = is_active !== false;
    const orderNum = parseInt(display_order, 10) || 0;

    const insertResult = await pool.query(
      `INSERT INTO account_types (title, description, icon, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [cleanTitle, cleanDesc, cleanIcon, isActiveBool, orderNum]
    );

    const createdItem = insertResult.rows[0];

    // Socket notification
    try {
      const io = req.app.get('io');
      if (io) io.emit('account_types_updated', { action: 'create', item: createdItem });
    } catch {}

    return res.status(201).json({
      success: true,
      message: 'New account type created successfully.',
      accountType: createdItem,
    });
  } catch (err) {
    console.error('Error creating account type:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account type.',
      error: err.message,
    });
  }
}

/**
 * 4. Admin API: Update an Existing Account Type
 * PUT /api/account-types/:id
 */
async function updateAccountType(req, res) {
  try {
    const { id } = req.params;
    const { title, description, icon, is_active, display_order } = req.body;

    const existingRes = await pool.query('SELECT * FROM account_types WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found.',
      });
    }

    const existing = existingRes.rows[0];
    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newDesc = description !== undefined ? String(description).trim() : existing.description;
    const newIcon = icon !== undefined ? String(icon).trim().toLowerCase() : existing.icon;
    const newIsActive = is_active !== undefined ? Boolean(is_active) : existing.is_active;
    const newOrder = display_order !== undefined ? parseInt(display_order, 10) : existing.display_order;

    const updateRes = await pool.query(
      `UPDATE account_types
       SET title = $1, description = $2, icon = $3, is_active = $4, display_order = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *;`,
      [newTitle, newDesc, newIcon, newIsActive, newOrder, id]
    );

    const updatedItem = updateRes.rows[0];

    // Socket notification
    try {
      const io = req.app.get('io');
      if (io) io.emit('account_types_updated', { action: 'update', item: updatedItem });
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Account type updated successfully.',
      accountType: updatedItem,
    });
  } catch (err) {
    console.error('Error updating account type:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account type.',
      error: err.message,
    });
  }
}

/**
 * 5. Admin API: Delete an Account Type
 * DELETE /api/account-types/:id
 */
async function deleteAccountType(req, res) {
  try {
    const { id } = req.params;

    const delRes = await pool.query('DELETE FROM account_types WHERE id = $1 RETURNING *;', [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found.',
      });
    }

    // Socket notification
    try {
      const io = req.app.get('io');
      if (io) io.emit('account_types_updated', { action: 'delete', id: parseInt(id, 10) });
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Account type deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting account type:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account type.',
      error: err.message,
    });
  }
}

module.exports = {
  getPublicAccountTypes,
  getAllAccountTypes,
  createAccountType,
  updateAccountType,
  deleteAccountType,
};
