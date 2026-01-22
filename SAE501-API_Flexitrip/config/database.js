/**
 * Configuration Database - MIGRÉ VERS SUPABASE
 * 
 * ⚠️ DEPRECATED: Sequelize/MySQL/MongoDB ne sont PLUS utilisés
 * 
 * Utiliser à la place:
 * - services/supabaseService.js pour toutes les opérations DB
 * - @supabase/supabase-js client
 */

const supabaseService = require('../services/supabaseService');

module.exports = {
    // Service centralisé Supabase
    supabase: supabaseService,
    
    // Fonction utilitaire pour tester la connexion
    async testConnection() {
        return await supabaseService.testConnection();
    }
};

