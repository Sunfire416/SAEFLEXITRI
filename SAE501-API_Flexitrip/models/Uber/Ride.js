const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseUBER');

/**
 * Modèle Ride - UBER/Taxi
 * Enrichi avec support PMR complet
 */
const Ride = sequelize.define('Ride', {
    Ride_Id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identifiant unique du trajet'
    },
    adresse_1: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Adresse de départ'
    },
    adresse_2: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Adresse d\'arrivée'
    },
    departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Heure de départ prévue'
    },
    arrival_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Heure d\'arrivée estimée'
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Prévu',
        comment: 'Statut du trajet (Prévu, En cours, Terminé, Annulé)'
    },
    company: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Uber',
        comment: 'Compagnie de taxi/VTC'
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 50.0,
        validate: {
            min: 0
        },
        comment: 'Prix estimé du trajet en euros'
    },
    
    // ==========================================
    // NOUVEAUX CHAMPS PMR
    // ==========================================
    accessible_pmr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Véhicule accessible PMR (rampe, espace fauteuil)'
    },
    pmr_vehicle_type: {
        type: DataTypes.ENUM('standard', 'wheelchair', 'assisted'),
        allowNull: false,
        defaultValue: 'standard',
        comment: 'Type de véhicule : standard, fauteuil roulant, assistance'
    },
    pmr_services: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            // Équipements véhicule
            rampe_acces: false,
            espace_fauteuil: false,
            sangle_fixation: false,
            porte_coulissante: false,
            
            // Assistance chauffeur
            aide_transfert: false,
            aide_bagages: false,
            chauffeur_forme_pmr: false,
            
            // Confort
            climatisation: true,
            siege_inclinable: false,
            barre_appui: false,
            
            // Communication
            application_accessible: true,
            communication_visuelle: false,
            
            // Extras
            accompagnement_animal: true,
            temps_supplementaire: false
        },
        comment: 'Services PMR disponibles (JSON structuré)'
    },
    departure_city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ville de départ (extraite de adresse_1)'
    },
    arrival_city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ville d\'arrivée (extraite de adresse_2)'
    },
    vehicle_capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 4,
        comment: 'Capacité du véhicule (nombre de passagers)'
    }
}, {
    tableName: 'Ride',
    timestamps: false,
    indexes: [
        {
            name: 'idx_departure_time_ride',
            fields: ['departure_time']
        },
        {
            name: 'idx_pmr_accessible_ride',
            fields: ['accessible_pmr']
        },
        {
            name: 'idx_pmr_vehicle_type',
            fields: ['pmr_vehicle_type']
        },
        {
            name: 'idx_cities_ride',
            fields: ['departure_city', 'arrival_city']
        }
    ]
});

/**
 * Méthode helper pour calculer la durée du trajet
 */
Ride.prototype.getDuration = function() {
    const departure = new Date(this.departure_time);
    const arrival = new Date(this.arrival_time);
    const durationMs = arrival - departure;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
};

/**
 * Méthode helper pour vérifier compatibilité PMR
 */
Ride.prototype.isPMRCompatible = function(requiredServices = []) {
    if (!this.accessible_pmr) return false;
    
    if (requiredServices.length === 0) return true;
    
    return requiredServices.every(service => 
        this.pmr_services && this.pmr_services[service] === true
    );
};

/**
 * Méthode helper pour estimer le prix selon la distance
 * (Basé sur une estimation simple : 2€/km + 5€ de prise en charge)
 */
Ride.prototype.estimatePrice = function(distanceKm = 10) {
    const basePrice = 5; // Prise en charge
    const pricePerKm = 2;
    let total = basePrice + (distanceKm * pricePerKm);
    
    // Supplément PMR si applicable
    if (this.accessible_pmr && this.pmr_vehicle_type === 'wheelchair') {
        total += 10; // Supplément véhicule adapté
    }
    
    return Math.round(total * 100) / 100;
};

module.exports = Ride;
