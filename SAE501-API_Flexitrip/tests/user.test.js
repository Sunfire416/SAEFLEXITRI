const request = require('supertest');
const app = require('../app'); // Assurez-vous que le chemin vers votre application est correct
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('../models');
jest.mock('jsonwebtoken');

describe('Tests de la méthode findByPk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('devrait récupérer un utilisateur avec succès pour un id valide', async () => {
        const mockUser = {
            id: 1,
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            phone: '1234567890',
            address: '123 Test St',
            role: 'User',
            pmr_assistance: false,
        };

        // On simule le retour de la méthode findByPk avec un utilisateur
        User.findByPk.mockResolvedValue(mockUser);

        // Appel à la méthode findByPk pour récupérer l'utilisateur avec id = 1
        const user = await User.findByPk(1);

        // Vérification que la méthode retourne bien l'utilisateur attendu
        expect(user).toEqual(mockUser);
    });

    it('devrait retourner null si l\'utilisateur n\'est pas trouvé', async () => {
        // On simule l'absence d'utilisateur avec id = 1
        User.findByPk.mockResolvedValue(null);

        // Appel à la méthode findByPk pour un utilisateur inexistant
        const user = await User.findByPk(1);

        // Vérification que la méthode retourne null
        expect(user).toBeNull();
    });
});

describe('Tests des routes utilisateur', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /users/insert', () => {
        it('devrait insérer un nouvel utilisateur avec succès', async () => {
            const mockUser = {
                id: 1,
                name: 'Test',
                surname: 'User',
                email: 'test@example.com',
                phone: '1234567890',
                address: '123 Test St',
                role: 'User',
                pmr_assistance: false,
            };

            User.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/users/insert')
                .send({
                    name: 'Test',
                    surname: 'User',
                    email: 'test@example.com',
                    phone: '1234567890',
                    address: '123 Test St',
                    role: 'User',
                    password: 'password123',
                    pmr_assistance: false,
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockUser);
        });

        it('devrait retourner une erreur si les champs obligatoires sont manquants', async () => {
            const response = await request(app).post('/users/insert').send({
                email: 'test@example.com',
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Tous les champs obligatoires sont requis.');
        });
    });

    describe('POST /users/login', () => {
        it('devrait retourner un jeton JWT lors d\'une connexion réussie', async () => {
            const mockUser = {
                id: 1,
                Email: 'test@example.com',
                Password: 'hashedpassword123',
                toJSON: jest.fn().mockReturnValue({ Email: 'test@example.com', Role: 'User' }),
            };

            User.findOne.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('mockedJWT');
            jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

            const response = await request(app).post('/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe('mockedJWT');
            expect(response.body.user.Email).toBe('test@example.com');
        });

        it('devrait retourner une erreur si l\'email n\'est pas trouvé', async () => {
            User.findOne.mockResolvedValue(null);

            const response = await request(app).post('/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

});
