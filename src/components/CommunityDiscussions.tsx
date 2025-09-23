import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, User as UserIcon, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Post, CreatePost } from '../types/auth';
import { PostService } from '../services/postService';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from './NotificationSystem';

interface CommunityDiscussionsProps {
  onAuthRequired: () => void;
}

const CommunityDiscussions: React.FC<CommunityDiscussionsProps> = ({ onAuthRequired }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addNotification } = useNotifications();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreatePost>({
    title: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  /**
   * Fetches all posts from the database
   */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await PostService.getAllPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      addNotification({
        type: 'error',
        title: 'Error Loading Posts',
        message: 'Failed to load community discussions. Please refresh the page.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validates form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.trim().length > 10000) {
      errors.content = 'Content must be 10,000 characters or less';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handles form submission for creating/editing posts
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingPost) {
        // Update existing post
        const result = await PostService.updatePost(editingPost.id, formData);
        if (result.success && result.post) {
          setPosts(prev => prev.map(p => p.id === editingPost.id ? result.post! : p));
          addNotification({
            type: 'success',
            title: 'Post Updated',
            message: 'Your post has been updated successfully.',
            duration: 3000
          });
          setEditingPost(null);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Create new post
        const result = await PostService.createPost(formData);
        if (result.success && result.post) {
          setPosts(prev => [result.post!, ...prev]);
          addNotification({
            type: 'success',
            title: 'Post Created',
            message: 'Your post has been published successfully.',
            duration: 3000
          });
          setShowCreateForm(false);
        } else {
          throw new Error(result.error);
        }
      }

      // Reset form
      setFormData({ title: '', content: '' });
      setFormErrors({});
    } catch (error: any) {
      console.error('Error submitting post:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit post. Please try again.',
        duration: 4000
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles post deletion
   */
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await PostService.deletePost(postId);
      if (result.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        addNotification({
          type: 'success',
          title: 'Post Deleted',
          message: 'Your post has been deleted successfully.',
          duration: 3000
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete post. Please try again.',
        duration: 4000
      });
    }
  };

  /**
   * Starts editing a post
   */
  const startEditing = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  /**
   * Cancels form submission
   */
  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingPost(null);
    setFormData({ title: '', content: '' });
    setFormErrors({});
  };

  /**
   * Formats timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Redirect non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Community Discussions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join our community to participate in discussions, share deals, and connect with fellow deal hunters.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
            <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Sign In Required
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              You need to be signed in to view and participate in community discussions.
            </p>
            <button
              onClick={onAuthRequired}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Community Discussions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Share deals, ask questions, and connect with fellow deal hunters
          </p>
        </div>
        
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Post</span>
          </button>
        )}
      </div>

      {/* Create/Edit Post Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your post about?"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                maxLength={200}
                required
              />
              <div className="flex justify-between mt-1">
                {formErrors.title && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{formErrors.title}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.title.length}/200
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts, deals, or questions..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  formErrors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                maxLength={10000}
                required
              />
              <div className="flex justify-between mt-1">
                {formErrors.content && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{formErrors.content}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.content.length}/10,000
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span>{submitting ? 'Publishing...' : (editingPost ? 'Update Post' : 'Publish Post')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to start a discussion in the community!
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              {/* Post Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {post.author?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{post.author?.username || 'unknown'} • {formatTimestamp(post.created_at)}
                    </p>
                  </div>
                </div>
                
                {/* Post Actions - Only for post author */}
                {user?.id === post.user_id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(post)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Post Footer */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Clock className="h-4 w-4 mr-1" />
                <span>Posted {formatTimestamp(post.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityDiscussions;