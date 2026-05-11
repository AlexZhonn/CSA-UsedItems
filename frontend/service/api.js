const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

const authHeaders = (token, extra = {}) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extra,
});

const request = async (method, path, { token, body, params, multipart } = {}) => {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = multipart
    ? authHeaders(token)
    : authHeaders(token, { "Content-Type": "application/json" });

  const res = await fetch(url, {
    method,
    headers,
    body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const getAllPosts = () => request("GET", "/api/posts");

const getPostById = (postId, token) => request("GET", `/api/posts/${postId}`, { token });

const getPostsByCategory = (category) =>
  request("GET", "/api/posts/post", { params: { category } });

const getUserPostsByStatus = (status, clerkId) =>
  request("GET", `/api/posts/userpost/${status}`, { params: { clerkId } });

const updatePostImagesAndDetails = (token, postId, formData) =>
  request("PUT", `/api/posts/${postId}`, { token, body: formData, multipart: true });

const deletePostById = (token, postId) =>
  request("DELETE", `/api/posts/${postId}`, { token });

const reportPost = (token, postId, payload) =>
  request("POST", `/api/posts/${postId}/report`, { token, body: payload });

const markPostSoldDetailed = (token, postId, payload = {}) =>
  request("PATCH", `/api/users/post/${postId}`, { token, body: { status: "sold", ...payload } });

const saveUser = (token, payload) =>
  request("POST", "/api/users/save", { token, body: payload });

const getCurrentUserProfile = (token) =>
  request("GET", "/api/users/profile", { token });

const updateCurrentUserProfile = (token, payload) =>
  request("PUT", "/api/users/profile", { token, body: payload });

const getUserProfileByClerkId = (token, clerkId) =>
  request("GET", `/api/users/profile/${clerkId}`, { token });

const getUserActiveListings = (token, clerkId) => {
  const path = clerkId ? `/api/users/post/active/${clerkId}` : "/api/users/post/active";
  return request("GET", path, { token });
};

const getUserSoldListings = (token, clerkId) => {
  const path = clerkId ? `/api/users/post/sold/${clerkId}` : "/api/users/post/sold";
  return request("GET", path, { token });
};

const addPostToUserActive = (token, postId) =>
  request("POST", "/api/users/post/active", { token, body: { postId } });

const markUserPostSold = (token, postId, extra = {}) =>
  request("PATCH", `/api/users/post/${postId}`, { token, body: { status: "sold", ...extra } });

const markUserPostActive = (token, postId, extra = {}) =>
  request("PATCH", `/api/users/post/${postId}`, { token, body: { status: "active", ...extra } });

const deleteUserPost = (token, postId) =>
  request("DELETE", `/api/users/post/${postId}`, { token });

const getUserFavorites = (token) =>
  request("GET", "/api/users/post/favorites", { token });

const updateUserFavorite = (token, { postId, action }) =>
  request("POST", "/api/users/post/favorites", { token, body: { postId, action } });

const getCurrentMongoUser = (token) =>
  request("GET", "/api/users/me", { token });

const createUserPost = (token, formData) =>
  request("POST", "/api/users/post/add", { token, body: formData, multipart: true });

const getUserConversations = (token, params = {}) =>
  request("GET", "/api/users/conversation", { token, params });

const startConversation = (token, { postId }) =>
  request("POST", "/api/users/conversation/start", { token, body: { postId } });

const getConversationMessages = (token, conversationId) =>
  request("GET", `/api/users/conversation/${conversationId}/messages`, { token });

const sendConversationMessage = (token, conversationId, body) =>
  request("POST", `/api/users/conversation/${conversationId}/messages`, { token, body });

const getFeatureStats = () => request("GET", "/api/features/feature");

const api = {
  getAllPosts,
  getPostById,
  getPostsByCategory,
  getUserPostsByStatus,
  updatePostImagesAndDetails,
  deletePostById,
  reportPost,
  markPostSoldDetailed,
  saveUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserProfileByClerkId,
  getUserActiveListings,
  getUserSoldListings,
  addPostToUserActive,
  markUserPostSold,
  markUserPostActive,
  deleteUserPost,
  getUserFavorites,
  updateUserFavorite,
  getCurrentMongoUser,
  createUserPost,
  getUserConversations,
  startConversation,
  getConversationMessages,
  sendConversationMessage,
  getFeatureStats,
};

export default api;
