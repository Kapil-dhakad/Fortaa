// Frontend Service for Fortaa Admin Dashboard APIs

const BASE_URL = '/api/admin';

export async function loginAdmin(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    console.error('loginAdmin error:', err);
    return { success: false, message: 'Unable to connect to server' };
  }
}

export async function fetchAdminStats() {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminStats error:', err);
    return { success: false, stats: {} };
  }
}

export async function fetchAdminRecentActivities() {
  try {
    const res = await fetch(`${BASE_URL}/recent-activities`);
    if (!res.ok) throw new Error('Failed to fetch recent activities');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminRecentActivities error:', err);
    return { success: false, activities: [] };
  }
}

export async function fetchAdminLatestUsers() {
  try {
    const res = await fetch(`${BASE_URL}/latest-users`);
    if (!res.ok) throw new Error('Failed to fetch latest users');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminLatestUsers error:', err);
    return { success: false, users: [] };
  }
}

export async function fetchAdminTopCategories() {
  try {
    const res = await fetch(`${BASE_URL}/top-categories`);
    if (!res.ok) throw new Error('Failed to fetch top categories');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminTopCategories error:', err);
    return { success: false, categories: [] };
  }
}

export async function fetchAdminLatestCompanies() {
  try {
    const res = await fetch(`${BASE_URL}/latest-companies`);
    if (!res.ok) throw new Error('Failed to fetch latest companies');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminLatestCompanies error:', err);
    return { success: false, companies: [] };
  }
}

export async function fetchAdminRecentEvents() {
  try {
    const res = await fetch(`${BASE_URL}/recent-events`);
    if (!res.ok) throw new Error('Failed to fetch recent events');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminRecentEvents error:', err);
    return { success: false, events: [] };
  }
}

export async function fetchAdminPlatformStats() {
  try {
    const res = await fetch(`${BASE_URL}/platform-stats`);
    if (!res.ok) throw new Error('Failed to fetch platform stats');
    return await res.json();
  } catch (err) {
    console.error('fetchAdminPlatformStats error:', err);
    return { success: false, platformStats: {} };
  }
}
