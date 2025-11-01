import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  VideoCameraIcon,
  PlayIcon,
  UserCircleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import VideoCard from '../components/video/VideoCard';

interface SearchResults {
  videos: any[];
  playlists: any[];
  creators: any[];
  totalCount: number;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults>({
    videos: [],
    playlists: [],
    creators: [],
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'playlists' | 'creators'>('all');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/search?q=${encodeURIComponent(query)}&limit=30`);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = () => {
    switch (activeTab) {
      case 'videos':
        return { ...results, playlists: [], creators: [] };
      case 'playlists':
        return { ...results, videos: [], creators: [] };
      case 'creators':
        return { ...results, videos: [], playlists: [] };
      default:
        return results;
    }
  };

  const filtered = filteredResults();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <MagnifyingGlassIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Search Results
              </h1>
              {query && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Results for "<span className="font-medium">{query}</span>"
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All ({results.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'videos'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Videos ({results.videos.length})
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'playlists'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Playlists ({results.playlists.length})
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'creators'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Creators ({results.creators.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filtered.totalCount === 0 ? (
          <div className="text-center py-20">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Videos */}
            {filtered.videos.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <VideoCameraIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Videos ({filtered.videos.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {/* Playlists */}
            {filtered.playlists.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <FolderIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Playlists ({filtered.playlists.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlists/${playlist.id}`}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <PlayIcon className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                          {playlist.videoCount} videos
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {playlist.title}
                        </h3>
                        {playlist.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {playlist.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{playlist.creator.name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Creators */}
            {filtered.creators.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Creators ({filtered.creators.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      to={`/creators/${creator.id}`}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center space-x-4">
                        {creator.profileImage ? (
                          <img
                            src={creator.profileImage}
                            alt={creator.name}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-semibold">
                            {creator.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {creator.name}
                          </h3>
                          {creator.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {creator.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {creator._count.videos} videos
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
