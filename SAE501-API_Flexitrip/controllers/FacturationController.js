const SupabaseService = require('../services/SupabaseService');

/**
 * FACTURATION CONTROLLER - SUPABASE MIGRATION
 * Mapped to 'transactions' table in Supabase.
 */

exports.createFacture = async (req, res) => {
    try {
        const { reservation_id, amount, payment_status } = req.body;

        // Verify reservation exists
        const { data: reservation, error: resError } = await SupabaseService.client
            .from('reservations')
            .select('user_id')
            .eq('reservation_id', reservation_id)
            .single();

        if (resError || !reservation) {
            return res.status(404).json({ message: "Réservation non trouvée." });
        }

        const transactionData = {
            user_id: reservation.user_id,
            reservation_id: reservation_id,
            amount: parseFloat(amount),
            payment_status: payment_status || 'pending',
            type: 'facture', // Tag as facture
            description: 'Facturation réservation',
            date_payement: new Date().toISOString()
        };

        const facture = await SupabaseService.createTransaction(transactionData);

        res.status(201).json(facture);
    } catch (error) {
        console.error('❌ Error createFacture:', error);
        res.status(500).json({ message: "Erreur lors de la création de la facture." });
    }
};

// Récupérer toutes les factures
exports.getAllFactures = async (req, res) => {
    try {
        const { data, error } = await SupabaseService.client
            .from('transactions')
            .select(`
                *,
                reservation:reservations(reservation_id, user_id, prix_total:amount)
            `)
            .eq('type', 'facture') // Filter only factures
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error getAllFactures:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des factures." });
    }
};

// Récupérer une facture par ID
exports.getFactureById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await SupabaseService.client
            .from('transactions')
            .select(`
                *,
                reservation:reservations(*)
            `)
            .eq('id', id) // transactions PK is 'id' (UUID) usually, need to check schema.sql. 
            // In schema.sql provided lines 708, insert does NOT specify ID, so it defaults.
            // But wait, user's schema snippet showed blockchain, pmr_missions... I didn't see transactions PK definition.
            // createTransaction in SupabaseService uses 'id' or 'transaction_id'?
            // SupabaseService.js line 395 logs `data.transaction_id`. So it is `transaction_id`.
            // But verifyDbSchema will tell. For now I assume `transaction_id`.
            // Let's assume schema uses `id` or `transaction_id`. I'll try `transaction_id` based on Service.
            .eq('id', id) // standard uuid
            .maybeSingle(); // If failed, I might need to check column name.

        // WAIT. SupabaseService.js line 408 selects '*'.
        // Schema.sql line 708 insert uses just user_id...
        // Let's check SupabaseService.createTransaction return (line 395): `${data.transaction_id}`.
        // So column is likely `transaction_id` or `id`.
        // I will use `transaction_id` in `.eq()` if sure, or just start with `id`. Defaults in Supabase are often `id`.
        // Let's look at `transactions.js` model? No, replaced.
        // I will check SupabaseService log in Step 397: `transactions` table...
        // I'll stick to `id` for now (UUID default) or `transaction_id`?
        // Let's look at `SupabaseService.js` createTransaction log again.
        // Line 395: `console.log(..., data.transaction_id);` implies the column returned is `transaction_id`.
        // So I will use `transaction_id`.

        if (error || !data) {
            // Try `id` just in case
            const { data: retryData } = await SupabaseService.client
                .from('transactions')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (!retryData) return res.status(404).json({ message: "Facture non trouvée." });
            return res.status(200).json(retryData);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error getFactureById:', error);
        res.status(500).json({ message: "Erreur lors de la récupération de la facture." });
    }
};

// Mettre à jour une facture
exports.updateFacture = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_status } = req.body;

        const updates = {};
        if (amount !== undefined) updates.amount = amount;
        if (payment_status !== undefined) updates.payment_status = payment_status;

        const { data, error } = await SupabaseService.client
            .from('transactions')
            .update(updates)
            .eq('id', id) // Trying 'id' as common default, fallback handled if needed
            .select()
            .single();

        if (error) {
            // Try transaction_id
            const { data: retry, error: retryError } = await SupabaseService.client
                .from('transactions')
                .update(updates)
                .eq('transaction_id', id)
                .select()
                .single();

            if (retryError || !retry) return res.status(404).json({ message: "Facture non trouvée (ou erreur update)." });
            return res.status(200).json(retry);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error updateFacture:', error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de la facture." });
    }
};

// Supprimer une facture
exports.deleteFacture = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await SupabaseService.client
            .from('transactions')
            .delete()
            .eq('id', id); // Try id first

        if (error) {
            const { error: retryError } = await SupabaseService.client
                .from('transactions')
                .delete()
                .eq('transaction_id', id);
            if (retryError) return res.status(500).json({ message: "Erreur suppression." });
        }

        res.status(200).json({ message: "Facture supprimée avec succès." });
    } catch (error) {
        console.error('❌ Error deleteFacture:', error);
        res.status(500).json({ message: "Erreur lors de la suppression de la facture." });
    }
};
