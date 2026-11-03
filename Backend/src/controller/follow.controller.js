const db = require('../db/db');

/**
 * Toggle Follow / Unfollow a user
 */
async function toggleFollow(req, res) {
  try {
    const targetUserId = parseInt(req.params.targetUserId, 10);
    const followerId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid target user ID' });
    }
    if (!followerId || isNaN(followerId)) {
      return res.status(400).json({ success: false, message: 'Current user ID is required' });
    }
    if (followerId === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        isFollowing: true,
        message: 'Follow updated (offline mode)',
      });
    }

    // Check if target user exists
    const targetCheck = await db.query('SELECT id, name FROM users WHERE id = $1', [targetUserId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Check if already following
    const checkRes = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    let isFollowing = false;
    let message = '';

    if (checkRes.rows.length > 0) {
      // Unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, targetUserId]
      );
      isFollowing = false;
      message = `Unfollowed ${targetCheck.rows[0].name}`;
    } else {
      // Follow
      await db.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [followerId, targetUserId]
      );
      isFollowing = true;
      message = `You are now following ${targetCheck.rows[0].name}`;
    }

    // Get updated counts
    const followerCountRes = await db.query(
      'SELECT COUNT(*) FROM follows WHERE following_id = $1',
      [targetUserId]
    );
    const followingCountRes = await db.query(
      'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
      [followerId]
    );

    return res.status(200).json({
      success: true,
      isFollowing,
      message,
      targetFollowers: parseInt(followerCountRes.rows[0].count, 10),
      currentFollowing: parseInt(followingCountRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('toggleFollow error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating follow status' });
  }
}

/**
 * Get list of followers for a user
 */
async function getFollowers(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, followers: [] });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, COALESCE(u.designation, 'Leader') as designation, 
              COALESCE(u.company_brand, 'Fortaa') as company_brand, u.member_id, f.created_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      followers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('getFollowers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch followers' });
  }
}

/**
 * Get list of users followed by a user
 */
async function getFollowing(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, following: [] });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, COALESCE(u.designation, 'Leader') as designation, 
              COALESCE(u.company_brand, 'Fortaa') as company_brand, u.member_id, f.created_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      following: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('getFollowing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch following' });
  }
}

/**
 * Get array of IDs that the current user is following
 */
async function getFollowingIds(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(200).json({ success: true, followingIds: [] });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, followingIds: [] });
    }

    const result = await db.query(
      'SELECT following_id FROM follows WHERE follower_id = $1',
      [userId]
    );

    const followingIds = result.rows.map((r) => r.following_id);
    return res.status(200).json({ success: true, followingIds });
  } catch (error) {
    console.error('getFollowingIds error:', error);
    return res.status(200).json({ success: true, followingIds: [] });
  }
}

/**
 * Get real counts for a user's profile
 */
async function getUserSocialCounts(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });
    }

    const userRes = await db.query('SELECT member_id FROM users WHERE id = $1', [userId]);
    const memberId = userRes.rows[0]?.member_id;

    const [followersRes, followingRes, postsRes, networkRes] = await Promise.all([
      db.query('SELECT COUNT(*) FROM follows WHERE following_id = $1', [userId]),
      db.query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [userId]),
      db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]),
      memberId
        ? db.query('SELECT COUNT(*) FROM users WHERE referral_id = $1', [memberId])
        : Promise.resolve({ rows: [{ count: 0 }] }),
    ]);

    return res.status(200).json({
      success: true,
      followersCount: parseInt(followersRes.rows[0].count, 10),
      followingCount: parseInt(followingRes.rows[0].count, 10),
      postsCount: parseInt(postsRes.rows[0].count, 10),
      networkCount: parseInt(networkRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('getUserSocialCounts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch counts' });
  }
}

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowingIds,
  getUserSocialCounts,
};
