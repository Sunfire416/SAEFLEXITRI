const { Biometric } = require('../models');
const mongoose = require('mongoose');

const saveBiometricData = async (req, res) => {
    try {
      const { userId, image } = req.body; // Récupère l'ID utilisateur et l'image (Base64)
  
      if (!userId || !image) {
        return res.status(400).json({ error: 'Données manquantes (userId ou image).' });
      }
  
      // Vérification et conversion de l'userId si nécessaire
      const validUserId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  
      // Enregistrer les informations dans la base MongoDB
      const newBiometric = new Biometric({
        userId: validUserId,
        image: image, // Stockage de l'image directement en base64
      });
  
      await newBiometric.save();
  
      res.status(201).json({
        message: 'Image enregistrée avec succès dans la base de données.',
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'image dans MongoDB:", error);
      res.status(500).json({ error: error.message });
    }
  };


  module.exports = { saveBiometricData };
