const { User, Voyage } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

/**
 * ==========================================
 * AUTHENTIFICATION
 * ==========================================
 */

/**
 * Connexion utilisateur
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mot de passe invalide' });
        }

        const token = jwt.sign({ id: user.user_id }, JWT_SECRET, { expiresIn: '24h' });

        // Sauvegarder en session
        req.session.user = {
            id: user.user_id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role
        };

        // Retourner les données sans le mot de passe
        const userWithoutPassword = { ...user.toJSON() };
        delete userWithoutPassword.password;

        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        console.error('Erreur lors de la connexion:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
};

/**
 * Déconnexion utilisateur
 */
exports.logoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Échec de la déconnexion' });
            }
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Déconnexion réussie' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

/**
 * ==========================================
 * INSCRIPTION
 * ==========================================
 */

/**
 * Inscription utilisateur (PMR ou Accompagnant)
 */
exports.insertUser = async (req, res) => {
    const {
        name,
        surname,
        date_naissance,
        nationalite,
        email,
        phone,
        address,
        role,
        password,
        type_handicap,
        besoins_specifiques
    } = req.body;

    // Validation des champs obligatoires
    if (!name || !surname || !email || !phone || !role || !password) {
        return res.status(400).json({
            error: 'Les champs suivants sont obligatoires : nom, prénom, email, téléphone, rôle, mot de passe'
        });
    }

    try {
        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Préparation des données
        const userData = {
            name,
            surname,
            date_naissance: date_naissance || null,
            nationalite: nationalite || null,
            email,
            phone,
            address: address || null,
            role,
            password: hashedPassword,
            type_handicap: role === 'PMR' ? (type_handicap || 'Aucun') : 'Aucun',
            besoins_specifiques: role === 'PMR' ? (besoins_specifiques || {}) : {}
        };

        // Création de l'utilisateur
        const newUser = await User.create(userData);

        // Retourner sans le mot de passe
        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;

        res.status(201).json({
            message: 'Compte créé avec succès',
            user: userResponse
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
};

/**
 * Inscription agent
 */
exports.insertAgent = async (req, res) => {
    const { name, surname, email, phone, address, password } = req.body;

    if (!name || !surname || !email || !phone || !password) {
        return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAgent = await User.create({
            name,
            surname,
            email,
            phone,
            address: address || null,
            role: 'Agent',
            password: hashedPassword,
            type_handicap: 'Aucun',
            besoins_specifiques: {}
        });

        const agentResponse = { ...newAgent.toJSON() };
        delete agentResponse.password;

        res.status(201).json({
            message: 'Agent créé avec succès',
            agent: agentResponse
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'agent:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        res.status(500).json({ error: 'Erreur lors de la création de l\'agent' });
    }
};

/**
 * ==========================================
 * GESTION DES UTILISATEURS (CRUD)
 * ==========================================
 */

/**
 * Récupérer tous les utilisateurs
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupérer un utilisateur par ID
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { user_id: req.params.id },
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Ajouter l'âge calculé
        const userResponse = user.toJSON();
        userResponse.age = user.getAge();

        res.status(200).json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mettre à jour un utilisateur
 */
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        // Si le mot de passe est présent, le hacher
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Mise à jour
        await user.update(updates);

        // Retourner sans le mot de passe
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Supprimer un utilisateur
 */
exports.deleteUser = async (req, res) => {
    try {
        const deleted = await User.destroy({
            where: { user_id: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ==========================================
 * FILTRES PAR RÔLE
 * ==========================================
 */

/**
 * Récupérer tous les PMR
 */
exports.getUserWithPMRRole = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: 'PMR' },
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupérer tous les Accompagnants
 */
exports.getUserWithAccompagnantRole = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: 'Accompagnant' },
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ==========================================
 * VOYAGE
 * ==========================================
 */

/**
 * Récupérer les voyages d'un PMR
 */
exports.getVoyageWithIdPMR = async (req, res) => {
    const { idPMR } = req.params;
    
    try {
        const voyage = await Voyage.findOne({ id_pmr: idPMR });

        if (!voyage) {
            return res.status(404).json({ error: 'Voyage non trouvé pour cet ID PMR' });
        }

        res.status(200).json(voyage);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: `Erreur lors de la récupération du voyage : ${error.message}`
        });
    }
};