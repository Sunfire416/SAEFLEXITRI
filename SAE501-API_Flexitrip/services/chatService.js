const SupabaseService = require('./SupabaseService');

class ChatService {
    async createOrGetConversation(reservationId, etapeNumero = 1, pmrUserId, agentUserId) {
        try {
            // Check existing
            const { data: existing, error: findError } = await SupabaseService.client
                .from('chat_conversations')
                .select('*')
                .eq('reservation_id', reservationId)
                .eq('etape_numero', etapeNumero)
                .maybeSingle();

            if (existing) return existing;

            // Create new
            const { data: created, error: createError } = await SupabaseService.client
                .from('chat_conversations')
                .insert([{
                    reservation_id: reservationId,
                    etape_numero: etapeNumero,
                    pmr_user_id: pmrUserId,
                    agent_user_id: agentUserId,
                    status: 'open'
                }])
                .select()
                .single();

            if (createError) throw createError;
            return created;

        } catch (error) {
            console.error('❌ ChatService.createOrGetConversation:', error.message);
            throw error;
        }
    }

    async getConversation(conversationId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('chat_conversations')
                .select('*')
                .eq('conversation_id', conversationId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            return null;
        }
    }

    async listMessages(conversationId, limit = 50, afterMessageId = null) {
        try {
            let query = SupabaseService.client
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('message_id', { ascending: true })
                .limit(limit);

            if (afterMessageId) {
                query = query.gt('message_id', afterMessageId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ ChatService.listMessages:', error.message);
            throw error;
        }
    }

    async postMessage(conversationId, senderUserId, content) {
        try {
            const { data, error } = await SupabaseService.client
                .from('chat_messages')
                .insert([{
                    conversation_id: conversationId,
                    sender_user_id: senderUserId,
                    content: content
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ ChatService.postMessage:', error.message);
            throw error;
        }
    }
}

module.exports = new ChatService();
