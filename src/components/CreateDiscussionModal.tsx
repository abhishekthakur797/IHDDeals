import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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

interface CreateDiscussionModalProps {
  onClose: () => void;
  onDiscussionCreated: (discussion: Discussion) => void;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  onClose,
  onDiscussionCreated
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security check: Ensure user is authenticated and has write permissions
    if (!isAuthenticated || !user || !hasPermission('write')) {
      console.error('Unauthorized attempt to create discussion');
      onClose();
      return;
    }
    
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const newDiscussion = {
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        author_name: user.fullName || user.username || 'Anonymous'
      };

      const { data, error } = await supabase
        .from('discussions')
        .insert(newDiscussion)
        .select()
        .single();

      if (error) throw error;

      onDiscussionCreated({
        ...data,
        likes: 0,
        views: 0,
        reply_count: 0
      });
    } catch (error) {
      console.error('Error creating discussion:', error);
      // Show error to user instead of creating mock discussion
      alert('Failed to create discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Start New Discussion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your discussion about?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
              maxLength={200}
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {title.length}/200 characters
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your discussion topic..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
              maxLength={2000}
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {content.length}/2000 characters
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{loading ? 'Creating...' : 'Create Discussion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDiscussionModal;