const db = require('../db/db');
const { getIO } = require('../socket/chat.socket');

/**
 * Get all active stories grouped by user (within 24 hours)
 */
async function getActiveStories(req, res) {
  try {
    const currentUserId = parseInt(req.query.userId || req.params.userId || 0, 10);

    const queryText = `
      SELECT s.id, s.user_id, s.media_type, s.media_url, s.text_content,
             s.background_style, s.poll_data, s.created_at, s.expires_at,
             u.name as author_name,
             u.avatar_url as author_avatar,
             COALESCE(u.designation, 'Business Leader') as author_role,
             COALESCE(u.company_brand, 'Fortaa') as author_company,
             EXISTS(
               SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1
             ) as is_viewed,
             (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id != s.user_id) as views_count,
             EXISTS(
               SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1
             ) as is_liked,
             (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id) as likes_count,
             (SELECT option_id FROM story_poll_votes spv WHERE spv.story_id = s.id AND spv.user_id = $1) as user_poll_vote
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.created_at ASC
    `;

    const result = await db.query(queryText, [currentUserId]);
    const rawStories = result.rows || [];

    // Group stories by author
    const groupsMap = new Map();

    for (const story of rawStories) {
      const uId = story.user_id;
      if (!groupsMap.has(uId)) {
        groupsMap.set(uId, {
          userId: uId,
          userName: story.author_name || 'Fortaa Leader',
          userAvatar: story.author_avatar || null,
          userRole: story.author_role || 'Business Leader',
          hasUnviewed: false,
          latestCreatedAt: story.created_at,
          stories: [],
        });
      }

      const group = groupsMap.get(uId);
      if (!story.is_viewed) {
        group.hasUnviewed = true;
      }
      group.stories.push(story);
      group.latestCreatedAt = story.created_at;
    }

    const groupsList = Array.from(groupsMap.values());

    // Sort order:
    // 1. Current user's stories first (if any)
    // 2. Unviewed stories next
    // 3. Fully viewed stories last
    groupsList.sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt);
    });

    return res.status(200).json({
      success: true,
      storyGroups: groupsList,
      totalStories: rawStories.length,
    });
  } catch (error) {
    console.error('getActiveStories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stories' });
  }
}

/**
 * Create a new story (photo, video, text, or interactive poll)
 */
