// Frontend Service for 24-Hour Stories (Photo, Video, Text, Interactive Polls)

const BASE_URL = '/api/stories';

/**
 * Fetch all active stories grouped by author
 */
export async function fetchStories(userId) {
  try {
    const res = await fetch(`${BASE_URL}?userId=${userId || 0}`);
    const data = await res.json();
    return data?.storyGroups || [];
  } catch (err) {
    console.error('fetchStories error:', err);
    return [];
  }
}

/**
 * Create a new story (photo, video, text, poll)
 */
export async function createStory(storyPayload) {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyPayload),
    });
    return await res.json();
  } catch (err) {
    console.error('createStory error:', err);
    return { success: false, message: err.message || 'Network error' };
  }
}

/**
 * Record a story view
 */
export async function recordStoryView(storyId, userId) {
  if (!storyId || !userId) return;
  try {
    await fetch(`${BASE_URL}/${storyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (err) {
    console.error('recordStoryView error:', err);
  }
}

/**
 * Vote on a story poll
 */
export async function voteStoryPoll(storyId, optionId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/${storyId}/poll-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('voteStoryPoll error:', err);
    return { success: false };
  }
}

/**
 * Delete a story
 */
export async function deleteStory(storyId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/${storyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('deleteStory error:', err);
    return { success: false };
  }
}

/**
 * Fetch viewers who watched a story
 */
export async function fetchStoryViewers(storyId) {
  try {
    const res = await fetch(`${BASE_URL}/${storyId}/viewers`);
    const data = await res.json();
    const viewers = data?.viewers || [];
    viewers.likesCount = data?.likesCount || 0;
    return viewers;
  } catch (err) {
    console.error('fetchStoryViewers error:', err);
    return [];
  }
}

/**
 * Toggle like on a story
 */
export async function toggleStoryLike(storyId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/${storyId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.error('toggleStoryLike error:', err);
    return { success: false };
  }
}

/**
 * Reply to a story
 */
export async function replyStory(storyId, senderId, text) {
  try {
    const res = await fetch(`${BASE_URL}/${storyId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, text }),
    });
    return await res.json();
  } catch (err) {
    console.error('replyStory error:', err);
    return { success: false, message: err.message };
  }
}
