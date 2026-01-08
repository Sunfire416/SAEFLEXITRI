/**
 * Script de seed - Données de test réalistes
 * Génère 20 vols + 15 trajets SNCF + 10 rides Uber
 * 
 * Exécution : node scripts/seedTransports.js
 */

const { Vol } = require('../models/AF');
const { Trajet } = require('../models/SNCF');
const { Ride } = require('../models/Uber');

// ==========================================
// DONNÉES VOLS AIR FRANCE (20 vols)
// ==========================================
const seedFlights = async () => {
    console.log('🛫 Génération des vols Air France...');
    
    const flights = [
        // Vols domestiques France
        {
            flight_id: 'AF7300',
            company: 'Air France',
            available_seats: 180,
            price: 120.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1, // Paris CDG
            arrival_airport_id: 2,   // Nice
            departure_time: new Date('2026-01-15T08:00:00Z'),
            arrival_time: new Date('2026-01-15T09:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Nice'
        },
        {
            flight_id: 'AF7301',
            company: 'Air France',
            available_seats: 150,
            price: 95.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 3, // Lyon
            departure_time: new Date('2026-01-15T10:00:00Z'),
            arrival_time: new Date('2026-01-15T11:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Lyon'
        },
        {
            flight_id: 'AF7302',
            company: 'Air France',
            available_seats: 200,
            price: 110.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 4, // Marseille
            departure_time: new Date('2026-01-15T12:00:00Z'),
            arrival_time: new Date('2026-01-15T13:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Marseille'
        },
        {
            flight_id: 'AF7303',
            company: 'Air France',
            available_seats: 120,
            price: 140.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 5, // Toulouse
            departure_time: new Date('2026-01-15T14:00:00Z'),
            arrival_time: new Date('2026-01-15T15:30:00Z'),
            status: 'scheduled',
            accessible_pmr: false, // Vol non accessible PMR
            departure_city: 'Paris',
            arrival_city: 'Toulouse',
            pmr_services: {
                ascenseurs: true,
                assistance_embarquement: true,
                fauteuils_roulants_disponibles: false,
                espace_fauteuil_bord: false
            }
        },
        {
            flight_id: 'AF7304',
            company: 'Air France',
            available_seats: 160,
            price: 85.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 6, // Bordeaux
            departure_time: new Date('2026-01-15T16:00:00Z'),
            arrival_time: new Date('2026-01-15T17:15:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Bordeaux'
        },
        
        // Vols européens
        {
            flight_id: 'AF1148',
            company: 'Air France',
            available_seats: 220,
            price: 180.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 10, // Barcelone
            departure_time: new Date('2026-01-16T09:00:00Z'),
            arrival_time: new Date('2026-01-16T11:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Barcelone'
        },
        {
            flight_id: 'AF1514',
            company: 'Air France',
            available_seats: 250,
            price: 220.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 11, // Madrid
            departure_time: new Date('2026-01-16T11:00:00Z'),
            arrival_time: new Date('2026-01-16T13:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Madrid'
        },
        {
            flight_id: 'AF1710',
            company: 'Air France',
            available_seats: 180,
            price: 250.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 12, // Rome
            departure_time: new Date('2026-01-16T13:00:00Z'),
            arrival_time: new Date('2026-01-16T15:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Rome'
        },
        {
            flight_id: 'AF1234',
            company: 'Air France',
            available_seats: 300,
            price: 200.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 13, // Londres
            departure_time: new Date('2026-01-16T15:00:00Z'),
            arrival_time: new Date('2026-01-16T15:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'London'
        },
        {
            flight_id: 'AF1410',
            company: 'Air France',
            available_seats: 200,
            price: 190.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 14, // Amsterdam
            departure_time: new Date('2026-01-16T17:00:00Z'),
            arrival_time: new Date('2026-01-16T18:15:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Amsterdam'
        },
        
        // Vols internationaux
        {
            flight_id: 'AF0083',
            company: 'Air France',
            available_seats: 350,
            price: 650.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 20, // New York JFK
            departure_time: new Date('2026-01-17T10:00:00Z'),
            arrival_time: new Date('2026-01-17T18:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'New York'
        },
        {
            flight_id: 'AF0065',
            company: 'Air France',
            available_seats: 280,
            price: 580.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 21, // Los Angeles
            departure_time: new Date('2026-01-17T12:00:00Z'),
            arrival_time: new Date('2026-01-17T23:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Los Angeles'
        },
        {
            flight_id: 'AF0277',
            company: 'Air France',
            available_seats: 300,
            price: 720.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 22, // Tokyo
            departure_time: new Date('2026-01-17T14:00:00Z'),
            arrival_time: new Date('2026-01-18T08:00:00Z'),
            status: 'scheduled',
            accessible_pmr: false,
            departure_city: 'Paris',
            arrival_city: 'Tokyo',
            pmr_services: {
                ascenseurs: true,
                assistance_embarquement: true,
                fauteuils_roulants_disponibles: true,
                espace_fauteuil_bord: false
            }
        },
        {
            flight_id: 'AF0112',
            company: 'Air France',
            available_seats: 250,
            price: 890.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 1,
            arrival_airport_id: 23, // Dubaï
            departure_time: new Date('2026-01-17T16:00:00Z'),
            arrival_time: new Date('2026-01-18T01:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Dubai'
        },
        
        // Vols retour
        {
            flight_id: 'AF7310',
            company: 'Air France',
            available_seats: 180,
            price: 120.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 2, // Nice
            arrival_airport_id: 1,   // Paris
            departure_time: new Date('2026-01-18T10:00:00Z'),
            arrival_time: new Date('2026-01-18T11:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Nice',
            arrival_city: 'Paris'
        },
        {
            flight_id: 'AF1149',
            company: 'Air France',
            available_seats: 220,
            price: 180.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 10, // Barcelone
            arrival_airport_id: 1,    // Paris
            departure_time: new Date('2026-01-18T14:00:00Z'),
            arrival_time: new Date('2026-01-18T16:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Barcelone',
            arrival_city: 'Paris'
        },
        {
            flight_id: 'AF7311',
            company: 'Air France',
            available_seats: 150,
            price: 95.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 3, // Lyon
            arrival_airport_id: 1,   // Paris
            departure_time: new Date('2026-01-18T16:00:00Z'),
            arrival_time: new Date('2026-01-18T17:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Lyon',
            arrival_city: 'Paris'
        },
        {
            flight_id: 'AF7312',
            company: 'Air France',
            available_seats: 200,
            price: 110.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 4, // Marseille
            arrival_airport_id: 1,   // Paris
            departure_time: new Date('2026-01-18T18:00:00Z'),
            arrival_time: new Date('2026-01-18T19:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Marseille',
            arrival_city: 'Paris'
        },
        {
            flight_id: 'AF7313',
            company: 'Air France',
            available_seats: 160,
            price: 85.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 6, // Bordeaux
            arrival_airport_id: 1,   // Paris
            departure_time: new Date('2026-01-18T20:00:00Z'),
            arrival_time: new Date('2026-01-18T21:15:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Bordeaux',
            arrival_city: 'Paris'
        },
        {
            flight_id: 'AF1235',
            company: 'Air France',
            available_seats: 300,
            price: 200.00,
            max_weight_suitcase: 23.0,
            departure_airport_id: 13, // Londres
            arrival_airport_id: 1,    // Paris
            departure_time: new Date('2026-01-19T08:00:00Z'),
            arrival_time: new Date('2026-01-19T10:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'London',
            arrival_city: 'Paris'
        }
    ];
    
    try {
        await Vol.bulkCreate(flights, { 
            ignoreDuplicates: true,
            validate: true 
        });
        console.log(`✅ ${flights.length} vols créés avec succès`);
    } catch (error) {
        console.error('❌ Erreur lors de la création des vols:', error.message);
    }
};

// ==========================================
// DONNÉES TRAJETS SNCF (15 trajets)
// ==========================================
const seedTrains = async () => {
    console.log('🚄 Génération des trajets SNCF...');
    
    const trains = [
        // TGV Paris → grandes villes
        {
            trajet_id: 'TGV6201',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 400,
            price: 85.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1, // Paris Gare de Lyon
            arrival_gare_id: 2,   // Lyon Part-Dieu
            departure_time: new Date('2026-01-15T07:00:00Z'),
            arrival_time: new Date('2026-01-15T09:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Lyon'
        },
        {
            trajet_id: 'TGV6202',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 450,
            price: 95.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 3, // Marseille Saint-Charles
            departure_time: new Date('2026-01-15T09:00:00Z'),
            arrival_time: new Date('2026-01-15T12:20:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Marseille'
        },
        {
            trajet_id: 'TGV6203',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 380,
            price: 75.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 4, // Lille Europe
            departure_time: new Date('2026-01-15T11:00:00Z'),
            arrival_time: new Date('2026-01-15T12:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Lille'
        },
        {
            trajet_id: 'TGV6204',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 420,
            price: 90.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 5, // Bordeaux Saint-Jean
            departure_time: new Date('2026-01-15T13:00:00Z'),
            arrival_time: new Date('2026-01-15T15:05:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Bordeaux'
        },
        {
            trajet_id: 'TGV6205',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 400,
            price: 88.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 6, // Strasbourg
            departure_time: new Date('2026-01-15T15:00:00Z'),
            arrival_time: new Date('2026-01-15T17:00:00Z'),
            status: 'scheduled',
            accessible_pmr: false,
            departure_city: 'Paris',
            arrival_city: 'Strasbourg'
        },
        {
            trajet_id: 'TGV6206',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 380,
            price: 82.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 7, // Nantes
            departure_time: new Date('2026-01-15T17:00:00Z'),
            arrival_time: new Date('2026-01-15T19:10:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Nantes'
        },
        {
            trajet_id: 'TGV6207',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 350,
            price: 78.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 1,
            arrival_gare_id: 8, // Rennes
            departure_time: new Date('2026-01-15T19:00:00Z'),
            arrival_time: new Date('2026-01-15T20:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Paris',
            arrival_city: 'Rennes'
        },
        
        // Trajets inter-villes
        {
            trajet_id: 'TGV6208',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 300,
            price: 65.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 2, // Lyon
            arrival_gare_id: 3,   // Marseille
            departure_time: new Date('2026-01-16T08:00:00Z'),
            arrival_time: new Date('2026-01-16T09:45:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Lyon',
            arrival_city: 'Marseille'
        },
        {
            trajet_id: 'TGV6209',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 320,
            price: 70.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 4, // Lille
            arrival_gare_id: 2,   // Lyon
            departure_time: new Date('2026-01-16T10:00:00Z'),
            arrival_time: new Date('2026-01-16T13:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Lille',
            arrival_city: 'Lyon'
        },
        
        // Trajets retour
        {
            trajet_id: 'TGV6210',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 400,
            price: 85.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 2, // Lyon
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T07:00:00Z'),
            arrival_time: new Date('2026-01-17T09:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Lyon',
            arrival_city: 'Paris'
        },
        {
            trajet_id: 'TGV6211',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 450,
            price: 95.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 3, // Marseille
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T09:00:00Z'),
            arrival_time: new Date('2026-01-17T12:20:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Marseille',
            arrival_city: 'Paris'
        },
        {
            trajet_id: 'TGV6212',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 380,
            price: 75.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 4, // Lille
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T14:00:00Z'),
            arrival_time: new Date('2026-01-17T15:00:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Lille',
            arrival_city: 'Paris'
        },
        {
            trajet_id: 'TGV6213',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 420,
            price: 90.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 5, // Bordeaux
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T16:00:00Z'),
            arrival_time: new Date('2026-01-17T18:05:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Bordeaux',
            arrival_city: 'Paris'
        },
        {
            trajet_id: 'TGV6214',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 380,
            price: 82.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 7, // Nantes
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T18:00:00Z'),
            arrival_time: new Date('2026-01-17T20:10:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Nantes',
            arrival_city: 'Paris'
        },
        {
            trajet_id: 'TGV6215',
            company: 'SNCF',
            train_type: 'TGV',
            available_seats: 350,
            price: 78.00,
            max_weight_suitcase: 30.0,
            departure_gare_id: 8, // Rennes
            arrival_gare_id: 1,   // Paris
            departure_time: new Date('2026-01-17T20:00:00Z'),
            arrival_time: new Date('2026-01-17T21:30:00Z'),
            status: 'scheduled',
            accessible_pmr: true,
            departure_city: 'Rennes',
            arrival_city: 'Paris'
        }
    ];
    
    try {
        await Trajet.bulkCreate(trains, { 
            ignoreDuplicates: true,
            validate: true 
        });
        console.log(`✅ ${trains.length} trajets SNCF créés avec succès`);
    } catch (error) {
        console.error('❌ Erreur lors de la création des trajets:', error.message);
    }
};

// ==========================================
// DONNÉES RIDES UBER (10 rides)
// ==========================================
const seedRides = async () => {
    console.log('🚕 Génération des trajets Uber...');
    
    const rides = [
        // Liaisons aéroports
        {
            adresse_1: 'Aéroport Paris Charles de Gaulle',
            adresse_2: 'Gare de Lyon, Paris',
            departure_time: new Date('2026-01-15T09:00:00Z'),
            arrival_time: new Date('2026-01-15T10:00:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 55.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'wheelchair',
            departure_city: 'Paris CDG',
            arrival_city: 'Paris',
            vehicle_capacity: 3
        },
        {
            adresse_1: 'Gare de Lyon, Paris',
            adresse_2: 'Aéroport Paris Charles de Gaulle',
            departure_time: new Date('2026-01-15T14:00:00Z'),
            arrival_time: new Date('2026-01-15T15:00:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 55.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'wheelchair',
            departure_city: 'Paris',
            arrival_city: 'Paris CDG',
            vehicle_capacity: 3
        },
        {
            adresse_1: 'Aéroport Nice Côte d\'Azur',
            adresse_2: 'Gare de Nice Ville',
            departure_time: new Date('2026-01-15T10:00:00Z'),
            arrival_time: new Date('2026-01-15T10:30:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 35.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'assisted',
            departure_city: 'Nice',
            arrival_city: 'Nice',
            vehicle_capacity: 4
        },
        {
            adresse_1: 'Aéroport Lyon Saint-Exupéry',
            adresse_2: 'Gare Lyon Part-Dieu',
            departure_time: new Date('2026-01-15T11:30:00Z'),
            arrival_time: new Date('2026-01-15T12:00:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 40.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'wheelchair',
            departure_city: 'Lyon',
            arrival_city: 'Lyon',
            vehicle_capacity: 3
        },
        {
            adresse_1: 'Gare Lyon Part-Dieu',
            adresse_2: 'Aéroport Lyon Saint-Exupéry',
            departure_time: new Date('2026-01-16T15:00:00Z'),
            arrival_time: new Date('2026-01-16T15:30:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 40.00,
            accessible_pmr: false,
            pmr_vehicle_type: 'standard',
            departure_city: 'Lyon',
            arrival_city: 'Lyon',
            vehicle_capacity: 4
        },
        {
            adresse_1: 'Aéroport Marseille Provence',
            adresse_2: 'Gare Marseille Saint-Charles',
            departure_time: new Date('2026-01-15T13:00:00Z'),
            arrival_time: new Date('2026-01-15T13:45:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 48.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'assisted',
            departure_city: 'Marseille',
            arrival_city: 'Marseille',
            vehicle_capacity: 4
        },
        
        // Liaisons intra-urbaines
        {
            adresse_1: '5 Rue de Rivoli, Paris',
            adresse_2: 'Tour Eiffel, Paris',
            departure_time: new Date('2026-01-15T16:00:00Z'),
            arrival_time: new Date('2026-01-15T16:25:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 20.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'wheelchair',
            departure_city: 'Paris',
            arrival_city: 'Paris',
            vehicle_capacity: 3
        },
        {
            adresse_1: '10 Boulevard Haussmann, Paris',
            adresse_2: 'Musée du Louvre, Paris',
            departure_time: new Date('2026-01-15T17:00:00Z'),
            arrival_time: new Date('2026-01-15T17:20:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 18.00,
            accessible_pmr: false,
            pmr_vehicle_type: 'standard',
            departure_city: 'Paris',
            arrival_city: 'Paris',
            vehicle_capacity: 4
        },
        {
            adresse_1: 'Place Bellecour, Lyon',
            adresse_2: 'Vieux Lyon',
            departure_time: new Date('2026-01-16T10:00:00Z'),
            arrival_time: new Date('2026-01-16T10:15:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 15.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'assisted',
            departure_city: 'Lyon',
            arrival_city: 'Lyon',
            vehicle_capacity: 4
        },
        {
            adresse_1: 'Vieux Port, Marseille',
            adresse_2: 'Notre-Dame de la Garde, Marseille',
            departure_time: new Date('2026-01-16T14:00:00Z'),
            arrival_time: new Date('2026-01-16T14:20:00Z'),
            status: 'Prévu',
            company: 'Uber',
            price: 16.00,
            accessible_pmr: true,
            pmr_vehicle_type: 'wheelchair',
            departure_city: 'Marseille',
            arrival_city: 'Marseille',
            vehicle_capacity: 3
        }
    ];
    
    try {
        await Ride.bulkCreate(rides, { 
            ignoreDuplicates: true,
            validate: true 
        });
        console.log(`✅ ${rides.length} trajets Uber créés avec succès`);
    } catch (error) {
        console.error('❌ Erreur lors de la création des rides:', error.message);
    }
};

// ==========================================
// EXÉCUTION DU SCRIPT
// ==========================================
const runSeed = async () => {
    console.log('🌱 Démarrage du seed des données de transport...\n');
    
    try {
        await seedFlights();
        await seedTrains();
        await seedRides();
        
        console.log('\n🎉 Seed terminé avec succès !');
        console.log('📊 Récapitulatif :');
        console.log('   - 20 vols Air France');
        console.log('   - 15 trajets SNCF');
        console.log('   - 10 trajets Uber');
        console.log('   - Total : 45 options de transport');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors du seed:', error);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    runSeed();
}

module.exports = { seedFlights, seedTrains, seedRides };
