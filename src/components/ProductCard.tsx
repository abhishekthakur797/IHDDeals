import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FeaturedDeal {
  deal_id: number;
  image: string;
  title: string;
  subtitle?: string;
  original_price: number;
  deal_price: number;
  buy_now_link: string;
  created_date: string;
  is_active: boolean;
}

interface ProductCardProps {
  product: FeaturedDeal;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  /**
   * Formats price in Indian Rupee format with proper comma separation
   * Example: 25999 -> "₹25,999"
   */
  const formatINRPrice = (price: number): string => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  /**
   * Calculates discount percentage for display
   */
  const getDiscountPercentage = (): number => {
    const discount = ((product.original_price - product.deal_price) / product.original_price) * 100;
    return Math.round(discount);
  };

  const handleBuyNow = () => {
    // Open link in new tab as required
    window.open(product.buy_now_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-none w-64 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
      {/* Product Image with Discount Badge */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-40 object-cover rounded-t-lg transition-opacity duration-300"
          loading="lazy"
        />
        {/* Discount Percentage Badge */}
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {getDiscountPercentage()}% OFF
        </div>
        {/* Active Deal Indicator */}
        {product.is_active && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            LIVE
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Product Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 leading-tight">
          {product.title}
        </h3>
        
        {/* Product Subtitle/Description */}
        {product.subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {product.subtitle}
          </p>
        )}
        
        {/* Price Section - Centered as requested */}
        <div className="flex flex-col items-center mb-3 space-y-1">
          {/* Original Price - Strikethrough in Red */}
          <span className="text-sm text-red-500 line-through font-medium">
            {formatINRPrice(product.original_price)}
          </span>
          
          {/* Deal Price - Green Color, Larger Font */}
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatINRPrice(product.deal_price)}
          </span>
          
          {/* Savings Amount */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            You save {formatINRPrice(product.original_price - product.deal_price)}
          </span>
        </div>
        
        {/* Buy Now Button */}
        <button
          onClick={handleBuyNow}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          aria-label={`Buy ${product.title} now`}
        >
          <span>Buy Now</span>
          <ExternalLink className="h-3 w-3" />
        </button>
        
      </div>
    </div>
  );
};

export default ProductCard;