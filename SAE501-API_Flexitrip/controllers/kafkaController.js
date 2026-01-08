const { producer } = require('../models/Kafka');
// commentaire 
// Fonction pour produire un message Kafka
const produceMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message produit sur le topic ${topic}:`, message);
  } catch (error) {
    console.error('Erreur lors de la production du message Kafka:', error);
  }
};

// Contrôleur pour la vérification des bagag
const bagageVerification = async (req, res) => {
  const { agentId, pmrId, status } = req.body;

  const message = {
    event: 'Bagage Verification',
    agentId,
    pmrId,
    status,
    timestamp: new Date().toISOString(),
  };

  await produceMessage('pmr-notifications', message);

  res.status(200).json({ success: true, message: 'Message envoyé' });
};

// Contrôleur pour la vérification des e-billets
const eBilletVerification = async (req, res) => {
  const { agentId, pmrId, status } = req.body;

  const message = {
    event: 'E-Billet Verification',
    agentId,
    pmrId,
    status,
    timestamp: new Date().toISOString(),
  };

  await produceMessage('pmr-notifications', message);

  res.status(200).json({ success: true, message: 'Message envoyé' });
};

// Contrôleur pour la reconnaissance faciale
const reconnaissanceFaciale = async (req, res) => {
  const { agentId, pmrId, success, confidence } = req.body;

  const message = {
    event: 'Reconnaissance Faciale',
    agentId,
    pmrId,
    success,
    confidence,
    timestamp: new Date().toISOString(),
  };

  await produceMessage('pmr-notifications', message);

  res.status(200).json({ success: true, message: 'Message envoyé' });
};

// Contrôleur pour le filtrage des exceptions
const filtrageException = async (req, res) => {
  const { agentId, exceptionType, description, status } = req.body;

  const message = {
    event: 'Filtrage Exception',
    agentId,
    exceptionType,
    description,
    status,
    timestamp: new Date().toISOString(),
  };

  await produceMessage('pmr-notifications', message);

  res.status(200).json({ success: true, message: 'Message envoyé' });
};

// Contrôleur pour la confirmation de dépôt
const confirmationDepot = async (req, res) => {
  const { agentId, pmrId, depotId, status } = req.body;

  const message = {
    event: 'Confirmation de Dépôt',
    agentId,
    pmrId,
    depotId,
    status,
    timestamp: new Date().toISOString(),
  };

  await produceMessage('pmr-notifications', message);

  res.status(200).json({ success: true, message: 'Message envoyé' });
};

module.exports = {
  bagageVerification,
  eBilletVerification,
  reconnaissanceFaciale,
  filtrageException,
  confirmationDepot,
};
