import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Send, ArrowUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from './NotificationSystem';

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

interface Reply {
  id: string;
  discussion_id: string;
  content: string;
  author_id: string;
  author_name: string;
  parent_reply_id: string | null;
  created_at: string;
  likes: number;
}

interface DiscussionModalProps {
  discussion: Discussion;
  onClose: () => void;
  onAuthRequired: () => void;
}

const DiscussionModal: React.FC<DiscussionModalProps> = ({
  discussion,
  onClose,
  onAuthRequired
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(discussion.likes);
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  useEffect(() => {
    fetchReplies();
    if (isAuthenticated && user) {
      checkIfLiked();
    }
  }, [discussion.id, isAuthenticated, user]);

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussion.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', discussion.id)
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error);
        return;
      }
      setLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user || !hasPermission('write')) {
      onAuthRequired();
      return;
    }

    if (likingInProgress) return; // Prevent double-clicking
    setLikingInProgress(true);

    try {
      if (liked) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussion.id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Update discussion likes count
        const { error: updateError } = await supabase
          .from('discussions')
          .update({ likes: Math.max(0, likeCount - 1) })
          .eq('id', discussion.id);

        if (updateError) throw updateError;

        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: discussion.id,
            user_id: user.id
          });

        if (insertError) throw insertError;

        // Update discussion likes count
        const { error: updateError } = await supabase
          .from('discussions')
          .update({ likes: likeCount + 1 })
          .eq('id', discussion.id);

        if (updateError) throw updateError;

        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      addNotification({
        type: 'error',
        title: 'Like Error',
        message: getDetailedErrorMessage(error, 'like'),
        duration: 3000
      });
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user || !hasPermission('write')) {
      onAuthRequired();
      return;
    }

    if (!newReply.trim()) return;

    setSubmittingReply(true);
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussion.id,
          content: newReply.trim(),
          author_id: user.id,
          author_name: user.fullName || user.username || 'Anonymous',
          parent_reply_id: replyingTo
        })
        .select()
        .single();

      if (error) throw error;

      // Update discussion reply count
      const { error: updateError } = await supabase
        .from('discussions')
        .update({ reply_count: replies.length + 1 })
        .eq('id', discussion.id);

      if (updateError) {
        console.error('Error updating reply count:', updateError);
      }

      setReplies(prev => [...prev, data]);
      setNewReply('');
      setReplyingTo(null);
      
      addNotification({
        type: 'success',
        title: 'Reply Posted',
        message: 'Your reply has been added successfully.',
        duration: 3000
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      addNotification({
        type: 'error',
        title: 'Reply Error',
        message: getDetailedErrorMessage(error, 'reply'),
        duration: 4000
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyLike = async (replyId: string, currentLikes: number, isLiked: boolean) => {
    if (!isAuthenticated || !user || !hasPermission('write')) {
      onAuthRequired();
      return;
    }

    try {
      if (isLiked) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Update reply likes count
        const { error: updateError } = await supabase
          .from('discussion_replies')
          .update({ likes: Math.max(0, currentLikes - 1) })
          .eq('id', replyId);

        if (updateError) throw updateError;
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('reply_likes')
          .insert({
            reply_id: replyId,
            user_id: user.id
          });

        if (insertError) throw insertError;

        // Update reply likes count
        const { error: updateError } = await supabase
          .from('discussion_replies')
          .update({ likes: currentLikes + 1 })
          .eq('id', replyId);

        if (updateError) throw updateError;
      }

      // Refresh replies to show updated counts
      await fetchReplies();
    } catch (error) {
      console.error('Error toggling reply like:', error);
      addNotification({
        type: 'error',
        title: 'Like Error',
        message: getDetailedErrorMessage(error, 'like'),
        duration: 3000
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getThreadedReplies = (replies: Reply[]) => {
    const topLevel = replies.filter(reply => !reply.parent_reply_id);
    const threaded = topLevel.map(reply => ({
      ...reply,
      children: replies.filter(r => r.parent_reply_id === reply.id)
    }));
    return threaded;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {discussion.title}
            </h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
              <span>by {discussion.author_name}</span>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatTimeAgo(discussion.created_at)}
              </div>
              <span>{discussion.views} views</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Discussion Content */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {discussion.content}
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated || likingInProgress}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                  liked
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    : `bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ${
                        isAuthenticated 
                          ? 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`
                }`}
                title={!isAuthenticated ? 'Sign in to like discussions' : ''}
              >
                {likingInProgress ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                )}
                <span>{likeCount}</span>
              </button>
              {!isAuthenticated && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Sign in to like and reply
                </span>
              )}
            </div>
          </div>

          {/* Replies Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Replies ({replies.length})
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getThreadedReplies(replies).map(reply => (
                  <div key={reply.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{reply.author_name}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(reply.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleReplyLike(reply.id, reply.likes, false)}
                        disabled={!isAuthenticated}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          isAuthenticated 
                            ? 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 cursor-pointer' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={!isAuthenticated ? 'Sign in to like replies' : 'Like this reply'}
                      >
                        <Heart className="h-3 w-3" />
                        <span>{reply.likes}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(reply.id)}
                        disabled={!isAuthenticated}
                        className={`text-sm transition-colors ${
                          isAuthenticated
                            ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={!isAuthenticated ? 'Sign in to reply' : 'Reply to this comment'}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Nested replies */}
                    {reply.children && reply.children.length > 0 && (
                      <div className="ml-6 mt-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        {reply.children.map(childReply => (
                          <div key={childReply.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <span className="font-medium">{childReply.author_name}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(childReply.created_at)}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                              {childReply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {replies.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                    <p>No replies yet. Be the first to respond!</p>
                  </div>
                )}
              </div>
            )}

            {/* Reply Form */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              {replyingTo && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
                  <span>Replying to a comment</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmitReply} className="space-y-3">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to join the discussion"}
                  disabled={!isAuthenticated}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center">
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={onAuthRequired}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Sign in to reply
                    </button>
                  )}
                  <div className="ml-auto">
                    <button
                      type="submit"
                      disabled={!isAuthenticated || !newReply.trim() || submittingReply}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {submittingReply ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>{submittingReply ? 'Posting...' : 'Reply'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to provide more specific error messages
const getDetailedErrorMessage = (error: any, action: 'like' | 'reply'): string => {
  const baseAction = action === 'like' ? 'update like' : 'post reply';
  
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return `Network error: Check your internet connection and try again.`;
  }
  
  // Authentication errors
  if (error.message?.includes('auth') || error.message?.includes('unauthorized') || error.code === 401) {
    return `Authentication error: Please sign out and sign back in.`;
  }
  
  // Permission errors
  if (error.message?.includes('permission') || error.code === 403) {
    return `Permission denied: You may not have access to ${baseAction}.`;
  }
  
  // Rate limiting
  if (error.message?.includes('rate') || error.code === 429) {
    return `Too many requests: Please wait a moment before trying again.`;
  }
  
  // Server errors
  if (error.code >= 500) {
    return `Server error: Our servers are experiencing issues. Please try again later.`;
  }
  
  // Database errors
  if (error.message?.includes('database') || error.message?.includes('connection')) {
    return `Database error: Unable to save changes. Please try again.`;
  }
  
  // Content validation errors
  if (action === 'reply' && (error.message?.includes('validation') || error.message?.includes('length'))) {
    return `Content error: Please check your reply length and content.`;
  }
  
  // Default fallback with troubleshooting hint
  return `Failed to ${baseAction}. Try refreshing the page or check your internet connection.`;
};

export default DiscussionModal;