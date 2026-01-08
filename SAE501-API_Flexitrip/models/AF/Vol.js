const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databaseAF');

const Vol = sequelize.define('Vol', {
    flight_id: {
        type: DataTypes.STRING(7),
        primaryKey: true,
        allowNull: false
    },
    company: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    available_seats: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    max_weight_suitcase: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    departure_airport_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    arrival_airport_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    departure_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    arrival_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('cancelled', 'scheduled', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled'
    },
    
    // ==========================================
    // 🆕 NOUVEAUX CHAMPS PMR
    // ==========================================
    departure_city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    arrival_city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    accessible_pmr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    pmr_services: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            ascenseurs: true,
            rampes_acces: true,
            toilettes_adaptees: true,
            assistance_embarquement: true,
            assistance_deplacement: true,
            personnel_forme: true,
            fauteuils_roulants_disponibles: true,
            espace_fauteuil_bord: true,
            signalisation_visuelle: true,
            annonces_sonores: true,
            boucle_induction: false,
            priorite_embarquement: true,
            accompagnement_animal: true,
            service_medical: false,
            menu_adapte: false
        }
    }
}, {
    tableName: 'Vol',
    timestamps: false
});

// Méthodes utiles
Vol.prototype.getDuration = function() {
    const diff = new Date(this.arrival_time) - new Date(this.departure_time);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

Vol.prototype.isPMRCompatible = function(requiredServices = []) {
    if (!this.accessible_pmr) return false;
    if (requiredServices.length === 0) return true;
    
    return requiredServices.every(service => this.pmr_services && this.pmr_services[service]);
};

module.exports = Vol;