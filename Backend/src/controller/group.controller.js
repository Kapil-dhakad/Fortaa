const db = require('../db/db');

// Fallback groups for offline/demo resilience
const FALLBACK_GROUPS = [
  {
    id: 1,
    name: 'Fortaa Elite Leaders Group',
    description: 'Official masterminds and top-tier direct sellers collaboration hub across India.',
    category: 'Leadership',
    members: '12.4K members',
    sub: 'Elite leaders community',
    icon_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    is_member: false,
  },
  {
    id: 2,
    name: 'Success Mindset & Motivation',
    description: 'Daily affirmations, goal setting, sales psychology and mindset mentoring for high achievers.',
    category: 'Motivation',
    members: '8.5K members',
    sub: 'Daily growth insights',
    icon_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80',
    is_member: false,
  },
  {
    id: 3,
    name: 'Network Marketing Tips & Hacks',
    description: 'High-conversion prospecting techniques, objection handling, closing scripts & team building.',
    category: 'Direct Selling',
    members: '6.2K members',
    sub: 'Prospecting & sales',
    icon_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80',
    is_member: false,
  },
  {
    id: 4,
    name: 'Health & Wellness Products Hub',
    description: 'Natural nutrition, wellness trends, organic product catalogs, and real customer success stories.',
    category: 'Wellness',
    members: '9.1K members',
    sub: 'Wellness networkers',
    icon_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&auto=format&fit=crop&q=80',
    is_member: false,
  },
  {
    id: 5,
    name: 'Digital Marketing & AI for MLM',
    description: 'Scale your team using automated funnels, social media reels, and AI lead generation tools.',
    category: 'Marketing',
    members: '4.8K members',
    sub: 'Online lead gen',
    icon_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&auto=format&fit=crop&q=80',
    is_member: false,
  },
];

/**
 * Get all groups with membership status for current user
 */
async function getAllGroups(req, res) {
  try {
    const userId = parseInt(req.query.userId || req.userId, 10) || 0;

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, groups: FALLBACK_GROUPS });
    }

    const query = `
      SELECT 
        g.*,
        COALESCE(g.category, 'General') as category,
        COALESCE(g.description, 'Connect and collaborate with industry leaders.') as description,
        COALESCE(g.members, '1 member') as members,
        COUNT(gm.id)::int as actual_members_count,
        CASE 
          WHEN user_gm.id IS NOT NULL THEN TRUE 
          ELSE FALSE 
        END as is_member
      FROM groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id
      LEFT JOIN group_members user_gm ON user_gm.group_id = g.id AND user_gm.user_id = $1
      GROUP BY g.id, user_gm.id
      ORDER BY g.id ASC;
    `;

    const result = await db.query(query, [userId]);

    // If table is completely empty, return fallbacks
    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, groups: FALLBACK_GROUPS });
    }

    return res.status(200).json({
      success: true,
      groups: result.rows,
    });
  } catch (error) {
    console.error('[getAllGroups Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch groups', groups: FALLBACK_GROUPS });
  }
}

/**
 * Join a group
 */
async function joinGroup(req, res) {
  try {
    const { userId, groupId } = req.body;
    const uid = parseInt(userId, 10);
    const gid = parseInt(groupId, 10);

    if (!uid || !gid || isNaN(uid) || isNaN(gid)) {
      return res.status(400).json({ success: false, message: 'Valid userId and groupId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Joined group successfully (demo mode)' });
    }

    await db.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [gid, uid]
    );

    // Update group members text or count
    try {
      const countRes = await db.query('SELECT COUNT(*)::int as count FROM group_members WHERE group_id = $1', [gid]);
      const currentCount = countRes.rows[0]?.count || 1;
      await db.query('UPDATE groups SET members = $1 WHERE id = $2', [`${currentCount} members`, gid]);
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Successfully joined group!',
      groupId: gid,
    });
  } catch (error) {
    console.error('[joinGroup Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to join group' });
  }
}

/**
 * Leave a group
 */
