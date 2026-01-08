const Vol = require('./Vol');
const Airports = require('./Airports');
const reservation_vol = require('./reservation_vol3');
const AgentAF = require('./AgentAF');

Vol.hasMany(reservation_vol, { foreignKey: 'id_vol' });
reservation_vol.belongsTo(Vol, { foreignKey: 'id_vol' });

module.exports = {
    Vol,
    reservation_vol,
    Airports,
    AgentAF
};
