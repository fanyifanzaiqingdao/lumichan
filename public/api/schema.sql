-- Lumichan products table for Baota MySQL
-- 1) 宝塔创建数据库，例如 lumichan
-- 2) 导入本文件
-- 3) 再访问 /api/migrate-products.php?token=你的admin_password 导入初始数据（一次性）

CREATE TABLE IF NOT EXISTS `products` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT '',
  `description` text,
  `long_description` mediumtext,
  `duration` varchar(64) DEFAULT '',
  `price` varchar(64) DEFAULT '',
  `rating` decimal(3,1) DEFAULT 5.0,
  `review_count` int NOT NULL DEFAULT 0,
  `max_altitude` varchar(64) DEFAULT '',
  `group_size` varchar(64) DEFAULT '',
  `highlights` json DEFAULT NULL,
  `itinerary` json DEFAULT NULL,
  `inclusions` json DEFAULT NULL,
  `exclusions` json DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `image` varchar(512) DEFAULT '',
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` varchar(32) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_products_published_sort` (`is_published`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `inquiry_id` varchar(32) NOT NULL,
  `request_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `consent_at` datetime NOT NULL,
  `consent_version` varchar(80) NOT NULL,
  `source_page` varchar(255) NOT NULL,
  `utm_json` json DEFAULT NULL,
  `language` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(200) NOT NULL,
  `preferred_contact` varchar(20) NOT NULL,
  `contact_handle` varchar(80) NOT NULL DEFAULT '',
  `country` varchar(100) NOT NULL DEFAULT '',
  `travelers` smallint unsigned NOT NULL,
  `travel_dates` varchar(100) NOT NULL,
  `destinations` varchar(200) NOT NULL DEFAULT '',
  `preferred_service` varchar(100) NOT NULL DEFAULT '',
  `traveling_with_children` tinyint(1) NOT NULL DEFAULT 0,
  `child_age_band` varchar(20) NOT NULL DEFAULT '',
  `english_guide` varchar(20) NOT NULL DEFAULT 'Not sure',
  `interests_json` json DEFAULT NULL,
  `message` text,
  `notification_status` varchar(16) NOT NULL DEFAULT 'pending',
  `notification_attempts` smallint unsigned NOT NULL DEFAULT 0,
  `notification_claimed_at` datetime DEFAULT NULL,
  `notified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`inquiry_id`),
  UNIQUE KEY `uq_inquiries_request` (`request_id`),
  KEY `idx_inquiries_created` (`created_at`),
  KEY `idx_inquiries_notification` (`notification_status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inquiry_rate_limits` (
  `bucket_hash` char(64) NOT NULL,
  `hit_count` smallint unsigned NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`bucket_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guides (applications + published directory)
CREATE TABLE IF NOT EXISTS `guides` (
  `id` varchar(64) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(64) DEFAULT '',
  `location` varchar(255) DEFAULT '',
  `photo_url` varchar(512) DEFAULT NULL,
  `id_document_url` varchar(512) DEFAULT NULL,
  `has_vehicle` tinyint(1) NOT NULL DEFAULT 0,
  `vehicle_type` varchar(128) DEFAULT NULL,
  `vehicle_plate` varchar(64) DEFAULT NULL,
  `vehicle_photo_url` varchar(512) DEFAULT NULL,
  `insurance_document_url` varchar(512) DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `specialties` json DEFAULT NULL,
  `experience` varchar(128) DEFAULT '',
  `bio` mediumtext,
  `intro_video_url` varchar(512) DEFAULT NULL,
  `price_per_day` decimal(10,2) DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT 5.0,
  `reviews_count` int NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `admin_notes` text,
  `created_at` varchar(32) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_guides_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
