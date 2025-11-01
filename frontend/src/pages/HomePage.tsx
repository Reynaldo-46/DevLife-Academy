import React, { useEffect, useState } from 'react';
import { videosAPI } from '../services/api';
import type { Video } from '../types';
import VideoGrid from '../components/video/VideoGrid';
import { PlayIcon, SparklesIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videosAPI.getVideos({ visibility: 'PUBLIC', take: 12 });
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-900 dark:via-primary-800 dark:to-gray-900 text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 animate-scale-in">
              <SparklesIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Welcome to the Future of Learning</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
              <span className="block">Master the Art of</span>
              <span className="block bg-gradient-to-r from-accent-300 via-accent-200 to-white bg-clip-text text-transparent">
                Full-Stack Development
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-3xl mx-auto animate-slide-up">
              Join me on my journey as a full-stack developer, dad, and lifelong learner. 
              Real coding tutorials, dev vlogs, and life lessons from the trenches.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up">
              <a
                href="#videos"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <PlayIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Learning
              </a>
              <a
                href="/subscribe"
                className="group inline-flex items-center justify-center px-8 py-4 bg-primary-500/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-primary-500/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-all duration-200 border-2 border-white/20 hover:border-white/30"
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Go Premium
              </a>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 md:h-16" viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 48h1440V0S1140 48 720 48 0 0 0 0v48z" className="fill-gray-50 dark:fill-gray-900" />
          </svg>
        </div>
      </div>

      {/* Featured Videos Section */}
      <div id="videos" className="bg-gray-50 dark:bg-gray-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 animate-slide-up">
            <div>
              <h2 className="section-title">Latest Videos</h2>
              <p className="section-subtitle">Fresh content from the dev trenches</p>
            </div>
            <a 
              href="/videos" 
              className="hidden sm:inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold group transition-colors duration-200"
            >
              View All
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
          
          <VideoGrid videos={videos} loading={loading} />

          <div className="mt-8 text-center sm:hidden">
            <a href="/videos" className="btn-primary inline-flex items-center">
              View All Videos
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="section-title">What You'll Learn</h2>
            <p className="section-subtitle">Comprehensive content covering all aspects of modern development</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: 'Coding Tutorials',
                description: 'Master React, TypeScript, Node.js, and the latest web technologies with hands-on projects',
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Dev Vlogs',
                description: 'Real glimpses into my daily life as a work-from-home developer, balancing code and family',
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'Career Insights',
                description: 'Practical advice on career growth, work-life balance, and continuous learning in tech',
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="card-hover p-8 text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white mb-6 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Level Up Your Skills?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of developers learning and growing together
          </p>
          <a
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started Free
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
