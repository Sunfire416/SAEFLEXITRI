const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modèle User - Gestion des profils utilisateurs
 * Conforme au cahier des charges : Point 1 - Gestion des profils utilisateurs
 */
const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // ==========================================
    // INFORMATIONS PERSONNELLES
    // ==========================================
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nom de famille'
    },
    surname: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Prénom'
    },
    date_naissance: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Date de naissance (format YYYY-MM-DD)'
    },
    nationalite: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Nationalité du voyageur'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        },
        comment: 'Email unique'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Numéro de téléphone'
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Adresse complète'
    },

    // ==========================================
    // COMPTE ET SÉCURITÉ
    // ==========================================
    role: {
        type: DataTypes.ENUM('PMR', 'Accompagnant', 'Agent'),
        allowNull: false,
        comment: 'Rôle de l\'utilisateur'
    },
    // ==========================================
    // AGENT PMR - IDENTITÉ QR
    // ==========================================
    agent_qr_public_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
        comment: 'Identifiant public (QR) pour les comptes Agent (nullable)'
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Mot de passe hashé (bcrypt)'
    },

    // ==========================================
    // INFORMATIONS PMR
    // ==========================================
    type_handicap: {
        type: DataTypes.ENUM(
            'Fauteuil roulant manuel',
            'Fauteuil roulant électrique',
            'Déficience visuelle',
            'Déficience auditive',
            'Mobilité réduite',
            'Déficience cognitive',
            'Autre',
            'Aucun'
        ),
        allowNull: true,
        defaultValue: 'Aucun',
        comment: 'Type de handicap principal'
    },
    besoins_specifiques: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Besoins spécifiques détaillés (JSON)'
    },

    // ==========================================
    // PROFIL PMR DÉTAILLÉ
    // ==========================================
    pmr_profile: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            mobility_aid: 'none', // wheelchair, cane, walker, none
            wheelchair_type: null, // manual, electric
            visual_impairment: false,
            hearing_impairment: false,
            cognitive_assistance_needed: false,
            service_dog: false,
            preferred_seat: 'aisle', // aisle, window, first_row
            assistance_level: 'partial', // full, partial, minimal
            language_preference: 'fr', // fr, en, es
            emergency_contact: {
                name: '',
                phone: '',
                relationship: ''
            },
            medical_info: '',
            special_equipment_needed: [] // rampe, fauteuil_transfert, oxygen, etc.
        },
        comment: 'Profil PMR complet pour assistance personnalisée'
    },

    // ==========================================
    // WALLET
    // ==========================================
    solde: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 700.0,
        comment: 'Solde du portefeuille (points)'
    }
}, {
    tableName: 'User',
    timestamps: false,
    indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['agent_qr_public_id'] }
    ]
});

/**
 * Méthode helper pour calculer l'âge à partir de la date de naissance
 */
User.prototype.getAge = function() {
    if (!this.date_naissance) return null;
    const today = new Date();
    const birthDate = new Date(this.date_naissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Méthode helper pour vérifier si l'utilisateur est PMR
 */
User.prototype.isPMR = function() {
    return this.role === 'PMR';
};

/**
 * Méthode helper pour obtenir les besoins spécifiques actifs
 */
User.prototype.getActiveBesoins = function() {
    if (!this.besoins_specifiques) return [];
    return Object.entries(this.besoins_specifiques)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
};

module.exports = User;