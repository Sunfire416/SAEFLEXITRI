const Voyage = require('./../models/Voyage');

const newVoyage = {
    id_pmr: 1,
    id_accompagnant: 1,
    date_debut: new Date('2024-12-20'),
    date_fin: new Date('2024-12-25'),
    lieu_depart: {
        locomotion: 'avion',
        id: 1,
    },
    lieu_arrive: {
        locomotion: 'train',
        id: 3,
    },
    etapes: [
        { id: 'FL12345', type_Transport: 'avion', compagnie: 'Air France' },
        { id: 'TR56789', type_Transport: 'train', compagnie: 'Shinkansen' },
    ],
    prix_total: 1500.75,
};

Voyage.create(newVoyage)
    .then((voyage) => {
        console.log('Voyage créé : ', voyage);
    })
    .catch((err) => {
        console.error('Erreur lors de la création du voyage : ', err);
    });
