import { getToken } from "../utils/auth";

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
    let message = text;
    try {
      message = JSON.parse(text).message || text;
    } catch {}
    const err = new Error(message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// Helper to get stored token and pass it automatically
const withToken = async (fn) => {
  const token = await getToken();
  return fn(token);
};

// ── Auth (public — no token needed) ──────────────────────────────────────────
const login = (email, password) =>
  request("POST", "/api/auth/login", { body: { email, password } });

const register = (firstName, lastName, email, password) =>
  request("POST", "/api/auth/register", { body: { firstName, lastName, email, password } });

const verifyEmail = (email, code) =>
  request("POST", "/api/auth/verify-email", { body: { email, code } });

// ── Posts (public reads) ──────────────────────────────────────────────────────
const getAllPosts = () => request("GET", "/api/posts");

const getPostById = (postId, token) => request("GET", `/api/posts/${postId}`, { token });

const getPostsByCategory = (category) =>
  request("GET", "/api/posts/post", { params: { category } });

const getUserPostsByStatus = (status, userId) =>
  request("GET", `/api/posts/userpost/${status}`, { params: { userId } });

const updatePostImagesAndDetails = (token, postId, formData) =>
  request("PUT", `/api/posts/${postId}`, { token, body: formData, multipart: true });

const deletePostById = (token, postId) =>
  request("DELETE", `/api/posts/${postId}`, { token });

const reportPost = (token, postId, payload) =>
  request("POST", `/api/posts/${postId}/report`, { token, body: payload });

const markPostSoldDetailed = (token, postId, payload = {}) =>
  request("PATCH", `/api/users/post/${postId}`, { token, body: { status: "sold", ...payload } });

// ── Users (auth required) ─────────────────────────────────────────────────────
const getCurrentUserProfile = (token) =>
  request("GET", "/api/users/profile", { token });

const updateCurrentUserProfile = (token, payload) =>
  request("PUT", "/api/users/profile", { token, body: payload });

const getUserProfileByUserId = (token, userId) =>
  request("GET", `/api/users/profile/${userId}`, { token });

const getUserActiveListings = (token, userId) => {
  const path = userId ? `/api/users/post/active/${userId}` : "/api/users/post/active";
  return request("GET", path, { token });
};

const getUserSoldListings = (token, userId) => {
  const path = userId ? `/api/users/post/sold/${userId}` : "/api/users/post/sold";
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

// ── E2E Public Keys ───────────────────────────────────────────────────────────
const savePublicKey = (token, publicKey) =>
  request("POST", "/api/users/public-key", { token, body: { publicKey } });

const getPublicKey = (token, userId) =>
  request("GET", `/api/users/public-key/${userId}`, { token });

const api = {
  // auth
  login,
  register,
  verifyEmail,
  // posts
  getAllPosts,
  getPostById,
  getPostsByCategory,
  getUserPostsByStatus,
  updatePostImagesAndDetails,
  deletePostById,
  reportPost,
  markPostSoldDetailed,
  // users
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserProfileByUserId,
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
  savePublicKey,
  getPublicKey,
};

export default api;
