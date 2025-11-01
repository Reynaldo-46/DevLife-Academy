import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../../types';
import { ClockIcon, EyeIcon, HeartIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Link to={`/videos/${video.id}`} className="group">
      <div className="card-hover overflow-hidden transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600">
              <span className="text-white text-5xl font-bold opacity-30">
                {video.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <PlayCircleIcon className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-lg">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Premium badge */}
          {video.visibility === 'PAID' && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
              Premium
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Creator info */}
          {video.creator && (
            <div className="flex items-center mb-3">
              {video.creator.profileImage ? (
                <img
                  src={video.creator.profileImage}
                  alt={video.creator.name}
                  className="w-8 h-8 rounded-full ring-2 ring-primary-500 mr-3"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold mr-3">
                  {video.creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {video.creator.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {video.title}
          </h3>

          {/* Description */}
          {video.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {video.description}
            </p>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {video._count && (
                <>
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-4 w-4" />
                    <span className="font-medium">{video._count.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="h-4 w-4" />
                    <span className="font-medium">{video._count.likes}</span>
                  </div>
                </>
              )}
            </div>
            {video.publishedAt && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
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
