const db = require('../db/db');

// Fallback in-memory data in case DB is momentarily unreachable
const fallbackData = {
  posts: [
    {
      id: 1,
      author_name: 'Kapil Dhakad',
      author_role: 'Gold Leader',
      content: 'Grateful to be part of an amazing team! Fortaa has given me the right platform to grow, learn and achieve my goals. Together we grow bigger!',
      tags: '#FortaaMarketing #Teamwork #Success #Fortaa',
      image_url: null,
      likes_count: 124,
      comments_count: 28,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      author_name: 'Sneha Patel',
      author_role: 'Platinum Leader',
      content: 'Looking for motivated people who want to build their own business and create financial freedom. DM me for more details.',
      tags: '#Opportunity #FinancialFreedom #JoinNow',
      image_url: null,
      likes_count: 89,
      comments_count: 14,
      created_at: new Date().toISOString(),
    },
  ],
  trainers: [
    { id: 1, name: 'Neha Gupta', role: 'Diamond Leader', network: '1.2 Network', followers: '2K Followers' },
    { id: 2, name: 'Amit Verma', role: 'Diamond Leader', network: '1.2 Network', followers: '5K Followers' },
    { id: 3, name: 'Vikas Kumar', role: 'Diamond Leader', network: '1.2K Network', followers: '1.1K Followers' },
  ],
  leaders: [
    { id: 1, name: 'Neha Verma', role: 'Business Leader' },
    { id: 2, name: 'Anjali Singh', role: 'Silver Leader' },
    { id: 3, name: 'Vikram Yadav', role: 'Team Leader' },
    { id: 4, name: 'Pooja Verma', role: 'Business Leader' },
  ],
  services: [
    {
      id: 1,
      title: 'Digital Marketing Specialist',
      description: 'Digital Marketing | Graphic Designer | Video Editor | Software Engineer',
      location: 'Indore, Madhya Pradesh, India',
    },
    {
      id: 2,
      title: 'Team Leader',
      description: 'Team Management | Marketing / Training | Reporting | Compose Target',
      location: 'Rewa, Madhya Pradesh, India',
    },
    {
      id: 3,
      title: 'Franchise Partner',
      description: 'Franchise Opportunity | Business Set up Support | Marketing Support | Brand Licensing',
      location: 'France, Paris',
    },
    {
      id: 4,
      title: 'Wellness Products',
      description: 'Health Supplements | Personal Care Products | Herbal Products | Nutrition Products',
      location: 'Indore, Madhya Pradesh, India',
    },
  ],
  events: [
    { id: 1, date: '20', month: 'NOV', title: 'Leadership Summit', type: 'Online' },
    { id: 2, date: '25', month: 'NOV', title: 'Industry Networking Meet', type: 'New Delhi' },
    { id: 3, date: '30', month: 'NOV', title: 'Business Growth Workshop', type: 'Online' },
  ],
  groups: [
    { id: 1, name: 'Success Mindset & Moti...', members: '12.4K members', sub: '3.8K mindset' },
    { id: 2, name: 'Network Marketing Tips', members: '5.7K member', sub: '8.6 mindset' },
    { id: 3, name: 'Health & Wellness Products', members: '8.2k member', sub: '6.2K mindset' },
  ],
  opportunities: [
    {
      id: 1,
      title: 'Digital Marketing Specialist',
      is_new: false,
      tags: ['Work from Home', 'High Earning'],
      price: '₹ 25k - 75k / month',
    },
    {
      id: 2,
      title: 'Leadership Program',
      is_new: true,
      tags: ['Build Team', 'Bonus'],
      price: '₹ 50k - 2L / month',
    },
    {
      id: 3,
      title: 'Health & Wellness Specialist',
      is_new: false,
      tags: ['High Demand'],
      price: '₹ 10k - 50k / month',
    },
  ],
};

