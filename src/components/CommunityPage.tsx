import React, { useState, useEffect } from 'react';
import { X, Search, Plus, MessageSquare, Heart, Eye, Clock, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import DiscussionCard from './DiscussionCard';
import DiscussionModal from './DiscussionModal';
import CreateDiscussionModal from './CreateDiscussionModal';

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  likes: number;
  views: number;
  reply_count: number;
}

interface CommunityPageProps {
  onClose: () => void;
  onAuthRequired: () => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ onClose, onAuthRequired }) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const discussionsPerPage = 15;

  useEffect(() => {
    fetchDiscussions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('discussions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions' }, () => {
        fetchDiscussions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterAndSortDiscussions();
  }, [discussions, searchTerm, sortBy]);

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.warn('Error fetching discussions, using mock data:', error);
      // Fallback mock data for demo
      setDiscussions([
        {
          id: '1',
          title: 'Best deals for Black Friday 2025?',
          content: 'Hey everyone! Black Friday is coming up and I\'m looking for the best deals on electronics. What are your top recommendations?',
          author_id: 'demo-user',
          author_name: 'Deal Hunter',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes: 23,
          views: 156,
          reply_count: 8
        },
        {
          id: '2',
          title: 'Smart home setup on a budget',
          content: 'I\'m trying to set up a smart home without breaking the bank. Any suggestions for affordable smart devices that actually work well?',
          author_id: 'demo-user-2',
          author_name: 'Tech Newbie',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          likes: 15,
          views: 89,
          reply_count: 5
        },
        {
          id: '3',
          title: 'Wireless headphones under $100',
          content: 'Can anyone recommend good wireless headphones under $100? I need them for commuting and working out.',
          author_id: 'demo-user-3',
          author_name: 'Music Lover',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          likes: 31,
          views: 203,
          reply_count: 12
        },
        {
          id: '4',
          title: 'Gaming laptop recommendations under $1000',
          content: 'Looking for a decent gaming laptop that won\'t break the bank. Any suggestions for good performance under $1000?',
          author_id: 'demo-user-4',
          author_name: 'Gamer123',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 259200000).toISOString(),
          likes: 18,
          views: 134,
          reply_count: 7
        },
        {
          id: '5',
          title: 'Best kitchen appliances for small apartments',
          content: 'Moving to a small apartment and need space-saving kitchen appliances. What are your must-haves?',
          author_id: 'demo-user-5',
          author_name: 'CookingEnthusiast',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          updated_at: new Date(Date.now() - 345600000).toISOString(),
          likes: 12,
          views: 98,
          reply_count: 4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDiscussions = () => {
    let filtered = discussions.filter(discussion =>
      discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.likes + b.reply_count) - (a.likes + a.reply_count);
        case 'views':
          return b.views - a.views;
        case 'replies':
          return b.reply_count - a.reply_count;
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredDiscussions(filtered);
    setCurrentPage(1);
  };

  const handleCreateDiscussion = () => {
    if (!isAuthenticated || !hasPermission('write')) {
      onAuthRequired();
      return;
    }
    setShowCreateModal(true);
  };

  const handleDiscussionCreated = (newDiscussion: Discussion) => {
    setDiscussions(prev => [newDiscussion, ...prev]);
    setShowCreateModal(false);
  };

  const handleDiscussionClick = async (discussion: Discussion) => {
    // Increment views
    try {
      await supabase
        .from('discussions')
        .update({ views: discussion.views + 1 })
        .eq('id', discussion.id);
    } catch (error) {
      console.error('Error updating views:', error);
    }
    
    setSelectedDiscussion({ ...discussion, views: discussion.views + 1 });
  };

  const getPaginatedDiscussions = () => {
    const startIndex = (currentPage - 1) * discussionsPerPage;
    const endIndex = startIndex + discussionsPerPage;
    return filteredDiscussions.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredDiscussions.length / discussionsPerPage);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community Discussions ({filteredDiscussions.length})
            </h1>
            {!isAuthenticated && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                Read-only mode
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleCreateDiscussion}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Discussion</span>
              </button>
            ) : (
              <button
                onClick={onAuthRequired}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In to Post</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
              <option value="replies">Most Replies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discussions List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredDiscussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No discussions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : isAuthenticated 
                  ? 'Be the first to start a discussion!' 
                  : 'Sign in to start participating in discussions!'
              }
            </p>
            {!isAuthenticated && !searchTerm && (
              <button
                onClick={onAuthRequired}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In to Join
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {getPaginatedDiscussions().map(discussion => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  onClick={() => handleDiscussionClick(discussion)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Discussion Modal */}
      {selectedDiscussion && (
        <DiscussionModal
          discussion={selectedDiscussion}
          user={user}
          onClose={() => setSelectedDiscussion(null)}
          onAuthRequired={onAuthRequired}
        />
      )}

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <CreateDiscussionModal
          onClose={() => setShowCreateModal(false)}
          onDiscussionCreated={handleDiscussionCreated}
        />
      )}
    </div>
  );
};

export default CommunityPage;