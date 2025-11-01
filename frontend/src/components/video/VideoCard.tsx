import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../../types';
import { ClockIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link to={`/videos/${video.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
              <span className="text-white text-4xl font-bold">
                {video.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>
          )}
          {video.visibility === 'PAID' && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              Premium
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600">
            {video.title}
          </h3>

          {video.creator && (
            <div className="flex items-center mb-2">
              {video.creator.profileImage ? (
                <img
                  src={video.creator.profileImage}
                  alt={video.creator.name}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 mr-2" />
              )}
              <span className="text-sm text-gray-600">{video.creator.name}</span>
            </div>
          )}

          {video.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            {video._count && (
              <>
                <div className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  <span>{video._count.likes} views</span>
                </div>
                <div className="flex items-center">
                  <HeartIcon className="h-4 w-4 mr-1" />
                  <span>{video._count.likes}</span>
                </div>
              </>
            )}
            {video.publishedAt && (
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{formatDate(video.publishedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