// 1. Get Dashboard Overview / Stats
async function getDashboardOverview(req, res) {
  try {
    let user = null;
    const userId = req.userId || req.query.userId;
    const email = req.query.email;

    if (db.isDBConnected()) {
      if (userId) {
        const userRes = await db.query(
          'SELECT id, member_id, name, email, designation, company_brand, business_name, account_type, avatar_url FROM users WHERE id = $1',
          [userId]
        );
        if (userRes.rows.length > 0) user = userRes.rows[0];
      } else if (email) {
        const userRes = await db.query(
          'SELECT id, member_id, name, email, designation, company_brand, business_name, account_type, avatar_url FROM users WHERE email = $1',
          [email]
        );
        if (userRes.rows.length > 0) user = userRes.rows[0];
      }

      // If still no user specified, grab the latest registered user
      if (!user) {
        const latestUserRes = await db.query(
          'SELECT id, member_id, name, email, designation, company_brand, business_name, account_type, avatar_url FROM users ORDER BY id DESC LIMIT 1'
        );
        if (latestUserRes.rows.length > 0) user = latestUserRes.rows[0];
      }

      const activeUserId = user ? user.id : 0;

      // Real counts from DB
      const [postCountRes, followerCountRes, followingCountRes, networkCountRes] = await Promise.all([
        db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [activeUserId]),
        db.query('SELECT COUNT(*) FROM follows WHERE following_id = $1', [activeUserId]),
        db.query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [activeUserId]),
        user?.member_id
          ? db.query('SELECT COUNT(*) FROM users WHERE referral_id = $1', [user.member_id])
          : Promise.resolve({ rows: [{ count: 0 }] }),
      ]);

      const myPostsCount = parseInt(postCountRes.rows[0].count, 10);
      const followersCount = parseInt(followerCountRes.rows[0].count, 10);
      const followingCount = parseInt(followingCountRes.rows[0].count, 10);
      const networkCount = parseInt(networkCountRes.rows[0].count, 10);

      return res.status(200).json({
        success: true,
        user: user || {
          name: 'Kapil Dhakad',
          member_id: 'NS381517',
          designation: 'Senior Leader',
          company_brand: 'Index Technology',
        },
        stats: {
          network: networkCount,
          followers: followersCount,
          following: followingCount,
          totalPosts: myPostsCount,
        },
      });
    }

    // Fallback response
    return res.status(200).json({
      success: true,
      user: {
        name: 'Kapil Dhakad',
        member_id: 'NS381517',
        designation: 'Senior Leader',
        company_brand: 'Index Technology',
      },
      stats: {
        network: 0,
        followers: 12,
        following: 5,
        totalPosts: fallbackData.posts.length,
      },
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 2. Get Posts (Personalized Feed / Following / Mine)
async function getPosts(req, res) {
  try {
    const userId = parseInt(req.query.userId || req.userId, 10);
    const filter = req.query.filter; // 'mine', 'following', 'all'

    if (db.isDBConnected()) {
      const activeUserId = userId || 0;
      let queryStr = `
        SELECT p.*,
               COALESCE((SELECT TRUE FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1 LIMIT 1), FALSE) AS has_liked
        FROM posts p
        ORDER BY p.created_at DESC
      `;
      let params = [activeUserId];

      if (filter === 'mine' && userId) {
        queryStr = `
          SELECT p.*,
                 COALESCE((SELECT TRUE FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1 LIMIT 1), FALSE) AS has_liked
          FROM posts p
          WHERE p.user_id = $1
          ORDER BY p.created_at DESC
        `;
        params = [userId];
      } else if (filter === 'following' && userId) {
        queryStr = `
          SELECT p.*,
                 COALESCE((SELECT TRUE FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1 LIMIT 1), FALSE) AS has_liked
          FROM posts p
          WHERE p.user_id = $1 
             OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
          ORDER BY p.created_at DESC
        `;
        params = [userId];
      } else {
        // Main community feed: show all community posts so users can discover & follow leaders
        queryStr = `
          SELECT p.*,
                 COALESCE((SELECT TRUE FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1 LIMIT 1), FALSE) AS has_liked
          FROM posts p
          ORDER BY p.created_at DESC
        `;
        params = [activeUserId];
      }

      const result = await db.query(queryStr, params);
      return res.status(200).json({
        success: true,
        posts: result.rows,
      });
    }

    return res.status(200).json({
      success: true,
      posts: fallbackData.posts,
    });
  } catch (error) {
    console.error('getPosts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve posts' });
  }
}

// 3. Create a New Post
async function createPost(req, res) {
  try {
    const { content, tags, imageUrl, videoUrl, mediaType, authorName, authorRole, authorAvatar, userId, pollData } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    const postAuthor = authorName || 'Kapil Dhakad';
    const postRole = authorRole || 'Senior Leader';
    const postAvatar = authorAvatar || null;
    const postVideo = videoUrl || (mediaType === 'video' ? imageUrl : null);
    const postImage = postVideo ? null : (imageUrl || null);
    const postMediaType = mediaType || (postVideo ? 'video' : 'image');
    const postTags = tags && tags.trim() ? tags.trim() : null;
    const postUserId = userId || req.userId || null;
    const postPollData = pollData ? (typeof pollData === 'object' ? JSON.stringify(pollData) : pollData) : null;

    if (db.isDBConnected()) {
      const result = await db.query(
        `INSERT INTO posts (user_id, author_name, author_role, author_avatar, content, tags, image_url, video_url, media_type, poll_data, likes_count, comments_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0)
         RETURNING *`,
        [postUserId, postAuthor, postRole, postAvatar, content.trim(), postTags, postImage, postVideo, postMediaType, postPollData]
      );
      return res.status(201).json({
        success: true,
        message: 'Post created successfully!',
        post: result.rows[0],
      });
    }

    // Fallback creation
    const newPost = {
      id: Date.now(),
      user_id: postUserId,
      author_name: postAuthor,
      author_role: postRole,
      author_avatar: postAvatar,
      content: content.trim(),
      tags: postTags,
      image_url: postImage,
      video_url: postVideo,
      media_type: postMediaType,
      poll_data: postPollData,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    };
    fallbackData.posts.unshift(newPost);

    return res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: newPost,
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create post' });
  }
}

// 3.5 Vote on a Poll
async function votePoll(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);
    const { optionId, userId } = req.body;

    if (optionId === undefined || optionId === null) {
      return res.status(400).json({ success: false, message: 'optionId is required' });
    }

    const voterKey = String(userId || req.userId || 'user_' + Date.now());

    if (db.isDBConnected()) {
      const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
      if (postRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const post = postRes.rows[0];
      let poll = null;
      try {
        poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
      } catch (e) {}

      if (!poll || !Array.isArray(poll.options)) {
        return res.status(400).json({ success: false, message: 'No poll found on this post' });
      }

      poll.voters = poll.voters || {};
      const prevOptionId = poll.voters[voterKey];

      if (prevOptionId === optionId) {
        return res.status(200).json({ success: true, pollData: poll });
      }

      poll.options = poll.options.map((opt) => {
        let votes = Number(opt.votes) || 0;
        if (opt.id === prevOptionId) votes = Math.max(0, votes - 1);
        if (opt.id === optionId) votes += 1;
        return { ...opt, votes };
      });

      poll.voters[voterKey] = optionId;
      poll.totalVotes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

      const updatedStr = JSON.stringify(poll);
      await db.query('UPDATE posts SET poll_data = $1 WHERE id = $2', [updatedStr, postId]);

      return res.status(200).json({ success: true, pollData: poll });
    }

    // Fallback
    const post = fallbackData.posts.find((p) => p.id === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    let poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    if (!poll) return res.status(400).json({ success: false, message: 'No poll' });
    poll.voters = poll.voters || {};
    const prev = poll.voters[voterKey];
    poll.options = poll.options.map((opt) => {
      let votes = Number(opt.votes) || 0;
      if (opt.id === prev) votes = Math.max(0, votes - 1);
      if (opt.id === optionId) votes += 1;
      return { ...opt, votes };
    });
    poll.voters[voterKey] = optionId;
    poll.totalVotes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);
    post.poll_data = poll;
    return res.status(200).json({ success: true, pollData: poll });
  } catch (error) {
    console.error('votePoll error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record vote' });
  }
}

