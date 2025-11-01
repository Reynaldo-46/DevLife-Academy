import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  VideoCameraIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import type { Video } from '../types';

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  estimatedRevenue: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
    estimatedRevenue: 0,
  });
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch creator dashboard stats
      const statsRes = await api.get('/api/analytics/creator/dashboard');
      setStats(statsRes.data);

      // Fetch all videos
      const videosRes = await api.get('/api/videos');
      setVideos(videosRes.data);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (videoId: string, currentlyPublished: boolean) => {
    try {
      if (currentlyPublished) {
        // Unpublish logic (set publishedAt to null)
        await api.put(`/api/videos/${videoId}`, { publishedAt: null });
      } else {
        // Publish
        await api.post(`/api/videos/${videoId}/publish`);
      }
      fetchDashboardData(); // Refresh
    } catch (err: any) {
      console.error('Publish error:', err);
      alert('Failed to publish/unpublish video');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/videos/${videoId}`);
      fetchDashboardData(); // Refresh
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete video');
    }
  };

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Creator Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your videos and track performance
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Upload Video
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <VideoCameraIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalVideos}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Videos</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <EyeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {formatWatchTime(stats.totalWatchTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Watch Time</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              ${stats.estimatedRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Est. Revenue</div>
          </div>
        </div>

        {/* Video Management Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Videos</h2>
          </div>

          {videos.length === 0 ? (
            <div className="p-12 text-center">
              <VideoCameraIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start creating content by uploading your first video
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Upload Your First Video
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {videos.map((video) => (
                    <tr
                      key={video.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <VideoCameraIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {video.title}
                            </div>
                            {video.tags && video.tags.length > 0 && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {video.tags.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {video.publishedAt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            video.visibility === 'PUBLIC'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                              : video.visibility === 'PRIVATE'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}
                        >
                          {video.visibility}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {/* TODO: Add view count from analytics */}
                        0
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handlePublish(video.id, !!video.publishedAt)}
                            className={`p-2 rounded-lg transition-colors ${
                              video.publishedAt
                                ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={video.publishedAt ? 'Unpublish' : 'Publish'}
                          >
                            {video.publishedAt ? (
                              <XCircleIcon className="w-5 h-5" />
                            ) : (
                              <CheckCircleIcon className="w-5 h-5" />
                            )}
                          </button>
                          <Link
                            to={`/videos/${video.id}/edit`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
