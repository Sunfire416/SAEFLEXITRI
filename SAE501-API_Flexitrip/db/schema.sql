-- ============================================
-- FLEXITRIP - SCHEMA COMPLET SUPABASE
-- Version SAFE - Gestion des conflits
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TABLE USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations personnelles
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_naissance DATE,
    nationalite VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    
    -- Compte et sécurité
    role VARCHAR(20) NOT NULL DEFAULT 'PMR' 
        CHECK (role IN ('PMR', 'Accompagnant', 'Agent', 'admin')),
    password VARCHAR(255) NOT NULL,
    
    -- Informations PMR
    type_handicap VARCHAR(50) DEFAULT 'Aucun',
    besoins_specifiques JSONB DEFAULT '{}',
    pmr_profile JSONB DEFAULT '{
        "service_dog": false,
        "medical_info": "",
        "mobility_aid": "none",
        "preferred_seat": "aisle",
        "wheelchair_type": null,
        "assistance_level": "partial",
        "emergency_contact": {"name": "", "phone": "", "relationship": ""},
        "visual_impairment": false,
        "hearing_impairment": false,
        "language_preference": "fr",
        "special_equipment_needed": [],
        "cognitive_assistance_needed": false
    }',
    needs_assistance BOOLEAN DEFAULT FALSE,
    
    -- Wallet
    solde NUMERIC(10,2) NOT NULL DEFAULT 700.00 CHECK (solde >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLE VOYAGES
-- ============================================
CREATE TABLE IF NOT EXISTS voyages (
    id_voyage UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pmr UUID REFERENCES users(user_id) ON DELETE CASCADE,
    id_accompagnant UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Dates
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ NOT NULL,
    
    -- Lieux (JSONB pour flexibilité)
    lieu_depart JSONB NOT NULL,
    lieu_arrivee JSONB NOT NULL,
    
    -- Bagages (array JSONB)
    bagage JSONB DEFAULT '[]',
    
    -- Étapes (array JSONB)
    etapes JSONB DEFAULT '[]',
    
    -- Prix
    prix_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Statut
    status TEXT DEFAULT 'planned',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLE RESERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    id_voyage UUID REFERENCES voyages(id_voyage) ON DELETE SET NULL,
    
    -- Identifiants métier
    num_reza_mmt VARCHAR(100) UNIQUE NOT NULL,
    num_pax VARCHAR(100),
    booking_reference VARCHAR(100),
    
    -- Transport et assistance
    type_transport VARCHAR(50) 
        CHECK (type_transport IN ('train', 'taxi', 'avion', 'bus', 'multimodal')),
    assistance_pmr BOOLEAN DEFAULT FALSE,
    
    -- Dates et lieux
    date_reservation DATE DEFAULT CURRENT_DATE,
    lieu_depart VARCHAR(255),
    lieu_arrivee VARCHAR(255),
    date_depart TIMESTAMPTZ,
    date_arrivee TIMESTAMPTZ,
    
    -- Statuts
    enregistre BOOLEAN DEFAULT FALSE,
    statut VARCHAR(50) DEFAULT 'PENDING',
    ticket_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (ticket_status IN ('pending', 'generated', 'used', 'cancelled')),
    
    -- Options PMR
    pmr_options JSONB DEFAULT '{}',
    
    -- Billetterie et QR Code
    ticket_qr_code TEXT,
    ticket_generated_at TIMESTAMPTZ,
    qr_code_data TEXT,
    
    -- Facturation
    facturation_id UUID,
    etape_voyage INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLE PMR_MISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS pmr_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(reservation_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Statut de la mission
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    
    -- Géolocalisation agent
    agent_lat NUMERIC,
    agent_lng NUMERIC,
    eta SMALLINT,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLE BAGAGES
-- ============================================
CREATE TABLE IF NOT EXISTS bagages (
    bagage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(reservation_id) ON DELETE SET NULL,
    
    -- Identifiant scannable
    bagage_public_id VARCHAR(50) UNIQUE,
    
    -- Caractéristiques
    weight NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'checked_in',
    
    -- Localisation
    current_location VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLE NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Contenu
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Payload
    data JSONB DEFAULT '{}',
    agent_info JSONB,
    
    -- UI
    icon VARCHAR(50) DEFAULT '🔔',
    priority VARCHAR(20) DEFAULT 'normal',
    action_url VARCHAR(255),
    
    -- État
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLE TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(reservation_id) ON DELETE SET NULL,
    
    -- Transaction
    amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    type VARCHAR(50) NOT NULL,
    date_payement TIMESTAMPTZ,
    
    -- Wallet tracking
    balance_after NUMERIC(10,2),
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABLE BLOCKCHAIN
-- ============================================
CREATE TABLE IF NOT EXISTS blockchain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Transaction info
    transaction_id VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    balance_before NUMERIC(10,2),
    balance_after NUMERIC(10,2),
    
    -- Blockchain
    previous_hash VARCHAR(255) NOT NULL,
    hash VARCHAR(255) UNIQUE NOT NULL,
    nonce INTEGER DEFAULT 0,
    
    -- Extra
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (avec IF NOT EXISTS implicite)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_needs_assistance ON users(needs_assistance);

CREATE INDEX IF NOT EXISTS idx_voyages_id_pmr ON voyages(id_pmr);
CREATE INDEX IF NOT EXISTS idx_voyages_date_debut ON voyages(date_debut);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_id_voyage ON reservations(id_voyage);
CREATE INDEX IF NOT EXISTS idx_reservations_num_reza_mmt ON reservations(num_reza_mmt);
CREATE INDEX IF NOT EXISTS idx_reservations_ticket_status ON reservations(ticket_status);
CREATE INDEX IF NOT EXISTS idx_reservations_assistance_pmr ON reservations(assistance_pmr);
CREATE INDEX IF NOT EXISTS idx_reservations_type_transport ON reservations(type_transport);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation_id ON transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date_payement ON transactions(date_payement);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_blockchain_user_id ON blockchain(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON blockchain(hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_previous_hash ON blockchain(previous_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_created_at ON blockchain(created_at);
CREATE INDEX IF NOT EXISTS idx_blockchain_transaction_id ON blockchain(transaction_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS TEXT AS $$
    SELECT role FROM users WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
    SELECT get_my_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_pmr_or_accompagnant() 
RETURNS BOOLEAN AS $$
    SELECT get_my_role() IN ('PMR', 'Accompagnant');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_transaction() 
RETURNS TRIGGER AS $$
DECLARE
    current_solde NUMERIC(10,2);
BEGIN
    SELECT solde INTO current_solde 
    FROM users 
    WHERE user_id = NEW.user_id 
    FOR UPDATE;

    IF NEW.type IN ('debit', 'Billet_Voyage', 'Duty_Free') THEN
        NEW.balance_after := current_solde - NEW.amount;
    ELSIF NEW.type IN ('credit', 'remboursement') THEN
        NEW.balance_after := current_solde + NEW.amount;
    ELSE
        NEW.balance_after := current_solde;
    END IF;

    IF NEW.balance_after < 0 THEN
        RAISE EXCEPTION 'Solde insuffisant pour cette transaction';
    END IF;

    UPDATE users 
    SET solde = NEW.balance_after, updated_at = NOW() 
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_wallet(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT
)
RETURNS JSON AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
    result JSON;
BEGIN
    SELECT solde INTO current_balance 
    FROM users 
    WHERE user_id = p_user_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;

    IF p_type IN ('credit', 'deposit', 'remboursement') THEN
        new_balance := current_balance + p_amount;
    ELSIF p_type IN ('debit', 'Billet_Voyage', 'Duty_Free') THEN
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Solde insuffisant';
        END IF;
        new_balance := current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Type de transaction invalide: %', p_type;
    END IF;

    UPDATE users 
    SET solde = new_balance, updated_at = NOW() 
    WHERE user_id = p_user_id;

    INSERT INTO transactions (user_id, amount, type, payment_status, balance_after, description)
    VALUES (
        p_user_id,
        p_amount,
        p_type,
        'paid',
        new_balance,
        CASE 
            WHEN p_type IN ('credit', 'deposit') THEN 'Rechargement de compte'
            WHEN p_type = 'debit' THEN 'Débit de compte'
            WHEN p_type = 'remboursement' THEN 'Remboursement'
            ELSE 'Transaction manuelle'
        END
    );

    result := json_build_object(
        'success', true,
        'user_id', p_user_id,
        'old_balance', current_balance,
        'new_balance', new_balance,
        'transaction_type', p_type,
        'amount', p_amount
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (DROP IF EXISTS pour éviter conflits)
-- ============================================

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_voyages ON voyages;
CREATE TRIGGER set_timestamp_voyages
    BEFORE UPDATE ON voyages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_reservations ON reservations;
CREATE TRIGGER set_timestamp_reservations
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_notifications ON notifications;
CREATE TRIGGER set_timestamp_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_blockchain ON blockchain;
CREATE TRIGGER set_timestamp_blockchain
    BEFORE UPDATE ON blockchain
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS tr_wallet_sync ON transactions;
CREATE TRIGGER tr_wallet_sync
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_transaction();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmr_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (DROP avant CREATE pour éviter conflits)
-- ============================================

-- USERS POLICIES
DROP POLICY IF EXISTS "Allow system to insert new users" ON users;
DROP POLICY IF EXISTS "Allow system to search user by email" ON users;
DROP POLICY IF EXISTS "Enable insert access for registration" ON users;
DROP POLICY IF EXISTS "api_full_access" ON users;
DROP POLICY IF EXISTS "service_role_access_users" ON users;
DROP POLICY IF EXISTS "authenticated_users_select" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

CREATE POLICY "Allow system to insert new users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow system to search user by email" ON users
    FOR SELECT USING (true);

CREATE POLICY "users_select_policy" ON users
    FOR SELECT 
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE 
    USING (auth.uid() = user_id OR is_admin());

-- VOYAGES POLICIES
DROP POLICY IF EXISTS "voyages_select_policy" ON voyages;
DROP POLICY IF EXISTS "voyages_insert_policy" ON voyages;
DROP POLICY IF EXISTS "voyages_update_policy" ON voyages;

CREATE POLICY "voyages_select_policy" ON voyages
    FOR SELECT 
    USING (
        auth.uid() = id_pmr 
        OR auth.uid() = id_accompagnant 
        OR is_admin()
        OR get_my_role() = 'Agent'
    );

CREATE POLICY "voyages_insert_policy" ON voyages
    FOR INSERT 
    WITH CHECK (is_pmr_or_accompagnant() OR is_admin());

CREATE POLICY "voyages_update_policy" ON voyages
    FOR UPDATE 
    USING (
        auth.uid() = id_pmr 
        OR auth.uid() = id_accompagnant 
        OR is_admin()
    );

-- RESERVATIONS POLICIES
DROP POLICY IF EXISTS "reservations_select_policy" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_policy" ON reservations;
DROP POLICY IF EXISTS "reservations_update_policy" ON reservations;

CREATE POLICY "reservations_select_policy" ON reservations
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR is_admin() 
        OR get_my_role() = 'Agent'
    );

CREATE POLICY "reservations_insert_policy" ON reservations
    FOR INSERT 
    WITH CHECK (is_pmr_or_accompagnant() OR is_admin() OR get_my_role() = 'Agent');

CREATE POLICY "reservations_update_policy" ON reservations
    FOR UPDATE 
    USING (
        auth.uid() = user_id 
        OR is_admin() 
        OR get_my_role() = 'Agent'
    );

-- PMR_MISSIONS POLICIES
DROP POLICY IF EXISTS "pmr_missions_agent_select_own" ON pmr_missions;
DROP POLICY IF EXISTS "pmr_missions_agent_update_own" ON pmr_missions;
DROP POLICY IF EXISTS "Allow select for service_role" ON pmr_missions;

CREATE POLICY "pmr_missions_agent_select_own" ON pmr_missions
    FOR SELECT 
    USING (
        agent_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM reservations r 
            WHERE r.reservation_id = pmr_missions.reservation_id 
            AND r.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY "pmr_missions_agent_update_own" ON pmr_missions
    FOR UPDATE 
    USING (agent_id = auth.uid() OR is_admin());

CREATE POLICY "Allow select for service_role" ON pmr_missions
    FOR SELECT 
    USING (true);

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;

CREATE POLICY "transactions_select_policy" ON transactions
    FOR SELECT 
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT 
    WITH CHECK (is_pmr_or_accompagnant() OR is_admin());

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT 
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE 
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT 
    WITH CHECK (true);

-- BLOCKCHAIN POLICIES
DROP POLICY IF EXISTS "blockchain_select_policy" ON blockchain;
DROP POLICY IF EXISTS "blockchain_insert_policy" ON blockchain;

CREATE POLICY "blockchain_select_policy" ON blockchain
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR is_admin() 
        OR get_my_role() = 'Agent'
    );

CREATE POLICY "blockchain_insert_policy" ON blockchain
    FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- VUES
-- ============================================

CREATE OR REPLACE VIEW voyages_details AS
SELECT 
    v.*,
    u_pmr.email AS pmr_email,
    u_pmr.surname AS pmr_surname, 
    u_pmr.name AS pmr_name,
    u_acc.surname AS accompagnant_surname,
    u_acc.name AS accompagnant_name
FROM voyages v
LEFT JOIN users u_pmr ON v.id_pmr = u_pmr.user_id
LEFT JOIN users u_acc ON v.id_accompagnant = u_acc.user_id;

CREATE OR REPLACE VIEW reservations_completes AS
SELECT 
    r.*,
    u.name as user_name,
    u.surname as user_surname,
    u.email as user_email,
    u.role as user_role,
    v.date_debut as voyage_date_debut,
    v.date_fin as voyage_date_fin
FROM reservations r
JOIN users u ON r.user_id = u.user_id
LEFT JOIN voyages v ON r.id_voyage = v.id_voyage;

CREATE OR REPLACE VIEW blockchain_details AS
SELECT 
    b.*,
    u.name as user_name,
    u.surname as user_surname,
    u.email as user_email
FROM blockchain b
JOIN users u ON b.user_id = u.user_id;

-- ============================================
-- CONFIGURATION REALTIME
-- ============================================

DO $$
BEGIN
    ALTER TABLE notifications REPLICA IDENTITY FULL;
    ALTER TABLE pmr_missions REPLICA IDENTITY FULL;
    ALTER TABLE bagages REPLICA IDENTITY FULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE users IS 'Utilisateurs: PMR, Agents, Accompagnants, Admins';
COMMENT ON TABLE voyages IS 'Voyages multimodaux avec étapes JSONB';
COMMENT ON TABLE reservations IS 'Réservations par segment avec QR Code';
COMMENT ON TABLE pmr_missions IS 'Assignation agents PMR';
COMMENT ON TABLE bagages IS 'Traçabilité bagages avec QR Code';
COMMENT ON TABLE notifications IS 'Notifications temps réel';
COMMENT ON TABLE transactions IS 'Wallet et transactions';
COMMENT ON TABLE blockchain IS 'Traçabilité immuable';

-- ============================================
-- FIN DU SCHEMA
-- ============================================