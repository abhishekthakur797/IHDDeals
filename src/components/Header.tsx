import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Moon, Sun, Search, Filter, LogIn, LogOut, User as UserIcon, ArrowRight, MessageSquare, Package, Send } from 'lucide-react';
import { supabase, signOut } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import ProductCard from './ProductCard';
import ProductsPage from './ProductsPage';
import CommunityPage from './CommunityPage';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  affiliate_link: string;
  category: string;
  description: string;
  rating: number;
}

interface HeaderProps {
  user: User | null;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [showProductsPage, setShowProductsPage] = useState(false);
  const [showCommunityPage, setShowCommunityPage] = useState(false);

  const categories = ['all', 'electronics', 'fashion', 'home', 'books', 'sports'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback mock data for demo
      setProducts([
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          price: 199.99,
          image_url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300',
          affiliate_link: '#',
          category: 'electronics',
          description: 'High-quality wireless headphones with noise cancellation',
          rating: 4.8
        },
        {
          id: '2',
          name: 'Smart Fitness Watch',
          price: 299.99,
          image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300',
          affiliate_link: '#',
          category: 'electronics',
          description: 'Advanced fitness tracking with heart rate monitor',
          rating: 4.6
        },
        {
          id: '3',
          name: 'Stylish Leather Jacket',
          price: 149.99,
          image_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300',
          affiliate_link: '#',
          category: 'fashion',
          description: 'Premium leather jacket for modern style',
          rating: 4.7
        },
        {
          id: '4',
          name: 'Smart Home Speaker',
          price: 99.99,
          image_url: 'https://images.pexels.com/photos/6686448/pexels-photo-6686448.jpeg?auto=compress&cs=tinysrgb&w=300',
          affiliate_link: '#',
          category: 'electronics',
          description: 'Voice-controlled smart speaker with AI assistant',
          rating: 4.5
        },
        {
          id: '5',
          name: 'Yoga Mat Set',
          price: 49.99,
          image_url: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=300',
          affiliate_link: '#',
          category: 'sports',
          description: 'Complete yoga mat set with accessories',
          rating: 4.4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/IHDdeals Logo Redesigned.png" 
                alt="Deals IHD Logo" 
                className="h-12 w-auto"
              />
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProductsPage(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </button>
            
            <button
              onClick={() => setShowCommunityPage(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Discussions</span>
            </button>
            
            <button
              onClick={() => window.open('https://t.me/IHDBroadcast', '_blank', 'noopener,noreferrer')}
             className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Filters */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Featured Deals
          </h2>
          
          {loading ? (
            <div className="flex space-x-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-none w-64 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {filteredProducts.slice(0, 10).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
                
                {/* View All Products Button */}
                {filteredProducts.length > 10 && (
                  <div className="flex-none w-64 flex items-center justify-center">
                    <button
                      onClick={() => setShowProductsPage(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span>View All {filteredProducts.length} Products</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                {filteredProducts.length === 0 && (
                  <div className="flex-none w-full text-center py-12 text-gray-500 dark:text-gray-400">
                    No products found matching your criteria.
                  </div>
                )}
              </div>
              
              {/* Products Page Modal */}
              {showProductsPage && (
                <ProductsPage
                  onClose={() => setShowProductsPage(false)}
                  initialProducts={filteredProducts}
                />
              )}
              
              {/* Community Page Modal */}
              {showCommunityPage && (
                <CommunityPage
                  user={user}
                  onClose={() => setShowCommunityPage(false)}
                  onAuthRequired={onAuthClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;