async function createStory(req, res) {
  try {
    const {
      userId,
      mediaType = 'photo',
      mediaUrl = null,
      textContent = null,
      backgroundStyle = 'linear-gradient(135deg, #6366F1, #9333EA)',
      pollData = null,
    } = req.body;

    const parsedUserId = parseInt(userId, 10);
    if (!parsedUserId || isNaN(parsedUserId)) {
      return res.status(400).json({ success: false, message: 'Valid user ID is required' });
    }

    if (!['photo', 'video', 'text', 'poll'].includes(mediaType)) {
      return res.status(400).json({ success: false, message: 'Invalid story media type' });
    }

    if ((mediaType === 'photo' || mediaType === 'video') && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required for photo/video story' });
    }

    if (mediaType === 'text' && !textContent?.trim()) {
      return res.status(400).json({ success: false, message: 'Text content is required for text story' });
    }

    let formattedPollData = null;
    if (mediaType === 'poll') {
      const q = (pollData?.question || textContent || '').trim();
      if (!q) {
        return res.status(400).json({ success: false, message: 'Question is required for poll story' });
      }

      const options = Array.isArray(pollData?.options) ? pollData.options : [];
      if (options.length < 2) {
        return res.status(400).json({ success: false, message: 'Poll requires at least 2 options' });
      }

      formattedPollData = {
        question: q,
        options: options.map((opt, idx) => ({
          id: opt.id || idx + 1,
          text: typeof opt === 'string' ? opt : opt.text,
          votes: 0,
        })),
        totalVotes: 0,
        voters: {},
      };
    }

    const insertQuery = `
      INSERT INTO stories (
        user_id, media_type, media_url, text_content, background_style, poll_data, created_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '24 HOURS')
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      parsedUserId,
      mediaType,
      mediaUrl,
      textContent?.trim() || null,
      backgroundStyle,
      formattedPollData ? JSON.stringify(formattedPollData) : null,
    ]);

    const newStory = result.rows[0];

    // Fetch author details
    const userResult = await db.query(
      `SELECT name, avatar_url, designation, company_brand FROM users WHERE id = $1`,
      [parsedUserId]
    );
    const author = userResult.rows[0] || {};

    const fullStory = {
      ...newStory,
      author_name: author.name,
      author_avatar: author.avatar_url,
      author_role: author.designation || 'Business Leader',
      author_company: author.company_brand || 'Fortaa',
      is_viewed: false,
      views_count: 0,
      user_poll_vote: null,
    };

    return res.status(201).json({
      success: true,
      message: 'Story published successfully! 🚀',
      story: fullStory,
    });
  } catch (error) {
    console.error('createStory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create story' });
  }
}

/**
 * Record a story view (UPSERT) - Only records when viewer is NOT the author
 */
async function recordStoryView(req, res) {
  try {
    const storyId = parseInt(req.params.id, 10);
    const viewerId = parseInt(req.body.userId || req.query.userId || 0, 10);

    if (!storyId || !viewerId) {
      return res.status(400).json({ success: false, message: 'Invalid story ID or viewer ID' });
    }

    // Do NOT record view if the viewer is the author of the story
    const storyOwnerCheck = await db.query('SELECT user_id FROM stories WHERE id = $1', [storyId]);
    if (storyOwnerCheck.rows.length > 0 && storyOwnerCheck.rows[0].user_id === viewerId) {
      return res.status(200).json({ success: true, message: 'Owner view not recorded' });
    }

    await db.query(
      `INSERT INTO story_views (story_id, viewer_id, viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (story_id, viewer_id) DO NOTHING`,
      [storyId, viewerId]
    );

    return res.status(200).json({ success: true, message: 'View recorded' });
  } catch (error) {
    console.error('recordStoryView error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record view' });
  }
}

/**
 * Vote on a story poll
 */
async function voteStoryPoll(req, res) {
  try {
    const storyId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId, 10);
    const optionId = parseInt(req.body.optionId, 10);

    if (!storyId || !userId || !optionId) {
      return res.status(400).json({ success: false, message: 'storyId, userId, and optionId are required' });
    }

    // 1. Record vote in story_poll_votes
    await db.query(
      `INSERT INTO story_poll_votes (story_id, user_id, option_id, voted_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (story_id, user_id)
       DO UPDATE SET option_id = EXCLUDED.option_id, voted_at = NOW()`,
      [storyId, userId, optionId]
    );

    // 2. Fetch all votes for this story to accurately recalculate counts
    const votesResult = await db.query(
      `SELECT option_id, COUNT(*) as count FROM story_poll_votes WHERE story_id = $1 GROUP BY option_id`,
      [storyId]
    );

    const countsMap = {};
    let totalVotes = 0;
    votesResult.rows.forEach((r) => {
      const opt = parseInt(r.option_id, 10);
      const cnt = parseInt(r.count, 10);
      countsMap[opt] = cnt;
      totalVotes += cnt;
    });

    // 3. Update story poll_data
    const storyResult = await db.query(`SELECT poll_data FROM stories WHERE id = $1`, [storyId]);
    if (storyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const currentPoll = storyResult.rows[0].poll_data || { options: [] };
    const updatedOptions = (currentPoll.options || []).map((opt) => ({
      ...opt,
      votes: countsMap[opt.id] || 0,
    }));

    const voters = currentPoll.voters || {};
    voters[String(userId)] = optionId;

    const newPollData = {
      ...currentPoll,
      options: updatedOptions,
      totalVotes,
      voters,
    };

    await db.query(
      `UPDATE stories SET poll_data = $1 WHERE id = $2`,
      [JSON.stringify(newPollData), storyId]
    );

    return res.status(200).json({
      success: true,
      message: 'Vote submitted successfully! 📊',
      pollData: newPollData,
      userVotedOption: optionId,
    });
  } catch (error) {
    console.error('voteStoryPoll error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit vote' });
  }
}

/**
 * Delete a story
 */
async function deleteStory(req, res) {
  try {
    const storyId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId || req.query.userId || 0, 10);

    if (!storyId || !userId) {
      return res.status(400).json({ success: false, message: 'Story ID and User ID required' });
    }

    const storyCheck = await db.query(`SELECT user_id FROM stories WHERE id = $1`, [storyId]);
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const userCheck = await db.query(`SELECT role FROM users WHERE id = $1`, [userId]);
    const userRole = userCheck.rows[0]?.role || 'user';

    if (storyCheck.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this story' });
    }

    await db.query(`DELETE FROM stories WHERE id = $1`, [storyId]);

    return res.status(200).json({
      success: true,
      message: 'Story deleted successfully',
      deletedStoryId: storyId,
    });
  } catch (error) {
    console.error('deleteStory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete story' });
  }
}

/**
 * Get viewers list for a story (excludes author self-views)
 */
async function getStoryViewers(req, res) {
  try {
    const storyId = parseInt(req.params.id, 10);
    if (!storyId) {
      return res.status(400).json({ success: false, message: 'Invalid story ID' });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.avatar_url, COALESCE(u.designation, 'Business Leader') as designation, sv.viewed_at
       FROM story_views sv
       JOIN stories s ON sv.story_id = s.id
       JOIN users u ON sv.viewer_id = u.id
       WHERE sv.story_id = $1 AND sv.viewer_id != s.user_id
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );

    return res.status(200).json({
      success: true,
      viewers: result.rows || [],
      count: result.rows.length,
    });
  } catch (error) {
    console.error('getStoryViewers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch viewers' });
  }
}

/**
 * Toggle like on a story
 */
async function toggleStoryLike(req, res) {
  try {
    const storyId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId, 10);

    if (!storyId || !userId) {
      return res.status(400).json({ success: false, message: 'storyId and userId are required' });
    }

    const check = await db.query(
      `SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2`,
      [storyId, userId]
    );

    let isLiked = false;
    if (check.rows.length > 0) {
      await db.query(`DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2`, [storyId, userId]);
      isLiked = false;
    } else {
      await db.query(
        `INSERT INTO story_likes (story_id, user_id, created_at) VALUES ($1, $2, NOW())`,
        [storyId, userId]
      );
      isLiked = true;

      // Trigger notification for story author if someone else liked
      try {
        const storyOwnerRes = await db.query(
          `SELECT s.user_id as owner_id, u.name as liker_name, u.avatar_url as liker_avatar
           FROM stories s
           JOIN users u ON u.id = $2
           WHERE s.id = $1`,
          [storyId, userId]
        );
        if (storyOwnerRes.rows.length > 0) {
          const { owner_id, liker_name, liker_avatar } = storyOwnerRes.rows[0];
          if (parseInt(owner_id, 10) !== userId) {
            await db.query(
              `INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, message, ref_id)
               VALUES ($1, $2, $3, $4, 'story_like', 'liked your story', $5)`,
              [owner_id, userId, liker_name, liker_avatar, storyId]
            );

            const io = req.app?.get('io') || getIO();
            if (io) {
              io.to(`room_${owner_id}`).emit('new_notification', {
                type: 'story_like',
                actorId: userId,
                actorName: liker_name,
                actorAvatar: liker_avatar,
                message: 'liked your story',
                refId: storyId,
              });
            }
          }
        }
      } catch (notifErr) {
        console.warn('Story like notification error (non-fatal):', notifErr.message);
      }
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM story_likes WHERE story_id = $1`,
      [storyId]
    );
    const likesCount = parseInt(countResult.rows[0].count, 10);

    return res.status(200).json({
      success: true,
      isLiked,
      likesCount,
    });
  } catch (error) {
    console.error('toggleStoryLike error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
}

module.exports = {
  getActiveStories,
  createStory,
  recordStoryView,
  voteStoryPoll,
  deleteStory,
  getStoryViewers,
  toggleStoryLike,
};
