const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseSNCF');

/**
 * Modèle Trajet - SNCF
 * Enrichi avec support PMR complet
 */
const Trajet = sequelize.define('Trajet', {
    trajet_id: {
        type: DataTypes.STRING(7),
        primaryKey: true,
        allowNull: false,
        comment: 'Identifiant unique du trajet (ex: TGV1234)'
    },
    company: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'SNCF',
        comment: 'Compagnie ferroviaire'
    },
    available_seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Nombre de places disponibles'
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        },
        comment: 'Prix du trajet en euros'
    },
    max_weight_suitcase: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 30.0,
        comment: 'Poids maximum bagage en kg'
    },
    departure_gare_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la gare de départ'
    },
    arrival_gare_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la gare d\'arrivée'
    },
    departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Heure de départ'
    },
    arrival_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Heure d\'arrivée'
    },
    status: {
        type: DataTypes.ENUM('cancelled', 'scheduled', 'completed', 'delayed'),
        allowNull: false,
        defaultValue: 'scheduled',
        comment: 'Statut du trajet'
    },
    
    // ==========================================
    // NOUVEAUX CHAMPS PMR
    // ==========================================
    accessible_pmr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Trajet accessible aux PMR (normes SNCF)'
    },
    pmr_services: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            // Accessibilité gare
            ascenseurs: true,
            rampes_acces: true,
            portes_automatiques: true,
            toilettes_adaptees: true,
            
            // Assistance humaine
            assistance_embarquement: true,
            assistance_deplacement: true,
            personnel_forme_pmr: true,
            service_acceo: true,  // Service SNCF dédié PMR
            
            // Équipements à bord
            fauteuils_roulants_disponibles: false,
            espace_fauteuil_bord: true,
            siege_adapte: true,
            table_accessible: true,
            
            // Communication
            signalisation_visuelle: true,
            annonces_sonores: true,
            boucle_induction: true,
            
            // Extras
            priorite_embarquement: true,
            accompagnement_animal: true,
            marchepied_mobile: true
        },
        comment: 'Services PMR disponibles (JSON structuré)'
    },
    departure_city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ville de départ (pour recherche)'
    },
    arrival_city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ville d\'arrivée (pour recherche)'
    },
    train_type: {
        type: DataTypes.ENUM('TGV', 'Intercités', 'TER', 'Ouigo'),
        allowNull: true,
        defaultValue: 'TGV',
        comment: 'Type de train'
    }
}, {
    tableName: 'Trajet',
    timestamps: false,
    indexes: [
        {
            name: 'idx_departure_arrival_gare',
            fields: ['departure_gare_id', 'arrival_gare_id']
        },
        {
            name: 'idx_departure_time_trajet',
            fields: ['departure_time']
        },
        {
            name: 'idx_pmr_accessible_trajet',
            fields: ['accessible_pmr']
        },
        {
            name: 'idx_cities_trajet',
            fields: ['departure_city', 'arrival_city']
        }
    ]
});

/**
 * Méthode helper pour calculer la durée du trajet
 */
Trajet.prototype.getDuration = function() {
    const departure = new Date(this.departure_time);
    const arrival = new Date(this.arrival_time);
    const durationMs = arrival - departure;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

/**
 * Méthode helper pour vérifier compatibilité PMR
 */
Trajet.prototype.isPMRCompatible = function(requiredServices = []) {
    if (!this.accessible_pmr) return false;
    
    if (requiredServices.length === 0) return true;
    
    return requiredServices.every(service => 
        this.pmr_services && this.pmr_services[service] === true
    );
};

module.exports = Trajet;
