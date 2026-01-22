/**
 * Models Index - MIGRÉ VERS SUPABASE
 * ===================================
 * 
 * ⚠️ DEPRECATED: Les modèles Sequelize ne sont PLUS utilisés
 * 
 * À la place, utiliser:
 * - services/supabaseService.js pour tous les accès DB
 * - types/supabase.types.ts pour les interfaces TypeScript
 * 
 * Les associations Sequelize ci-dessous sont conservées à titre de référence
 * mais NE SONT PAS UTILISÉES en production.
 * 
 * STRUCTURE SUPABASE:
 * - users (remplace User.js)
 * - voyages (remplace Voyage.js)
 * - reservations (remplace Reservations.js)
 * - pmr_missions (remplace Agent assignment)
 * - transactions (remplace Transaction.js)
 * - blockchain (ledger immuable)
 * - notifications (remplace Notification.js)
 */

// Import du service centralisé Supabase
const supabaseService = require('../services/supabaseService');

// Les anciennes dépendances Sequelize sont commentées pour documenter la migration
// const Facturation = require('./Facturation');
// const Reservations = require('./Reservations');
// const User = require('./User');
// ... autres modèles

// RÉFÉRENCES DOCUMENTAIRES SEULEMENT - Ne pas utiliser en production
const SUPABASE_TABLES = {
    users: 'Table utilisateurs (PK: user_id)',
    voyages: 'Trajets (PK: id_voyage)',
    reservations: 'Réservations (PK: reservation_id, UK: num_reza_mmt)',
    pmr_missions: 'Missions PMR/Agents (PK: id, UK: reservation_id)',
    transactions: 'Transactions wallet (PK: id)',
    blockchain: 'Ledger blockchain (PK: id, UK: hash)',
    notifications: 'Notifications (PK: notification_id)'
};

const SUPABASE_VIEWS = {
    blockchain_details: 'Blockchain avec infos utilisateur',
    reservations_completes: 'Réservations avec user et voyage',
    voyages_details: 'Voyages avec PMR et accompagnant'
};

module.exports = {
    // Service centralisé à utiliser
    supabaseService,
    
    // Documentation des tables
    SUPABASE_TABLES,
    SUPABASE_VIEWS,
    
    // Les anciens modèles Sequelize ne sont plus exportés
    // Utiliser supabaseService.create[Entity](), supabaseService.get[Entity]ById(), etc.
};

