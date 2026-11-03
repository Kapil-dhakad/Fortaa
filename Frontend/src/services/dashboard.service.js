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

export async function fetchPosts(userId = null, filter = '') {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (filter) params.append('filter', filter);
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

export async function fetchLeaders() {
  try {
    const res = await fetch(`${BASE_URL}/leaders`);
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
