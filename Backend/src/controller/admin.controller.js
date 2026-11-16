const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── Admin Dedicated Login API (OWASP Generic Error on Failure) ───
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (!db.isDBConnected()) {
      // Fallback check against environment variables if DB is momentarily disconnected
      const envEmail = (process.env.ADMIN_EMAIL || 'admin@fortaa.com').toLowerCase();
      const envPassword = process.env.ADMIN_PASSWORD || 'Admin@Fortaa2026!';
      if (cleanEmail === envEmail && password === envPassword) {
        const token = jwt.sign(
          { id: 1, email: envEmail, role: 'admin' },
          process.env.JWT_SECRET || 'fortaa_super_secret_jwt_key_2026',
          { expiresIn: '7d' }
        );
        return res.status(200).json({
          success: true,
          message: 'Admin logged in successfully',
          token,
          user: {
            id: 1,
            name: 'Fortaa Admin',
            email: envEmail,
            role: 'admin',
            designation: 'Super Admin',
          },
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      // Option 2 Generic error: doesn't reveal whether user exists
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    // Check role: must be admin
    if (user.role !== 'admin') {
      // Option 2 Generic error: non-admin users get identical invalid message
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Issue JWT token with admin role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'admin', memberId: user.member_id },
      process.env.JWT_SECRET || 'fortaa_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name || 'Fortaa Admin',
        email: user.email,
        role: 'admin',
        designation: user.designation || 'Super Admin',
      },
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
}

// ─── Admin Dashboard Stats (Real data from DB) ───
async function getAdminDashboardStats(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        stats: {
          totalUsers: 0,
          totalCompanies: 0,
          totalProducts: 0,
          totalEvents: 0,
          totalPosts: 0,
          totalGroups: 0,
        },
      });
    }

    const [
      usersRes,
      postsRes,
      eventsRes,
      groupsRes,
      servicesRes,
      opportunitiesRes,
      trainersRes,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM posts'),
      db.query('SELECT COUNT(*) FROM events'),
      db.query('SELECT COUNT(*) FROM groups'),
      db.query('SELECT COUNT(*) FROM services'),
      db.query('SELECT COUNT(*) FROM opportunities'),
      db.query('SELECT COUNT(*) FROM trainers'),
    ]);

    // Get counts from last month for trend calculation
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthAgoStr = oneMonthAgo.toISOString();

    const [usersLastMonthRes, postsLastMonthRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [monthAgoStr]),
      db.query('SELECT COUNT(*) FROM posts WHERE created_at >= $1', [monthAgoStr]),
    ]);

    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    const totalPosts = parseInt(postsRes.rows[0].count, 10);
    const totalEvents = parseInt(eventsRes.rows[0].count, 10);
    const totalGroups = parseInt(groupsRes.rows[0].count, 10);
    const totalServices = parseInt(servicesRes.rows[0].count, 10);
    const totalOpportunities = parseInt(opportunitiesRes.rows[0].count, 10);
    const totalTrainers = parseInt(trainersRes.rows[0].count, 10);
    const newUsersThisMonth = parseInt(usersLastMonthRes.rows[0].count, 10);
    const newPostsThisMonth = parseInt(postsLastMonthRes.rows[0].count, 10);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies: totalGroups,     // groups as company proxy
        totalProducts: totalOpportunities + totalServices,
        totalEvents,
        totalPosts,
        totalGroups,
        totalServices,
        totalOpportunities,
        totalTrainers,
        newUsersThisMonth,
        newPostsThisMonth,
      },
    });
  } catch (error) {
    console.error('getAdminDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Recent Activities (Real from DB) ───
async function getAdminRecentActivities(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, activities: [] });
    }

    // Combine recent users, posts, events, groups into a unified activity feed
    const activities = [];

    // New user registrations
    const newUsers = await db.query(
      `SELECT id, name, created_at FROM users ORDER BY created_at DESC LIMIT 5`
    );
    for (const u of newUsers.rows) {
      activities.push({
        icon: '👤',
        title: 'New user registered',
        desc: u.name + ' joined as Member',
        time: u.created_at,
        color: '#8B5CF6',
        type: 'user',
      });
    }

    // New posts
    const newPosts = await db.query(
      `SELECT id, author_name, content, created_at FROM posts ORDER BY created_at DESC LIMIT 3`
    );
    for (const p of newPosts.rows) {
      activities.push({
        icon: '📝',
        title: 'New post created',
        desc: p.author_name + ': ' + (p.content || '').substring(0, 40),
        time: p.created_at,
        color: '#3B82F6',
        type: 'post',
      });
    }

    // New groups
    const newGroups = await db.query(
      `SELECT id, name, created_at FROM groups ORDER BY created_at DESC LIMIT 2`
    );
    for (const g of newGroups.rows) {
      activities.push({
        icon: '🏢',
        title: 'New group/company added',
        desc: g.name,
        time: g.created_at,
        color: '#EC4899',
        type: 'company',
      });
    }

    // Sort all activities by time desc and limit to 7
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const topActivities = activities.slice(0, 7);

    // Format relative time
    const now = new Date();
    for (const act of topActivities) {
      const diff = Math.floor((now - new Date(act.time)) / 1000);
      if (diff < 60) act.timeAgo = diff + ' sec ago';
      else if (diff < 3600) act.timeAgo = Math.floor(diff / 60) + ' min ago';
      else if (diff < 86400) act.timeAgo = Math.floor(diff / 3600) + ' hour ago';
      else act.timeAgo = Math.floor(diff / 86400) + ' days ago';
    }

    return res.status(200).json({ success: true, activities: topActivities });
  } catch (error) {
    console.error('getAdminRecentActivities error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Latest Users (for the leads table) ───
async function getAdminLatestUsers(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, users: [] });
    }

    const result = await db.query(
      `SELECT id, name, email, mobile_number, avatar_url, 
              COALESCE(designation, 'Member') as designation,
              created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );

    return res.status(200).json({ success: true, users: result.rows });
  } catch (error) {
    console.error('getAdminLatestUsers error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Top Categories (business_category from users) ───
async function getAdminTopCategories(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, categories: [] });
    }

    const result = await db.query(
      `SELECT business_category AS name, COUNT(*) AS count
       FROM users 
       WHERE business_category IS NOT NULL AND business_category != ''
       GROUP BY business_category
       ORDER BY count DESC
       LIMIT 6`
    );

    const categories = result.rows.map((r, i) => ({
      id: i + 1,
      name: r.name,
      count: parseInt(r.count, 10),
      status: 'Active',
    }));

    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('getAdminTopCategories error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Latest Groups/Companies ───
async function getAdminLatestCompanies(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, companies: [] });
    }

    const result = await db.query(
      `SELECT g.id, g.name, g.category, g.icon_url, g.members, g.created_at,
              COALESCE(u.name, 'Admin') AS created_by_name
       FROM groups g
       LEFT JOIN users u ON u.id = g.created_by
       ORDER BY g.created_at DESC
       LIMIT 6`
    );

    return res.status(200).json({ success: true, companies: result.rows });
  } catch (error) {
    console.error('getAdminLatestCompanies error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Recent Events ───
async function getAdminRecentEvents(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, events: [] });
    }

    const result = await db.query(
      `SELECT id, date, month, title, type, created_at
       FROM events
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return res.status(200).json({ success: true, events: result.rows });
  } catch (error) {
    console.error('getAdminRecentEvents error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Platform Statistics ───
async function getAdminPlatformStats(req, res) {
  try {
    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        platformStats: {
          totalPageViews: 0,
          totalClicks: 0,
          conversionRate: '0%',
          activeUsers: 0,
        },
      });
    }

    const [usersRes, postsRes, likesRes, commentsRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM posts'),
      db.query('SELECT COUNT(*) FROM post_likes'),
      db.query('SELECT COUNT(*) FROM post_comments'),
    ]);

    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    const totalPosts = parseInt(postsRes.rows[0].count, 10);
    const totalLikes = parseInt(likesRes.rows[0].count, 10);
    const totalComments = parseInt(commentsRes.rows[0].count, 10);

    // Derive metrics from actual engagement data
    const totalInteractions = totalLikes + totalComments;
    const conversionRate = totalUsers > 0
      ? ((totalInteractions / totalUsers) * 100).toFixed(1)
      : '0';

    // Active users = users who posted or liked in the last 30 days
    let activeUsers = totalUsers;
    try {
      const activeRes = await db.query(
        `SELECT COUNT(DISTINCT user_id) FROM (
           SELECT user_id FROM posts WHERE created_at >= NOW() - INTERVAL '30 days' AND user_id IS NOT NULL
           UNION
           SELECT user_id FROM post_likes WHERE created_at >= NOW() - INTERVAL '30 days'
           UNION
           SELECT user_id FROM post_comments WHERE created_at >= NOW() - INTERVAL '30 days' AND user_id IS NOT NULL
         ) active_users`
      );
      activeUsers = parseInt(activeRes.rows[0].count, 10);
    } catch (e) {
      // fallback
    }

    return res.status(200).json({
      success: true,
      platformStats: {
        totalPageViews: totalPosts * 15 + totalLikes * 3, // estimated
        totalClicks: totalLikes + totalComments,
        conversionRate: conversionRate + '%',
        activeUsers,
      },
    });
  } catch (error) {
    console.error('getAdminPlatformStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  adminLogin,
  getAdminDashboardStats,
  getAdminRecentActivities,
  getAdminLatestUsers,
  getAdminTopCategories,
  getAdminLatestCompanies,
  getAdminRecentEvents,
  getAdminPlatformStats,
};
