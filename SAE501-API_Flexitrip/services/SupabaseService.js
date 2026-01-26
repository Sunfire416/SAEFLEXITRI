/**
 * SupabaseService - Service centralisé pour Supabase/PostgreSQL
 * 
 * Schema: public (users, voyages, reservations, pmr_missions, transactions, blockchain, notifications)
 * Views: blockchain_details, reservations_completes, voyages_details
 * RLS: Enabled on all base tables
 * Triggers: set_timestamp, wallet_sync, blockchain_sync
 * 
 * ⚠️ IMPORTANT: Toujours utiliser SERVICE_ROLE_KEY côté serveur pour bypasser RLS
 * Pour les clients web: utiliser ANON_KEY avec policies RLS
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        this.init();
    }

    init() {
        const supabaseUrl = process.env.SUPABASE_URL;
        // TOUJOURS utiliser SERVICE_ROLE_KEY côté serveur
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Configuration Supabase incomplète');
            console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
            console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
            throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis');
        }

        // Client principal avec service_role pour accès complet
        this.client = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            db: {
                schema: 'public'
            }
        });

        console.log('✅ SupabaseService initialisé');
    }

    // ==================== USERS ====================

    async getUserById(userId) {
        console.log(`🔍 SupabaseService.getUserById: ${userId}`);

        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('❌ SupabaseService.getUserById error:', error.message);
                console.error('   Code:', error.code, 'Details:', error.details);
                return null;
            }

            console.log(`✅ User found: ${data.email} (${data.role})`);
            return data;
        } catch (error) {
            console.error('❌ Exception in getUserById:', error.message);
            return null;
        }
    }

    async getUserByEmail(email) {
        console.log(`🔍 SupabaseService.getUserByEmail: ${email}`);

        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase().trim())
                .single();

            if (error) {
                console.error('❌ SupabaseService.getUserByEmail error:', error.message);
                return null;
            }

            return data;
        } catch (error) {
            console.error('❌ Exception in getUserByEmail:', error.message);
            return null;
        }
    }

    async createUser(userData) {
        console.log(`🔍 SupabaseService.createUser: ${userData.email}`);

        try {
            const { data, error } = await this.client
                .from('users')
                .insert([userData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createUser error:', error.message);
                console.error('   Code:', error.code, 'Details:', error.details);
                throw error;
            }

            console.log(`✅ User created: ${data.user_id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createUser:', error.message);
            throw error;
        }
    }

    async updateUserWallet(userId, amount, type = 'debit') {
        const normalizedType = this.normalizeTransactionType(type);
        console.log(`🔍 SupabaseService.updateUserWallet (Trigger Mode): ${userId}, ${amount}, ${normalizedType}`);

        try {
            // Simplification radicale : on insère juste une transaction
            // Le trigger SQL 'tr_wallet_sync' s'occupe de mettre à jour le solde utilisateur
            // et de calculer le balance_after.

            const transactionData = {
                user_id: userId,
                amount: parseFloat(amount),
                type: normalizedType,
                payment_status: 'paid',
                description: type === 'credit' ? 'Rechargement (Trigger)' : 'Paiement voyage (Trigger)',
                date_payement: new Date().toISOString()
            };

            const { data, error } = await this.client
                .from('transactions')
                .insert([transactionData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.updateUserWallet error:', error.message);
                // Si l'erreur vient du trigger (ex: Solde insuffisant)
                throw error;
            }

            console.log(`✅ Transaction created via Trigger: ${data.id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in updateUserWallet:', error.message);
            throw error;
        }
    }

    // updateUserWalletManually est obsolète avec les triggers
    // On le garde comme alias si besoin, mais il redirige vers la nouvelle logique
    async updateUserWalletManually(userId, amount, type = 'debit') {
        console.warn('⚠️ Usage de méthode dépréciée updateUserWalletManually - Redirection vers updateUserWallet');
        return this.updateUserWallet(userId, amount, type);
    }

    // ==================== VOYAGES ====================

    async createVoyage(voyageData) {
        console.log(`🔍 SupabaseService.createVoyage: ${voyageData.id_voyage || 'new'}`);

        try {
            const { data, error } = await this.client
                .from('voyages')
                .insert([voyageData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createVoyage error:', error.message, error.code);
                throw error;
            }

            console.log(`✅ Voyage created: ${data.id_voyage}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createVoyage:', error.message);
            throw error;
        }
    }

    async getVoyageById(voyageId) {
        console.log(`🔍 SupabaseService.getVoyageById: ${voyageId}`);

        try {
            // Essayer d'abord avec la jointure complexe
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
                // Si la jointure échoue (clé étrangère non trouvée), essayer sans
                if (error.message.includes('foreign key') || error.message.includes('relation')) {
                    console.log(`ℹ️ Jointure complexe échouée, réessai sans jointures pour voyage ${voyageId}`);

                    const { data: simpleData, error: simpleError } = await this.client
                        .from('voyages')
                        .select('*')
                        .eq('id_voyage', voyageId)
                        .single();

                    if (simpleError) throw simpleError;

                    // Récupérer les utilisateurs séparément si nécessaire
                    if (simpleData.id_pmr) {
                        const pmr = await this.getUserById(simpleData.id_pmr);
                        simpleData.pmr = pmr;
                    }
                    if (simpleData.id_accompagnant) {
                        const accompagnant = await this.getUserById(simpleData.id_accompagnant);
                        simpleData.accompagnant = accompagnant;
                    }

                    return simpleData;
                }
                throw error;
            }

            console.log(`✅ Voyage found: ${voyageId}`);
            return data;
        } catch (error) {
            console.error('❌ SupabaseService.getVoyageById error:', error.message);
            return null;
        }
    }

    async getVoyagesByUser(userId, role) {
        console.log(`🔍 SupabaseService.getVoyagesByUser: ${userId}, ${role}`);

        try {
            // Optimisation : Utilisation de jointures SQL (embedding) au lieu de boucles N+1
            // On suppose que les contraintes FK sont 'voyages_id_pmr_fkey' et 'voyages_id_accompagnant_fkey'
            // Si cela échoue, vérifiez les noms exacts dans Supabase.
            let query = this.client
                .from('voyages')
                .select(`
                    *,
                    pmr:users!voyages_id_pmr_fkey(user_id, name, surname, email),
                    accompagnant:users!voyages_id_accompagnant_fkey(user_id, name, surname, email)
                `);

            // Filtrer selon le rôle
            if (role === 'PMR') {
                query = query.eq('id_pmr', userId);
            } else if (role === 'Accompagnant') {
                query = query.eq('id_accompagnant', userId);
            } else if (role === 'admin' || role === 'Agent') {
                // Admin ou Agent voit tout (pas de filtre)
            } else {
                // Par défaut, voir ses propres voyages
                query = query.or(`id_pmr.eq.${userId},id_accompagnant.eq.${userId}`);
            }

            const { data, error } = await query.order('date_debut', { ascending: false });

            if (error) {
                // Si erreur, c'est peut-être à cause de la syntaxe de jointure qui dépend du nom de la FK
                // On log l'erreur mais on tente un fallback simple
                console.warn('⚠️ Erreur fetch avec hash join (FKs possiblement incorrectes), fallback simple:', error.message);

                // Fallback: requête simple (moins performante mais fonctionnelle)
                return this.getVoyagesByUserFallback(userId, role);
            }

            console.log(`✅ Found ${data?.length || 0} voyages for user ${userId} (optimized)`);
            return data || [];
        } catch (error) {
            console.error('❌ SupabaseService.getVoyagesByUser error:', error.message);
            return [];
        }
    }

    // Méthode de secours si les jointures échouent
    async getVoyagesByUserFallback(userId, role) {
        // ... (Ancienne implémentation avec boucle)
        let query = this.client.from('voyages').select('*');
        if (role === 'PMR') query = query.eq('id_pmr', userId);
        else if (role === 'Accompagnant') query = query.eq('id_accompagnant', userId);
        else if (role !== 'admin' && role !== 'Agent') query = query.or(`id_pmr.eq.${userId},id_accompagnant.eq.${userId}`);

        const { data, error } = await query.order('date_debut', { ascending: false });
        if (error) throw error;

        if (data && data.length > 0) {
            for (const voyage of data) {
                if (voyage.id_pmr) voyage.pmr = await this.getUserById(voyage.id_pmr);
                if (voyage.id_accompagnant) voyage.accompagnant = await this.getUserById(voyage.id_accompagnant);
            }
        }
        return data || [];
    }

    // ==================== RESERVATIONS ====================

    async createReservation(reservationData) {
        console.log(`🔍 SupabaseService.createReservation: ${reservationData.num_reza_mmt || 'new'}`);

        try {
            const { data, error } = await this.client
                .from('reservations')
                .insert([reservationData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createReservation error:', error.message, error.code);
                throw error;
            }

            console.log(`✅ Reservation created: ${data.reservation_id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createReservation:', error.message);
            throw error;
        }
    }

    async getReservationByNumReza(numReza) {
        console.log(`🔍 SupabaseService.getReservationByNumReza: ${numReza}`);

        try {
            const { data, error } = await this.client
                .from('reservations')
                .select(`
                    *,
                    user:users(*),
                    voyage:voyages(*)
                `)
                .eq('num_reza_mmt', numReza)
                .single();

            if (error) throw error;

            console.log(`✅ Reservation found: ${numReza}`);
            return data;
        } catch (error) {
            console.error('❌ SupabaseService.getReservationByNumReza error:', error.message);
            return null;
        }
    }

    async updateReservationStatus(reservationId, updates) {
        console.log(`🔍 SupabaseService.updateReservationStatus: ${reservationId}`);

        try {
            const { data, error } = await this.client
                .from('reservations')
                .update(updates)
                .eq('reservation_id', reservationId)
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.updateReservationStatus error:', error.message);
                throw error;
            }

            console.log(`✅ Reservation updated: ${reservationId}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in updateReservationStatus:', error.message);
            throw error;
        }
    }

    // ==================== TRANSACTIONS ====================

    async createTransaction(transactionData) {
        console.log(`🔍 SupabaseService.createTransaction: ${transactionData.transaction_id || 'new'}`);

        try {
            const { data, error } = await this.client
                .from('transactions')
                .insert([transactionData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createTransaction error:', error.message);
                throw error;
            }

            console.log(`✅ Transaction created: ${data.transaction_id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createTransaction:', error.message);
            throw error;
        }
    }

    async getUserTransactions(userId) {
        console.log(`🔍 SupabaseService.getUserTransactions: ${userId}`);

        try {
            const { data, error } = await this.client
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ SupabaseService.getUserTransactions error:', error.message);
                return [];
            }

            console.log(`✅ Found ${data?.length || 0} transactions for user ${userId}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in getUserTransactions:', error.message);
            return [];
        }
    }

    // ==================== NOTIFICATIONS ====================

    async createNotification(notificationData) {
        console.log(`🔍 SupabaseService.createNotification: ${notificationData.type || 'general'}`);

        try {
            const { data, error } = await this.client
                .from('notifications')
                .insert([notificationData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createNotification error:', error.message);
                throw error;
            }

            console.log(`✅ Notification created: ${data.notification_id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createNotification:', error.message);
            throw error;
        }
    }

    async getUserNotifications(userId, limit = 50, skip = 0, unreadOnly = false, type = null) {
        console.log(`🔍 SupabaseService.getUserNotifications: ${userId}, limit=${limit}`);

        try {
            let query = this.client
                .from('notifications')
                .select('*', { count: 'estimated' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(skip, skip + limit - 1);

            if (unreadOnly) {
                query = query.eq('read', false);
            }
            if (type) {
                query = query.eq('type', type);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            console.log(`✅ Found ${data?.length || 0} notifications for user ${userId}`);
            return { notifications: data, total: count };
        } catch (error) {
            console.error('❌ SupabaseService.getUserNotifications error:', error.message);
            return { notifications: [], total: 0 };
        }
    }

    async countUnreadNotifications(userId) {
        console.log(`🔍 SupabaseService.countUnreadNotifications: ${userId}`);

        try {
            const { count, error } = await this.client
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) {
                console.error('❌ SupabaseService.countUnreadNotifications error:', error.message);
                return 0;
            }

            console.log(`✅ Unread notifications for ${userId}: ${count}`);
            return count;
        } catch (error) {
            console.error('❌ Exception in countUnreadNotifications:', error.message);
            return 0;
        }
    }

    async getNotificationById(notificationId) {
        console.log(`🔍 SupabaseService.getNotificationById: ${notificationId}`);

        try {
            const { data, error } = await this.client
                .from('notifications')
                .select('*')
                .eq('notification_id', notificationId)
                .single();

            if (error) {
                console.error('❌ SupabaseService.getNotificationById error:', error.message);
                return null;
            }

            return data;
        } catch (error) {
            console.error('❌ Exception in getNotificationById:', error.message);
            return null;
        }
    }

    async markNotificationAsRead(notificationId) {
        console.log(`🔍 SupabaseService.markNotificationAsRead: ${notificationId}`);

        try {
            const { data, error } = await this.client
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString()
                })
                .eq('notification_id', notificationId)
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.markNotificationAsRead error:', error.message);
                throw error;
            }

            console.log(`✅ Notification marked as read: ${notificationId}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in markNotificationAsRead:', error.message);
            throw error;
        }
    }

    async markAllNotificationsAsRead(userId) {
        console.log(`🔍 SupabaseService.markAllNotificationsAsRead: ${userId}`);

        try {
            const { data, error } = await this.client
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) {
                console.error('❌ SupabaseService.markAllNotificationsAsRead error:', error.message);
                throw error;
            }

            console.log(`✅ All notifications marked as read for user: ${userId}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in markAllNotificationsAsRead:', error.message);
            throw error;
        }
    }

    async deleteNotification(notificationId) {
        console.log(`🔍 SupabaseService.deleteNotification: ${notificationId}`);

        try {
            const { error } = await this.client
                .from('notifications')
                .delete()
                .eq('notification_id', notificationId);

            if (error) {
                console.error('❌ SupabaseService.deleteNotification error:', error.message);
                throw error;
            }

            console.log(`✅ Notification deleted: ${notificationId}`);
            return true;
        } catch (error) {
            console.error('❌ Exception in deleteNotification:', error.message);
            throw error;
        }
    }

    async deleteExpiredNotifications() {
        console.log('🔍 SupabaseService.deleteExpiredNotifications');

        try {
            const { error, count } = await this.client
                .from('notifications')
                .delete({ count: 'exact' })
                .lt('expires_at', new Date().toISOString());

            if (error) {
                console.error('❌ SupabaseService.deleteExpiredNotifications error:', error.message);
                throw error;
            }

            console.log(`✅ Deleted ${count} expired notifications`);
            return { deletedCount: count };
        } catch (error) {
            console.error('❌ Exception in deleteExpiredNotifications:', error.message);
            throw error;
        }
    }

    async executeRawQuery(query, params = []) {
        console.log(`🔍 SupabaseService.executeRawQuery: ${query.substring(0, 50)}...`);

        try {
            const { data, error } = await this.client.rpc('execute_sql', {
                query,
                params
            });

            if (error) {
                console.error('❌ SupabaseService.executeRawQuery error:', error.message);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('❌ Exception in executeRawQuery:', error.message);
            throw error;
        }
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    async testConnection() {
        try {
            console.log('🔍 SupabaseService.testConnection...');

            const { data, error } = await this.client
                .from('users')
                .select('count', { count: 'exact', head: true })
                .limit(1);

            if (error) {
                console.error('❌ SupabaseService.testConnection failed:', error.message);
                console.error('   Code:', error.code);
                return false;
            }

            console.log('✅ SupabaseService connection OK');
            return true;
        } catch (error) {
            console.error('❌ SupabaseService.testConnection exception:', error.message);
            return false;
        }
    }

    async getTableSchema(tableName) {
        console.log(`🔍 SupabaseService.getTableSchema: ${tableName}`);

        try {
            // Cette méthode est utile pour le débogage
            const { data, error } = await this.client
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log(`📋 Structure de la table ${tableName}:`, columns);
                return columns;
            }
            return [];
        } catch (error) {
            console.error(`❌ SupabaseService.getTableSchema error for ${tableName}:`, error.message);
            return [];
        }
    }
    // ==================== BAGAGES ====================

    async createBagage(bagageData) {
        console.log(`🔍 SupabaseService.createBagage: ${bagageData.bagage_public_id}`);

        try {
            const { data, error } = await this.client
                .from('bagages')
                .insert([bagageData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createBagage error:', error.message);
                throw error;
            }

            console.log(`✅ Bagage created: ${data.bagage_id}`);
            return data;
        } catch (error) {
            console.error('❌ Exception in createBagage:', error.message);
            throw error;
        }
    }

    async getBagagesByUser(userId) {
        console.log(`🔍 SupabaseService.getBagagesByUser: ${userId}`);

        try {
            const { data, error } = await this.client
                .from('bagages')
                .select(`
                    *,
                    reservation:reservations(
                        reservation_id, 
                        num_reza_mmt, 
                        "Type_Transport", 
                        "Lieu_depart", 
                        "Lieu_arrivee", 
                        "Date_depart", 
                        "Date_arrivee", 
                        etape_voyage
                    )
                `)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('❌ SupabaseService.getBagagesByUser error:', error.message);
                return [];
            }

            return data;
        } catch (error) {
            console.error('❌ Exception in getBagagesByUser:', error.message);
            return [];
        }
    }

    async getBagageByPublicId(publicId) {
        console.log(`🔍 SupabaseService.getBagageByPublicId: ${publicId}`);

        try {
            const { data, error } = await this.client
                .from('bagages')
                .select('*')
                .eq('bagage_public_id', publicId)
                .single();

            if (error) {
                console.error('❌ SupabaseService.getBagageByPublicId error:', error.message);
                return null;
            }

            return data;
        } catch (error) {
            console.error('❌ Exception in getBagageByPublicId:', error.message);
            return null;
        }
    }

    async getBagageById(bagageId) {
        console.log(`🔍 SupabaseService.getBagageById: ${bagageId}`);
        try {
            const { data, error } = await this.client
                .from('bagages')
                .select(`
                    *,
                    reservation:reservations(
                        reservation_id, 
                        num_reza_mmt, 
                        "Type_Transport", 
                        "Lieu_depart", 
                        "Lieu_arrivee", 
                        "Date_depart", 
                        "Date_arrivee", 
                        etape_voyage
                    )
                `)
                .eq('bagage_id', bagageId)
                .single();

            if (error) return null;
            return data;
        } catch (error) {
            return null;
        }
    }

    async updateBagageStatus(bagageId, status, location = null) {
        console.log(`🔍 SupabaseService.updateBagageStatus: ${bagageId} -> ${status}`);

        try {
            const updates = {
                status: status,
                last_event_at: new Date().toISOString()
            };
            if (location) updates.last_location = location;

            const { data, error } = await this.client
                .from('bagages')
                .update(updates)
                .eq('bagage_id', bagageId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Exception in updateBagageStatus:', error.message);
            throw error;
        }
    }

    async createBagageEvent(eventData) {
        console.log(`🔍 SupabaseService.createBagageEvent: ${eventData.event_type}`);

        try {
            const { data, error } = await this.client
                .from('bagage_events')
                .insert([eventData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Exception in createBagageEvent:', error.message);
            throw error;
        }
    }

    async getBagageTimeline(bagageId) {
        console.log(`🔍 SupabaseService.getBagageTimeline: ${bagageId}`);

        try {
            const { data, error } = await this.client
                .from('bagage_events')
                .select('*')
                .eq('bagage_id', bagageId)
                .order('scanned_at', { ascending: true });

            if (error) return [];
            return data;
        } catch (error) {
            return [];
        }
    }

    // ==================== PRISE EN CHARGE ====================

    async createPriseEnCharge(pecData) {
        console.log(`🔍 SupabaseService.createPriseEnCharge`);

        try {
            const { data, error } = await this.client
                .from('prise_en_charge')
                .insert([pecData])
                .select()
                .single();

            if (error) {
                console.error('❌ SupabaseService.createPriseEnCharge error:', error.message);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('❌ Exception in createPriseEnCharge:', error.message);
            throw error;
        }
    }
    // ==================== INCIDENTS ====================

    async createIncident(incidentData) {
        console.log(`🔍 SupabaseService.createIncident: ${incidentData.type}`);

        try {
            const { data, error } = await this.client
                .from('incidents')
                .insert([incidentData])
                .select()
                .single();

            if (error) {
                // Si la table n'existe pas encore, on log et on retourne un faux succès pour ne pas casser la prod
                console.warn('⚠️ SupabaseService.createIncident warning:', error.message);
                return { _id: 'fallback_' + Date.now(), ...incidentData };
            }
            return data;
        } catch (error) {
            console.error('❌ Exception in createIncident:', error.message);
            return { _id: 'fallback_' + Date.now(), ...incidentData };
        }
    }

    async getIncidentsByVoyage(voyageId) {
        try {
            const { data, error } = await this.client
                .from('incidents')
                .select('*')
                .eq('voyage_id', voyageId);

            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    }

    async getIncidentsByReservation(reservationId) {
        try {
            const { data, error } = await this.client
                .from('incidents')
                .select('*')
                .eq('reservation_id', reservationId);

            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    }
    async getReservationsByBookingRef(bookingRef) {
        try {
            const { data, error } = await this.client
                .from('reservations')
                .select('*')
                .eq('booking_reference', bookingRef);

            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    }

    async getReservationsByVoyageId(voyageId) {
        try {
            // voyageId can be numeric (id_voyage) or string (voyage_id_mongo / uuid)
            // We'll try query on voyage_id_mongo first as legacy code passes that
            let query = this.client.from('reservations').select('*');

            // Basic heuristics check
            if (String(voyageId).length > 10) {
                query = query.eq('voyage_id_mongo', voyageId);
            } else {
                query = query.eq('id_voyage', voyageId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    }
    async getReservationsByUser(userId) {
        try {
            const { data, error } = await this.client
                .from('reservations')
                .select('*')
                .eq('user_id', userId)
                .order('date_depart', { ascending: false }); // date_reservation field might specific, assuming date_depart or similar

            if (error) throw error;
            return data;
        } catch (error) {
            return [];
        }
    }

    async deleteVoyage(voyageId) {
        try {
            const { error } = await this.client
                .from('voyages')
                .delete()
                .eq('id_voyage', voyageId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ SupabaseService.deleteVoyage error:', error.message);
            throw error;
        }
    }

    async getReservationQR(voyageId) {
        try {
            const { data, error } = await this.client
                .from('reservations')
                .select('qr_code_data, ticket_qr_code')
                .eq('id_voyage', voyageId)
                .limit(1);

            if (error || !data || data.length === 0) return null;
            return data[0];
        } catch (error) {
            return null;
        }
    }
    // ==================== PMR MISSIONS ====================

    async createPmrMission(missionData) {
        console.log(`🔍 SupabaseService.createPmrMission`);
        try {
            const { data, error } = await this.client
                .from('pmr_missions')
                .insert([missionData])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Exception in createPmrMission:', error.message);
            throw error;
        }
    }

    async getPmrMission(reservationId) {
        try {
            const { data, error } = await this.client
                .from('pmr_missions')
                .select('*')
                .eq('reservation_id', reservationId)
                .maybeSingle(); // Use maybeSingle to avoid error if not found, returns null

            if (error) throw error;
            return data;
        } catch (error) {
            return null;
        }
    }

    async updatePmrMission(missionId, updates) {
        try {
            const { data, error } = await this.client
                .from('pmr_missions')
                .update(updates)
                .eq('id', missionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new SupabaseService();
