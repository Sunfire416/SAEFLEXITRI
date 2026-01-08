const { Kafka } = require('kafkajs');

// Configuration du client Kafka
const kafka = new Kafka({
  clientId: 'flexitrip-app',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'], // connexion via le conteneur Docker
});

// Initialisation du producteur
const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connecté avec succès !');
  } catch (error) {
    console.error('Erreur de connexion du Producteur Kafka:', error);
  }
};

module.exports = {
  producer,
  connectProducer,
};
