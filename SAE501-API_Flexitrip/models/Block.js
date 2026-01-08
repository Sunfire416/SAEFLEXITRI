const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    index: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    previousHash: { type: String, required: true },
    hash: { type: String, required: true },
    nonce: { type: Number, required: true },
});

module.exports = mongoose.model('Block', blockSchema);
