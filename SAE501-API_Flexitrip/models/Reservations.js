const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modèle Reservations - Table centrale
 * Enrichi avec génération de billets et options PMR détaillées
 */
const Reservations = sequelize.define('reservations', {
    reservation_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identifiant unique de la réservation'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Identifiant de l\'utilisateur'
    },
    num_reza_mmt: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Numéro de réservation multimodale unique'
    },
    num_pax: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Numéro passager pour ce segment'
    },
    enregistre: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Statut d\'enregistrement (check-in)'
    },
    assistance_PMR: {
        type: DataTypes.STRING(4),
        allowNull: true,
        comment: 'Assistance PMR demandée (Oui/Non)'
    },
    Type_Transport: {
        type: DataTypes.ENUM('train', 'taxi', 'avion', 'bus', 'multimodal'),
        allowNull: true,
        comment: 'Type de transport pour ce segment'
    },
    Facturation_Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Identifiant de la facture associée'
    },
    id_voyage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Identifiant numérique du voyage (Voyage.id_voyage) - Optionnel'
    },
    voyage_id_mongo: {
        type: DataTypes.STRING(24),
        allowNull: true,
        comment: 'ObjectId MongoDB du voyage (Voyage._id) - Lien vers collection Voyage'
    },
    enrollment_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'ID enrollment biométrique (workflows MODERATE/FULL uniquement)'
    },
    etape_voyage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Numéro de l\'étape dans le voyage (1, 2, 3...)'
    },
    date_reservation: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Date de création de la réservation'
    },
    
    // ==========================================
    // CHAMPS DE DÉTAILS DU VOYAGE
    // ==========================================
    Lieu_depart: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Lieu de départ'
    },
    Lieu_arrivee: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Lieu d\'arrivée'
    },
    Date_depart: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date et heure de départ'
    },
    Date_arrivee: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date et heure d\'arrivée'
    },
    Statut: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'PENDING',
        comment: 'Statut de la réservation'
    },
    booking_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Référence de réservation opérateur'
    },
    qr_code_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Données du QR code (JSON)'
    },
    
    // ==========================================
    // NOUVEAUX CHAMPS - OPTIONS PMR DÉTAILLÉES
    // ==========================================
    pmr_options: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Options PMR spécifiques pour ce segment',
        // Structure recommandée :
        // {
        //   espace_fauteuil: boolean,
        //   assistance_embarquement: boolean,
        //   assistance_debarquement: boolean,
        //   siege_adapte: boolean,
        //   aide_transfert: boolean,
        //   equipement_medical: boolean,
        //   chien_assistance: boolean,
        //   notes_speciales: string
        // }
    },
    
    // ==========================================
    // NOUVEAUX CHAMPS - BILLET UNIQUE
    // ==========================================
    ticket_qr_code: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Données du QR code du billet (JSON stringifié)'
    },
    ticket_generated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date de génération du billet'
    },
    ticket_status: {
        type: DataTypes.ENUM('pending', 'generated', 'used', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Statut du billet'
    }
}, {
    tableName: 'reservations',
    timestamps: false,
    indexes: [
        {
            name: 'idx_user_id',
            fields: ['user_id']
        },
        {
            name: 'idx_voyage_id',
            fields: ['id_voyage']
        },
        {
            name: 'idx_num_reza_mmt',
            fields: ['num_reza_mmt']
        },
        {
            name: 'idx_ticket_status',
            fields: ['ticket_status']
        }
    ]
});

/**
 * Méthode helper pour générer le QR code du billet
 */
Reservations.prototype.generateTicketQRCode = function(voyageData) {
    const qrData = {
        reservation_id: this.reservation_id,
        num_reza_mmt: this.num_reza_mmt,
        user_id: this.user_id,
        id_voyage: this.id_voyage,
        etape: this.etape_voyage,
        type_transport: this.Type_Transport,
        pmr_options: this.pmr_options,
        date_reservation: this.date_reservation,
        // Ajouter des données du voyage si fournies
        ...(voyageData && {
            departure: voyageData.departure,
            destination: voyageData.destination,
            departure_time: voyageData.departure_time,
            arrival_time: voyageData.arrival_time
        })
    };
    
    this.ticket_qr_code = JSON.stringify(qrData);
    this.ticket_generated_at = new Date();
    this.ticket_status = 'generated';
    
    return this.ticket_qr_code;
};

/**
 * Méthode helper pour vérifier si le billet est valide
 */
Reservations.prototype.isTicketValid = function() {
    return this.ticket_status === 'generated' && 
           this.ticket_qr_code !== null &&
           this.enregistre === false; // Pas encore utilisé
};

/**
 * Méthode helper pour marquer le billet comme utilisé
 */
Reservations.prototype.useTicket = function() {
    this.ticket_status = 'used';
    this.enregistre = true;
    return this.save();
};

/**
 * Méthode helper pour annuler le billet
 */
Reservations.prototype.cancelTicket = function() {
    this.ticket_status = 'cancelled';
    return this.save();
};

module.exports = Reservations;
