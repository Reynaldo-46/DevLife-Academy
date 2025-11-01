import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Video, Comment } from '../types';
import { videosAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HeartIcon, BookmarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

const VideoPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        const videoData = await videosAPI.getVideo(id);
        setVideo(videoData);
        
        const commentsData = await videosAPI.getComments(id);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  // Track watch time
  useEffect(() => {
    if (!video) return;

    const interval = setInterval(() => {
      setWatchTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      // Record analytics when leaving the page
      if (watchTime > 0) {
        analyticsAPI.recordView(video.id, watchTime);
      }
    };
  }, [video, watchTime]);

  const handleLike = async () => {
    if (!video || !isAuthenticated) return;
    try {
      const result = await videosAPI.likeVideo(video.id);
      setLiked(result.liked);
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleSave = async () => {
    if (!video || !isAuthenticated) return;
    try {
      const result = await videosAPI.saveVideo(video.id);
      setSaved(result.saved);
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !isAuthenticated || !newComment.trim()) return;

    try {
      const comment = await videosAPI.createComment(video.id, { content: newComment });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-600">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black aspect-video rounded-lg overflow-hidden mb-4">
              {video.hlsUrl ? (
                <video
                  controls
                  className="w-full h-full"
                  src={video.hlsUrl}
                  poster={video.thumbnailUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <p className="text-white">Video player placeholder</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{video._count?.likes || 0} views</span>
                  <span>•</span>
                  <span>{video.publishedAt && formatDate(video.publishedAt)}</span>
                </div>

                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <button
                    onClick={handleLike}
                    disabled={!isAuthenticated}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    {liked ? (
                      <HeartIconSolid className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5" />
                    )}
                    <span>{video._count?.likes || 0}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={!isAuthenticated}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    {saved ? (
                      <BookmarkIconSolid className="h-5 w-5 text-primary-500" />
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                    <span>Save</span>
                  </button>

                  <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    <ShareIcon className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                {video.creator && (
                  <div className="flex items-center mb-4">
                    {video.creator.profileImage ? (
                      <img
                        src={video.creator.profileImage}
                        alt={video.creator.name}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 mr-3" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{video.creator.name}</p>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Subscribe
                      </button>
                    </div>
                  </div>
                )}

                {video.description && (
                  <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
                )}

                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {comments.length} Comments
              </h2>

              {isAuthenticated && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    {comment.user.profileImage ? (
                      <img
                        src={comment.user.profileImage}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{comment.content}</p>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 mt-3 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              {reply.user.profileImage ? (
                                <img
                                  src={reply.user.profileImage}
                                  alt={reply.user.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300" />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-sm">{reply.user.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700 mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Recommended Videos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended</h3>
              <p className="text-gray-500 text-sm">More videos coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
