-- =========================================================
-- TRIGGER SYNCHRONISATION TRANSACTION -> BLOCKCHAIN
-- =========================================================

-- S'assurer que pgcrypto est activé pour le hachage
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction qui crée le bloc blockchain
CREATE OR REPLACE FUNCTION sync_transaction_to_blockchain()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_hash TEXT;
    v_new_hash TEXT;
    v_metadata JSONB;
    v_blockchain_type TEXT; -- Nouvelle variable pour la traduction
BEGIN
    -- 1. Traduction du type pour la table blockchain (Contrainte debit/credit)
    IF NEW.type IN ('debit', 'Billet_Voyage', 'Duty_Free') THEN
        v_blockchain_type := 'debit';
    ELSIF NEW.type IN ('credit', 'remboursement') THEN
        v_blockchain_type := 'credit';
    ELSE
        v_blockchain_type := 'debit'; -- Par défaut
    END IF;

    -- [Le reste de ton code actuel pour le hash...]
    SELECT hash INTO v_previous_hash FROM blockchain ORDER BY created_at DESC LIMIT 1;
    IF v_previous_hash IS NULL THEN
        v_previous_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    v_metadata := jsonb_build_object(
        'description', NEW.description,
        'payment_status', NEW.payment_status,
        'reservation_id', NEW.reservation_id,
        'source', 'trigger_sync',
        'original_type', NEW.type -- On garde quand même l'info originale ici
    );

    v_new_hash := encode(digest(NEW.id::text || NEW.amount::text || v_previous_hash || NOW()::text, 'sha256'), 'hex');

    -- 2. Insertion avec le type corrigé (v_blockchain_type)
    INSERT INTO blockchain (
        user_id,
        transaction_id,
        amount,
        transaction_type, -- C'est cette colonne qui a la contrainte !
        balance_before,
        balance_after,
        previous_hash,
        hash,
        metadata,
        created_at
    )
    VALUES (
        NEW.user_id,
        NEW.id,
        NEW.amount,
        v_blockchain_type, -- Utilisation de la version traduite ('debit')
        COALESCE(NEW.balance_after, 0) + CASE WHEN v_blockchain_type = 'debit' THEN NEW.amount ELSE -NEW.amount END,
        COALESCE(NEW.balance_after, 0),
        v_previous_hash,
        v_new_hash,
        v_metadata,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;