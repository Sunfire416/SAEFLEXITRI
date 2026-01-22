-- ============================================
-- 9. TABLE BAGAGES & EVENTS
-- ============================================
CREATE TABLE bagages (
    bagage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(reservation_id) ON DELETE SET NULL,
    
    bagage_public_id VARCHAR(50) UNIQUE, -- ID scannable (tag)
    weight NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'checked_in'
        CHECK (status IN ('checked_in', 'security', 'loading', 'in_transit', 'unloading', 'carousel', 'delivered', 'lost')),
    
    current_location VARCHAR(255),
    last_scanned_at TIMESTAMPTZ,
    
    description TEXT,
    photo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bagage_events (
    event_id SERIAL PRIMARY KEY,
    bagage_id UUID REFERENCES bagages(bagage_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes Bagages
CREATE INDEX idx_bagages_user ON bagages(user_id);
CREATE INDEX idx_bagages_reservation ON bagages(reservation_id);
CREATE INDEX idx_bagages_public_id ON bagages(bagage_public_id);
CREATE INDEX idx_bagage_events_bagage ON bagage_events(bagage_id);
