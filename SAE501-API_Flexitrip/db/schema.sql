-- ============================================
-- FLEXITRIP - SCHEMA COMPLET OPTIMISÉ SUPABASE
-- Version finale avec notifications et fonctions
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. TABLE USERS (Optimisé pour JSON et booléens)
-- ============================================
CREATE TABLE users (
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
    
    -- Informations PMR (Optimisé avec booléens)
    type_handicap VARCHAR(50) DEFAULT 'Aucun',
    besoins_specifiques JSONB DEFAULT '{}',
    pmr_profile JSONB DEFAULT '{
        "mobility_aid": "none",
        "wheelchair_type": null,
        "visual_impairment": false,
        "hearing_impairment": false,
        "cognitive_assistance_needed": false,
        "service_dog": false,
        "preferred_seat": "aisle",
        "assistance_level": "partial",
        "language_preference": "fr",
        "emergency_contact": {"name": "", "phone": "", "relationship": ""},
        "medical_info": "",
        "special_equipment_needed": []
    }',
    needs_assistance BOOLEAN DEFAULT FALSE,
    
    -- Wallet
    solde NUMERIC(10,2) NOT NULL DEFAULT 700.00 CHECK (solde >= 0),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLE VOYAGES (snake_case cohérent)
-- ============================================
CREATE TABLE voyages (
    id_voyage UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pmr UUID REFERENCES users(user_id) ON DELETE CASCADE,
    id_accompagnant UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Dates
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ NOT NULL,
    
    -- Lieux (snake_case)
    lieu_depart JSONB NOT NULL,
    lieu_arrivee JSONB NOT NULL,
    
    -- Bagages
    bagage JSONB DEFAULT '[]',
    
    -- Étapes
    etapes JSONB DEFAULT '[]',
    
    -- Prix
    prix_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Statut (ajouté)
    status TEXT DEFAULT 'planned',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLE RESERVATIONS (snake_case complet)
-- ============================================
CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    id_voyage UUID REFERENCES voyages(id_voyage) ON DELETE SET NULL,
    
    -- Identifiants métier
    num_reza_mmt VARCHAR(100) UNIQUE NOT NULL,
    num_pax VARCHAR(100),
    booking_reference VARCHAR(100),
    
    -- Transport et assistance (snake_case)
    type_transport VARCHAR(50) CHECK (type_transport IN ('train', 'taxi', 'avion', 'bus', 'multimodal')),
    assistance_pmr BOOLEAN DEFAULT FALSE,
    
    -- Dates et lieux (snake_case)
    date_reservation DATE DEFAULT CURRENT_DATE,
    lieu_depart VARCHAR(255),
    lieu_arrivee VARCHAR(255),
    date_depart TIMESTAMPTZ,
    date_arrivee TIMESTAMPTZ,
    
    -- Statuts (snake_case)
    enregistre BOOLEAN DEFAULT FALSE,
    statut VARCHAR(50) DEFAULT 'PENDING',
    ticket_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (ticket_status IN ('pending', 'generated', 'used', 'cancelled')),
    
    -- Options PMR
    pmr_options JSONB DEFAULT '{}',
    
    -- Billetterie
    ticket_qr_code TEXT,
    ticket_generated_at TIMESTAMPTZ,
    qr_code_data TEXT,
    
    -- Facturation legacy (snake_case)
    facturation_id UUID,
    etape_voyage INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLE TRANSACTIONS (Types élargis)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(reservation_id) ON DELETE SET NULL,
    
    -- Champs transactionnels
    amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'pending', 'paid')),
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('debit', 'credit', 'remboursement', 'Billet_Voyage', 'Duty_Free')),
    date_payement TIMESTAMPTZ,
    
    -- Wallet tracking
    balance_after NUMERIC(10,2),
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLE NOTIFICATIONS (Pour Supabase)
-- ============================================
CREATE TABLE notifications (
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

-- ============================================
-- INDEXES OPTIMISÉS
-- ============================================

-- Indexes users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_needs_assistance ON users(needs_assistance);

-- Indexes voyages
CREATE INDEX idx_voyages_id_pmr ON voyages(id_pmr);
CREATE INDEX idx_voyages_date_debut ON voyages(date_debut);
CREATE INDEX idx_voyages_status ON voyages(status);

-- Indexes reservations
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_id_voyage ON reservations(id_voyage);
CREATE INDEX idx_reservations_num_reza_mmt ON reservations(num_reza_mmt);
CREATE INDEX idx_reservations_ticket_status ON reservations(ticket_status);
CREATE INDEX idx_reservations_assistance_pmr ON reservations(assistance_pmr);
CREATE INDEX idx_reservations_type_transport ON reservations(type_transport);

-- Indexes transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_reservation_id ON transactions(reservation_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date_payement ON transactions(date_payement);

-- Indexes notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- TRIGGERS ET FONCTIONS
-- ============================================

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER set_timestamp_users 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_voyages
BEFORE UPDATE ON voyages 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_reservations
BEFORE UPDATE ON reservations 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notifications
BEFORE UPDATE ON notifications 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

-- Fonction intelligente pour calculer et synchroniser le solde
CREATE OR REPLACE FUNCTION process_transaction() 
RETURNS TRIGGER AS $$
DECLARE
    current_solde NUMERIC(10,2);
BEGIN
    -- Récupérer le solde actuel
    SELECT solde INTO current_solde FROM users WHERE user_id = NEW.user_id FOR UPDATE;

    -- Calculer le solde après opération
    IF NEW.type IN ('debit', 'Billet_Voyage', 'Duty_Free') THEN
        NEW.balance_after := current_solde - NEW.amount;
    ELSIF NEW.type IN ('credit', 'remboursement') THEN
        NEW.balance_after := current_solde + NEW.amount;
    ELSE
        NEW.balance_after := current_solde;
    END IF;

    -- Mise à jour automatique de la table users
    UPDATE users SET solde = NEW.balance_after, updated_at = NOW() WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger unique pour synchroniser le wallet
DROP TRIGGER IF EXISTS tr_wallet_sync ON transactions;
CREATE TRIGGER tr_wallet_sync
BEFORE INSERT ON transactions
FOR EACH ROW EXECUTE PROCEDURE process_transaction();

-- Fonction pour mettre à jour le wallet avec contrôle
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
    -- Récupérer le solde actuel avec verrouillage
    SELECT solde INTO current_balance FROM users WHERE user_id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;

    -- Calculer le nouveau solde
    IF p_type = 'credit' OR p_type = 'deposit' OR p_type = 'remboursement' THEN
        new_balance := current_balance + p_amount;
    ELSIF p_type = 'debit' OR p_type = 'Billet_Voyage' OR p_type = 'Duty_Free' THEN
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Solde insuffisant';
        END IF;
        new_balance := current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Type de transaction invalide: %', p_type;
    END IF;

    -- Mettre à jour l'utilisateur
    UPDATE users 
    SET solde = new_balance, updated_at = NOW() 
    WHERE user_id = p_user_id;

    -- Créer une transaction correspondante
    INSERT INTO transactions (user_id, amount, type, payment_status, description)
    VALUES (
        p_user_id,
        p_amount,
        p_type,
        'paid',
        CASE 
            WHEN p_type = 'credit' THEN 'Rechargement de compte'
            WHEN p_type = 'debit' THEN 'Débit de compte'
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

-- Fonction pour récupérer le rôle
CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS TEXT AS $$
    SELECT role FROM users WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction pour vérifier admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
    SELECT get_my_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction pour vérifier si utilisateur est PMR ou accompagnant
CREATE OR REPLACE FUNCTION is_pmr_or_accompagnant() 
RETURNS BOOLEAN AS $$
    SELECT get_my_role() IN ('PMR', 'Accompagnant');
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Activation RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies USERS
CREATE POLICY "users_select_policy" ON users FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "users_update_policy" ON users FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "users_insert_policy" ON users FOR INSERT
WITH CHECK (true); -- Permet l'inscription

-- Policies VOYAGES
CREATE POLICY "voyages_select_policy" ON voyages FOR SELECT
USING (
    auth.uid() = id_pmr 
    OR auth.uid() = id_accompagnant 
    OR is_admin()
    OR get_my_role() = 'Agent'
);

CREATE POLICY "voyages_insert_policy" ON voyages FOR INSERT
WITH CHECK (is_pmr_or_accompagnant() OR is_admin() OR get_my_role() = 'Agent');

CREATE POLICY "voyages_update_policy" ON voyages FOR UPDATE
USING (
    auth.uid() = id_pmr 
    OR auth.uid() = id_accompagnant 
    OR is_admin()
    OR get_my_role() = 'Agent'
);

-- Policies RESERVATIONS
CREATE POLICY "reservations_select_policy" ON reservations FOR SELECT
USING (
    auth.uid() = user_id 
    OR is_admin() 
    OR get_my_role() = 'Agent'
);

CREATE POLICY "reservations_insert_policy" ON reservations FOR INSERT
WITH CHECK (is_pmr_or_accompagnant() OR is_admin() OR get_my_role() = 'Agent');

CREATE POLICY "reservations_update_policy" ON reservations FOR UPDATE
USING (
    auth.uid() = user_id 
    OR is_admin() 
    OR get_my_role() = 'Agent'
);

-- Policies TRANSACTIONS
CREATE POLICY "transactions_select_policy" ON transactions FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "transactions_insert_policy" ON transactions FOR INSERT
WITH CHECK (is_pmr_or_accompagnant() OR is_admin());

-- Policies NOTIFICATIONS
CREATE POLICY "notifications_select_policy" ON notifications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_update_policy" ON notifications FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notifications_insert_policy" ON notifications FOR INSERT
WITH CHECK (true); -- Permet l'insertion par le système

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour les voyages avec détails utilisateurs
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

-- Vue pour les réservations complètes
CREATE OR REPLACE VIEW reservations_completes AS
SELECT 
    r.*,
    u.name as user_name,
    u.surname as user_surname,
    u.email as user_email,
    u.role as user_role,
    v.date_debut as voyage_date_debut,
    v.date_fin as voyage_date_fin,
    v.status as voyage_status
FROM reservations r
JOIN users u ON r.user_id = u.user_id
LEFT JOIN voyages v ON r.id_voyage = v.id_voyage;

-- Vue pour les notifications avec infos utilisateur
CREATE OR REPLACE VIEW notifications_details AS
SELECT 
    n.*,
    u.name as user_name,
    u.surname as user_surname,
    u.email as user_email,
    u.role as user_role
FROM notifications n
JOIN users u ON n.user_id = u.user_id;

-- ============================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================

-- Insertion des utilisateurs de démo
INSERT INTO users (
    user_id,
    name,
    surname,
    email,
    phone,
    role,
    password,
    needs_assistance
)
VALUES
-- Agent
(
    gen_random_uuid(),
    'Mr',
    'Agent',
    'agent@test.com',
    '+33600000001',
    'Agent',
    crypt('agent', gen_salt('bf')),
    FALSE
),

-- PMR
(
    gen_random_uuid(),
    'Mme',
    'PMR',
    'pmr.client@test.com',
    '+33600000002',
    'PMR',
    crypt('pmr', gen_salt('bf')),
    TRUE
),

-- Accompagnant
(
    gen_random_uuid(),
    'Mr',
    'Accompagnant',
    'accompagnant@test.com',
    '+33600000003',
    'Accompagnant',
    crypt('accompagnant', gen_salt('bf')),
    FALSE
),
-- Admin
(
    gen_random_uuid(),
    'Admin',
    'System',
    'admin@flexitrip.com',
    '+33600000000',
    'admin',
    crypt('admin123', gen_salt('bf')),
    FALSE
);

-- Insertion d'un voyage de démo
WITH pmr_user AS (
    SELECT user_id FROM users WHERE role = 'PMR' LIMIT 1
),
accomp_user AS (
    SELECT user_id FROM users WHERE role = 'Accompagnant' LIMIT 1
)
INSERT INTO voyages (
    id_voyage,
    id_pmr,
    id_accompagnant,
    date_debut,
    date_fin,
    lieu_depart,
    lieu_arrivee,
    bagage,
    etapes,
    prix_total,
    status
)
SELECT
    gen_random_uuid(),
    pmr.user_id,
    acc.user_id,
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '5 days',
    '{"ville":"Paris","gare":"Gare de Lyon","code":"PLY"}',
    '{"ville":"Marseille","gare":"Saint-Charles","code":"MSC"}',
    '[{"type":"valise","poids":20,"description":"Valise cabine"}]',
    '[{"ordre":1,"transport":"train","duree":"3h30"},{"ordre":2,"transport":"taxi","duree":"0h20"}]',
    120.00,
    'confirmed'
FROM pmr_user pmr, accomp_user acc;

-- Insertion d'une réservation de démo
WITH voyage_data AS (
    SELECT v.id_voyage, v.id_pmr as user_id
    FROM voyages v
    LIMIT 1
)
INSERT INTO reservations (
    reservation_id,
    user_id,
    id_voyage,
    num_reza_mmt,
    type_transport,
    assistance_pmr,
    statut,
    ticket_status,
    date_depart,
    date_arrivee,
    lieu_depart,
    lieu_arrivee,
    pmr_options
)
SELECT
    gen_random_uuid(),
    vd.user_id,
    vd.id_voyage,
    'MMT-DEMO-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'train',
    TRUE,
    'CONFIRMED',
    'generated',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
    'Paris Gare de Lyon',
    'Marseille Saint-Charles',
    '{"wheelchair_assistance": true, "priority_boarding": true, "special_seating": "aisle"}'
FROM voyage_data vd;

-- Insertion d'une transaction de démo
WITH res_data AS (
    SELECT r.reservation_id, r.user_id
    FROM reservations r
    LIMIT 1
)
INSERT INTO transactions (
    user_id,
    reservation_id,
    amount,
    type,
    payment_status,
    description,
    date_payement
)
SELECT
    rd.user_id,
    rd.reservation_id,
    120.00,
    'Billet_Voyage',
    'paid',
    'Paiement billet train Paris → Marseille',
    NOW()
FROM res_data rd;

-- Insertion d'une notification de démo
WITH pmr_user AS (
    SELECT user_id FROM users WHERE role = 'PMR' LIMIT 1
)
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    icon,
    priority
)
SELECT
    pu.user_id,
    'INFO',
    'Bienvenue sur FlexiTrip!',
    'Votre compte a été créé avec succès. Bon voyage!',
    '{"action": "dashboard", "category": "welcome"}',
    '🎉',
    'normal'
FROM pmr_user pu;

-- ============================================
-- GRANTS (Permissions Supabase)
-- ============================================

-- Réinitialisation des droits
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Droits pour service_role (backend Node.js/Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Droits pour authenticated (utilisateurs connectés)
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON voyages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reservations TO authenticated;
GRANT SELECT, INSERT ON transactions TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- Droits pour anon (inscription)
GRANT INSERT ON users TO anon;

-- Droits sur les vues
GRANT SELECT ON voyages_details TO authenticated;
GRANT SELECT ON reservations_completes TO authenticated;
GRANT SELECT ON notifications_details TO authenticated;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE users IS 'Table des utilisateurs FlexiTrip PMR';
COMMENT ON TABLE voyages IS 'Voyages multimodaux avec étapes JSON';
COMMENT ON TABLE reservations IS 'Réservations et billets électroniques';
COMMENT ON TABLE transactions IS 'Historique des transactions et wallet';
COMMENT ON TABLE notifications IS 'Notifications système pour les utilisateurs';
COMMENT ON COLUMN users.pmr_profile IS 'Profil PMR détaillé au format JSON (préférences, équipements, contacts)';
COMMENT ON COLUMN voyages.status IS 'Statut du voyage: planned, confirmed, in_progress, completed, cancelled';
COMMENT ON COLUMN reservations.assistance_pmr IS 'Booléen indiquant si une assistance PMR est requise';
COMMENT ON COLUMN transactions.balance_after IS 'Solde du wallet après la transaction (calculé automatiquement)';
COMMENT ON FUNCTION update_user_wallet IS 'Fonction sécurisée pour mettre à jour le wallet utilisateur';

-- ============================================
-- CONFIGURATION SUPABASE SPÉCIFIQUE
-- ============================================

-- Configuration pour que Supabase fonctionne correctement
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Assure que les tables sont répliquées pour Realtime
ALTER TABLE notifications REPLICA IDENTITY FULL;