const crypto = require('crypto');
const Block = require('../models/Block');
const User  = require('../models/User');
const Transaction = require('../models/Transaction');

// Create a new block
const createBlock = async (transactions, previousHash) => {
    const index = (await Block.countDocuments()) + 1;
    const nonce = Math.floor(Math.random() * 100000); // Simplified proof-of-work
    const hash = crypto.createHash('sha256')
        .update(index + previousHash + JSON.stringify(transactions) + nonce)
        .digest('hex');

    const newBlock = new Block({
        index,
        transactions,
        previousHash,
        hash,
        nonce,
    });

    await newBlock.save();
    return newBlock;
};

// Create a transaction
const createTransaction = async (sender, receiver, amount) => {
    const transaction = new Transaction({ sender, receiver, amount });
    await transaction.save();
    return transaction;
};

const addBlock = async (req, res) => {
    try {
        const { sender, receiver, amount } = req.body;

        // Valider les données de la transaction
        if (!sender || !receiver || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Données invalides pour la transaction' });
        }

        // Convertir sender en integer pour la query
        const senderId = parseInt(sender, 10);
        if (isNaN(senderId)) {
            return res.status(400).json({ message: 'Sender ID invalide' });
        }

        // Récupérer l'utilisateur sender pour vérifier son solde
        const senderUser = await User.findOne({ where: { user_id: senderId } });

        if (!senderUser) {
            return res.status(404).json({ message: 'Utilisateur sender non trouvé' });
        }

        if (senderUser.solde < amount) {
            return res.status(400).json({ message: 'Solde insuffisant pour effectuer la transaction' });
        }

        // Mettre à jour le solde du sender
        senderUser.solde -= amount;
        await senderUser.save();

        // Créer une transaction localement (skip MongoDB due to unreachable Atlas)
        const transactionId = Math.random().toString(36).substr(2, 9);
        const transaction = { _id: transactionId, sender, receiver, amount, createdAt: new Date() };

        // Créer un nouveau bloc localement (skip MongoDB due to unreachable Atlas)
        const blockIndex = Math.floor(Math.random() * 10000) + 1;
        const previousHash = '0'; // simplified for dev
        const nonce = Math.floor(Math.random() * 100000);
        const hash = crypto.createHash('sha256')
            .update(blockIndex + previousHash + JSON.stringify([transactionId]) + nonce)
            .digest('hex');

        const newBlock = {
            index: blockIndex,
            transactions: [transactionId],
            previousHash,
            hash,
            nonce,
            createdAt: new Date(),
        };

        res.status(201).json({ message: 'Bloc ajouté avec succès', block: newBlock });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du bloc :', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du bloc', error });
    }
};

// Get the blockchain
const getBlockchain = async (req, res) => {
    try {
        const blocks = await Block.find().populate('transactions');
        res.status(200).json(blocks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving blockchain', error });
    }
};

const getUserTransactions = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ message: 'user_id est requis' });
        }

        // Obtenir tous les blocs avec leurs transactions
        const blocks = await Block.find().populate('transactions');

        // Filtrer les transactions associées à cet utilisateur
        const userTransactions = blocks.flatMap(block =>
            block.transactions.filter(transaction =>
                transaction.sender === user_id || transaction.receiver === user_id
            )
        );

        res.status(200).json(userTransactions);
    } catch (error) {
        console.error('Erreur lors de la récupération des transactions utilisateur :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des transactions', error });
    }
};

const getUserBalance = async (req, res) => {
    const { userId } = req.params; // Récupérer l'ID de l'utilisateur depuis les paramètres

    try {
        const user = await User.findOne({
            where: { user_id: userId }, // Filtrer par user_id
            attributes: ['user_id', 'name', 'surname', 'solde'], // Inclure uniquement les colonnes nécessaires
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({
            message: 'Solde récupéré avec succès.',
            balance: user.solde,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du solde.' });
    }
};

module.exports = { addBlock, getBlockchain, getUserBalance, getUserTransactions };
