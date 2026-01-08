const { Kafka } = require('kafkajs');

// Configuration du consommateur Kafka
const kafka = new Kafka({
  clientId: 'flexitrip-app',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'], // connexion via Docker
});

const consumer = kafka.consumer({ groupId: 'pmr-notifications-group' });

// Buffer pour stocker temporairement les messages consommés
let messagesBuffer = [];

// Connexion au consommateur Kafka
const connectConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka Consumer connecté avec succès !');
  } catch (error) {
    console.error('Erreur lors de la connexion du Consumer Kafka:', error);
    throw error;
  }
};

// Fonction pour consommer les messages
const consumeMessages = async () => {
  try {
    await connectConsumer();

    // S'abonner à des sujets spécifiques
    await consumer.subscribe({ topic: 'pmr-notifications', fromBeginning: true });
    await consumer.subscribe({ topic: 'bagage-verification', fromBeginning: true });
    await consumer.subscribe({ topic: 'e-billet-verification', fromBeginning: true });

    // Consommation des messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageContent = {
          topic,
          partition,
          key: message.key?.toString() || null,
          value: message.value.toString(),
          timestamp: new Date().toISOString(),
        };

        console.log(`📩 Message reçu du topic ${topic}:`, messageContent);

        // Ajouter le message au buffer
        messagesBuffer.push(messageContent);

        // Limiter la taille du buffer
        if (messagesBuffer.length > 1000) {
          messagesBuffer.shift();
        }
      },
    });
  } catch (error) {
    console.error('Erreur lors de la consommation des messages:', error);
  }
};

// Fonction pour récupérer les messages consommés
const getConsumedMessages = () => messagesBuffer;

// Fonction pour vider le buffer
const clearMessagesBuffer = () => {
  messagesBuffer = [];
};

module.exports = {
  consumeMessages,
  getConsumedMessages,
  clearMessagesBuffer,
};