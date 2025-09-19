import React from 'react';
import { MessageSquare, Heart, Eye, Clock } from 'lucide-react';

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

interface DiscussionCardProps {
  discussion: Discussion;
  onClick: () => void;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion, onClick }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getContentSnippet = (content: string, maxLength: number = 120) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {discussion.title}
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
          <Clock className="h-4 w-4 mr-1" />
          {formatTimeAgo(discussion.created_at)}
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
        {getContentSnippet(discussion.content)}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          by <span className="font-medium">{discussion.author_name}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{discussion.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{discussion.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span>{discussion.reply_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCard;