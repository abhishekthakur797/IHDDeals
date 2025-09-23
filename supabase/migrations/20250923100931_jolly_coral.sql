/*
  # Create Featured Deals System

  1. New Tables
    - `featured_deals`
      - `deal_id` (integer, primary key, auto-increment)
      - `image` (text, required) - Product image URL
      - `title` (varchar(255), required) - Product name
      - `subtitle` (varchar(500), optional) - Product description
      - `original_price` (decimal(10,2), required) - Regular price in INR
      - `deal_price` (decimal(10,2), required) - Discounted price in INR
      - `buy_now_link` (text, required) - Purchase URL
      - `created_date` (timestamp, default now()) - Creation timestamp
      - `is_active` (boolean, default true) - Deal status

  2. Security
    - Enable RLS on `featured_deals` table
    - Add policy for public read access
    - Add policy for authenticated users to manage deals

  3. Sample Data
    - Insert 10 realistic Indian product deals
*/

-- Create the featured_deals table
CREATE TABLE IF NOT EXISTS featured_deals (
    deal_id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    original_price DECIMAL(10,2) NOT NULL CHECK (original_price > 0),
    deal_price DECIMAL(10,2) NOT NULL CHECK (deal_price > 0),
    buy_now_link TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure deal price is less than original price
    CONSTRAINT valid_discount CHECK (deal_price < original_price)
);

-- Enable Row Level Security
ALTER TABLE featured_deals ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read featured deals"
    ON featured_deals
    FOR SELECT
    TO public
    USING (true);

-- Create policy for authenticated users to manage deals
CREATE POLICY "Authenticated users can manage featured deals"
    ON featured_deals
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_deals_active ON featured_deals(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_deals_created_date ON featured_deals(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_featured_deals_price ON featured_deals(deal_price);

-- Insert sample data
INSERT INTO featured_deals (image, title, subtitle, original_price, deal_price, buy_now_link) VALUES
('https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300', 'Samsung Galaxy Smartphone', 'Latest Android smartphone with 128GB storage and triple camera setup', 25999.00, 18999.00, 'https://www.amazon.in/dp/example1'),
('https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300', 'Apple MacBook Air M2', 'Ultra-thin laptop with M2 chip, 8GB RAM, and 256GB SSD storage', 119900.00, 89999.00, 'https://www.flipkart.com/example2'),
('https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300', 'Sony WH-1000XM5 Headphones', 'Premium noise-canceling wireless headphones with 30-hour battery life', 29990.00, 21990.00, 'https://www.amazon.in/dp/example3'),
('https://images.pexels.com/photos/6686448/pexels-photo-6686448.jpeg?auto=compress&cs=tinysrgb&w=300', 'Apple Watch Series 9', 'Advanced fitness tracking with ECG and blood oxygen monitoring', 45900.00, 38999.00, 'https://www.apple.com/in/example4'),
('https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=300', 'JBL Charge 5 Bluetooth Speaker', 'Portable waterproof speaker with powerful bass and 20-hour playtime', 12999.00, 8999.00, 'https://www.flipkart.com/example5'),
('https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=300', 'Logitech MX Master 3S Mouse', 'Advanced wireless mouse with precision scrolling and ergonomic design', 8995.00, 6499.00, 'https://www.amazon.in/dp/example6'),
('https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=300', 'Philips Air Fryer HD9252', 'Healthy cooking with rapid air technology, 4.1L capacity for family meals', 12995.00, 9999.00, 'https://www.flipkart.com/example7'),
('https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300', 'Nike Air Max 270 Sneakers', 'Comfortable running shoes with Max Air cushioning and breathable mesh', 12995.00, 8999.00, 'https://www.nike.com/in/example8'),
('https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300', 'Levi''s 511 Slim Fit Jeans', 'Classic slim-fit denim jeans in dark wash, comfortable stretch fabric', 3999.00, 2499.00, 'https://www.levis.in/example9'),
('https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', 'Yoga Mat with Alignment Lines', 'Premium non-slip yoga mat with carrying strap and alignment guides', 2999.00, 1899.00, 'https://www.amazon.in/dp/example10');