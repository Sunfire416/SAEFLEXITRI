const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simulation de SupabaseService si l'import échoue (au cas où)
// Mais on va essayer d'importer le vrai service
const SupabaseService = require('../services/SupabaseService');

async function runMigration() {
    console.log('🚀 Démarrage de la migration SQL...');

    const migrationPath = path.join(__dirname, '../db/migrations/01_sync_blockchain.sql');

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📂 Lecture du fichier: ${migrationPath}`);

        // On sépare le fichier s'il y a plusieurs commandes, mais executeRawQuery gère généralement tout le bloc
        // Supabase RPC 'execute_sql' prend une string query.

        console.log('📡 Envoi de la requête au serveur...');
        await SupabaseService.executeRawQuery(sql);

        console.log('✅ Migration appliquée avec succès !');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

runMigration();
