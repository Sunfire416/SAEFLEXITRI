const request = require('supertest');
const app = require('../app'); // Fichier contenant l'application Express
const { Airports } = require('../models/AF/Airports'); // Modèle simulé

jest.mock('../models/AF/Airports', () => ({
    Airports: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    },
}));

describe('Test des routes Aéroports', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Réinitialiser les mocks avant chaque test
    });

    it('GET /airports - devrait récupérer tous les aéroports', async () => {
        // Simulation de Airports.findAll
        Airports.findAll.mockResolvedValue([
            { id: 1, name: 'Aéroport Charles de Gaulle', city: 'Paris', country: 'France' },
            { id: 2, name: 'Aéroport Orly', city: 'Paris', country: 'France' },
        ]);

        const res = await request(app).get('/airports/getAll'); // Tester l'endpoint
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe('Aéroport Charles de Gaulle');
        expect(res.body[1].name).toBe('Aéroport Orly');
    });

    it('GET /api/airports/:id - devrait récupérer un aéroport par ID', async () => {
        // Simulation de Airports.findByPk
        Airports.findByPk.mockResolvedValue({
            id: 1,
            name: 'Aéroport Charles de Gaulle',
            city: 'Paris',
            country: 'France',
        });

        const res = await request(app).get('/airports/get/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Aéroport Charles de Gaulle');
    });

    it('POST /api/airports - devrait créer un nouvel aéroport', async () => {
        // Simulation de Airports.create
        const newAirport = {
            id: 3,
            name: 'Aéroport de Toulouse',
            city: 'Toulouse',
            country: 'France',
            iata_code: 'TLS',
            icao_code: 'LFBO',
            latitude: 43.629310,
            longitude: 1.364110,
        };
        Airports.create.mockResolvedValue(newAirport);

        const res = await request(app)
            .post('/airports/insert')
            .send(newAirport); // Envoyer les données en body

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Aéroport de Toulouse');
    });

    it('PUT /airports/update/:id - devrait mettre à jour un aéroport existant', async () => {
        const existingAirport = {
            id: 1,
            name: 'Aéroport Charles de Gaulle',
            city: 'Paris',
            country: 'France',
            save: jest.fn(), // Simuler la méthode `save` de Sequelize
        };

        Airports.findByPk.mockResolvedValue(existingAirport); // Simuler `findByPk`

        const updatedData = {
            name: 'Aéroport Roissy Charles de Gaulle',
            city: 'Roissy',
        };

        const res = await request(app)
            .put('/airports/update/1') // Appeler l'endpoint
            .send(updatedData); // Envoyer les nouvelles données

        expect(res.statusCode).toBe(200);
        expect(existingAirport.name).toBe(updatedData.name);
        expect(existingAirport.city).toBe(updatedData.city);
        expect(existingAirport.save).toHaveBeenCalled(); // Vérifier que `save` a été appelé
    });

    // Test de suppression d'un aéroport
    it('DELETE /airports/delete/:id - devrait supprimer un aéroport existant', async () => {
        const existingAirport = {
            id: 1,
            name: 'Aéroport Charles de Gaulle',
            city: 'Paris',
            destroy: jest.fn(), // Simuler la méthode `destroy` de Sequelize
        };

        Airports.findByPk.mockResolvedValue(existingAirport); // Simuler `findByPk`

        const res = await request(app).delete('/airports/delete/1');

        expect(res.statusCode).toBe(200);
        expect(existingAirport.destroy).toHaveBeenCalled(); // Vérifier que `destroy` a été appelé
    });

    // Test de suppression d'un aéroport non existant
    it('DELETE /airports/delete/:id - devrait retourner 404 si l\'aéroport n\'existe pas', async () => {
        Airports.findByPk.mockResolvedValue(null); // Simuler un aéroport non trouvé

        const res = await request(app).delete('/airports/delete/999');

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Aéroport non trouvé");
    });
});
