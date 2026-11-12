const db = require('../db/db');
const { getIO } = require('../socket/chat.socket');

/**
 * Send a Follow Request (Status: 'pending')
 */
async function sendFollowRequest(req, res) {
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
        status: 'pending',
        message: 'Follow request sent (offline mode)',
      });
    }

    // Check target user
    const targetRes = await db.query('SELECT id, name FROM users WHERE id = $1', [targetUserId]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }
    const targetName = targetRes.rows[0].name;

    // Check follower user info
    const followerRes = await db.query('SELECT id, name, avatar_url FROM users WHERE id = $1', [followerId]);
    const followerName = followerRes.rows[0]?.name || 'Someone';
    const followerAvatar = followerRes.rows[0]?.avatar_url || '';

    // Check existing follow relationship
    const existing = await db.query(
      'SELECT id, status FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    if (existing.rows.length > 0) {
      const currentStatus = existing.rows[0].status || 'accepted';
      return res.status(200).json({
        success: true,
        status: currentStatus,
        message: currentStatus === 'pending' ? 'Follow request already sent' : 'Already following',
      });
    }

    // Insert follow request as 'pending'
    const insertRes = await db.query(
      'INSERT INTO follows (follower_id, following_id, status) VALUES ($1, $2, $3) RETURNING id',
      [followerId, targetUserId, 'pending']
    );
    const followId = insertRes.rows[0].id;

    // Create Notification for target user
    await db.query(
      `INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, message, ref_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        targetUserId,
        followerId,
        followerName,
        followerAvatar,
        'follow_request',
        `${followerName} sent you a follow request.`,
        followId,
      ]
    );

    // Real-time socket notification to target user
    try {
      const io = req.app?.get('io') || getIO();
      if (io) {
        const payload = {
          requesterId: followerId,
          requesterName: followerName,
          requesterAvatar: followerAvatar,
          message: `${followerName} sent you a follow request.`,
          type: 'follow_request',
        };
        const targetRoom = `room_${String(targetUserId).trim()}`;
        io.to(targetRoom).emit('follow_request_received', payload);
        io.to(targetRoom).emit('new_notification', payload);
        io.to(targetRoom).emit('follow_updated', { followerId, targetUserId, status: 'pending' });
        io.to(`room_${targetUserId}`).emit('follow_request_received', payload);
        io.to(`room_${targetUserId}`).emit('new_notification', payload);
        io.to(`room_${targetUserId}`).emit('follow_updated', { followerId, targetUserId, status: 'pending' });
        io.to(`room_${followerId}`).emit('follow_updated', { followerId, targetUserId, status: 'pending' });
      }
    } catch (sockErr) {
      console.warn('Socket notification error:', sockErr.message);
    }

    return res.status(200).json({
      success: true,
      status: 'pending',
      message: `Follow request sent to ${targetName}`,
    });
  } catch (error) {
    console.error('sendFollowRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send follow request' });
  }
}

/**
 * Accept a Follow Request
 */
async function acceptFollowRequest(req, res) {
  try {
    const requesterId = parseInt(req.params.requesterId, 10);
    const currentUserId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!requesterId || isNaN(requesterId) || !currentUserId || isNaN(currentUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({
        success: true,
        status: 'accepted',
        message: 'Follow request accepted (offline mode)',
      });
    }

    // Update follow status to 'accepted'
    const updateRes = await db.query(
      "UPDATE follows SET status = 'accepted' WHERE follower_id = $1 AND following_id = $2 RETURNING id",
      [requesterId, currentUserId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Follow request not found' });
    }

    // Mark the follow_request notification as read
    await db.query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND actor_id = $2 AND type = 'follow_request'",
      [currentUserId, requesterId]
    );

    // Get current user name & avatar to notify requester
    const currentUserRes = await db.query('SELECT name, avatar_url FROM users WHERE id = $1', [currentUserId]);
    const currentUserName = currentUserRes.rows[0]?.name || 'A user';
    const currentUserAvatar = currentUserRes.rows[0]?.avatar_url || '';

    // Create Notification for the requester that their request was accepted
    await db.query(
      `INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, message, ref_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        requesterId,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        'follow_accepted',
        `${currentUserName} accepted your follow request.`,
        updateRes.rows[0].id,
      ]
    );

    // Return updated counts
    const followerCountRes = await db.query(
      "SELECT COUNT(*) FROM follows WHERE following_id = $1 AND status = 'accepted'",
      [currentUserId]
    );
    const followingCountRes = await db.query(
      "SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND status = 'accepted'",
      [requesterId]
    );

    // Real-time socket notification to requester that their request was accepted!
    try {
      const io = req.app?.get('io') || getIO();
      if (io) {
        io.to(`room_${requesterId}`).emit('follow_accepted', {
          targetUserId: currentUserId,
          targetName: currentUserName,
          targetAvatar: currentUserAvatar,
        });
        io.to(`room_${requesterId}`).emit('new_notification');
        io.to(`room_${currentUserId}`).emit('follow_updated');
      }
    } catch (sockErr) {
      console.warn('Socket notification error:', sockErr.message);
    }

    return res.status(200).json({
      success: true,
      status: 'accepted',
      message: 'Follow request accepted',
      followersCount: parseInt(followerCountRes.rows[0].count, 10),
      requesterFollowingCount: parseInt(followingCountRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('acceptFollowRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept follow request' });
  }
}

/**
 * Reject / Decline a Follow Request
 */
