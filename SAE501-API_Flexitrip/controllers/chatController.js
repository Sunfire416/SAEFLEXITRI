const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');

const { ChatConversation, ChatMessage, PriseEnCharge } = require('../models');

const isChatEnabled = () => String(process.env.CHAT_ENABLED || '').toLowerCase() === 'true';

const ensureEnabled = (req, res) => {
    if (!isChatEnabled()) {
        res.status(404).json({ error: 'Chat désactivé' });
        return false;
    }
    return true;
};

const normalizeEtapeNumero = (value) => {
    const parsed = Number.parseInt(value ?? 1, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const canAccessConversation = (conversation, userId) => {
    if (!conversation) return false;
    return conversation.pmr_user_id === userId || conversation.agent_user_id === userId;
};

// POST /chat/conversations
// body: { reservation_id, etape_numero? }
exports.createOrGetConversation = [authenticateToken, async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    const userId = req.user?.id;
    const reservationId = Number.parseInt(req.body?.reservation_id, 10);
    const etapeNumero = normalizeEtapeNumero(req.body?.etape_numero);

    if (!userId) return res.status(401).json({ error: 'Non authentifié' });
    if (!Number.isFinite(reservationId)) return res.status(400).json({ error: 'reservation_id invalide' });

    try {
        const prise = await PriseEnCharge.findOne({
            where: {
                reservation_id: reservationId,
                etape_numero: etapeNumero,
            }
        });

        if (!prise) {
            return res.status(404).json({ error: 'Prise en charge introuvable' });
        }

        const pmrUserId = prise.user_id;
        const agentUserId = prise.validated_agent_user_id;

        // Chat autorisé uniquement après validation QR
        if (!agentUserId) {
            return res.status(403).json({ error: 'Chat indisponible avant validation' });
        }

        // Seuls PMR/Agent participants peuvent accéder
        if (userId !== pmrUserId && userId !== agentUserId) {
            return res.status(403).json({ error: 'Accès interdit' });
        }

        const [conversation] = await ChatConversation.findOrCreate({
            where: {
                reservation_id: reservationId,
                etape_numero: etapeNumero,
            },
            defaults: {
                pmr_user_id: pmrUserId,
                agent_user_id: agentUserId,
                status: 'open',
            }
        });

        // On refuse de muter une conversation existante
        if (conversation.pmr_user_id !== pmrUserId || conversation.agent_user_id !== agentUserId) {
            return res.status(409).json({ error: 'Conversation existante incompatible avec la prise en charge' });
        }

        return res.json({
            conversation_id: conversation.conversation_id,
            reservation_id: conversation.reservation_id,
            etape_numero: conversation.etape_numero,
            pmr_user_id: conversation.pmr_user_id,
            agent_user_id: conversation.agent_user_id,
            status: conversation.status,
            createdAt: conversation.createdAt,
        });
    } catch (error) {
        console.error('createOrGetConversation error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}];

// GET /chat/conversations/:conversationId
exports.getConversation = [authenticateToken, async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    const userId = req.user?.id;
    const conversationId = Number.parseInt(req.params?.conversationId, 10);

    if (!userId) return res.status(401).json({ error: 'Non authentifié' });
    if (!Number.isFinite(conversationId)) return res.status(400).json({ error: 'conversationId invalide' });

    try {
        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
        if (!canAccessConversation(conversation, userId)) return res.status(403).json({ error: 'Accès interdit' });

        return res.json({
            conversation_id: conversation.conversation_id,
            reservation_id: conversation.reservation_id,
            etape_numero: conversation.etape_numero,
            pmr_user_id: conversation.pmr_user_id,
            agent_user_id: conversation.agent_user_id,
            status: conversation.status,
            createdAt: conversation.createdAt,
        });
    } catch (error) {
        console.error('getConversation error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}];

// GET /chat/conversations/:conversationId/messages?after_message_id=&limit=
exports.listMessages = [authenticateToken, async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    const userId = req.user?.id;
    const conversationId = Number.parseInt(req.params?.conversationId, 10);
    const afterMessageId = req.query?.after_message_id ? Number.parseInt(req.query.after_message_id, 10) : null;
    const limitRaw = req.query?.limit ? Number.parseInt(req.query.limit, 10) : 50;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

    if (!userId) return res.status(401).json({ error: 'Non authentifié' });
    if (!Number.isFinite(conversationId)) return res.status(400).json({ error: 'conversationId invalide' });

    try {
        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
        if (!canAccessConversation(conversation, userId)) return res.status(403).json({ error: 'Accès interdit' });

        const where = { conversation_id: conversationId };
        if (Number.isFinite(afterMessageId)) {
            where.message_id = { [Op.gt]: afterMessageId };
        }

        const messages = await ChatMessage.findAll({
            where,
            order: [['message_id', 'ASC']],
            limit,
        });

        return res.json({
            conversation_id: conversationId,
            messages: messages.map((m) => ({
                message_id: m.message_id,
                conversation_id: m.conversation_id,
                sender_user_id: m.sender_user_id,
                message_type: m.message_type,
                content: m.content,
                createdAt: m.createdAt,
            }))
        });
    } catch (error) {
        console.error('listMessages error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}];

// POST /chat/conversations/:conversationId/messages
// body: { content }
exports.postMessage = [authenticateToken, async (req, res) => {
    if (!ensureEnabled(req, res)) return;

    const userId = req.user?.id;
    const conversationId = Number.parseInt(req.params?.conversationId, 10);
    const content = String(req.body?.content ?? '').trim();

    if (!userId) return res.status(401).json({ error: 'Non authentifié' });
    if (!Number.isFinite(conversationId)) return res.status(400).json({ error: 'conversationId invalide' });
    if (!content) return res.status(400).json({ error: 'Message vide' });
    if (content.length > 2000) return res.status(400).json({ error: 'Message trop long' });

    try {
        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
        if (!canAccessConversation(conversation, userId)) return res.status(403).json({ error: 'Accès interdit' });
        if (conversation.status !== 'open') return res.status(409).json({ error: 'Conversation fermée' });

        const message = await ChatMessage.create({
            conversation_id: conversationId,
            sender_user_id: userId,
            message_type: 'text',
            content,
        });

        return res.status(201).json({
            message_id: message.message_id,
            conversation_id: message.conversation_id,
            sender_user_id: message.sender_user_id,
            message_type: message.message_type,
            content: message.content,
            createdAt: message.createdAt,
        });
    } catch (error) {
        console.error('postMessage error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}];
