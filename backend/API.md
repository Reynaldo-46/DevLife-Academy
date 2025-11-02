# DevLife Academy API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "profileImage": "https://example.com/image.jpg" (optional),
  "bio": "My bio" (optional)
}

Response: 200 OK
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "SUBSCRIBER"
    },
    "accessToken": "jwt_token"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "SUBSCRIBER"
    },
    "accessToken": "jwt_token"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=<refresh_token>

Response: 200 OK
{
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>

Response: 200 OK
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Videos

### Get Upload URL (Presigned URL)
**Requires: CREATOR or ADMIN role**
```http
POST /api/videos/upload-url
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "filename": "my-video.mp4",
  "contentType": "video/mp4"
}

Response: 200 OK
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "videos/user_id/timestamp-my-video.mp4",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/..."
  }
}
```

### Get Thumbnail Upload URL
**Requires: CREATOR or ADMIN role**
```http
POST /api/videos/thumbnail-upload-url
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "filename": "thumbnail.jpg",
  "contentType": "image/jpeg"
}

Response: 200 OK
{
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "thumbnails/user_id/timestamp-thumbnail.jpg",
    "publicUrl": "https://bucket.s3.region.amazonaws.com/..."
  }
}
```

### Create Video
**Requires: CREATOR or ADMIN role**
```http
POST /api/videos
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "My Video Title",
  "description": "Video description" (optional),
  "tags": ["tutorial", "coding"] (optional),
  "visibility": "PUBLIC" (optional, default: PUBLIC),
  "price": 9.99 (optional, for PAID videos),
  "filename": "my-video.mp4",
  "thumbnailFilename": "thumbnail.jpg" (optional),
  "duration": 300 (in seconds)
}

Response: 201 Created
{
  "data": {
    "id": "video_id",
    "title": "My Video Title",
    "description": "Video description",
    "tags": ["tutorial", "coding"],
    "visibility": "PUBLIC",
    "s3Key": "videos/user_id/timestamp-my-video.mp4",
    "hlsUrl": "https://bucket.s3.region.amazonaws.com/...",
    "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/...",
    "duration": 300,
    "views": 0,
    "creator": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "profileImage": "..."
    },
    "createdAt": "2025-11-02T05:00:00.000Z",
    "updatedAt": "2025-11-02T05:00:00.000Z"
  }
}
```

### Get All Videos (Public)
```http
GET /api/videos?page=1&limit=10

Response: 200 OK
{
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Get Video by ID
```http
GET /api/videos/:id

Response: 200 OK
{
  "data": {
    "id": "video_id",
    "title": "My Video Title",
    ...
  }
}
```

### Get Videos by Creator
```http
GET /api/videos/creator/:creatorId?page=1&limit=10

Response: 200 OK
{
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

### Update Video
**Requires: CREATOR or ADMIN role (own videos only)**
```http
PATCH /api/videos/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title" (optional),
  "description": "Updated description" (optional),
  "tags": ["new", "tags"] (optional),
  "visibility": "PRIVATE" (optional),
  "price": 14.99 (optional)
}

Response: 200 OK
{
  "data": {
    "id": "video_id",
    "title": "Updated Title",
    ...
  }
}
```

### Publish Video
**Requires: CREATOR or ADMIN role (own videos only)**
```http
POST /api/videos/:id/publish
Authorization: Bearer <access_token>

Response: 200 OK
{
  "data": {
    "id": "video_id",
    "publishedAt": "2025-11-02T05:00:00.000Z",
    ...
  }
}
```

### Delete Video
**Requires: CREATOR or ADMIN role (own videos only)**
```http
DELETE /api/videos/:id
Authorization: Bearer <access_token>

Response: 200 OK
{
  "data": {
    "message": "Video deleted successfully"
  }
}
```

## Playlists

### Create Playlist
**Requires: CREATOR or ADMIN role**
```http
POST /api/playlists
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "My Playlist",
  "description": "Playlist description" (optional),
  "coverImage": "https://example.com/cover.jpg" (optional),
  "isPublic": true (optional, default: true)
}

Response: 201 Created
{
  "data": {
    "id": "playlist_id",
    "title": "My Playlist",
    "description": "Playlist description",
    "coverImage": "https://example.com/cover.jpg",
    "isPublic": true,
    "creator": {
      "id": "user_id",
      "name": "John Doe",
      "profileImage": "..."
    },
    "createdAt": "2025-11-02T05:00:00.000Z",
    "updatedAt": "2025-11-02T05:00:00.000Z"
  }
}
```

### Get All Playlists (Public)
```http
GET /api/playlists?page=1&limit=10

Response: 200 OK
{
  "data": {
    "playlists": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 30,
      "totalPages": 3
    }
  }
}
```

### Get Playlist by ID
```http
GET /api/playlists/:id

Response: 200 OK
{
  "data": {
    "id": "playlist_id",
    "title": "My Playlist",
    "description": "Playlist description",
    "creator": {...},
    "videos": [
      {
        "id": "playlist_video_id",
        "order": 0,
        "video": {
          "id": "video_id",
          "title": "Video Title",
          ...
        }
      }
    ],
    ...
  }
}
```

### Get Playlists by Creator
```http
GET /api/playlists/creator/:creatorId?page=1&limit=10

Response: 200 OK
{
  "data": {
    "playlists": [...],
    "pagination": {...}
  }
}
```

### Update Playlist
**Requires: CREATOR or ADMIN role (own playlists only)**
```http
PATCH /api/playlists/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Playlist Title" (optional),
  "description": "Updated description" (optional),
  "coverImage": "https://example.com/new-cover.jpg" (optional),
  "isPublic": false (optional)
}

Response: 200 OK
{
  "data": {
    "id": "playlist_id",
    "title": "Updated Playlist Title",
    ...
  }
}
```

### Add Video to Playlist
**Requires: CREATOR or ADMIN role (own playlists only)**
```http
POST /api/playlists/:id/videos
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "videoId": "video_id",
  "order": 0 (optional)
}

Response: 201 Created
{
  "data": {
    "id": "playlist_video_id",
    "playlistId": "playlist_id",
    "videoId": "video_id",
    "order": 0,
    "video": {...}
  }
}
```

### Remove Video from Playlist
**Requires: CREATOR or ADMIN role (own playlists only)**
```http
DELETE /api/playlists/:id/videos/:videoId
Authorization: Bearer <access_token>

Response: 200 OK
{
  "data": {
    "message": "Video removed from playlist"
  }
}
```

### Delete Playlist
**Requires: CREATOR or ADMIN role (own playlists only)**
```http
DELETE /api/playlists/:id
Authorization: Bearer <access_token>

Response: 200 OK
{
  "data": {
    "message": "Playlist deleted successfully"
  }
}
```

## Video Upload Flow

1. **Get Presigned Upload URL**
   ```
   POST /api/videos/upload-url
   { "filename": "video.mp4", "contentType": "video/mp4" }
   ```
   Returns: `uploadUrl`, `key`, `publicUrl`

2. **Upload Video to S3 (Client-side)**
   ```
   PUT <uploadUrl>
   Content-Type: video/mp4
   Body: <video file binary data>
   ```

3. **Create Video Record**
   ```
   POST /api/videos
   {
     "title": "My Video",
     "filename": "video.mp4",
     "duration": 300,
     ...
   }
   ```

4. **Publish Video** (Optional)
   ```
   POST /api/videos/:id/publish
   ```

## Error Responses

All error responses follow this format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2025-11-02T05:00:00.000Z",
  "path": "/api/videos"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error