// 4. Like / Unlike a Post (Toggle 1-like-per-user)
async function likePost(req, res) {
  try {
    const { id } = req.params;
    const userId = parseInt(req.body.userId || req.userId || req.query.userId, 10) || 13;

    if (db.isDBConnected()) {
      // Check if user already liked this post
      const existing = await db.query(
        'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [id, userId]
      );

      let liked = false;
      let updatedPost = null;

      if (existing.rows.length > 0) {
        // Already liked -> UNLIKE
        await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, userId]);
        const postRes = await db.query(
          'UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1 RETURNING *',
          [id]
        );
        if (postRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
        updatedPost = postRes.rows[0];
        liked = false;
      } else {
        // Not liked yet -> LIKE
        await db.query(
          'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, userId]
        );
        const postRes = await db.query(
          'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING *',
          [id]
        );
        if (postRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
        updatedPost = postRes.rows[0];
        liked = true;
      }

      return res.status(200).json({
        success: true,
        liked,
        post: {
          ...updatedPost,
          has_liked: liked,
        },
      });
    }

    const post = fallbackData.posts.find((p) => p.id == id);
    if (post) {
      if (!post.liked_by) post.liked_by = [];
      const userIndex = post.liked_by.indexOf(userId);
      let liked = false;
      if (userIndex > -1) {
        post.liked_by.splice(userIndex, 1);
        post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
        liked = false;
      } else {
        post.liked_by.push(userId);
        post.likes_count = (post.likes_count || 0) + 1;
        liked = true;
      }
      return res.status(200).json({
        success: true,
        liked,
        post: { ...post, has_liked: liked },
      });
    }
    return res.status(404).json({ success: false, message: 'Post not found' });
  } catch (error) {
    console.error('likePost error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update like status' });
  }
}

