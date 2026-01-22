#!/usr/bin/env node

/**
 * Script de Test - Vérifier la migration Supabase
 * 
 * Usage:
 *   node scripts/testSupabase.js
 */

require('dotenv').config();
const supabaseService = require('../services/supabaseService');
const userService = require('../services/userService');
const voyageService = require('../services/voyageService');

async function runTests() {
    console.log('\n🧪 TESTS MIGRATION SUPABASE\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // TEST 1: Connexion Supabase
    console.log('\n1️⃣  TEST: Connexion Supabase');
    try {
        const connected = await supabaseService.testConnection();
        if (connected) {
            console.log('✅ PASS: Connexion OK');
            passed++;
        } else {
            console.log('❌ FAIL: Connexion échouée');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failed++;
    }

    // TEST 2: Créer utilisateur
    console.log('\n2️⃣  TEST: Créer utilisateur');
    let testUserId = null;
    try {
        const testUser = await userService.create({
            name: 'Test',
            surname: 'User',
            email: `test_${Date.now()}@example.com`,
            phone: '+33600000000',
            password: 'TestPassword123!',
            role: 'PMR'
        });
        testUserId = testUser.user_id;
        console.log(`✅ PASS: Utilisateur créé (${testUserId})`);
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failed++;
    }

    // TEST 3: Récupérer utilisateur
    if (testUserId) {
        console.log('\n3️⃣  TEST: Récupérer utilisateur');
        try {
            const user = await userService.findById(testUserId);
            if (user && user.user_id === testUserId) {
                console.log(`✅ PASS: Utilisateur récupéré`);
                passed++;
            } else {
                console.log('❌ FAIL: Utilisateur non trouvé');
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL: ${error.message}`);
            failed++;
        }
    }

    // TEST 4: Créer voyage
    if (testUserId) {
        console.log('\n4️⃣  TEST: Créer voyage');
        let testVoyageId = null;
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextDay = new Date(now.getTime() + 48 * 60 * 60 * 1000);

            const voyage = await voyageService.create({
                id_pmr: testUserId,
                date_debut: tomorrow.toISOString(),
                date_fin: nextDay.toISOString(),
                lieu_depart: { lat: 48.8566, lng: 2.3522, address: 'Paris' },
                lieu_arrivee: { lat: 43.2965, lng: 5.3698, address: 'Marseille' },
                prix_total: 150.00,
                status: 'planned'
            });
            testVoyageId = voyage.id_voyage;
            console.log(`✅ PASS: Voyage créé (${testVoyageId})`);
            passed++;

            // TEST 5: Récupérer voyage
            console.log('\n5️⃣  TEST: Récupérer voyage');
            try {
                const retrieved = await voyageService.findById(testVoyageId);
                if (retrieved && retrieved.id_voyage === testVoyageId) {
                    console.log(`✅ PASS: Voyage récupéré`);
                    passed++;
                } else {
                    console.log('❌ FAIL: Voyage non trouvé');
                    failed++;
                }
            } catch (error) {
                console.log(`❌ FAIL: ${error.message}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL: ${error.message}`);
            failed++;
        }
    }

    // TEST 6: Vérifier schéma
    console.log('\n6️⃣  TEST: Vérifier schéma');
    try {
        const tables = ['users', 'voyages', 'reservations', 'pmr_missions', 'transactions', 'blockchain', 'notifications'];
        let allFound = true;

        for (const table of tables) {
            const cols = await supabaseService.getTableSchema(table);
            if (!cols || cols.length === 0) {
                console.log(`  ❌ Table '${table}' - Pas trouvée`);
                allFound = false;
            } else {
                console.log(`  ✅ Table '${table}' - ${cols.length} colonnes`);
            }
        }

        if (allFound) {
            console.log('✅ PASS: Toutes les tables présentes');
            passed++;
        } else {
            console.log('⚠️ WARN: Certaines tables manquantes');
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failed++;
    }

    // RÉSUMÉ
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ DES TESTS\n');
    console.log(`✅ Réussis: ${passed}`);
    console.log(`❌ Échoués: ${failed}`);
    console.log(`📈 Taux: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 TOUS LES TESTS PASSÉS!\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ\n');
        process.exit(1);
    }
}

// Lancer les tests
runTests().catch(error => {
    console.error('❌ Erreur durant les tests:', error);
    process.exit(1);
});
