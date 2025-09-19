import React, { useState } from 'react';
import { Heart, Mail, Send } from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Here you would typically send the email to your backend
    console.log('Newsletter subscription:', email);
    setSubscribed(true);
    setEmail('');
    
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Stay Updated with Latest Deals
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get notified about exclusive discounts and community highlights
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={subscribed}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {subscribed ? (
                <>
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscribed!</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscribe</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Main Footer Content */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>in India | Deals IHD | All Rights Reserved</span>
          </p>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Deals IHD. Connecting deal hunters worldwide.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;