-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS mini_task_mysql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ให้สิทธิ์ mini_task_user
GRANT ALL PRIVILEGES ON mini_task_mysql.* TO 'mini_task_user'@'%';
FLUSH PRIVILEGES;

USE mini_task_mysql;

-- ตาราง Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('user', 'premium', 'admin') DEFAULT 'user',
  isPremium BOOLEAN DEFAULT FALSE,
  subscriptionExpiry DATETIME DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BLACKLISTED TOKENS TABLE (Added by Person 2)
-- ============================================
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token(255))
);

-- ตาราง Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') DEFAULT 'low',
  ownerId INT NOT NULL,
  assignedTo INT DEFAULT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assigned FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

-- ตารางสำหรับจัดการ Idempotency (อาจใช้ในสัปดาห์ 3)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_value VARCHAR(255) UNIQUE NOT NULL,
  response JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NULL
);

-- ==========================
-- Users ตัวอย่าง 10 คน (รหัสผ่าน hashed ด้วย bcrypt)
-- ==========================
INSERT INTO users (email, password, name, role, isPremium, subscriptionExpiry)
VALUES
('user1@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User One', 'user', FALSE, NULL),
('user2@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Two', 'user', FALSE, NULL),
('user3@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Three', 'premium', TRUE, '2025-12-31 23:59:59'),
('user4@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Four', 'premium', TRUE, '2025-06-30 23:59:59'),
('user5@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Five', 'user', FALSE, NULL),
('user6@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Six', 'premium', TRUE, '2025-11-30 23:59:59'),
('user7@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Seven', 'user', FALSE, NULL),
('user8@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Eight', 'premium', TRUE, '2025-09-30 23:59:59'),
('user9@test.com', '$2b$10$VhT7XzYzM8GxV0kYJgR6u.OPlN0E/7bQKg1v1ZV3rXp3h0y0Yc1h6', 'User Nine', 'user', FALSE, NULL),
('admin@test.com', '$2b$10$kB9yG8s5OqZ7jD7vBx5GNeG0nYzGqVx5zXkF7A8r9t6M2h1wPqYfK', 'Admin User', 'admin', TRUE, NULL);

-- ==========================
-- Tasks ตัวอย่าง 10 งาน
-- ==========================
INSERT INTO tasks (title, description, status, priority, ownerId, assignedTo, isPublic)
VALUES
('Fix login bug', 'Login fails on special characters', 'pending', 'high', 1, 3, TRUE),
('Update profile page', 'Add new fields for user info', 'in_progress', 'medium', 2, 4, FALSE),
('Database backup', 'Backup every night at 2AM', 'pending', 'low', 3, NULL, TRUE),
('API endpoint testing', 'Test all /api/v1/tasks endpoints', 'completed', 'medium', 4, 3, FALSE),
('Design homepage', 'Create responsive layout', 'in_progress', 'high', 5, 6, TRUE),
('Fix CSS bugs', 'Adjust spacing and colors', 'pending', 'low', 6, 1, TRUE),
('Write documentation', 'Prepare README.md and API.md', 'completed', 'medium', 7, NULL, FALSE),
('Add search feature', 'Enable search by title and status', 'in_progress', 'high', 8, 2, TRUE),
('Optimize queries', 'Improve database query performance', 'pending', 'medium', 9, 5, FALSE),
('Admin panel setup', 'Create admin dashboard for users/tasks', 'completed', 'high', 10, NULL, TRUE);
