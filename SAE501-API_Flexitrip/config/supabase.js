const { createClient } = require('@supabase/supabase-js');

// Vérifier les variables d'environnement
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

// Initialiser le client Supabase avec service role (accès complet)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
        db: {
            schema: 'public'
        }
    }
);

// Fonction pour tester la connexion
const testConnection = async () => {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        // Test 1: Vérifier l'accès à la table users
        const { data, error } = await supabase
            .from('users')
            .select('count()', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
            return false;
        }
        
        console.log('✅ Supabase PostgreSQL connection OK');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test error:', error.message);
        return false;
    }
};

// Fonction utilitaire pour exécuter des requêtes SQL brutes
const executeSQL = async (sql, params = []) => {
    try {
        // Pour Supabase, nous devons utiliser l'API REST ou client PostgreSQL direct
        // Pour les requêtes simples, on utilise l'API REST
        if (sql.toLowerCase().includes('select')) {
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            if (error) throw error;
            return data;
        }
        
        // Pour INSERT/UPDATE/DELETE, on utilise directement les méthodes Supabase
        console.warn('⚠️ Raw SQL execution not fully supported. Use Supabase methods instead.');
        return null;
    } catch (error) {
        console.error('SQL execution error:', error);
        throw error;
    }
};

module.exports = {
    supabase,
    testConnection,
    executeSQL
};