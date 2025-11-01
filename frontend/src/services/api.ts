import axios from 'axios';
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  Video,
  CreateVideoDto,
  Playlist,
  CreatePlaylistDto,
  Comment,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          token: refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterDto) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post('/api/auth/resend-verification', { email });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<{ name: string; bio: string; profileImage: string }>) => {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },
};

// Videos API
export const videosAPI = {
  getVideos: async (params?: {
    visibility?: string;
    creatorId?: string;
    skip?: number;
    take?: number;
  }): Promise<Video[]> => {
    const response = await api.get('/api/videos', { params });
    return response.data;
  },

  getVideo: async (id: string): Promise<Video> => {
    const response = await api.get(`/api/videos/${id}`);
    return response.data;
  },

  createVideo: async (data: CreateVideoDto): Promise<Video> => {
    const response = await api.post('/api/videos', data);
    return response.data;
  },

  updateVideo: async (id: string, data: Partial<CreateVideoDto>): Promise<Video> => {
    const response = await api.put(`/api/videos/${id}`, data);
    return response.data;
  },

  publishVideo: async (id: string): Promise<Video> => {
    const response = await api.post(`/api/videos/${id}/publish`);
    return response.data;
  },

  deleteVideo: async (id: string): Promise<void> => {
    await api.delete(`/api/videos/${id}`);
  },

  likeVideo: async (id: string): Promise<{ liked: boolean }> => {
    const response = await api.post(`/api/videos/${id}/like`);
    return response.data;
  },

  saveVideo: async (id: string): Promise<{ saved: boolean }> => {
    const response = await api.post(`/api/videos/${id}/save`);
    return response.data;
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await api.get(`/api/videos/${id}/comments`);
    return response.data;
  },

  createComment: async (
    id: string,
    data: { content: string; parentId?: string }
  ): Promise<Comment> => {
    const response = await api.post(`/api/videos/${id}/comments`, data);
    return response.data;
  },
};

// Playlists API
export const playlistsAPI = {
  getPlaylists: async (creatorId?: string): Promise<Playlist[]> => {
    const response = await api.get('/api/playlists', { params: { creatorId } });
    return response.data;
  },

  getPlaylist: async (id: string): Promise<Playlist> => {
    const response = await api.get(`/api/playlists/${id}`);
    return response.data;
  },

  createPlaylist: async (data: CreatePlaylistDto): Promise<Playlist> => {
    const response = await api.post('/api/playlists', data);
    return response.data;
  },

  updatePlaylist: async (id: string, data: Partial<CreatePlaylistDto>): Promise<Playlist> => {
    const response = await api.put(`/api/playlists/${id}`, data);
    return response.data;
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await api.delete(`/api/playlists/${id}`);
  },

  addVideoToPlaylist: async (
    playlistId: string,
    data: { videoId: string; order?: number }
  ): Promise<void> => {
    await api.post(`/api/playlists/${playlistId}/videos`, data);
  },

  removeVideoFromPlaylist: async (playlistId: string, videoId: string): Promise<void> => {
    await api.delete(`/api/playlists/${playlistId}/videos/${videoId}`);
  },
};

// Analytics API
export const analyticsAPI = {
  recordView: async (videoId: string, secondsWatched: number): Promise<void> => {
    await api.post('/api/analytics/view', { videoId, secondsWatched });
  },

  getVideoAnalytics: async (videoId: string) => {
    const response = await api.get(`/api/analytics/video/${videoId}`);
    return response.data;
  },

  getCreatorDashboard: async () => {
    const response = await api.get('/api/analytics/creator/dashboard');
    return response.data;
  },

  getCreatorRevenue: async () => {
    const response = await api.get('/api/analytics/creator/revenue');
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  createCheckoutSession: async (planType: 'monthly' | 'annual') => {
    const response = await api.post('/api/pay/subscribe', { planType });
    return response.data;
  },

  getSubscriptionStatus: async () => {
    const response = await api.get('/api/pay/subscription/status');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.delete('/api/pay/subscription/cancel');
    return response.data;
  },
};

export default api;