async function rejectFollowRequest(req, res) {
  try {
    const requesterId = parseInt(req.params.requesterId, 10);
    const currentUserId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!requesterId || isNaN(requesterId) || !currentUserId || isNaN(currentUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, message: 'Follow request rejected' });
    }

    // Delete follow row
    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'",
      [requesterId, currentUserId]
    );

    // Remove or mark notification
    await db.query(
      "DELETE FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'follow_request'",
      [currentUserId, requesterId]
    );

    try {
      const io = req.app?.get('io') || getIO();
      if (io) {
        io.to(`room_${requesterId}`).emit('follow_declined', { targetUserId: currentUserId });
        io.to(`room_${currentUserId}`).emit('follow_updated');
      }
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Follow request declined',
    });
  } catch (error) {
    console.error('rejectFollowRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject follow request' });
  }
}

/**
 * Cancel a Sent Follow Request (Requester cancels pending request)
 */
async function cancelFollowRequest(req, res) {
  try {
    const targetUserId = parseInt(req.params.targetUserId, 10);
    const followerId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!targetUserId || isNaN(targetUserId) || !followerId || isNaN(followerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, status: 'none', message: 'Request cancelled' });
    }

    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'",
      [followerId, targetUserId]
    );

    // Remove notification from target user
    await db.query(
      "DELETE FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'follow_request'",
      [targetUserId, followerId]
    );

    return res.status(200).json({
      success: true,
      status: 'none',
      message: 'Follow request cancelled',
    });
  } catch (error) {
    console.error('cancelFollowRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel follow request' });
  }
}

/**
 * Unfollow User (Removes accepted follow relationship)
 */
async function unfollowUser(req, res) {
  try {
    const targetUserId = parseInt(req.params.targetUserId, 10);
    const followerId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!targetUserId || isNaN(targetUserId) || !followerId || isNaN(followerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, status: 'none', message: 'Unfollowed' });
    }

    await db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    return res.status(200).json({
      success: true,
      status: 'none',
      message: 'Unfollowed user',
    });
  } catch (error) {
    console.error('unfollowUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to unfollow user' });
  }
}

/**
 * Legacy toggle follow (calls request or unfollow depending on state)
 */
async function toggleFollow(req, res) {
  try {
    const targetUserId = parseInt(req.params.targetUserId, 10);
    const followerId = parseInt(req.body.currentUserId || req.query.currentUserId || req.userId, 10);

    if (!targetUserId || !followerId || followerId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, isFollowing: true, status: 'pending' });
    }

    const checkRes = await db.query(
      'SELECT id, status FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );

    if (checkRes.rows.length > 0) {
      // Exists: remove
      await db.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, targetUserId]
      );
      await db.query(
        "DELETE FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'follow_request'",
        [targetUserId, followerId]
      );
      return res.status(200).json({
        success: true,
        isFollowing: false,
        status: 'none',
        message: 'Unfollowed',
      });
    } else {
      // Send pending request
      return sendFollowRequest(req, res);
    }
  } catch (error) {
    console.error('toggleFollow error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle follow' });
  }
}

/**
 * Get Incoming Pending Follow Requests for a user
 */
async function getPendingRequests(req, res) {
  try {
    const userId = parseInt(req.params.userId || req.query.userId || req.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, requests: [] });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, COALESCE(u.designation, 'Business Leader') as designation,
              COALESCE(u.company_brand, 'Fortaa') as company_brand, u.avatar_url,
              f.id as request_id, f.created_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      requests: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('getPendingRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
}

/**
 * Get list of followers for a user (only accepted)
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
              COALESCE(u.company_brand, 'Fortaa') as company_brand, u.member_id, u.avatar_url, f.created_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1 AND (f.status = 'accepted' OR f.status IS NULL)
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
 * Get list of users followed by a user (includes both 'accepted' and 'pending')
 * Matches user's screenshot where both 'Following' and 'Pending' users are shown!
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
      `SELECT u.id, u.name, u.email, COALESCE(u.designation, 'Business Leader') as designation,
              COALESCE(u.company_brand, 'Fortaa') as company_brand, u.member_id, u.avatar_url,
              COALESCE(f.status, 'accepted') as follow_status, f.created_at
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
 * Get map/array of followed IDs and their statuses for the current user
 * Returns { followingIds: [1, 2], pendingIds: [3, 4] }
 */
async function getFollowingIds(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(200).json({ success: true, followingIds: [], pendingIds: [] });
    }

    if (!db.isDBConnected()) {
      return res.status(200).json({ success: true, followingIds: [], pendingIds: [] });
    }

    const result = await db.query(
      'SELECT following_id, COALESCE(status, \'accepted\') as status FROM follows WHERE follower_id = $1',
      [userId]
    );

    const followingIds = [];
    const pendingIds = [];

    result.rows.forEach((r) => {
      if (r.status === 'pending') {
        pendingIds.push(r.following_id);
      } else {
        followingIds.push(r.following_id);
      }
    });

    return res.status(200).json({
      success: true,
      followingIds,
      pendingIds,
    });
  } catch (error) {
    console.error('getFollowingIds error:', error);
    return res.status(200).json({ success: true, followingIds: [], pendingIds: [] });
  }
}

/**
 * Get social counts for profile
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
      db.query("SELECT COUNT(*) FROM follows WHERE following_id = $1 AND (status = 'accepted' OR status IS NULL)", [userId]),
      db.query("SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND (status = 'accepted' OR status IS NULL)", [userId]),
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
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest,
  unfollowUser,
  toggleFollow,
  getPendingRequests,
  getFollowers,
  getFollowing,
  getFollowingIds,
  getUserSocialCounts,
};
