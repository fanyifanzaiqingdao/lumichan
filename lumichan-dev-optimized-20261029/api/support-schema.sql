-- Import once into the site's existing MySQL database. No existing tables are changed.
CREATE TABLE IF NOT EXISTS support_conversations (
 id char(32) PRIMARY KEY,
 token_hash char(64) NOT NULL,
 state varchar(16) NOT NULL DEFAULT 'ai',
 assignee varchar(200) NOT NULL DEFAULT '',
 email varchar(200) NOT NULL DEFAULT '',
 language varchar(8) NOT NULL DEFAULT 'en',
 ai_consent tinyint NOT NULL DEFAULT 0,
 consent_version varchar(40) NOT NULL,
 created_at datetime NOT NULL,
 updated_at datetime NOT NULL,
 expires_at datetime NOT NULL,
 notification_status varchar(16) NOT NULL DEFAULT 'none',
 notification_attempts int NOT NULL DEFAULT 0,
 notification_due datetime DEFAULT NULL,
 INDEX support_expiry(expires_at), INDEX support_state(state,updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_messages (
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 conversation_id char(32) NOT NULL,
 role varchar(16) NOT NULL,
 author varchar(200) NOT NULL DEFAULT '',
 body text NOT NULL,
 request_id varchar(64) DEFAULT NULL,
 created_at datetime NOT NULL,
 UNIQUE KEY support_request(conversation_id,request_id),
 FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_audit (
 id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
 conversation_id char(32) NOT NULL,
 actor varchar(200) NOT NULL,
 action varchar(40) NOT NULL,
 created_at datetime NOT NULL,
 FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_limits (
 bucket char(64) PRIMARY KEY, hits int NOT NULL, expires_at datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_otp (
 email varchar(200) PRIMARY KEY, code_hash varchar(255) NOT NULL,
 attempts int NOT NULL DEFAULT 0, expires_at datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_knowledge (
 id char(32) PRIMARY KEY, title varchar(200) NOT NULL,
 answer_en text NOT NULL, answer_zh text NOT NULL,
 published tinyint NOT NULL DEFAULT 0, updated_at datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