// 5. Get Trainers
async function getTrainers(req, res) {
  try {
    if (db.isDBConnected()) {
      const result = await db.query('SELECT * FROM trainers ORDER BY id ASC');
      return res.status(200).json({ success: true, trainers: result.rows });
    }
    return res.status(200).json({ success: true, trainers: fallbackData.trainers });
  } catch (error) {
    console.error('getTrainers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trainers' });
  }
}

// 6. Get Leaders (Real Database users/friends)
async function getLeaders(req, res) {
  try {
    const currentUserId = parseInt(req.query.userId || req.userId, 10);
    if (db.isDBConnected()) {
      let queryStr = '';
      let queryParams = [];

      if (currentUserId && !isNaN(currentUserId)) {
        queryStr = `
          SELECT u.id, u.name, u.email, u.username,
                 COALESCE(u.designation, 'Business Leader') as role,
                 u.avatar_url,
                 COALESCE(u.company_brand, u.business_name, 'Fortaa') as company_brand,
                 u.location,
                 u.bio,
                 u.skills,
                 u.created_at,
                 (SELECT COUNT(*) FROM follows WHERE following_id = u.id AND (status = 'accepted' OR status IS NULL))::int AS followers_count,
                 (SELECT COUNT(*) FROM follows WHERE follower_id = u.id AND (status = 'accepted' OR status IS NULL))::int AS following_count,
                 (SELECT COUNT(*) FROM posts WHERE user_id = u.id)::int AS posts_count,
                 COALESCE(
                   (SELECT status FROM follows WHERE follower_id = $1 AND following_id = u.id LIMIT 1),
                   'none'
                 ) AS follow_status
          FROM users u
          WHERE u.id != $1
          ORDER BY u.id DESC LIMIT 50
        `;
        queryParams = [currentUserId];
      } else {
        queryStr = `
          SELECT u.id, u.name, u.email, u.username,
                 COALESCE(u.designation, 'Business Leader') as role,
                 u.avatar_url,
                 COALESCE(u.company_brand, u.business_name, 'Fortaa') as company_brand,
                 u.location,
                 u.bio,
                 u.skills,
                 u.created_at,
                 (SELECT COUNT(*) FROM follows WHERE following_id = u.id AND (status = 'accepted' OR status IS NULL))::int AS followers_count,
                 (SELECT COUNT(*) FROM follows WHERE follower_id = u.id AND (status = 'accepted' OR status IS NULL))::int AS following_count,
                 (SELECT COUNT(*) FROM posts WHERE user_id = u.id)::int AS posts_count,
                 'none' AS follow_status
          FROM users u
          ORDER BY u.id DESC LIMIT 50
        `;
        queryParams = [];
      }

      const usersRes = await db.query(queryStr, queryParams);
      if (usersRes.rows.length > 0) {
        return res.status(200).json({ success: true, leaders: usersRes.rows });
      }
    }
    return res.status(200).json({ success: true, leaders: fallbackData.leaders });
  } catch (error) {
    console.error('getLeaders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaders' });
  }
}

