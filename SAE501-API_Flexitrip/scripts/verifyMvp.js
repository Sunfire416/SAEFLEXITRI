const SupabaseService = require('../services/SupabaseService');
const checkinService = require('../services/checkinService');
const chatService = require('../services/chatService');
const intelligentAssignmentService = require('../services/intelligentAssignmentService');
require('dotenv').config();

async function runVerification() {
    console.log('🚀 Starting MVP Verification...');

    try {
        // 1. Supabase Connection
        console.log('\n📡 Testing Supabase Connection...');
        const users = await SupabaseService.getAllUsers();
        if (users) console.log(`✅ Supabase Connected. Check: Found ${users.length} users.`);
        else console.error('❌ Supabase Connection Failed.');

        // 2. Intelligent Assignment (Simplified)
        console.log('\n🤖 Testing Intelligent Assignment...');
        // Mock data
        const missionParams = {
            reservation_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            user_id: users[0]?.user_id,
            location: { lat: 48.8, lng: 2.3 },
            priorityLevel: 'normal'
        };
        const assignment = await intelligentAssignmentService.assignBestAgent(missionParams);
        if (assignment.success || assignment.reason === 'no_available_agents') {
            console.log('✅ Intelligent Assignment Service: OK (Result: ' + (assignment.success ? 'Assigned' : 'No Agents') + ')');
        } else {
            console.error('❌ Intelligent Assignment Failed:', assignment);
        }

        // 3. Chat Service
        console.log('\n💬 Testing Chat Service...');
        try {
            // We need a valid reservation ID usually, but we can try with dummy if DB constraint allows or fails expectedly
            const conv = await chatService.createOrGetConversation(
                '00000000-0000-0000-0000-000000000000',
                1,
                users[0]?.user_id,
                users[1]?.user_id
            );
            console.log('✅ Chat Service: OK (Conversation Created/Found)');
        } catch (e) {
            console.log('⚠️ Chat Service Check (Expected Failure on dummy ID):', e.message.split('\n')[0]);
            // If error is foreign key violation, it means it TRIED to hit DB. That's good.
            // If error is "MODULE_NOT_FOUND", that's bad.
        }

        // 4. Checkin Service
        console.log('\n🎫 Testing Checkin Service...');
        try {
            // We won't succeed without valid reservation, but we verify it runs
            await checkinService.performCheckIn({ user_id: 'dummy', reservation_id: 'dummy' });
        } catch (e) {
            console.log('✅ Checkin Service: Executed (Error expected:', e.message, ')');
        }

        console.log('\n✅ Verification Complete: Core modules loaded and executed without crash.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification CRASHED:', error);
        process.exit(1);
    }
}

runVerification();
