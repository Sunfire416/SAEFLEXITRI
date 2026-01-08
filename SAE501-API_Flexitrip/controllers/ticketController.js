const { Reservations, Voyage } = require('../models');
const QRCode = require('qrcode');

/**
 * Générer un billet unique multimodal pour un voyage
 * 
 * @route POST /tickets/generate
 * @body {number} id_voyage - ID du voyage
 * @body {number} user_id - ID de l'utilisateur
 */
exports.generateMultimodalTicket = async (req, res) => {
    try {
        const { id_voyage, user_id } = req.body;

        if (!id_voyage || !user_id) {
            return res.status(400).json({ 
                error: 'Paramètres manquants',
                message: 'id_voyage et user_id sont requis' 
            });
        }

        // Récupérer toutes les réservations pour ce voyage
        const reservations = await Reservations.findAll({
            where: { id_voyage, user_id },
            order: [['etape_voyage', 'ASC']]
        });

        if (reservations.length === 0) {
            return res.status(404).json({ 
                error: 'Réservations introuvables',
                message: 'Aucune réservation trouvée pour ce voyage' 
            });
        }

        // Récupérer les détails du voyage depuis MongoDB
        const voyage = await Voyage.findOne({ id_voyage });

        if (!voyage) {
            return res.status(404).json({ 
                error: 'Voyage introuvable',
                message: 'Voyage non trouvé dans la base de données' 
            });
        }

        // Construire les données du billet
        const ticketData = {
            ticket_id: `TICKET_${id_voyage}_${user_id}_${Date.now()}`,
            num_reza_mmt: reservations[0].num_reza_mmt,
            user_id: user_id,
            id_voyage: id_voyage,
            
            // Informations du voyage
            departure: voyage.lieu_depart,
            destination: voyage.lieu_arrive,
            date_debut: voyage.date_debut,
            date_fin: voyage.date_fin,
            prix_total: voyage.prix_total,
            
            // Segments du voyage
            segments: reservations.map(res => ({
                etape: res.etape_voyage,
                type_transport: res.Type_Transport,
                num_pax: res.num_pax,
                assistance_pmr: res.assistance_PMR,
                pmr_options: res.pmr_options,
                enregistre: res.enregistre
            })),
            
            // Métadonnées
            generated_at: new Date().toISOString(),
            valid: true
        };

        // Générer le QR code
        const qrCodeString = JSON.stringify(ticketData);
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2
        });

        // Mettre à jour toutes les réservations avec le QR code
        for (const reservation of reservations) {
            reservation.ticket_qr_code = qrCodeString;
            reservation.ticket_generated_at = new Date();
            reservation.ticket_status = 'generated';
            await reservation.save();
        }

        res.status(201).json({
            message: 'Billet multimodal généré avec succès',
            ticket: {
                ...ticketData,
                qr_code: qrCodeDataURL,
                qr_code_string: qrCodeString
            }
        });

    } catch (error) {
        console.error('❌ Erreur génération billet:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

/**
 * Récupérer tous les billets d'un utilisateur
 * 
 * @route GET /tickets/user/:user_id
 */
exports.getUserTickets = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Récupérer toutes les réservations de l'utilisateur
        const reservations = await Reservations.findAll({
            where: { 
                user_id,
                ticket_status: { [require('sequelize').Op.ne]: 'pending' }
            },
            order: [['ticket_generated_at', 'DESC']]
        });

        if (reservations.length === 0) {
            return res.status(200).json({
                message: 'Aucun billet trouvé',
                tickets: []
            });
        }

        // Grouper par voyage
        const ticketsByVoyage = {};
        
        for (const res of reservations) {
            if (!ticketsByVoyage[res.id_voyage]) {
                const voyage = await Voyage.findOne({ id_voyage: res.id_voyage });
                
                ticketsByVoyage[res.id_voyage] = {
                    id_voyage: res.id_voyage,
                    num_reza_mmt: res.num_reza_mmt,
                    ticket_status: res.ticket_status,
                    ticket_generated_at: res.ticket_generated_at,
                    qr_code_string: res.ticket_qr_code,
                    voyage_info: voyage ? {
                        departure: voyage.lieu_depart,
                        destination: voyage.lieu_arrive,
                        date_debut: voyage.date_debut,
                        date_fin: voyage.date_fin,
                        prix_total: voyage.prix_total
                    } : null,
                    segments: []
                };
            }
            
            ticketsByVoyage[res.id_voyage].segments.push({
                etape: res.etape_voyage,
                type_transport: res.Type_Transport,
                num_pax: res.num_pax,
                enregistre: res.enregistre
            });
        }

        const tickets = Object.values(ticketsByVoyage);

        res.status(200).json({
            message: `${tickets.length} billet(s) trouvé(s)`,
            tickets: tickets
        });

    } catch (error) {
        console.error('❌ Erreur récupération billets:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

/**
 * Récupérer un billet spécifique par ID de voyage
 * 
 * @route GET /tickets/voyage/:id_voyage
 */
exports.getTicketByVoyageId = async (req, res) => {
    try {
        const { id_voyage } = req.params;

        const reservations = await Reservations.findAll({
            where: { id_voyage },
            order: [['etape_voyage', 'ASC']]
        });

        if (reservations.length === 0) {
            return res.status(404).json({ 
                error: 'Billet introuvable',
                message: 'Aucune réservation trouvée pour ce voyage' 
            });
        }

        const voyage = await Voyage.findOne({ id_voyage });

        if (!voyage) {
            return res.status(404).json({ 
                error: 'Voyage introuvable' 
            });
        }

        // Générer le QR code en temps réel si nécessaire
        let qrCodeDataURL = null;
        if (reservations[0].ticket_qr_code) {
            qrCodeDataURL = await QRCode.toDataURL(reservations[0].ticket_qr_code, {
                errorCorrectionLevel: 'H',
                width: 300
            });
        }

        const ticket = {
            id_voyage: parseInt(id_voyage),
            num_reza_mmt: reservations[0].num_reza_mmt,
            ticket_status: reservations[0].ticket_status,
            ticket_generated_at: reservations[0].ticket_generated_at,
            qr_code: qrCodeDataURL,
            qr_code_string: reservations[0].ticket_qr_code,
            
            voyage_info: {
                departure: voyage.lieu_depart,
                destination: voyage.lieu_arrive,
                date_debut: voyage.date_debut,
                date_fin: voyage.date_fin,
                prix_total: voyage.prix_total,
                bagage: voyage.bagage
            },
            
            segments: reservations.map(res => ({
                etape: res.etape_voyage,
                type_transport: res.Type_Transport,
                num_pax: res.num_pax,
                assistance_pmr: res.assistance_PMR,
                pmr_options: res.pmr_options,
                enregistre: res.enregistre,
                date_reservation: res.date_reservation
            }))
        };

        res.status(200).json(ticket);

    } catch (error) {
        console.error('❌ Erreur récupération billet:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

/**
 * Annuler un billet
 * 
 * @route PUT /tickets/cancel/:id_voyage
 */
exports.cancelTicket = async (req, res) => {
    try {
        const { id_voyage } = req.params;
        const { user_id } = req.body;

        const reservations = await Reservations.findAll({
            where: { id_voyage, user_id }
        });

        if (reservations.length === 0) {
            return res.status(404).json({ 
                error: 'Réservations introuvables' 
            });
        }

        // Mettre à jour le statut
        for (const reservation of reservations) {
            reservation.ticket_status = 'cancelled';
            await reservation.save();
        }

        res.status(200).json({
            message: 'Billet annulé avec succès',
            id_voyage: id_voyage,
            cancelled_segments: reservations.length
        });

    } catch (error) {
        console.error('❌ Erreur annulation billet:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

/**
 * Vérifier la validité d'un QR code
 * 
 * @route POST /tickets/verify
 * @body {string} qr_code - Données du QR code
 */
exports.verifyTicket = async (req, res) => {
    try {
        const { qr_code } = req.body;

        if (!qr_code) {
            return res.status(400).json({ 
                error: 'QR code manquant' 
            });
        }

        // Parser les données du QR code
        let ticketData;
        try {
            ticketData = JSON.parse(qr_code);
        } catch (parseError) {
            return res.status(400).json({ 
                error: 'QR code invalide',
                message: 'Format de QR code incorrect' 
            });
        }

        // Vérifier l'existence de la réservation
        const reservation = await Reservations.findOne({
            where: { 
                num_reza_mmt: ticketData.num_reza_mmt 
            }
        });

        if (!reservation) {
            return res.status(404).json({ 
                valid: false,
                error: 'Réservation introuvable' 
            });
        }

        // Vérifier le statut
        if (reservation.ticket_status === 'cancelled') {
            return res.status(200).json({ 
                valid: false,
                reason: 'Billet annulé' 
            });
        }

        if (reservation.ticket_status === 'used') {
            return res.status(200).json({ 
                valid: false,
                reason: 'Billet déjà utilisé' 
            });
        }

        res.status(200).json({
            valid: true,
            ticket_status: reservation.ticket_status,
            ticket_data: ticketData,
            message: 'Billet valide'
        });

    } catch (error) {
        console.error('❌ Erreur vérification billet:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
};

module.exports = exports;