// 7. Get Services
async function getServices(req, res) {
  try {
    if (db.isDBConnected()) {
      const result = await db.query('SELECT * FROM services ORDER BY id ASC');
      return res.status(200).json({ success: true, services: result.rows });
    }
    return res.status(200).json({ success: true, services: fallbackData.services });
  } catch (error) {
    console.error('getServices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
}

// 8. Get Events
async function getEvents(req, res) {
  try {
    if (db.isDBConnected()) {
      const result = await db.query('SELECT * FROM events ORDER BY id ASC');
      return res.status(200).json({ success: true, events: result.rows });
    }
    return res.status(200).json({ success: true, events: fallbackData.events });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
}

// 9. Get Groups
async function getGroups(req, res) {
  try {
    if (db.isDBConnected()) {
      const result = await db.query('SELECT * FROM groups ORDER BY id ASC');
      return res.status(200).json({ success: true, groups: result.rows });
    }
    return res.status(200).json({ success: true, groups: fallbackData.groups });
  } catch (error) {
    console.error('getGroups error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
}

// 10. Get Opportunities
async function getOpportunities(req, res) {
  try {
    if (db.isDBConnected()) {
      const result = await db.query('SELECT * FROM opportunities ORDER BY id ASC');
      return res.status(200).json({ success: true, opportunities: result.rows });
    }
    return res.status(200).json({ success: true, opportunities: fallbackData.opportunities });
  } catch (error) {
    console.error('getOpportunities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch opportunities' });
  }
}

// 11. Update / Edit Post
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { content, tags, userId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content cannot be empty' });
    }

    if (db.isDBConnected()) {
      const checkRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      if (userId && checkRes.rows[0].user_id && Number(checkRes.rows[0].user_id) !== Number(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
      }

      const updateRes = await db.query(
        `UPDATE posts 
         SET content = $1, tags = COALESCE($2, tags)
         WHERE id = $3
         RETURNING *`,
        [content.trim(), tags || null, id]
      );

      return res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        post: updateRes.rows[0],
      });
    }

    const post = fallbackData.posts.find((p) => String(p.id) === String(id));
    if (post) {
      post.content = content.trim();
      if (tags) post.tags = tags;
      return res.status(200).json({ success: true, message: 'Post updated', post });
    }
    return res.status(404).json({ success: false, message: 'Post not found' });
  } catch (err) {
    console.error('updatePost error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating post' });
  }
}

// 12. Delete Post
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.body?.userId || req.query?.userId || req.userId;

    if (db.isDBConnected()) {
      const checkRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      if (userId && checkRes.rows[0].user_id && Number(checkRes.rows[0].user_id) !== Number(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
      }

      await db.query('DELETE FROM posts WHERE id = $1', [id]);
      return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    }

    fallbackData.posts = fallbackData.posts.filter((p) => String(p.id) !== String(id));
    return res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('deletePost error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting post' });
  }
}

