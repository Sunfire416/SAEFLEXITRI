/**
 * UserService - Remplace le modèle User.js Sequelize
 * 
 * Utilise supabaseService pour tous les accès à la table users
 */

const supabaseService = require('./supabaseService');
const bcrypt = require('bcrypt');

class UserService {
    /**
     * Créer un nouvel utilisateur
     */
    async create(userData) {
        const {
            name, surname, email, phone, password,
            role = 'PMR', date_naissance, nationalite, address,
            type_handicap = 'Aucun', besoins_specifiques = {},
            pmr_profile = {}, needs_assistance = false, solde = 700.00
        } = userData;

        // Hash du password
        const hashedPassword = await bcrypt.hash(password, 10);

        return supabaseService.createUser({
            name, surname, email, phone,
            password: hashedPassword,
            role, date_naissance, nationalite, address,
            type_handicap, besoins_specifiques, pmr_profile,
            needs_assistance, solde
        });
    }

    /**
     * Récupérer utilisateur par ID
     */
    async findById(userId) {
        return supabaseService.getUserById(userId);
    }

    /**
     * Récupérer utilisateur par email
     */
    async findByEmail(email) {
        return supabaseService.getUserByEmail(email);
    }

    /**
     * Mettre à jour utilisateur
     */
    async update(userId, updates) {
        // Si password est fourni, le hasher
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        return supabaseService.updateUser(userId, updates);
    }

    /**
     * Récupérer tous les utilisateurs (avec filtres optionnels)
     */
    async findAll(filters = {}) {
        return supabaseService.getAllUsers(filters);
    }

    /**
     * Récupérer tous les agents
     */
    async findAllAgents() {
        return supabaseService.getAllUsers({ role: 'Agent' });
    }

    /**
     * Récupérer tous les PMR qui ont besoin d'assistance
     */
    async findPmrNeedingAssistance() {
        return supabaseService.getAllUsers({
            role: 'PMR',
            needs_assistance: true
        });
    }

    /**
     * Vérifier un password
     */
    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    /**
     * Mettre à jour le solde (wallet)
     */
    async updateBalance(userId, amount) {
        const user = await this.findById(userId);
        const newBalance = (user.solde || 700) + amount;

        return this.update(userId, { solde: newBalance });
    }

    /**
     * Créditer le wallet
     */
    async creditWallet(userId, amount, description = '') {
        // Le trigger SQL gère la mise à jour du solde
        return supabaseService.createTransaction({
            user_id: userId,
            amount: amount,
            type: 'credit',
            payment_status: 'paid',
            description: description || 'Wallet credit'
        });
    }

    /**
     * Débiter le wallet
     */
    async debitWallet(userId, amount, description = '') {
        return supabaseService.createTransaction({
            user_id: userId,
            amount: amount,
            type: 'booking_payment',
            payment_status: 'paid',
            description: description || 'Wallet debit'
        });
    }
}

module.exports = new UserService();
