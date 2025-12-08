CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indonesia';
UPDATE users SET role = 'admin' WHERE email = 'triasajilomanto215@gmail.com';
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    is_halal_friendly BOOLEAN DEFAULT true,
    facilities TEXT[],
    rating DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_participants INTEGER,
    itinerary JSONB,
    facilities TEXT[],
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_package_destination 
        FOREIGN KEY (destination_id) 
        REFERENCES destinations(id) 
        ON DELETE CASCADE
);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_nights INTEGER;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS airline VARCHAR(100);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS departure_airport VARCHAR(100);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS arrival_airport VARCHAR(100);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS quota INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS quota_filled INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS departure_dates JSONB;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS includes JSONB; 
ALTER TABLE packages ADD COLUMN IF NOT EXISTS excludes JSONB;
UPDATE packages SET duration_nights = duration_days - 1 WHERE duration_nights IS NULL;
CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_is_featured ON packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    total_participants INTEGER NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    whatsapp_contact VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_package 
        FOREIGN KEY (package_id) 
        REFERENCES packages(id) 
        ON DELETE CASCADE
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(50) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fullname VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passport_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indonesia';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package ON bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    payment_method VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    verified_by UUID,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking 
        FOREIGN KEY (booking_id) 
        REFERENCES bookings(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_payment_verifier 
        FOREIGN KEY (verified_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    destination_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    photo_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_review_booking 
        FOREIGN KEY (booking_id) 
        REFERENCES bookings(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_review_destination 
        FOREIGN KEY (destination_id) 
        REFERENCES destinations(id) 
        ON DELETE CASCADE
);
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_review_destination;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS package_id UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE reviews DROP COLUMN IF EXISTS photo_url;
ALTER TABLE reviews DROP COLUMN IF EXISTS video_url;
ALTER TABLE reviews 
ADD CONSTRAINT fk_review_package 
FOREIGN KEY (package_id) 
REFERENCES packages(id) 
ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_package ON reviews(package_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    destination_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlist_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_destination 
        FOREIGN KEY (destination_id) 
        REFERENCES destinations(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_destination 
        UNIQUE(user_id, destination_id)
);
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS fk_wishlist_destination;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS unique_user_destination;
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS package_id UUID;
UPDATE wishlists w
SET package_id = (
    SELECT p.id 
    FROM packages p 
    WHERE p.destination_id = w.destination_id 
    LIMIT 1
)
WHERE package_id IS NULL AND destination_id IS NOT NULL;
ALTER TABLE wishlists DROP COLUMN IF EXISTS destination_id;
ALTER TABLE wishlists 
ADD CONSTRAINT fk_wishlist_package 
FOREIGN KEY (package_id) 
REFERENCES packages(id) 
ON DELETE CASCADE;
ALTER TABLE wishlists 
ADD CONSTRAINT unique_user_package 
UNIQUE(user_id, package_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_package ON wishlists(package_id);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    cover_image_url TEXT,
    author_id UUID,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_author 
        FOREIGN KEY (author_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags JSONB; 
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS read_time VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    icon_url TEXT,
    article_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO article_categories (name, slug, description) VALUES
('Tips Travel', 'tips-travel', 'Tips dan trik untuk perjalanan yang nyaman'),
('Destinasi', 'destinasi', 'Rekomendasi destinasi halal friendly'),
('Kuliner', 'kuliner', 'Kuliner halal di berbagai destinasi'),
('Budaya', 'budaya', 'Budaya dan tradisi islami')
ON CONFLICT (slug) DO NOTHING;
ALTER TABLE articles 
ADD CONSTRAINT fk_article_category 
FOREIGN KEY (category_id) 
REFERENCES article_categories(id) 
ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    rating DECIMAL(2,1),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_community_post_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);
INSERT INTO community_posts (user_id, title, content, created_at)
SELECT 
    cd.user_id,
    ct.title,
    cd.message,
    cd.created_at
FROM community_discussions cd
JOIN community_topics ct ON cd.topic_id = ct.id
ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID,
    booking_id UUID,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    testimonial_text TEXT NOT NULL,
    rating DECIMAL(2,1),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_testimonial_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_testimonial_package 
        FOREIGN KEY (package_id) 
        REFERENCES packages(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_testimonial_booking 
        FOREIGN KEY (booking_id) 
        REFERENCES bookings(id) 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO locations (country, region) VALUES
('Indonesia', 'Asia Tenggara'),
('Korea Selatan', 'Asia Timur'),
('Jepang', 'Asia Timur'),
('Turki', 'Timur Tengah'),
('Arab Saudi', 'Timur Tengah'),
('Uzbekistan', 'Asia Tengah'),
('Singapura', 'Asia Tenggara'),
('Malaysia', 'Asia Tenggara')
ON CONFLICT DO NOTHING;

CREATE TABLE community_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_topic_creator 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE TABLE community_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discussion_topic 
        FOREIGN KEY (topic_id) 
        REFERENCES community_topics(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_discussion_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE VIEW v_packages_with_destination AS
SELECT 
    p.*,
    d.name as destination_name,
    d.location as destination_location,
    d.category as destination_category,
    d.image_url as destination_image_url
FROM packages p
JOIN destinations d ON p.destination_id = d.id;

CREATE OR REPLACE VIEW v_bookings_detail AS
SELECT 
    b.*,
    u.full_name as user_full_name,
    u.email as user_email,
    p.name as package_name,
    p.price as package_price,
    d.name as destination_name
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN packages p ON b.package_id = p.id
JOIN destinations d ON p.destination_id = d.id;

CREATE OR REPLACE VIEW v_reviews_detail AS
SELECT 
    r.*,
    u.full_name as user_name,
    u.avatar_url as user_avatar,
    p.name as package_name,
    d.name as destination_name
FROM reviews r
JOIN users u ON r.user_id = u.id
LEFT JOIN packages p ON r.package_id = p.id
LEFT JOIN destinations d ON r.destination_id = d.id;

ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);

COMMIT;