export const BASE_URL = 'http://10.198.121.199:3000';

// 1. Fetch Dynamic Account Types (Step 1)
export async function getAccountTypes() {
  try {
    const res = await fetch(`${BASE_URL}/api/account-types`);
    const data = await res.json();
    if (data.success && Array.isArray(data.accountTypes)) {
      return data.accountTypes;
    }
    return [];
  } catch (err) {
    console.warn('API error getAccountTypes:', err);
    return [
      { id: 1, title: 'Individual / Professional', description: 'Doctors, Engineers, Advocates, Artists, Consultants, Freelancers', icon: 'user' },
      { id: 2, title: 'Proprietorship / MSME', description: 'Single-owner businesses, traders, manufacturers, small enterprises', icon: 'briefcase' },
      { id: 3, title: 'Partnership / LLP', description: 'Firms with two or more partners, registered partnerships, LLPs', icon: 'users' },
      { id: 4, title: 'Private Limited / Public Ltd', description: 'Registered corporations, large manufacturers, tech startups', icon: 'building' },
    ];
  }
}

// 2. User Login API
export async function loginApi({ identifier, password }) {
  const isEmail = identifier.includes('@');
  const payload = isEmail
    ? { email: identifier.trim().toLowerCase(), password }
    : { mobileNumber: identifier.trim(), password };

  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed. Please check credentials.');
  }
  return data;
}

// 3. User Register API
export async function registerApi(formData) {
  const res = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed. Please check details.');
  }
  return data;
}

// 4. Get All Leaders / Users
export async function getLeadersApi() {
  try {
    const res = await fetch(`${BASE_URL}/api/users/all`);
    const data = await res.json();
    if (data.success && Array.isArray(data.users)) {
      return data.users;
    }
    return [];
  } catch (err) {
    console.warn('API error getLeadersApi:', err);
    return [];
  }
}

// 5. Get Conversations for User
export async function getConversationsApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/conversations/${userId}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.conversations)) {
      return data.conversations;
    }
    return [];
  } catch (err) {
    console.warn('API error getConversationsApi:', err);
    return [];
  }
}

// 6. Get Chat History Between Two Users
export async function getChatHistoryApi(userId, otherUserId) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/history/${userId}/${otherUserId}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.messages)) {
      return data.messages;
    }
    return [];
  } catch (err) {
    console.warn('API error getChatHistoryApi:', err);
    return [];
  }
}

// 7. Send Message HTTP
export async function sendMessageApi({ senderId, receiverId, text }) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send message');
    }
    return data;
  } catch (err) {
    console.warn('API error sendMessageApi:', err);
    throw err;
  }
}

// 8. Google Login API
export async function googleLoginApi({ credential, email, name, picture, accountType }) {
  const res = await fetch(`${BASE_URL}/api/users/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, email, name, picture, accountType }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Google Login failed.');
  }
  return data;
}

// 9. Fetch Real Posts Feed from Backend
export async function fetchPostsApi({ userId, filter = 'all' } = {}) {
  try {
    let url = `${BASE_URL}/api/dashboard/posts?filter=${filter}`;
    if (userId) url += `&userId=${userId}&currentUserId=${userId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && Array.isArray(data.posts)) {
      return data.posts;
    }
    return [];
  } catch (err) {
    console.warn('API error fetchPostsApi:', err);
    return [];
  }
}

// 10. Create Real Post API
export async function createPostApi(payload) {
  const res = await fetch(`${BASE_URL}/api/dashboard/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create post');
  }
  return data.post;
}

// 11. Like / Unlike Post API
export async function likePostApi(postId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API error likePostApi:', err);
    return { success: false };
  }
}

// 12. Vote on Poll API
export async function votePollApi(postId, optionId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, userId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API error votePollApi:', err);
    return { success: false };
  }
}

// 13. Get Post Comments
export async function getPostCommentsApi(postId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/comments`);
    const data = await res.json();
    if (data.success && Array.isArray(data.comments)) {
      return data.comments;
    }
    return [];
  } catch (err) {
    console.warn('API error getPostCommentsApi:', err);
    return [];
  }
}

// 14. Add Post Comment
export async function addPostCommentApi(postId, { userId, authorName, authorAvatar, text }) {
  const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, authorName, authorAvatar, text }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to post comment');
  }
  return data.comment;
}

// 15. Share Post
export async function sharePostApi(postId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('API error sharePostApi:', err);
    return { success: false };
  }
}

// 16. Fetch Active Stories (Instagram-like)
export async function fetchStoriesApi(userId = 0) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories?userId=${userId}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.storyGroups)) {
      return data.storyGroups;
    }
    return [];
  } catch (err) {
    console.warn('API error fetchStoriesApi:', err);
    return [];
  }
}

// 17. Create Story (Photo / Video / Text / Poll)
export async function createStoryApi(storyData) {
  const res = await fetch(`${BASE_URL}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storyData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to publish story');
  }
  return data.story;
}

// 18. Record Story View
export async function recordStoryViewApi(storyId, viewerId) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewerId }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

// 19. Like Story
export async function toggleStoryLikeApi(storyId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories/${storyId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

// 20. Vote on Story Poll
export async function voteStoryPollApi(storyId, optionId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories/${storyId}/poll-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, userId }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

// 21. Upload Media
export async function uploadMediaApi(uri, isVideo = false) {
  try {
    const filename = uri.split('/').pop() || (isVideo ? 'upload.mp4' : 'upload.jpg');
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `${isVideo ? 'video' : 'image'}/${match[1]}` : (isVideo ? 'video/mp4' : 'image/jpeg');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type,
    });

    const endpoint = isVideo ? `${BASE_URL}/api/upload/video` : `${BASE_URL}/api/upload/image`;
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    return uri;
  } catch (err) {
    console.warn('Upload fallback to local URI:', err);
    return uri;
  }
}

