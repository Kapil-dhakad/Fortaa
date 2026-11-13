// Frontend Service for Fortaa User Dashboard APIs

const BASE_URL = '/api/dashboard';

export async function fetchDashboardOverview(email = '') {
  try {
    const url = email ? `${BASE_URL}/overview?email=${encodeURIComponent(email)}` : `${BASE_URL}/overview`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard overview');
    return await res.json();
  } catch (err) {
    console.error('fetchDashboardOverview error:', err);
    return null;
  }
}

export async function fetchPosts(userId = null, filter = '', currentUserId = null) {
  try {
    let activeRequesterId = currentUserId;
    if (!activeRequesterId) {
      try {
        const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        activeRequesterId = u.id || u._id;
      } catch {}
    }
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (filter) params.append('filter', filter);
    if (activeRequesterId) params.append('currentUserId', activeRequesterId);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${BASE_URL}/posts${queryString}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    return data.posts || [];
  } catch (err) {
    console.error('fetchPosts error:', err);
    return [];
  }
}

export async function submitPost(postData) {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to publish post');
  }
  return data.post;
}

export async function votePollApi(postId, optionId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, userId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('votePollApi error:', err);
    return null;
  }
}

export async function likePostApi(postId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('likePostApi error:', err);
    return null;
  }
}

export async function fetchPostLikersApi(postId, userId) {
  try {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${BASE_URL}/posts/${postId}/likes${query}`);
    const data = await res.json();
    return data?.likers || [];
  } catch (err) {
    console.error('fetchPostLikersApi error:', err);
    return [];
  }
}

export async function updatePostApi(postId, { content, tags, userId }) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags, userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('updatePostApi error:', err);
    return { success: false, message: 'Failed to update post' };
  }
}

export async function deletePostApi(postId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('deletePostApi error:', err);
    return { success: false, message: 'Failed to delete post' };
  }
}

export async function fetchTrainers() {
  try {
    const res = await fetch(`${BASE_URL}/trainers`);
    const data = await res.json();
    return data.trainers || [];
  } catch (err) {
    console.error('fetchTrainers error:', err);
    return [];
  }
}

export async function fetchLeaders(userId) {
  try {
    const url = userId ? `${BASE_URL}/leaders?userId=${userId}` : `${BASE_URL}/leaders`;
    const res = await fetch(url);
    const data = await res.json();
    return data.leaders || [];
  } catch (err) {
    console.error('fetchLeaders error:', err);
    return [];
  }
}

export async function fetchServices() {
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();
    return data.services || [];
  } catch (err) {
    console.error('fetchServices error:', err);
    return [];
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch(`${BASE_URL}/events`);
    const data = await res.json();
    return data.events || [];
  } catch (err) {
    console.error('fetchEvents error:', err);
    return [];
  }
}

export async function fetchGroups() {
  try {
    const res = await fetch(`${BASE_URL}/groups`);
    const data = await res.json();
    return data.groups || [];
  } catch (err) {
    console.error('fetchGroups error:', err);
    return [];
  }
}

export async function fetchOpportunities() {
  try {
    const res = await fetch(`${BASE_URL}/opportunities`);
    const data = await res.json();
    return data.opportunities || [];
  } catch (err) {
    console.error('fetchOpportunities error:', err);
    return [];
  }
}

export async function fetchPostComments(postId, userId) {
  try {
    let activeUserId = userId;
    if (!activeUserId) {
      try {
        const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        activeUserId = u.id || u._id;
      } catch {}
    }
    const url = `${BASE_URL}/posts/${postId}/comments${activeUserId ? `?userId=${activeUserId}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch comments');
    const data = await res.json();
    return data.comments || [];
  } catch (err) {
    console.error('fetchPostComments error:', err);
    return [];
  }
}

export async function addPostCommentApi(postId, { content, userId, authorName, authorRole, authorAvatar }) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId, authorName, authorRole, authorAvatar }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('addPostCommentApi error:', err);
    return { success: false, message: 'Failed to add comment' };
  }
}

export async function likePostCommentApi(commentId, userId) {
  try {
    let activeUserId = userId;
    if (!activeUserId) {
      try {
        const u = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        activeUserId = u.id || u._id;
      } catch {}
    }
    const res = await fetch(`${BASE_URL}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: activeUserId }),
    });
    return await res.json();
  } catch (err) {
    console.error('likePostCommentApi error:', err);
    return null;
  }
}

export async function deletePostCommentApi(commentId) {
  try {
    const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    console.error('deletePostCommentApi error:', err);
    return null;
  }
}

export async function sharePostApi(postId, { userId, quote, repostToFeed = false }) {
  try {
    const res = await fetch(`${BASE_URL}/posts/${postId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, quote, repostToFeed }),
    });
    return await res.json();
  } catch (err) {
    console.error('sharePostApi error:', err);
    return { success: false, message: 'Failed to share post' };
  }
}
