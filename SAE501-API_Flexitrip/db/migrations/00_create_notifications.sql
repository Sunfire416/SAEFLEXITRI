-- ============================================
-- TABLE NOTIFICATIONS (Pour Supabase)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'BOARDING_SUCCESS', 'DELAY', 'INFO', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadonnées et payload
    data JSONB DEFAULT '{}',
    agent_info JSONB DEFAULT NULL,
    
    -- UI
    icon VARCHAR(50) DEFAULT '🔔',
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    action_url VARCHAR(255),
    
    -- État
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_policy" ON notifications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_update_policy" ON notifications FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_insert_policy" ON notifications FOR INSERT
WITH CHECK (true); -- Permet l'insertion par le système (service_role) ou trigger
