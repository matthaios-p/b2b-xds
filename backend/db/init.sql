-- Reset schema for e-commerce
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_custom_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table (user's current cart)
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  ai_custom_specs_json JSONB,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_is_custom_ai ON products(is_custom_ai);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Seed a demo user (password: password123)
-- Note: Use this only in development
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@example.com') THEN
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Demo User', 'demo@example.com', '$2a$10$u1R3n8h8qFv3Zx7sK1tYvOQdQ7Z6cQ/2QeVvT8Yq6yJp9wY3c5h1G', 'customer');
  END IF;
END$$;

-- Seed a sample product
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE title = 'Standard 3D Letter - Small') THEN
    INSERT INTO products (title, description, base_price, is_custom_ai)
    VALUES ('Standard 3D Letter - Small', 'Off-the-shelf small 3D printed letter', 25.00, FALSE);
  END IF;
END$$;
