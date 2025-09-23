import React from 'react';
import { ExternalLink, Star } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const handleBuyNow = () => {
    window.open(product.affiliate_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-none w-64 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700 theme-transition-slow">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded-t-lg transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 capitalize transition-all duration-300">
          {product.category}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{product.rating}</span>
          </div>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ${product.price}
          </span>
        </div>
        
        <button
          onClick={handleBuyNow}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Buy Now</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;