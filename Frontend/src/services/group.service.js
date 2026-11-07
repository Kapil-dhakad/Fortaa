// Group API service for Fortaa

const API_BASE = '/api/groups';

/**
 * Fetch all groups with membership status for current user
 */
export async function fetchGroups(userId) {
  try {
    const url = userId ? `${API_BASE}?userId=${encodeURIComponent(userId)}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.groups || [];
  } catch (error) {
    console.error('[group.service] fetchGroups failed:', error);
    return [];
  }
}

/**
 * Fetch groups joined by specific user
 */
export async function fetchUserGroups(userId) {
  try {
    if (!userId) return [];
    const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.groups || [];
  } catch (error) {
    console.error('[group.service] fetchUserGroups failed:', error);
    return [];
  }
}

/**
 * Fetch members of a specific group
 */
export async function fetchGroupMembers(groupId) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(groupId)}/members`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('[group.service] fetchGroupMembers failed:', error);
    return { success: false, members: [], total: 0 };
  }
}

/**
 * Join a group
 */
export async function joinGroup(userId, groupId) {
  try {
    const res = await fetch(`${API_BASE}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to join group');
    }
    return data;
  } catch (error) {
    console.error('[group.service] joinGroup failed:', error);
    throw error;
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(userId, groupId) {
  try {
    const res = await fetch(`${API_BASE}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to leave group');
    }
    return data;
  } catch (error) {
    console.error('[group.service] leaveGroup failed:', error);
    throw error;
  }
}

/**
 * Create a new group
 */
export async function createGroup(groupData) {
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to create group');
    }
    return data.group;
  } catch (error) {
    console.error('[group.service] createGroup failed:', error);
    throw error;
  }
}
