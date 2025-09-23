import React, { useState, useEffect } from 'react';
import { Moon, Sun, Search, Filter, LogIn, LogOut, User as UserIcon, ArrowRight, MessageSquare, Package, Send, Menu, X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import CommunityDiscussions from './CommunityDiscussions';
import ProductCard from './ProductCard';
import ProductsPage from './ProductsPage';

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
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { isDark, toggleTheme, isTransitioning } = useTheme();
  const { user, isAuthenticated, signOut: handleSignOut, getUserDisplayName, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [showProductsPage, setShowProductsPage] = useState(false);
  const [showCommunityDiscussions, setShowCommunityDiscussions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [sliderRef, setSliderRef] = useState<HTMLDivElement | null>(null);

  // Ripple effect for theme toggle
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'theme-toggle-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    toggleTheme();
    
    // Add glow effect to the button
    event.currentTarget.classList.add('theme-glow-animation');
    setTimeout(() => {
      event.currentTarget.classList.remove('theme-glow-animation');
    }, 800);
  };

  const categories = ['all', 'electronics', 'fashion', 'home', 'books', 'sports'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('featured_deals')
        .select('*')
        .eq('is_active', true)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching featured deals:', error);
        // Fallback to static data if database fails
        setProducts(getFallbackProducts());
      } else {
        // Transform database data to match component interface
        const transformedProducts = (data || []).map(deal => ({
          id: deal.deal_id.toString(),
          name: deal.title,
          price: deal.deal_price,
          image_url: deal.image,
          affiliate_link: deal.buy_now_link,
          category: 'electronics', // Default category
          description: deal.subtitle || '',
          rating: 4.5, // Default rating
          deal_id: deal.deal_id,
          title: deal.title,
          subtitle: deal.subtitle,
          original_price: deal.original_price,
          deal_price: deal.deal_price,
          buy_now_link: deal.buy_now_link,
          created_date: deal.created_date,
          is_active: deal.is_active
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setProducts(getFallbackProducts());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackProducts = (): Product[] => {
    return [
      {
        id: '1',
        name: 'Samsung Galaxy Smartphone',
        price: 18999.00,
        image_url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.amazon.in/dp/example1',
        category: 'electronics',
        description: 'Latest Android smartphone with 128GB storage and triple camera setup',
        rating: 4.5,
        deal_id: 1,
        title: 'Samsung Galaxy Smartphone', 
        subtitle: 'Latest Android smartphone with 128GB storage and triple camera setup',
        original_price: 25999.00,
        deal_price: 18999.00,
        buy_now_link: 'https://www.amazon.in/dp/example1',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '2',
        name: 'Apple MacBook Air M2',
        price: 89999.00,
        image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.flipkart.com/example2',
        category: 'electronics',
        description: 'Ultra-thin laptop with M2 chip, 8GB RAM, and 256GB SSD storage',
        rating: 4.8,
        deal_id: 2,
        title: 'Apple MacBook Air M2',
        subtitle: 'Ultra-thin laptop with M2 chip, 8GB RAM, and 256GB SSD storage',
        original_price: 119900.00,
        deal_price: 89999.00,
        buy_now_link: 'https://www.flipkart.com/example2',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '3',
        name: 'Sony WH-1000XM5 Headphones',
        price: 21990.00,
        image_url: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.amazon.in/dp/example3',
        category: 'electronics',
        description: 'Premium noise-canceling wireless headphones with 30-hour battery life',
        rating: 4.7,
        deal_id: 3,
        title: 'Sony WH-1000XM5 Headphones',
        subtitle: 'Premium noise-canceling wireless headphones with 30-hour battery life',
        original_price: 29990.00,
        deal_price: 21990.00,
        buy_now_link: 'https://www.amazon.in/dp/example3',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '4',
        name: 'Apple Watch Series 9',
        price: 38999.00,
        image_url: 'https://images.pexels.com/photos/6686448/pexels-photo-6686448.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.apple.com/in/example4',
        category: 'electronics',
        description: 'Advanced fitness tracking with ECG and blood oxygen monitoring',
        rating: 4.6,
        deal_id: 4,
        title: 'Apple Watch Series 9',
        subtitle: 'Advanced fitness tracking with ECG and blood oxygen monitoring',
        original_price: 45900.00,
        deal_price: 38999.00,
        buy_now_link: 'https://www.apple.com/in/example4',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '5',
        name: 'JBL Charge 5 Bluetooth Speaker',
        price: 8999.00,
        image_url: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.flipkart.com/example5',
        category: 'electronics',
        description: 'Portable waterproof speaker with powerful bass and 20-hour playtime',
        rating: 4.4,
        deal_id: 5,
        title: 'JBL Charge 5 Bluetooth Speaker',
        subtitle: 'Portable waterproof speaker with powerful bass and 20-hour playtime',
        original_price: 12999.00,
        deal_price: 8999.00,
        buy_now_link: 'https://www.flipkart.com/example5',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '6',
        name: 'Logitech MX Master 3S Mouse',
        price: 6499.00,
        image_url: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.amazon.in/dp/example6',
        category: 'electronics',
        description: 'Advanced wireless mouse with precision scrolling and ergonomic design',
        rating: 4.3,
        deal_id: 6,
        title: 'Logitech MX Master 3S Mouse',
        subtitle: 'Advanced wireless mouse with precision scrolling and ergonomic design',
        original_price: 8995.00,
        deal_price: 6499.00,
        buy_now_link: 'https://www.amazon.in/dp/example6',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '7',
        name: 'Philips Air Fryer HD9252',
        price: 9999.00,
        image_url: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.flipkart.com/example7',
        category: 'home',
        description: 'Healthy cooking with rapid air technology, 4.1L capacity for family meals',
        rating: 4.2,
        deal_id: 7,
        title: 'Philips Air Fryer HD9252',
        subtitle: 'Healthy cooking with rapid air technology, 4.1L capacity for family meals',
        original_price: 12995.00,
        deal_price: 9999.00,
        buy_now_link: 'https://www.flipkart.com/example7',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '8',
        name: 'Nike Air Max 270 Sneakers',
        price: 8999.00,
        image_url: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.nike.com/in/example8',
        category: 'fashion',
        description: 'Comfortable running shoes with Max Air cushioning and breathable mesh',
        rating: 4.5,
        deal_id: 8,
        title: 'Nike Air Max 270 Sneakers',
        subtitle: 'Comfortable running shoes with Max Air cushioning and breathable mesh',
        original_price: 12995.00,
        deal_price: 8999.00,
        buy_now_link: 'https://www.nike.com/in/example8',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '9',
        name: 'Levi\'s 511 Slim Fit Jeans',
        price: 2499.00,
        image_url: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.levis.in/example9',
        category: 'fashion',
        description: 'Classic slim-fit denim jeans in dark wash, comfortable stretch fabric',
        rating: 4.1,
        deal_id: 9,
        title: 'Levi\'s 511 Slim Fit Jeans',
        subtitle: 'Classic slim-fit denim jeans in dark wash, comfortable stretch fabric',
        original_price: 3999.00,
        deal_price: 2499.00,
        buy_now_link: 'https://www.levis.in/example9',
        created_date: new Date().toISOString(),
        is_active: true
      },
      {
        id: '10',
        name: 'Yoga Mat with Alignment Lines',
        price: 1899.00,
        image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
        affiliate_link: 'https://www.amazon.in/dp/example10',
        category: 'sports',
        description: 'Premium non-slip yoga mat with carrying strap and alignment guides',
        rating: 4.0,
        deal_id: 10,
        title: 'Yoga Mat with Alignment Lines',
        subtitle: 'Premium non-slip yoga mat with carrying strap and alignment guides',
        original_price: 2999.00,
        deal_price: 1899.00,
        buy_now_link: 'https://www.amazon.in/dp/example10',
        created_date: new Date().toISOString(),
        is_active: true
      }
    ];
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.subtitle && product.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.deal_price - b.deal_price;
        case 'price-high':
          return b.deal_price - a.deal_price;
        case 'rating':
          return 0; // No rating field in new structure
        default:
          return a.title.localeCompare(b.title);
      }
    });

    setFilteredProducts(filtered);
  };

  const handleUserSignOut = () => {
    handleSignOut();
    setIsMobileMenuOpen(false); // Close mobile menu after sign out
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
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              {/* Theme-responsive logo */}
              <img
                src={isDark ? "/IHDDeals-logo-for-dark-theme.png" : "/IHDDeals-logo-for-light-theme.png"}
                alt="IHD Deals - Your Deal Hunting Community"
                className="h-10 w-auto transition-all duration-300 drop-shadow-sm"
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
              onClick={() => setShowCommunityDiscussions(true)}
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
              onClick={handleThemeToggle}
              className="theme-toggle-button p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden"
              aria-label="Toggle theme"
              disabled={isTransitioning}
            >
              {isTransitioning ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : isDark ? (
                <Sun className="theme-icon h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="theme-icon h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">
                    {getUserDisplayName()}
                  </span>
                </div>
                <button
                  onClick={handleUserSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : authLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
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
              onClick={handleThemeToggle}
              className="theme-toggle-button p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden"
              aria-label="Toggle theme"
              disabled={isTransitioning}
            >
              {isTransitioning ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : isDark ? (
                <Sun className="theme-icon h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="theme-icon h-5 w-5 text-gray-600 dark:text-gray-300" />
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
                  setShowCommunityDiscussions(true);
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
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Signed in as @{user.username}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleUserSignOut();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : authLoading ? (
                <div className="w-full flex items-center justify-center px-4 py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
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
                      <ProductCard product={{
                        deal_id: product.deal_id,
                        image: product.image_url,
                        title: product.title,
                        subtitle: product.subtitle,
                        original_price: product.original_price,
                        deal_price: product.deal_price,
                        buy_now_link: product.buy_now_link,
                        created_date: product.created_date,
                        is_active: product.is_active
                      }} />
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
              {showCommunityDiscussions && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
                  <div className="min-h-screen">
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                      <button
                        onClick={() => setShowCommunityDiscussions(false)}
                        className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-5 w-5" />
                        <span>Close Discussions</span>
                      </button>
                    </div>
                    <CommunityDiscussions
                  onAuthRequired={onAuthClick}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;