async function leaveGroup(req, res) {
  try {
    const { userId, groupId } = req.body;
    const uid = parseInt(userId, 10);
    const gid = parseInt(groupId, 10);

    if (!uid || !gid || isNaN(uid) || isNaN(gid)) {
      return res.status(400).json({ success: false, message: 'Valid userId and groupId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Left group' });
    }

    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [gid, uid]);

    return res.status(200).json({
      success: true,
      message: 'Left group successfully',
      groupId: gid,
    });
  } catch (error) {
    console.error('[leaveGroup Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
}

/**
 * Create a new group
 */
async function createGroup(req, res) {
  try {
    const { name, description, category, icon_url, userId } = req.body;
    const cleanName = (name || '').trim();
    const uid = parseInt(userId, 10);

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!db.isDBConnected()) {
      const demoGroup = {
        id: Date.now(),
        name: cleanName,
        description: (description || '').trim(),
        category: category || 'Network Marketing',
        icon_url: icon_url || null,
        created_by: uid || null,
        members: '1 member',
        is_member: true,
      };
      return res.status(201).json({ success: true, group: demoGroup, message: 'Group created!' });
    }

    const insertGroupQuery = `
      INSERT INTO groups (name, description, category, icon_url, created_by, members)
      VALUES ($1, $2, $3, $4, $5, '1 member')
      RETURNING *;
    `;

    const groupRes = await db.query(insertGroupQuery, [
      cleanName,
      (description || '').trim(),
      category || 'Network Marketing',
      icon_url || null,
      uid || null,
    ]);

    const createdGroup = groupRes.rows[0];

    // Auto-add creator as admin member
    if (uid) {
      await db.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'admin')
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [createdGroup.id, uid]
      );
    }

    return res.status(201).json({
      success: true,
      group: {
        ...createdGroup,
        is_member: true,
      },
      message: 'Group created successfully!',
    });
  } catch (error) {
    console.error('[createGroup Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create group' });
  }
}

/**
 * Get groups joined & created by a user
 */
async function getUserGroups(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Valid userId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, groups: [], joinedGroups: [], createdGroups: [] });
    }

    // 1. Created Groups (created_by = userId)
    const createdQuery = `
      SELECT 
        g.*,
        COALESCE(g.category, 'General') as category,
        COALESCE(g.description, 'Team collaboration group') as description,
        COALESCE(g.members, '1 member') as members,
        'admin' as member_role,
        TRUE as is_member,
        COALESCE((SELECT COUNT(*)::int FROM group_members WHERE group_id = g.id), 1) as actual_members_count
      FROM groups g
      WHERE g.created_by = $1
      ORDER BY g.id DESC;
    `;
    const createdResult = await db.query(createdQuery, [userId]);

    // 2. Joined Groups (in group_members but NOT created_by)
    const joinedQuery = `
      SELECT 
        g.*,
        COALESCE(g.category, 'General') as category,
        COALESCE(g.description, 'Team collaboration group') as description,
        COALESCE(g.members, '1 member') as members,
        COALESCE(gm.role, 'member') as member_role,
        gm.joined_at,
        TRUE as is_member,
        COALESCE((SELECT COUNT(*)::int FROM group_members WHERE group_id = g.id), 1) as actual_members_count
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1 AND (g.created_by IS NULL OR g.created_by != $1)
      ORDER BY gm.joined_at DESC;
    `;
    const joinedResult = await db.query(joinedQuery, [userId]);

    return res.status(200).json({
      success: true,
      createdGroups: createdResult.rows,
      joinedGroups: joinedResult.rows,
      groups: [...createdResult.rows, ...joinedResult.rows],
    });
  } catch (error) {
    console.error('[getUserGroups Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user groups' });
  }
}

/**
 * Get members of a specific group
 */
async function getGroupMembers(req, res) {
  try {
    const groupId = parseInt(req.params.groupId, 10);
    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({ success: false, message: 'Valid groupId required' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        members: [
          {
            user_id: 1,
            name: 'Demo Admin',
            role: 'admin',
            level_title: 'Crown Ambassador',
            avatar_url: null,
            email: 'admin@fortaa.com',
            joined_at: new Date().toISOString(),
          },
        ],
        total: 1,
      });
    }

    const query = `
      SELECT 
        gm.id as member_record_id,
        gm.group_id,
        gm.role,
        gm.joined_at,
        u.id as user_id,
        COALESCE(u.name, 'Fortaa Member') as name,
        u.avatar_url,
        u.email,
        COALESCE(u.designation, u.business_name, 'Direct Seller') as level_title,
        COALESCE(u.company_brand, 'Fortaa') as company_brand
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = $1
      ORDER BY 
        CASE WHEN gm.role = 'admin' THEN 1 ELSE 2 END,
        gm.joined_at ASC;
    `;

    const result = await db.query(query, [groupId]);

    // Also get group details
    const groupRes = await db.query(
      `SELECT id, name, description, category, icon_url, members, created_at, created_by 
       FROM groups WHERE id = $1`,
      [groupId]
    );

    return res.status(200).json({
      success: true,
      group: groupRes.rows[0] || null,
      members: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[getGroupMembers Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch group members' });
  }
}

module.exports = {
  getAllGroups,
  joinGroup,
  leaveGroup,
  createGroup,
  getUserGroups,
  getGroupMembers,
};
