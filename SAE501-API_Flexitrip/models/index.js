const Facturation = require('./Facturation');
const Reservations = require('./Reservations');
const User = require('./User');
// ==========================================
// 🆕 POINT 3 - MODÈLES BIOMÉTRIQUES
// ==========================================
const BoardingPass = require('./BoardingPass');
// ==========================================
const Voyage = require('./Voyage');
const Agent = require('./Agent');
const PriseEnCharge = require('./PriseEnCharge');
// ==========================================
// 🆕 MODÈLES IA - ASSIGNATION INTELLIGENTE
// ==========================================
const AgentAvailability = require('./AgentAvailability');
const AgentSkills = require('./AgentSkills');
const Bagage = require('./Bagage');
const BagageEvent = require('./BagageEvent');
// ==========================================
// 💬 CHAT (PMR <-> Agent) - Additif
// ==========================================
const ChatConversation = require('./ChatConversation');
const ChatMessage = require('./ChatMessage');

// Associations

// User et Reservations
Reservations.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user', // Alias pour accéder à l'utilisateur depuis une réservation
});
User.hasMany(Reservations, {
    foreignKey: 'user_id',
    as: 'reservations', // Alias pour accéder aux réservations depuis un utilisateur
});

// ==========================================
// 🆕 POINT 3 - ASSOCIATIONS BOARDING PASS
// ==========================================
// BoardingPass et Reservations
BoardingPass.belongsTo(Reservations, {
    foreignKey: 'reservation_id',
    as: 'reservation'
});
Reservations.hasOne(BoardingPass, {
    foreignKey: 'reservation_id',
    as: 'boarding_pass'
});

// BoardingPass et User
BoardingPass.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});
User.hasMany(BoardingPass, {
    foreignKey: 'user_id',
    as: 'boarding_passes'
});

// ==========================================
// 🆕 ASSOCIATIONS PRISE EN CHARGE PMR
// ==========================================
// PriseEnCharge et Reservations
PriseEnCharge.belongsTo(Reservations, {
    foreignKey: 'reservation_id',
    as: 'reservation'
});
Reservations.hasOne(PriseEnCharge, {
    foreignKey: 'reservation_id',
    as: 'prise_en_charge'
});

// PriseEnCharge et User
PriseEnCharge.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});
User.hasMany(PriseEnCharge, {
    foreignKey: 'user_id',
    as: 'prises_en_charge'
});

// PriseEnCharge et Agent (optionnel)
PriseEnCharge.belongsTo(Agent, {
    foreignKey: 'agent_id',
    as: 'agent'
});
Agent.hasMany(PriseEnCharge, {
    foreignKey: 'agent_id',
    as: 'prises_en_charge'
});

// ==========================================
// 🆕 ASSOCIATIONS IA - AGENTS
// ==========================================
// Agent et AgentAvailability (1-1)
Agent.hasOne(AgentAvailability, {
    foreignKey: 'agent_id',
    as: 'availability'
});
AgentAvailability.belongsTo(Agent, {
    foreignKey: 'agent_id',
    as: 'agent'
});

// Agent et AgentSkills (1-1)
Agent.hasOne(AgentSkills, {
    foreignKey: 'agent_id',
    as: 'skills'
});
AgentSkills.belongsTo(Agent, {
    foreignKey: 'agent_id',
    as: 'agent'
});

// 🧳 ASSOCIATIONS BAGAGES (TRACKING)
// ==========================================
Bagage.belongsTo(Reservations, {
    foreignKey: 'reservation_id',
    as: 'reservation'
});
Reservations.hasMany(Bagage, {
    foreignKey: 'reservation_id',
    as: 'bagages'
});

Bagage.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});
User.hasMany(Bagage, {
    foreignKey: 'user_id',
    as: 'bagages'
});

BagageEvent.belongsTo(Bagage, {
    foreignKey: 'bagage_id',
    as: 'bagage'
});
Bagage.hasMany(BagageEvent, {
    foreignKey: 'bagage_id',
    as: 'events'
});

// ==========================================
// 💬 ASSOCIATIONS CHAT (Additif)
// ==========================================
ChatConversation.belongsTo(User, {
    foreignKey: 'pmr_user_id',
    as: 'pmr_user'
});
User.hasMany(ChatConversation, {
    foreignKey: 'pmr_user_id',
    as: 'pmr_conversations'
});

ChatConversation.belongsTo(User, {
    foreignKey: 'agent_user_id',
    as: 'agent_user'
});
User.hasMany(ChatConversation, {
    foreignKey: 'agent_user_id',
    as: 'agent_conversations'
});

ChatMessage.belongsTo(ChatConversation, {
    foreignKey: 'conversation_id',
    as: 'conversation'
});
ChatConversation.hasMany(ChatMessage, {
    foreignKey: 'conversation_id',
    as: 'messages'
});

ChatMessage.belongsTo(User, {
    foreignKey: 'sender_user_id',
    as: 'sender'
});
User.hasMany(ChatMessage, {
    foreignKey: 'sender_user_id',
    as: 'sent_messages'
});

module.exports = {
    Facturation,
    Agent,
    Reservations,
    User,
    // ==========================================
    // 🆕 POINT 3 - EXPORTS MODÈLES BIOMÉTRIQUES
    // ==========================================
    BoardingPass,
    // ==========================================
    PriseEnCharge,
    Bagage,
    BagageEvent,
    ChatConversation,
    ChatMessage,
    Voyage,
    // ==========================================
    // 🆕 EXPORTS MODÈLES IA - ASSIGNATION INTELLIGENTE
    // ==========================================
    AgentAvailability,
    AgentSkills,
};
