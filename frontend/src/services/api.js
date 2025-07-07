import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (emailOrUsername, password) => api.post('/auth/login', { emailOrUsername, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  uploadAvatar: (id, formData) => api.post(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadCover: (id, formData) => api.post(`/users/${id}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
  getClips: (id, params) => api.get(`/users/${id}/clips`, { params }),
  search: (query) => api.get(`/search/users?q=${encodeURIComponent(query)}`),
};

// Posts API
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (postData) => api.post('/posts', postData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, postData) => api.put(`/posts/${id}`, postData),
  delete: (id) => api.delete(`/posts/${id}`),
  getFeed: () => api.get('/posts/feed'),
};

// Confessions API
export const confessionsAPI = {
  getAll: (page = 1) => api.get('/confessions', { params: { page, limit: 20 } }),
};

// Clips API
export const clipsAPI = {
  getAll: (params) => api.get('/clips', { params }),
  getById: (id) => api.get(`/clips/${id}`),
  create: (clipData) => api.post('/clips', clipData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createFromPost: (postId, clipData) => api.post(`/clips/from-post/${postId}`, clipData),
  update: (id, clipData) => api.put(`/clips/${id}`, clipData),
  delete: (id) => api.delete(`/clips/${id}`),
  getCategories: () => api.get('/clips/categories'),
};

// Comments API
export const commentsAPI = {
  getPostComments: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  getClipComments: (clipId, params) => api.get(`/comments/clip/${clipId}`, { params }),
  addPostComment: (postId, commentData) => api.post(`/comments/post/${postId}`, commentData),
  addClipComment: (clipId, commentData) => api.post(`/comments/clip/${clipId}`, commentData),
  update: (id, commentData) => api.put(`/comments/${id}`, commentData),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Likes API
export const likesAPI = {
  togglePostLike: (postId) => api.post(`/likes/post/${postId}`),
  toggleClipLike: (clipId) => api.post(`/likes/clip/${clipId}`),
  toggleCommentLike: (commentId) => api.post(`/likes/comment/${commentId}`),
  checkPostLike: (postId) => api.get(`/likes/post/${postId}`),
  checkClipLike: (clipId) => api.get(`/likes/clip/${clipId}`),
  checkCommentLike: (commentId) => api.get(`/likes/comment/${commentId}`),
};

// Follow API
export const followAPI = {
  toggleFollow: (userId) => api.post(`/follow/${userId}`),
  checkFollow: (userId) => api.get(`/follow/${userId}`),
  getFollowers: (userId, params) => api.get(`/follow/${userId}/followers`, { params }),
  getFollowing: (userId, params) => api.get(`/follow/${userId}/following`, { params }),
};

// Search API
export const searchAPI = {
  searchUsers: (params) => api.get('/search/users', { params }),
  searchPosts: (params) => api.get('/search/posts', { params }),
  searchClips: (params) => api.get('/search/clips', { params }),
  globalSearch: (params) => api.get('/search/global', { params }),
};

// Chat API
export const chatAPI = {
  getConversations: (userId) => api.get(`/chat/conversations/${userId}`),
  createConversation: (userId1, userId2) => api.post('/chat/conversations', { userId1, userId2 }),
  getMessages: (conversationId) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (messageData) => api.post('/chat/messages', messageData),
};

// Shorts API
export const shortsAPI = {
  getAll: (page = 1) => api.get('/shorts', { params: { page, limit: 20 } }),
  create: (data) => api.post('/shorts', data),
  getById: (id) => api.get(`/shorts/${id}`),
  like: (id) => api.post(`/shorts/${id}/like`),
  addComment: (id, content) => api.post(`/shorts/${id}/comments`, { content }),
  getComments: (id, page = 1) => api.get(`/shorts/${id}/comments`, { params: { page, limit: 20 } }),
  delete: (id) => api.delete(`/shorts/${id}`),
  getByUser: (userId, page = 1) => api.get(`/shorts/user/${userId}`, { params: { page, limit: 20 } }),
};

export default api; 