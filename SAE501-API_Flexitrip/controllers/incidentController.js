// Incidents désactivés - MongoDB retiré du projet
const incidentDisabled = (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Incidents désactivés (Mongo retiré)'
  });
};

exports.createIncident = incidentDisabled;
exports.getActiveIncidents = incidentDisabled;
exports.getIncidentById = incidentDisabled;
exports.updateIncident = incidentDisabled;
exports.addRerouteOptions = incidentDisabled;
exports.deleteIncident = incidentDisabled;