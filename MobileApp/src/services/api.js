export const BASE_URL = 'https://fortaa.com';

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
export async function sendMessageApi({ senderId, receiverId, text, attachment, replyTo }) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text, attachment, replyTo }),
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

// 7b. Delete Message HTTP
export async function deleteChatMessageApi(messageId, userId, deleteForEveryone = false) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/delete/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deleteForEveryone }),
    });
    return await res.json();
  } catch (err) {
    console.warn('API error deleteChatMessageApi:', err);
    return { success: false };
  }
}

// 7c. Upload Chat Media (image, video, pdf, document)
export async function uploadChatMediaApi(fileOrUri, mimeType = null, originalName = null) {
  try {
    const formData = new FormData();

    if (typeof fileOrUri === 'string') {
      // Local URI
      let filename = originalName || fileOrUri.split('/').pop() || 'upload_file';
      let type = mimeType || 'application/octet-stream';
      if (!mimeType) {
        if (filename.match(/\.(jpg|jpeg|png|webp)$/i)) type = 'image/jpeg';
        else if (filename.match(/\.(mp4|mov|avi)$/i)) type = 'video/mp4';
        else if (filename.match(/\.pdf$/i)) type = 'application/pdf';
        else if (filename.match(/\.(doc|docx)$/i)) type = 'application/msword';
      }
      formData.append('file', {
        uri: fileOrUri,
        name: filename,
        type,
      });
    } else {
      // Direct File object (Web)
      formData.append('file', fileOrUri);
    }

    const res = await fetch(`${BASE_URL}/api/messages/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('API error uploadChatMediaApi:', err);
    return null;
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
    let filename = uri.split('/').pop() || (isVideo ? 'upload.mp4' : 'upload.jpg');
    if (isVideo && !filename.includes('.')) {
      filename += '.mp4';
    }
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : 'jpg');
    const type = isVideo
      ? (ext === 'mov' ? 'video/quicktime' : 'video/mp4')
      : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

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
    console.warn('Upload API response missing url:', data);
    return uri;
  } catch (err) {
    console.warn('Upload fallback to local URI:', err);
    return uri;
  }
}

// 22. Fetch User Profile
export async function fetchUserProfileApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/users/profile/${userId}`);
    const data = await res.json();
    if (data.success && data.profile) {
      return data.profile;
    }
    return null;
  } catch (err) {
    console.warn('fetchUserProfileApi error:', err);
    return null;
  }
}

// 23. Update User Profile
export async function updateUserProfileApi(userId, profileData) {
  const res = await fetch(`${BASE_URL}/api/users/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update profile');
  }
  return data.profile || data;
}

// 24. Change Password API
export async function changePasswordApi({ currentPassword, newPassword, userId }) {
  const res = await fetch(`${BASE_URL}/api/users/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword, userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update password');
  }
  return data;
}

// 25. Get Post Likers API
export async function getPostLikersApi(postId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts/${postId}/likes?userId=${userId || 0}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.likers)) {
      return data.likers;
    }
    return [];
  } catch (err) {
    console.warn('getPostLikersApi error:', err);
    return [];
  }
}

// 26. Toggle Follow API
export async function toggleFollowApi(targetUserId, currentUserId) {
  try {
    const res = await fetch(`${BASE_URL}/api/follow/toggle/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUserId, userId: currentUserId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('toggleFollowApi error:', err);
    return { success: false };
  }
}

// 27. Delete Story API
export async function deleteStoryApi(storyId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('deleteStoryApi error:', err);
    return { success: false };
  }
}

// 28. Fetch Story Viewers API
export async function fetchStoryViewersApi(storyId) {
  try {
    const res = await fetch(`${BASE_URL}/api/stories/${storyId}/viewers`);
    const data = await res.json();
    const viewers = data?.viewers || [];
    viewers.likesCount = data?.likesCount || 0;
    return viewers;
  } catch (err) {
    console.warn('fetchStoryViewersApi error:', err);
    return [];
  }
}

// 29. Fetch Notifications API
export async function fetchNotificationsApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/${userId}`);
    const data = await res.json();
    return data.notifications || [];
  } catch (err) {
    console.warn('fetchNotificationsApi error:', err);
    return [];
  }
}

// 30. Mark All Notifications Read API
export async function markNotificationsReadApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('markNotificationsReadApi error:', err);
    return { success: false };
  }
}

// 31. Delete Notification API
export async function deleteNotificationApi(notifId, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('deleteNotificationApi error:', err);
    return { success: false };
  }
}

// 32. Fetch User Follow Stats (followers, following, posts count)
export async function fetchUserStatsApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/users/stats/${userId}`);
    const data = await res.json();
    if (data.success && data.stats) return data.stats;
    // fallback: try profile endpoint
    const res2 = await fetch(`${BASE_URL}/api/users/profile/${userId}`);
    const data2 = await res2.json();
    if (data2.success && data2.profile) {
      return {
        followers: data2.profile.followers_count || data2.profile.followersCount || 0,
        following: data2.profile.following_count || data2.profile.followingCount || 0,
        posts: data2.profile.posts_count || data2.profile.postsCount || 0,
        network: data2.profile.network_count || data2.profile.networkCount || 0,
      };
    }
    return { followers: 0, following: 0, posts: 0, network: 0 };
  } catch (err) {
    console.warn('fetchUserStatsApi error:', err);
    return { followers: 0, following: 0, posts: 0, network: 0 };
  }
}

// 33. Fetch User Posts
export async function fetchUserPostsApi(userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/posts?userId=${userId}&filter=my&currentUserId=${userId}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.posts)) return data.posts;
    return [];
  } catch (err) {
    console.warn('fetchUserPostsApi error:', err);
    return [];
  }
}

// 34. Reply to Story (send message via chat API)
export async function replyStoryApi(storyId, { senderId, receiverId, text }) {
  try {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text: `[Story Reply] ${text}` }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('replyStoryApi error:', err);
    return { success: false };
  }
}

// 35. Accept/Decline Follow Request
export async function handleFollowRequestApi(notificationId, action, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/follow/request/${notificationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId }), // action: 'accept' | 'decline'
    });
    return await res.json();
  } catch (err) {
    console.warn('handleFollowRequestApi error:', err);
    return { success: false };
  }
}

// 36. Search Users/Posts
export async function searchApi(query, userId) {
  try {
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}&userId=${userId || 0}`);
    const data = await res.json();
    return {
      leaders: data.leaders || data.users || [],
      posts: data.posts || [],
    };
  } catch (err) {
    console.warn('searchApi error:', err);
    return { leaders: [], posts: [] };
  }
}



