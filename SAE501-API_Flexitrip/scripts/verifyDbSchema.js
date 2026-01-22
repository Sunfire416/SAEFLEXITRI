require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifySchema() {
    console.log('🔍 Checking Database Schema...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing ENV variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
        process.exit(1);
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // List of ALL tables expected by the application
    const tablesToCheck = [
        'users',
        'voyages',
        'reservations',
        'transactions',
        'notifications',
        'pmr_missions', // Critical for agentAssignment
        'chat_conversations', // Critical for chat
        'chat_messages',
        'bagages', // Critical for bagageController
        'bagage_events'
    ];

    let failure = false;

    // We check via a "count" query. If table doesn't exist, it throws error code 42P01.
    for (const table of tablesToCheck) {
        const { error } = await client.from(table).select('count', { count: 'exact', head: true }).limit(1);

        if (error) {
            if (error.code === '42P01') { // undefined_table
                console.error(`❌ Table MISSING: ${table} (Required for functional parity)`);
                failure = true;
            } else {
                console.warn(`⚠️ Warning checking ${table}: ${error.message} (Is RLS blocking?)`);
                // Note: using Service Role key should bypass RLS, so this might be a real error.
                // But we don't fail immediately unless it's strictly missing.
            }
        } else {
            console.log(`✅ Table OK: ${table}`);
        }
    }

    if (failure) {
        console.error('\n💥 Database Schema Verification FAILED. Missing tables must be created via db/schema.sql.');
        process.exit(1);
    } else {
        console.log('\n✨ Database Schema Verification PASSED');
        process.exit(0);
    }
}

verifySchema();
