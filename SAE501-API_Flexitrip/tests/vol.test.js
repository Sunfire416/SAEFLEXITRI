const request = require('supertest');
const app = require('../app');  // Remplacez par le chemin de votre fichier app.js
const { Vol, Airports } = require('../models/AF');  // Remplacez par le modèle de vol dans votre app

jest.mock('../models/AF', () => ({
    Vol: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
        update: jest.fn(),
        getAllFlightsAmadeusModel: jest.fn(),
    },
    sequelize: {
        close: jest.fn(), // Mock pour fermer la connexion
    },
}));
describe('Flight Routes', () => {

    // Test pour récupérer tous les vols
    describe('GET /vol/getAll', () => {
        it('devrait retourner tous les vols', async () => {
            const mockFlights = [
                {
                    flight_id: 'ABC123',
                    company: 'Airline1',
                    available_seats: 100,
                    price: 500,
                    max_weight_suitcase: 30,
                    departure_airport_id: 1,
                    arrival_airport_id: 2,
                    departure_time: '2024-12-01T10:00:00Z',
                    arrival_time: '2024-12-01T14:00:00Z',
                    status: 'Prévu'
                },
                {
                    flight_id: 'XYZ456',
                    company: 'Airline2',
                    available_seats: 150,
                    price: 700,
                    max_weight_suitcase: 40,
                    departure_airport_id: 3,
                    arrival_airport_id: 4,
                    departure_time: '2024-12-02T11:00:00Z',
                    arrival_time: '2024-12-02T15:00:00Z',
                    status: 'Prévu'
                }
            ];

            Vol.findAll.mockResolvedValue(mockFlights);  // Simuler la récupération des vols

            const res = await request(app).get('/vol/getAll');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].flight_id).toBe('ABC123');
            expect(res.body[1].company).toBe('Airline2');
        });
    });

    // Test pour récupérer un vol par son ID
    describe('GET /vol/get/:id', () => {
        it('devrait retourner un vol par son ID', async () => {
            const mockFlight = {
                flight_id: 'ABC123',
                company: 'Airline1',
                available_seats: 100,
                price: 500,
                max_weight_suitcase: 30,
                departure_airport_id: 1,
                arrival_airport_id: 2,
                departure_time: '2024-12-01T10:00:00Z',
                arrival_time: '2024-12-01T14:00:00Z',
                status: 'Prévu'
            };

            Vol.findByPk.mockResolvedValue(mockFlight); // Simuler la récupération du vol par ID

            const res = await request(app).get('/vol/get/ABC123');

            expect(res.statusCode).toBe(200);
            expect(res.body.flight_id).toBe('ABC123');
            expect(res.body.company).toBe('Airline1');
        });
    });

    // Test pour créer un vol
    describe('POST /vol/insert', () => {
        it('devrait créer un nouveau vol', async () => {
            const newFlight = {
                flight_id: 'DEF789',
                company: 'Airline3',
                available_seats: 200,
                price: 900,
                max_weight_suitcase: 50,
                departure_airport_id: 1,
                arrival_airport_id: 2,
                departure_time: '2024-12-03T10:00:00Z',
                arrival_time: '2024-12-03T14:00:00Z',
                status: 'Prévu'
            };

            Vol.create.mockResolvedValue(newFlight); // Simuler la création du vol

            const res = await request(app)
                .post('/vol/insert')
                .send(newFlight);

            expect(res.statusCode).toBe(201);
            expect(res.body.flight_id).toBe('DEF789');
            expect(res.body.company).toBe('Airline3');
        });
    });

    // Test pour mettre à jour un vol
    describe('PUT /vol/update/:id', () => {
        it('devrait mettre à jour un vol existant', async () => {
            const updatedFlight = {
                flight_id: 'DEF789',
                company: 'Airline3 Updated',
                available_seats: 180,
                price: 850,
                max_weight_suitcase: 55,
                departure_airport_id: 1,
                arrival_airport_id: 2,
                departure_time: '2024-12-03T12:00:00Z',
                arrival_time: '2024-12-03T16:00:00Z',
                status: 'Prévu'
            };

            Vol.update.mockResolvedValue([1, [updatedFlight]]); // Simuler la mise à jour du vol

            const res = await request(app)
                .put('/vol/update/DEF789')
                .send(updatedFlight);

            expect(res.statusCode).toBe(200);
            expect(res.body.company).toBe('Airline3 Updated');
            expect(res.body.available_seats).toBe(180);
        });
    });

    // Test pour supprimer un vol
    describe('DELETE /vol/delete/:id', () => {
        it('devrait supprimer un vol', async () => {
            Vol.destroy.mockResolvedValue(1); // Simuler la suppression du vol

            const res = await request(app).delete('/vol/delete/DEF789');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Vol supprimé avec succès');
        });
    });

    // Test pour récupérer les vols au format Amadeus
    describe('GET /vol/flight-offers', () => {
        it('devrait récupérer tous les vols au format Amadeus', async () => {
            const mockOffers = [
                { flight: 'Flight1', price: 500, currency: 'USD' },
                { flight: 'Flight2', price: 700, currency: 'USD' }
            ];

            Vol.getAllFlightsAmadeusModel.mockResolvedValue(mockOffers); // Simuler la récupération des offres Amadeus

            const res = await request(app).get('/vol/flight-offers');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].flight).toBe('Flight1');
            expect(res.body[1].price).toBe(700);
        });
    });
    afterAll(async () => {
        await sequelize.close();  // Ferme la connexion à la base de données
    });

});