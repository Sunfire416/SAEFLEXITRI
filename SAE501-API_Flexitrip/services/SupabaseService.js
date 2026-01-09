const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        this.client = null;
        this.init();
    }

    init() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('❌ SUPABASE_URL et SUPABASE_KEY requis');
        }

        this.client = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            db: {
                schema: 'public'
            }
        });

        console.log('✅ Supabase client initialisé');
    }

    // ==================== USERS ====================

    async getUserById(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('❌ Supabase getUserById error:', error);
            return null;
        }
        return data;
    }

    async createUser(userData) {
        const { data, error } = await this.client
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createUser error:', error);
            throw error;
        }
        return data;
    }

    async updateUserWallet(userId, amount, type = 'debit') {
        const { data, error } = await this.client
            .rpc('update_user_wallet', {
                p_user_id: userId,
                p_amount: amount,
                p_type: type
            });

        if (error) {
            console.error('❌ Supabase updateUserWallet error:', error);
            throw error;
        }
        return data;
    }

    // ==================== VOYAGES ====================

    async createVoyage(voyageData) {
        const { data, error } = await this.client
            .from('voyages')
            .insert([voyageData])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createVoyage error:', error);
            throw error;
        }
        return data;
    }

    async getVoyageById(voyageId) {
        const { data, error } = await this.client
            .from('voyages')
            .select(`
                *,
                pmr:users!voyages_id_pmr_fkey(*),
                accompagnant:users!voyages_id_accompagnant_fkey(*)
            `)
            .eq('id_voyage', voyageId)
            .single();

        if (error) {
            console.error('❌ Supabase getVoyageById error:', error);
            return null;
        }
        return data;
    }

    async getVoyagesByUser(userId, role) {
        let query = this.client
            .from('voyages')
            .select(`
                *,
                pmr:users!voyages_id_pmr_fkey(*),
                accompagnant:users!voyages_id_accompagnant_fkey(*)
            `);

        if (role === 'PMR') {
            query = query.eq('id_pmr', userId);
        } else if (role === 'Accompagnant') {
            query = query.eq('id_accompagnant', userId);
        } else {
            // Admin ou Agent voit tout
            query = query.or(`id_pmr.eq.${userId},id_accompagnant.eq.${userId}`);
        }

        const { data, error } = await query.order('date_debut', { ascending: false });

        if (error) {
            console.error('❌ Supabase getVoyagesByUser error:', error);
            return [];
        }
        return data;
    }

    // ==================== RESERVATIONS ====================

    async createReservation(reservationData) {
        const { data, error } = await this.client
            .from('reservations')
            .insert([reservationData])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createReservation error:', error);
            throw error;
        }
        return data;
    }

    async getReservationByNumReza(numReza) {
        const { data, error } = await this.client
            .from('reservations')
            .select(`
                *,
                user:users(*),
                voyage:voyages(*)
            `)
            .eq('num_reza_mmt', numReza)
            .single();

        if (error) {
            console.error('❌ Supabase getReservationByNumReza error:', error);
            return null;
        }
        return data;
    }

    async updateReservationStatus(reservationId, updates) {
        const { data, error } = await this.client
            .from('reservations')
            .update(updates)
            .eq('reservation_id', reservationId)
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase updateReservationStatus error:', error);
            throw error;
        }
        return data;
    }

    // ==================== TRANSACTIONS ====================

    async createTransaction(transactionData) {
        const { data, error } = await this.client
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createTransaction error:', error);
            throw error;
        }
        return data;
    }

    async getUserTransactions(userId) {
        const { data, error } = await this.client
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getUserTransactions error:', error);
            return [];
        }
        return data;
    }

    // ==================== UTILITAIRES ====================

    async executeRawQuery(query, params = []) {
        const { data, error } = await this.client.rpc('execute_sql', {
            query,
            params
        });

        if (error) {
            console.error('❌ Supabase executeRawQuery error:', error);
            throw error;
        }
        return data;
    }
}

module.exports = new SupabaseService();