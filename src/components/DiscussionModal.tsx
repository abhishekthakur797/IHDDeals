import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Send, ArrowUp, Clock } from 'lucide-react';
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
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(discussion.likes);
  const [loading, setLoading] = useState(true);

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
    try {
      const { data, error } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', discussion.id)
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
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

    try {
      if (liked) {
        await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussion.id)
          .eq('user_id', user.id);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: discussion.id,
            user_id: user.id
          });
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user || !hasPermission('write')) {
      onAuthRequired();
      return;
    }

    if (!newReply.trim()) return;

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

      setReplies(prev => [...prev, data]);
      setNewReply('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
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
                disabled={!isAuthenticated}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                  liked
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    : `bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ${
                        isAuthenticated 
                          ? 'hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`
                }`}
                title={!isAuthenticated ? 'Sign in to like discussions' : ''}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
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
                      <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <Heart className="h-3 w-3" />
                        <span>{reply.likes}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(reply.id)}
                        disabled={!isAuthenticated}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                      disabled={!isAuthenticated || !newReply.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Reply</span>
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

export default DiscussionModal;