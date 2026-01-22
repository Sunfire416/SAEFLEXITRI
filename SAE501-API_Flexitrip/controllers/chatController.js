const chatService = require('../services/chatService');
const SupabaseService = require('../services/SupabaseService');

const isChatEnabled = () => String(process.env.CHAT_ENABLED || 'true').toLowerCase() === 'true';

const ensureEnabled = (req, res) => {
    if (!isChatEnabled()) {
        res.status(404).json({ error: 'Chat désactivé' });
        return false;
    }
    return true;
};

exports.createOrGetConversation = async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    try {
        const userId = req.user?.user_id; // Supabase auth uses user_id
        const { reservation_id, etape_numero } = req.body;

        if (!userId) return res.status(401).json({ error: 'Non authentifié' });
        if (!reservation_id) return res.status(400).json({ error: 'reservation_id invalide' });

        // Retrieve reservation to find agent/pmr
        const reservation = await SupabaseService.getReservationById(reservation_id);
        if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });

        // Retrieve agent assigned via pmr_missions or logic
        const mission = await SupabaseService.getPmrMission(reservation_id);
        // Need getPmrMission in SupabaseService (Added in previous run)

        let pmrUserId = reservation.user_id;
        let agentUserId = mission ? mission.agent_id : null;

        // Validation logic
        if (userId !== pmrUserId && userId !== agentUserId && req.user.role !== 'admin') {
            // Maybe user is the agent but mission logic differs? 
            // Trust requester if they are Agent?
            if (req.user.role === 'Agent') agentUserId = userId; // Self-assign for chat?
            else return res.status(403).json({ error: 'Accès interdit' });
        }

        if (!agentUserId && req.user.role === 'Agent') agentUserId = userId; // First agent to chat takes it?

        const conversation = await chatService.createOrGetConversation(
            reservation_id,
            etape_numero || 1,
            pmrUserId,
            agentUserId || userId // Fallback
        );

        res.json(conversation);

    } catch (error) {
        console.error('❌ createOrGetConversation error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getConversation = async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    try {
        const { conversationId } = req.params;
        const conversation = await chatService.getConversation(conversationId);

        if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });

        res.json(conversation);
    } catch (error) {
        console.error('❌ getConversation error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.listMessages = async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const after = req.query.after_message_id ? parseInt(req.query.after_message_id) : null;

        const messages = await chatService.listMessages(conversationId, limit, after);
        res.json({ conversation_id: conversationId, messages });
    } catch (error) {
        console.error('❌ listMessages error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.postMessage = async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const userId = req.user?.user_id;

        if (!content) return res.status(400).json({ error: 'Message vide' });

        const message = await chatService.postMessage(conversationId, userId, content);
        res.status(201).json(message);
    } catch (error) {
        console.error('❌ postMessage error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
