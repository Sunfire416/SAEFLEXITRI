const { supabase } = require('../config/supabase');

async function initSupabase() {
    console.log('🔄 Initializing Supabase with sample data...');
    
    try {
        // Check if users already exist
        const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (userCount > 0) {
            console.log(`ℹ️ ${userCount} users already exist in Supabase`);
            return;
        }
        
        console.log('🌱 Creating sample users...');
        
        // Create sample PMR user
        const { data: pmrUser, error: pmrError } = await supabase.auth.admin.createUser({
            email: 'pmr@flexitrip.fr',
            password: 'Password123!',
            email_confirm: true,
            user_metadata: {
                first_name: 'Jean',
                last_name: 'Dupont',
                role: 'PMR'
            }
        });
        
        if (pmrError) {
            console.log('PMR user might already exist:', pmrError.message);
        } else {
            await supabase
                .from('users')
                .insert({
                    id: pmrUser.user.id,
                    email: 'pmr@flexitrip.fr',
                    first_name: 'Jean',
                    last_name: 'Dupont',
                    role: 'PMR',
                    wallet_balance: 1000.00,
                    pmr_assistance: true,
                    created_at: new Date().toISOString()
                });
            console.log('✅ PMR user created');
        }
        
        // Create sample Agent user
        const { data: agentUser, error: agentError } = await supabase.auth.admin.createUser({
            email: 'agent@flexitrip.fr',
            password: 'Password123!',
            email_confirm: true,
            user_metadata: {
                first_name: 'Marie',
                last_name: 'Leroy',
                role: 'Agent'
            }
        });
        
        if (agentError) {
            console.log('Agent user might already exist:', agentError.message);
        } else {
            await supabase
                .from('users')
                .insert({
                    id: agentUser.user.id,
                    email: 'agent@flexitrip.fr',
                    first_name: 'Marie',
                    last_name: 'Leroy',
                    role: 'Agent',
                    wallet_balance: 500.00,
                    pmr_assistance: false,
                    entreprise: 'Gare de Lyon',
                    created_at: new Date().toISOString()
                });
            console.log('✅ Agent user created');
        }
        
        console.log('🎉 Supabase initialization complete!');
        console.log('\n📋 Test credentials:');
        console.log('  PMR: pmr@flexitrip.fr / Password123!');
        console.log('  Agent: agent@flexitrip.fr / Password123!');
        
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
    }
}

// Run if called directly
if (require.main === module) {
    initSupabase();
}

module.exports = { initSupabase };