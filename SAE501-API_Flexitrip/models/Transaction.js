const mongoose = require('mongoose');

// ÉTAPE 10 : Schéma Transaction pour historique wallet
const transactionSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    
    // 🆕 ÉTAPE 10 : Champs additionnels
    booking_reference: { type: String },
    voyage_id: { type: String },
    description: { type: String },
    type: { 
        type: String, 
        enum: ['booking_payment', 'refund', 'transfer', 'bonus', 'other'],
        default: 'other'
    },
    balance_before: { type: Number },
    balance_after: { type: Number }
});

module.exports = mongoose.model('Transaction', transactionSchema);
