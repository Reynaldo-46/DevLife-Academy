# Frontend Integration Guide

This guide explains how to integrate the frontend with the newly implemented backend video upload and playlist features.

## Overview

The backend now provides complete API endpoints for:
- Video uploads using AWS S3 presigned URLs
- Playlist management
- User authentication

## Required Frontend Changes

### 1. Fix the "No routes matched location '/playlists'" Error

Add a `/playlists` route to your frontend router:

```typescript
// Example for React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playlists" element={<Playlists />} />  {/* ADD THIS */}
        <Route path="/playlists/:id" element={<PlaylistDetail />} />
        {/* ... other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. Implement Video Upload Flow

Replace the current video upload implementation with this three-step process:

```typescript
async function uploadVideo(videoFile: File, metadata: VideoMetadata) {
  try {
    // Step 1: Get presigned upload URL from backend
    const uploadUrlResponse = await fetch('http://localhost:3000/api/videos/upload-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: videoFile.name,
        contentType: videoFile.type,
      }),
    });
    
    if (!uploadUrlResponse.ok) {
      throw new Error('Failed to get upload URL');
    }
    
    const { uploadUrl, key, publicUrl } = await uploadUrlResponse.json();
    
    // Step 2: Upload video directly to S3
    const s3UploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': videoFile.type,
      },
      body: videoFile,
    });
    
    if (!s3UploadResponse.ok) {
      throw new Error('Failed to upload video to S3');
    }
    
    // Step 3: Create video record in database
    const createVideoResponse = await fetch('http://localhost:3000/api/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        visibility: metadata.visibility || 'PUBLIC',
        filename: videoFile.name,
        duration: metadata.duration, // Get from video metadata
      }),
    });
    
    if (!createVideoResponse.ok) {
      throw new Error('Failed to create video record');
    }
    
    const video = await createVideoResponse.json();
    
    // Step 4: Redirect to playlists (NOT dashboard)
    window.location.href = '/playlists';
    // OR using React Router: navigate('/playlists');
    
    return video;
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
}
```

### 3. Fix Premature Dashboard Redirect

**Current Issue**: The page redirects to dashboard before video is uploaded.

**Fix**: Only redirect after ALL three steps complete:

```typescript
// ❌ WRONG - Don't do this
async function handleUpload() {
  uploadVideo(file, metadata); // Don't await
  navigate('/dashboard'); // Redirects immediately!
}

// ✅ CORRECT - Wait for upload to complete
async function handleUpload() {
  try {
    await uploadVideo(file, metadata); // Wait for completion
    navigate('/playlists'); // Redirect to playlists, not dashboard
  } catch (error) {
    // Show error message to user
    setError(error.message);
  }
}
```

### 4. Add Upload Progress Indicator

Track upload progress for better UX:

```typescript
async function uploadVideoWithProgress(
  videoFile: File,
  metadata: VideoMetadata,
  onProgress: (percent: number) => void
) {
  // Step 1: Get presigned URL
  onProgress(10);
  const { uploadUrl } = await getUploadUrl(videoFile.name, videoFile.type);
  
  // Step 2: Upload to S3 with progress tracking
  onProgress(20);
  await uploadToS3WithProgress(uploadUrl, videoFile, (percent) => {
    onProgress(20 + (percent * 0.6)); // 20% to 80%
  });
  
  // Step 3: Create video record
  onProgress(85);
  const video = await createVideoRecord(metadata);
  
  onProgress(100);
  return video;
}

// Usage in component
function VideoUploadForm() {
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleSubmit = async () => {
    setUploadProgress(0);
    await uploadVideoWithProgress(file, metadata, setUploadProgress);
    navigate('/playlists');
  };
  
  return (
    <div>
      {/* Your form */}
      {uploadProgress > 0 && (
        <div className="progress-bar">
          <div style={{ width: `${uploadProgress}%` }} />
          <span>{uploadProgress}% uploaded</span>
        </div>
      )}
    </div>
  );
}
```

### 5. Fetch and Display Playlists

Create a Playlists page component:

```typescript
function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const response = await fetch('http://localhost:3000/api/playlists');
        const data = await response.json();
        setPlaylists(data.playlists);
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlaylists();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Playlists</h1>
      <div className="playlists-grid">
        {playlists.map(playlist => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
}
```

## Environment Configuration

Create a `.env` file in your frontend:

```env
VITE_API_URL=http://localhost:3000/api
# or for Next.js:
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## API Helper Functions

Create a centralized API helper:

```typescript
// api/videos.ts
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

export async function getVideoUploadUrl(filename: string, contentType: string) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/videos/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType }),
  });
  
  if (!response.ok) throw new Error('Failed to get upload URL');
  return response.json();
}

export async function uploadToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  if (!response.ok) throw new Error('Failed to upload to S3');
}

export async function createVideo(data: CreateVideoDto) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error('Failed to create video');
  return response.json();
}

export async function getPlaylists(page = 1, limit = 10) {
  const response = await fetch(`${API_URL}/playlists?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
}
```

## Testing the Integration

1. **Start the backend**:
```bash
cd backend
npm run start:dev
```

2. **Test the endpoints**:
```bash
# Should return empty array initially (not an error)
curl http://localhost:3000/api/playlists
```

3. **Test video upload flow**:
   - Login as a user with CREATOR or ADMIN role
   - Navigate to video upload page
   - Select a video file
   - Fill in metadata (title, description, etc.)
   - Click upload
   - Verify upload progress shows
   - Verify redirect goes to `/playlists` (not `/dashboard`)
   - Verify no console errors

## Common Issues and Solutions

### Issue: "No routes matched location '/playlists'"
**Solution**: Add the `/playlists` route to your frontend router (see section 1)

### Issue: Page redirects before upload completes
**Solution**: Use `await` when calling upload functions (see section 3)

### Issue: 401 Unauthorized on upload
**Solution**: Ensure user has CREATOR or ADMIN role, not just SUBSCRIBER

### Issue: CORS errors
**Solution**: Backend CORS is configured for `http://localhost:5173`. Update backend `.env`:
```env
CORS_ORIGIN=http://localhost:YOUR_FRONTEND_PORT
```

### Issue: Upload succeeds but video doesn't show in list
**Solution**: Call the publish endpoint after creating the video:
```typescript
await fetch(`${API_URL}/videos/${videoId}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

## Next Steps

1. Implement the changes outlined above
2. Test the complete upload flow
3. Add error handling and user feedback
4. Implement thumbnail upload (similar to video upload)
5. Add upload retry logic for failed uploads
6. Implement video player on playlist detail page

## Need Help?

- See `backend/API.md` for complete API documentation
- See `backend/README.md` for backend setup instructions
- See `SOLUTION.md` for detailed solution explanation