// 13. Get Post Comments
async function getPostComments(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    if (db.isDBConnected()) {
      const result = await db.query(
        `SELECT c.*,
                COALESCE(u.name, c.author_name) AS author_name,
                COALESCE(u.avatar_url, c.author_avatar) AS author_avatar,
                COALESCE(u.designation, c.author_role, 'Member') AS author_role
         FROM post_comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.post_id = $1
         ORDER BY c.created_at ASC`,
        [id]
      );
      return res.status(200).json({ success: true, comments: result.rows });
    }

    const post = fallbackData.posts.find((p) => String(p.id) === String(id));
    return res.status(200).json({ success: true, comments: post?.comments || [] });
  } catch (err) {
    console.error('getPostComments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
}

// 14. Add Comment to Post
async function addPostComment(req, res) {
  try {
    const { id } = req.params;
    const { content, userId, authorName, authorRole, authorAvatar } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const activeUserId = userId ? parseInt(userId, 10) : null;
    const name = authorName || 'Member';
    const role = authorRole || 'Member';
    const avatar = authorAvatar || null;

    if (db.isDBConnected()) {
      // 1. Insert comment
      const commentRes = await db.query(
        `INSERT INTO post_comments (post_id, user_id, author_name, author_role, author_avatar, content)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, activeUserId, name, role, avatar, content.trim()]
      );

      // 2. Update post comments count
      const countRes = await db.query(
        `UPDATE posts 
         SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = $1)
         WHERE id = $1
         RETURNING comments_count`,
        [id]
      );

      const commentsCount = countRes.rows[0]?.comments_count || 1;

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: commentRes.rows[0],
        comments_count: commentsCount,
      });
    }

    const post = fallbackData.posts.find((p) => String(p.id) === String(id));
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (!post.comments) post.comments = [];

    const newComment = {
      id: Date.now(),
      post_id: id,
      user_id: activeUserId,
      author_name: name,
      author_role: role,
      author_avatar: avatar,
      content: content.trim(),
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    post.comments.push(newComment);
    post.comments_count = (post.comments_count || 0) + 1;

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: newComment,
      comments_count: post.comments_count,
    });
  } catch (err) {
    console.error('addPostComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
}

// 15. Like a Comment
async function likePostComment(req, res) {
  try {
    const { id } = req.params;
    if (db.isDBConnected()) {
      const result = await db.query(
        `UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      return res.status(200).json({ success: true, comment: result.rows[0] });
    }

    return res.status(200).json({ success: true, message: 'Comment liked' });
  } catch (err) {
    console.error('likePostComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to like comment' });
  }
}

// 16. Delete a Comment
async function deletePostComment(req, res) {
  try {
    const { id } = req.params;
    if (db.isDBConnected()) {
      const check = await db.query('SELECT post_id FROM post_comments WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      const postId = check.rows[0].post_id;
      await db.query('DELETE FROM post_comments WHERE id = $1', [id]);
      const countRes = await db.query(
        'UPDATE posts SET comments_count = GREATEST(0, (SELECT COUNT(*) FROM post_comments WHERE post_id = $1)) WHERE id = $1 RETURNING comments_count',
        [postId]
      );
      return res.status(200).json({
        success: true,
        message: 'Comment deleted',
        comments_count: countRes.rows[0]?.comments_count || 0,
      });
    }

    return res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('deletePostComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
}

// 17. Share a Post (Tracks shares & increments shares_count)
async function sharePost(req, res) {
  try {
    const { id } = req.params;
    const { userId, quote, repostToFeed } = req.body;

    if (db.isDBConnected()) {
      const updateRes = await db.query(
        `UPDATE posts 
         SET shares_count = COALESCE(shares_count, 0) + 1 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const originalPost = updateRes.rows[0];

      // If user chose to Repost to feed
      if (repostToFeed && userId) {
        const userRes = await db.query('SELECT name, designation, avatar_url FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0] || {};
        await db.query(
          `INSERT INTO posts (user_id, author_name, author_role, author_avatar, content, tags, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            user.name || 'Member',
            user.designation || 'Member',
            user.avatar_url || null,
            quote ? `${quote.trim()}\n\n[Reposted from ${originalPost.author_name}]: ${originalPost.content}` : `[Reposted from ${originalPost.author_name}]: ${originalPost.content}`,
            originalPost.tags,
            originalPost.image_url,
          ]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Post shared successfully',
        post: originalPost,
        shares_count: originalPost.shares_count,
      });
    }

    const post = fallbackData.posts.find((p) => String(p.id) === String(id));
    if (post) {
      post.shares_count = (post.shares_count || 0) + 1;
      return res.status(200).json({ success: true, message: 'Post shared', shares_count: post.shares_count });
    }

    return res.status(200).json({ success: true, message: 'Post shared', shares_count: 1 });
  } catch (err) {
    console.error('sharePost error:', err);
    return res.status(500).json({ success: false, message: 'Failed to share post' });
  }
}

module.exports = {
  getDashboardOverview,
  getPosts,
  createPost,
  votePoll,
  likePost,
  updatePost,
  deletePost,
  getPostComments,
  addPostComment,
  likePostComment,
  deletePostComment,
  sharePost,
  getTrainers,
  getLeaders,
  getServices,
  getEvents,
  getGroups,
  getOpportunities,
};
