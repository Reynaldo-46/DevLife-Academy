export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CREATOR' | 'SUBSCRIBER';
  profileImage?: string;
  bio?: string;
  joinDate: string;
}

export interface Video {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE' | 'PAID';
  price?: number;
  s3Key?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  transcript?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Playlist {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  videos?: {
    id: string;
    order: number;
    video: Video;
  }[];
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  replies?: Comment[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
  role?: 'CREATOR' | 'SUBSCRIBER';
}

export interface CreateVideoDto {
  title: string;
  description?: string;
  tags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PAID';
  price?: number;
  s3Key?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  transcript?: string;
}

export interface CreatePlaylistDto {
  title: string;
  description?: string;
  coverImage?: string;
}
