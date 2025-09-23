import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, Heart, Eye, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import DiscussionCard from './DiscussionCard';
import DiscussionModal from './DiscussionModal';
import CreateDiscussionModal from './CreateDiscussionModal';
import CommunityPage from './CommunityPage';

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

interface CommunitySectionProps {
  onAuthRequired: () => void;
}

const CommunitySection: React.FC<CommunitySectionProps> = ({ onAuthRequired }) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommunityPage, setShowCommunityPage] = useState(false);

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

      if (error) {
        console.error('Error fetching discussions:', error);
        setDiscussions([]);
        return;
      }

      setDiscussions(data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setDiscussions([]);
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Community Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Community Discussions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isAuthenticated 
              ? "Share deals, ask questions, and connect with fellow deal hunters"
              : "Browse discussions from our community of deal hunters"
            }
          </p>
        </div>
        
        {isAuthenticated ? (
          <button
            onClick={handleCreateDiscussion}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Start Discussion</span>
          </button>
        ) : (
          <button
            onClick={onAuthRequired}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Sign In to Post</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="views">Most Viewed</option>
          <option value="replies">Most Replies</option>
        </select>
      </div>

      {/* Discussions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
        <div className="space-y-4">
          {filteredDiscussions.map(discussion => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onClick={() => handleDiscussionClick(discussion)}
            />
          ))}

          {/* View More Discussions Button */}
          {filteredDiscussions.length > 5 && (
            <div className="text-center pt-6">
              <button
                onClick={() => setShowCommunityPage(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto"
              >
                <MessageSquare className="h-5 w-5" />
                <span>View More Discussions</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Community Page Modal */}
      {showCommunityPage && (
        <CommunityPage
          onClose={() => setShowCommunityPage(false)}
          onAuthRequired={onAuthRequired}
        />
      )}
    </main>
  );
};

export default CommunitySection;