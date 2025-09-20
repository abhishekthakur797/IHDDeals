import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Moon, Sun, Search, Filter, LogIn, LogOut, User as UserIcon, ArrowRight, MessageSquare, Package, Send, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [sliderRef, setSliderRef] = useState<HTMLDivElement | null>(null);

  const categories = ['all', 'electronics', 'fashion', 'home', 'books', 'sports'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      // Always use fallback data until database is connected
      setProducts(getFallbackProducts());
    } catch (error) {
      // Silently handle any errors and use fallback data
      setProducts(getFallbackProducts());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackProducts = (): Product[] => {
    return [
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
      },
      {
        id: '6',
        name: 'Gaming Mechanical Keyboard',
        price: 129.99,
        image_url: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: '#',
        category: 'electronics',
        description: 'RGB mechanical keyboard for gaming',
        rating: 4.9
      },
      {
        id: '7',
        name: 'Portable Bluetooth Speaker',
        price: 79.99,
        image_url: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: '#',
        category: 'electronics',
        description: 'Waterproof portable speaker with excellent sound',
        rating: 4.3
      },
      {
        id: '8',
        name: 'Designer Sunglasses',
        price: 89.99,
        image_url: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: '#',
        category: 'fashion',
        description: 'UV protection designer sunglasses',
        rating: 4.2
      },
      {
        id: '9',
        name: 'Coffee Maker Machine',
        price: 159.99,
        image_url: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: '#',
        category: 'home',
        description: 'Automatic coffee maker with programmable features',
        rating: 4.6
      },
      {
        id: '10',
        name: 'Running Shoes',
        price: 119.99,
        image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: '#',
        category: 'sports',
        description: 'Comfortable running shoes with advanced cushioning',
        rating: 4.5
      }
    ];
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.offsetLeft);
    setScrollLeft(sliderRef.scrollLeft);
    sliderRef.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    if (!sliderRef) return;
    setIsDragging(false);
    sliderRef.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    if (!sliderRef) return;
    setIsDragging(false);
    sliderRef.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.scrollLeft = scrollLeft - walk;
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef) return;
    const scrollAmount = 300;
    const newScrollLeft = direction === 'left' 
      ? sliderRef.scrollLeft - scrollAmount 
      : sliderRef.scrollLeft + scrollAmount;
    
    sliderRef.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Top Navigation */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
             <img 
               src="/IHDdeals-light-copy.png" 
               alt="IHD Deals" 
               className="h-10 w-auto filter drop-shadow-md"
             />
            </div>
          </div>
          
          {/* Desktop Navigation Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
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
          
          {/* Desktop Auth & Theme Controls */}
          <div className="hidden lg:flex items-center space-x-4">
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
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
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
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="space-y-2">
              {/* Navigation Items */}
              <button
                onClick={() => {
                  setShowProductsPage(true);
                  closeMobileMenu();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </button>
              
              <button
                onClick={() => {
                  setShowCommunityPage(true);
                  closeMobileMenu();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Discussions</span>
              </button>
              
              <button
                onClick={() => {
                  window.open('https://t.me/IHDBroadcast', '_blank', 'noopener,noreferrer');
                  closeMobileMenu();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <Send className="h-5 w-5" />
                <span>Telegram</span>
              </button>
              
              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* Auth Section */}
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <UserIcon className="h-5 w-5" />
                    <span>{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onAuthClick();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Featured Deals
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollSlider('left')}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => scrollSlider('right')}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex space-x-4 overflow-hidden cursor-grab">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-none w-64 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div 
                ref={setSliderRef}
                className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide cursor-grab select-none"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredProducts.slice(0, 10).map(product => (
                  <div key={product.id} className="pointer-events-none">
                    <div className="pointer-events-auto">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
                
                {/* View All Products Button */}
                {filteredProducts.length > 10 && (
                  <div className="flex-none w-64 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => setShowProductsPage(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 pointer-events-auto"
                    >
                      <span>View All {filteredProducts.length} Products</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                {filteredProducts.length === 0 && (
                  <div className="flex-none w-full text-center py-12 text-gray-500 dark:text-gray-400 pointer-events-none">
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