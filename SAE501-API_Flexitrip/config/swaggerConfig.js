const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config();

const API_PORT = process.env.PORT || 17777;
const BASE_URL = `http://localhost:${API_PORT}`; // Pour le dev local

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'API Documentation',
        version: '1.0.1',
        description: 'Documentation de l\'API pour la gestion des PMR, accompagnants, agents, et utilisateurs',
    },
    servers: [
        {
            url: BASE_URL,
            description: 'Serveur de développement'
        }
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./routes/**/*.js'], // Fichiers où Swagger va chercher les annotations pour générer la documentation
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
