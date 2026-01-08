const { consumeMessages } = require('../models/kafkaConsumer');

// Contrôleur pour démarrer le consommateur Kafka
const startConsumer = async (req, res) => {
  try {
    consumeMessages(); // Démarre la consommation des messages
    res.status(200).send('Le consommateur Kafka a démarré avec succès.');
  } catch (error) {
    console.error('Erreur lors du démarrage du consommateur Kafka:', error);
    res.status(500).send('Erreur lors du démarrage du consommateur Kafka.');
  }
};

module.exports = {
  startConsumer,
};
