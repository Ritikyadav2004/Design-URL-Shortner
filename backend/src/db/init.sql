-- =======================================================================
-- SYSTEM DESIGN DATABASE SCHEMA FOR URL SHORTENER (TINYURL CLONE)
-- Designed based on requirements: 1000 writes/sec, 100,000 reads/sec
-- =======================================================================

-- Step 1: Database create karo agar exist nahi karta (agar manual run kar rahe ho)
-- CREATE DATABASE url_shortener_db;

-- Step 2: Key Generation Service (KGS) Table
-- System Design Concept (PDF Page 8-9):
-- To eliminate hash collisions, we pre-generate 7-character Base62 keys
-- aur is SQL table me store karte hain. ACID transaction row-level lock
-- se do web servers ko kabhi same key nahi milti.
CREATE TABLE IF NOT EXISTS available_keys (
    -- Unique 7-character Base62 string (e.g., '3ad32p9')
    key VARCHAR(7) PRIMARY KEY,
    
    -- Status flag: FALSE = key free hai, TRUE = kisi URL ko assign ho chuki hai
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Kab key generate hui thi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup ke liye index banate hain unused keys par:
-- System Design Note: Partial index sirf 'is_used = FALSE' rows ko index karega,
-- jisse unused keys find karne ki query O(1) me execute hogi bina table scan ke.
CREATE INDEX IF NOT EXISTS idx_available_keys_unused 
ON available_keys (key) 
WHERE is_used = FALSE;


-- Step 3: Core URLs Mapping Table
-- System Design Concept (PDF Page 5-7):
-- Short URL identifier ko original Long URL ke sath map karta hai.
CREATE TABLE IF NOT EXISTS urls (
    -- Primary Key: Wahi 7-character unique identifier
    short_code VARCHAR(7) PRIMARY KEY,
    
    -- Original long URL (URL 2048 characters tak lambi ho sakti hai)
    long_url TEXT NOT NULL,
    
    -- Kis user ne link banaya (anonymous user ke liye optional)
    user_id VARCHAR(100) DEFAULT 'anonymous',
    
    -- Total click counter for fast display
    click_count BIGINT DEFAULT 0 NOT NULL,
    
    -- Optional expiration date (PDF Page 12 - Link Expiration requirement)
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Active status: soft delete ya manual disable ke liye
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Extra metadata: title, tags, custom description (stored efficiently as JSONB)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Kab create hua tha
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on created_at for fast sorting in user dashboard
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls (created_at DESC);


-- Step 4: Analytics Tracking Table
-- System Design Concept (PDF Page 6 - 302 Redirection & Analytics):
-- Har click ki deep details (Referrer, Country, User-Agent, Timestamp) record karta hai.
CREATE TABLE IF NOT EXISTS url_clicks (
    -- Auto-incrementing unique ID per click event
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign key linking to the short_code in urls table
    short_code VARCHAR(7) NOT NULL REFERENCES urls(short_code) ON DELETE CASCADE,
    
    -- Request headers se user ka device / browser information
    user_agent TEXT,
    
    -- Traffic source (e.g., twitter.com, google.com, direct)
    referrer TEXT,
    
    -- Client IP address (for geographic analytics and fraud detection)
    ip_address VARCHAR(45),
    
    -- Exact timestamp when the redirect happened
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on short_code for fast aggregation when viewing stats of a link
CREATE INDEX IF NOT EXISTS idx_url_clicks_short_code ON url_clicks (short_code);