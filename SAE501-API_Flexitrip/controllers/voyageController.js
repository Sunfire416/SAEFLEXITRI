const SupabaseService = require('../services/SupabaseService');
const Neo4jService = require('../services/neo4jService');
const { v4: uuidv4, validate: validateUuid } = require('uuid');

class VoyageController {
  /**
   * Créer un nouveau voyage multimodal
   */
  async createVoyage(req, res) {
    try {
      const {
        user_id,
        id_pmr,
        id_accompagnant,
        etapes = [],
        pmr_options = {},
        notes = ''
      } = req.body;

      // Validation basique
      if (!etapes || etapes.length === 0) {
        return res.status(400).json({
          error: 'Au moins une étape est requise'
        });
      }

      // 1. Validation de l'ID Utilisateur
      const finalUserId = req.user?.user_id || user_id || id_pmr;

      if (!validateUuid(finalUserId)) {
        console.error(`❌ ID Utilisateur invalide détecté: ${finalUserId}`);
        return res.status(400).json({
          error: "Format user_id invalide (UUID attendu)",
          details: `ID reçu: "${finalUserId}" doit être un UUID valide`
        });
      }

      const voyageId = uuidv4();
      const reservationNum = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 2. Récupérer les informations des stations depuis Neo4j (Parallélisé)
      // On utilise Promise.all pour accélérer le traitement
      const stationsPromises = etapes.map(async (etape) => {
        if (etape.type === 'transport' && etape.station_start && etape.station_end) {
          try {
            const [startStation, endStation] = await Promise.all([
              Neo4jService.getStationById(etape.station_start).catch(e => null),
              Neo4jService.getStationById(etape.station_end).catch(e => null)
            ]);

            if (!startStation || !endStation) {
              return {
                type: 'transport',
                etape_data: etape,
                price: etape.price || 0,
                start_station: { name: etape.adresse_1 || 'Départ' },
                end_station: { name: etape.adresse_2 || 'Arrivée' },
                route: null,
                date_depart: etape.departure_time ? new Date(etape.departure_time) : null,
                date_arrivee: etape.arrival_time ? new Date(etape.arrival_time) : null
              };
            }

            let route = null;
            try {
              route = await Neo4jService.findOptimalRoute(
                etape.station_start,
                etape.station_end,
                {
                  requireAccessibility: pmr_options?.accessibility_required || true,
                  maxTransfers: 3
                }
              );
            } catch (neoError) {
              console.warn(`⚠️ Neo4j route error: ${neoError.message}`);
              route = {
                total_duration: etape.duration || 60,
                estimated_price: etape.price || 0,
                stations: []
              };
            }

            return {
              type: 'transport',
              start_station: startStation,
              end_station: endStation,
              route: route,
              etape_data: etape,
              price: route?.estimated_price || etape.price || 0,
              date_depart: etape.departure_time ? new Date(etape.departure_time) : null,
              date_arrivee: etape.arrival_time ? new Date(etape.arrival_time) : null
            };

          } catch (error) {
            // Fallback complet
            return {
              type: 'transport',
              etape_data: etape,
              price: etape.price || 0,
              start_station: { name: etape.adresse_1 || 'Départ' },
              end_station: { name: etape.adresse_2 || 'Arrivée' },
              date_depart: etape.departure_time ? new Date(etape.departure_time) : null,
              date_arrivee: etape.arrival_time ? new Date(etape.arrival_time) : null
            };
          }
        } else {
          // Taxi ou autre
          let price = etape.price || 0;
          if (etape.type === 'taxi') price = etape.price || 15;

          return {
            type: etape.type || 'transport',
            etape_data: etape,
            price: price,
            start_station: { name: etape.adresse_1 || 'Départ' },
            end_station: { name: etape.adresse_2 || 'Arrivée' },
            date_depart: etape.departure_time ? new Date(etape.departure_time) : new Date(),
            date_arrivee: etape.arrival_time ? new Date(etape.arrival_time) : new Date(Date.now() + 3600000)
          };
        }
      });

      const stationsDetails = await Promise.all(stationsPromises);

      // Calculs globaux
      const prixTotal = parseFloat(stationsDetails.reduce((sum, s) => sum + (s.price || 0), 0).toFixed(2));
      const dateDebut = stationsDetails[0].date_depart || new Date();
      const dateFin = stationsDetails[stationsDetails.length - 1].date_arrivee || new Date(Date.now() + 3600000);

      // 3. Préparer les données du voyage (Status initial: PENDING_PAYMENT)
      const firstEtape = etapes[0] || {};
      const lastEtape = etapes[etapes.length - 1] || {};

      const lieuDepart = stationsDetails[0]?.start_station?.name || firstEtape.adresse_1 || 'Départ inconnu';
      const lieuArrivee = stationsDetails[stationsDetails.length - 1]?.end_station?.name || lastEtape.adresse_2 || 'Arrivée inconnue';

      const voyageData = {
        id_voyage: voyageId,
        id_pmr: finalUserId,
        id_accompagnant: validateUuid(id_accompagnant) ? id_accompagnant : null,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        lieu_depart: lieuDepart,
        lieu_arrivee: lieuArrivee,
        bagage: req.body.bagage || [],
        etapes: this.prepareEtapesForStorage(stationsDetails),
        prix_total: prixTotal,
        status: prixTotal > 0 ? 'pending_payment' : 'confirmed' // Status temporaire si payant
      };

      // 4. Créer le voyage dans Supabase
      const { data: voyage, error: vError } = await SupabaseService.client
        .from('voyages')
        .insert([voyageData])
        .select()
        .single();

      if (vError) throw vError;

      console.log(`✅ Voyage créé (pending): ${voyageId}`);

      // 5. GESTION ATOMIQUE DU PAIEMENT
      let walletResult = null;
      let transactionId = null;

      if (prixTotal > 0) {
        try {
          console.log(`💰 Tentative de débit: ${finalUserId} -> ${prixTotal}€`);
          // Appel qui utilise le trigger SQL
          walletResult = await SupabaseService.updateUserWallet(finalUserId, prixTotal, 'Billet_Voyage');
          transactionId = walletResult.id;
          console.log('✅ Paiement accepté, transaction:', transactionId);

          // Mise à jour du statut voyage -> CONFIRMED
          await SupabaseService.client
            .from('voyages')
            .update({ status: 'confirmed' })
            .eq('id_voyage', voyageId);

        } catch (walletError) {
          console.error('❌ ECHEC DU PAIEMENT:', walletError.message);

          // Mise à jour du statut voyage -> PAYMENT_FAILED
          await SupabaseService.client
            .from('voyages')
            .update({ status: 'payment_failed' })
            .eq('id_voyage', voyageId);

          // Interception propre pour renvoyer 400
          if (walletError.message.includes('Solde insuffisant')) {
            return res.status(400).json({
              success: false,
              error: 'Solde insuffisant',
              details: 'Le solde de votre portefeuille est insuffisant pour ce voyage.'
            });
          }

          throw walletError; // Autre erreur technique -> 500
        }
      }

      // 6. Créer la réservation (Seulement si paiement OK ou gratuit)
      let reservationCreated = false;
      let reservationId = null;

      try {
        const reservationData = {
          reservation_id: uuidv4(),
          user_id: finalUserId,
          id_voyage: voyageId,
          num_reza_mmt: reservationNum,
          num_pax: `PAX-${finalUserId}-${Date.now()}`,
          booking_reference: reservationNum,
          type_transport: this.determineTransportType(etapes),
          assistance_pmr: Object.keys(pmr_options).length > 0,
          date_reservation: new Date().toISOString(),
          lieu_depart: lieuDepart,
          lieu_arrivee: lieuArrivee,
          date_depart: voyageData.date_debut,
          date_arrivee: voyageData.date_fin,
          pmr_options: pmr_options,
          ticket_status: 'pending',
          statut: 'CONFIRMED' // Confirmé car payé
        };

        reservationId = reservationData.reservation_id;

        const { error: rError } = await SupabaseService.client
          .from('reservations')
          .insert([reservationData]);

        if (rError) {
          console.error('⚠️ Erreur création réservation:', rError.message);
        } else {
          reservationCreated = true;
          console.log(`✅ Réservation créée: ${reservationNum}`);
        }
      } catch (e) { console.error('Erreur réservation:', e); }

      // 7. Lier transaction et réservation
      if (transactionId && reservationId) {
        SupabaseService.client
          .from('transactions')
          .update({ reservation_id: reservationId, description: `Voyage ${reservationNum}` })
          .eq('id', transactionId)
          .then(() => console.log('✅ Transaction liée à la réservation'));
      }

      // 8. Générer QR Code
      if (reservationCreated && reservationId) {
        const qrData = {
          reservation_id: reservationId,
          num_reza_mmt: reservationNum,
          voyage_id: voyageId,
          user_id: finalUserId
        };
        SupabaseService.updateReservationStatus(reservationId, {
          qr_code_data: JSON.stringify(qrData),
          ticket_status: 'generated',
          ticket_generated_at: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Voyage confirmé',
        voyage: { ...voyage, status: 'confirmed' }, // On renvoie le statut confirmé
        financial: {
          amount: prixTotal,
          paid: prixTotal > 0,
          transaction_id: transactionId
        },
        reservation: {
          id: reservationId,
          reference: reservationNum
        }
      });

    } catch (error) {
      console.error('🔥 Erreur critique création voyage:', error);
      res.status(500).json({
        error: 'Erreur technique lors de la création du voyage',
        details: error.message
      });
    }
  }

  /**
   * Récupérer un voyage par ID
   */
  async getVoyage(req, res) {
    try {
      const voyageId = req.params.id;
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      const voyage = await SupabaseService.getVoyageById(voyageId);

      if (!voyage) {
        return res.status(404).json({ error: 'Voyage non trouvé' });
      }

      if (!this.canAccessVoyage(voyage, userId, userRole)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      if (voyage.etapes && Array.isArray(voyage.etapes)) {
        const enrichedEtapes = await Promise.all(
          voyage.etapes.map(async etape => {
            if (etape.start_station_id) {
              try {
                const station = await Neo4jService.getStationById(etape.start_station_id);
                return { ...etape, station_details: station };
              } catch (neoError) {
                console.warn(`⚠️ Impossible de récupérer station ${etape.start_station_id}:`, neoError.message);
                return etape;
              }
            }
            return etape;
          })
        );
        voyage.etapes = enrichedEtapes;
      }

      res.json(voyage);
    } catch (error) {
      console.error('❌ Erreur récupération voyage:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Rechercher des stations
   */
  async searchStations(req, res) {
    try {
      const { query, lat, lon, radius = 1000 } = req.query;

      let stations = [];

      if (lat && lon) {
        stations = await Neo4jService.findNearbyStations(
          parseFloat(lat),
          parseFloat(lon),
          parseInt(radius)
        );

        if (query) {
          stations = stations.filter(station =>
            station.name.toLowerCase().includes(query.toLowerCase()) ||
            station.id.includes(query)
          );
        }
      } else if (query) {
        stations = await Neo4jService.searchStations(query);
      } else {
        return res.status(400).json({ error: 'Query ou coordonnées requis' });
      }

      res.json({
        count: stations.length,
        stations: stations
      });
    } catch (error) {
      console.error('❌ Erreur recherche stations:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Planifier un itinéraire
   */
  async planRoute(req, res) {
    try {
      const {
        start_station,
        end_station,
        departure_time,
        accessibility_required = true,
        max_transfers = 3
      } = req.body;

      if (!start_station || !end_station) {
        return res.status(400).json({ error: 'Stations de départ et d\'arrivée requises' });
      }

      const startDetails = await Neo4jService.getStationById(start_station);
      const endDetails = await Neo4jService.getStationById(end_station);

      if (!startDetails || !endDetails) {
        return res.status(404).json({
          error: 'Station(s) non trouvée(s)',
          start_found: !!startDetails,
          end_found: !!endDetails
        });
      }

      const route = await Neo4jService.findOptimalRoute(
        start_station,
        end_station,
        {
          requireAccessibility: accessibility_required,
          maxTransfers: parseInt(max_transfers)
        }
      );

      if (!route) {
        return res.status(404).json({
          error: 'Aucun itinéraire trouvé',
          message: 'Aucun chemin accessible trouvé entre ces stations'
        });
      }

      const departure = departure_time ? new Date(departure_time) : new Date();
      const arrival = new Date(departure.getTime() + (route.total_duration * 60 * 1000));

      res.json({
        start_station: startDetails,
        end_station: endDetails,
        route: route,
        schedule: {
          departure_time: departure.toISOString(),
          estimated_arrival: arrival.toISOString(),
          total_duration_minutes: route.total_duration
        },
        price: route.estimated_price,
        accessibility: {
          all_stations_accessible: route.stations.every(s => s.accessible),
          has_accessible_path: true
        }
      });

    } catch (error) {
      console.error('❌ Erreur planification itinéraire:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupérer l'historique des voyages d'un utilisateur
   */
  async getUserVoyages(req, res) {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const voyages = await SupabaseService.getVoyagesByUser(userId, userRole);

      res.json({
        count: voyages.length,
        voyages: voyages
      });
    } catch (error) {
      console.error('❌ Erreur récupération historiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Mettre à jour un voyage
   */
  async updateVoyage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      const voyage = await SupabaseService.getVoyageById(id);
      if (!voyage) return res.status(404).json({ error: 'Voyage non trouvé' });

      if (userRole !== 'admin' && userRole !== 'Agent' && voyage.id_pmr !== userId && voyage.id_accompagnant !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const allowedFields = ['date_debut', 'date_fin', 'lieu_depart', 'lieu_arrivee', 'bagage', 'prix_total', 'id_accompagnant'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const { data, error } = await SupabaseService.client
        .from('voyages')
        .update(updates)
        .eq('id_voyage', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, message: 'Voyage mis à jour', voyage: data });

    } catch (error) {
      console.error('❌ Erreur update voyage:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprimer un voyage
   */
  async deleteVoyage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      const voyage = await SupabaseService.getVoyageById(id);
      if (!voyage) return res.status(404).json({ error: 'Voyage non trouvé' });

      if (userRole !== 'admin' && userRole !== 'Agent' && voyage.id_pmr !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const { error } = await SupabaseService.client
        .from('voyages')
        .delete()
        .eq('id_voyage', id);

      if (error) throw error;

      res.json({ success: true, message: 'Voyage supprimé' });
    } catch (error) {
      console.error('❌ Erreur delete voyage:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ==================== HELPER METHODS ====================

  prepareEtapesForStorage(stationsDetails) {
    return stationsDetails.map(detail => ({
      type: detail.type || detail.etape_data?.type,
      start_station_id: detail.start_station?.id,
      end_station_id: detail.end_station?.id,
      start_station_snapshot: detail.start_station ? {
        id: detail.start_station.id,
        name: detail.start_station.name,
        lat: detail.start_station.lat,
        lon: detail.start_station.lon,
        accessible: detail.start_station.accessible,
        zone: detail.start_station.zone
      } : null,
      end_station_snapshot: detail.end_station ? {
        id: detail.end_station.id,
        name: detail.end_station.name,
        lat: detail.end_station.lat,
        lon: detail.end_station.lon,
        accessible: detail.end_station.accessible,
        zone: detail.end_station.zone
      } : null,
      route_summary: detail.route ? {
        station_count: detail.route.stations?.length || 0,
        total_duration: detail.route.total_duration || 0,
        total_distance: detail.route.total_distance || 0,
        estimated_price: detail.route.estimated_price || 0
      } : null,
      etape_data: detail.etape_data
    }));
  }

  determineTransportType(etapes) {
    const types = etapes.map(e => e.type?.toLowerCase() || 'transport');
    const uniqueTypes = [...new Set(types)];

    if (uniqueTypes.length > 1) {
      return 'multimodal';
    }

    if (types.includes('avion')) return 'avion';
    if (types.includes('train')) return 'train';
    if (types.includes('bus')) return 'bus';
    if (types.includes('taxi')) return 'taxi';

    return 'train';
  }

  canAccessVoyage(voyage, userId, userRole) {
    if (userRole === 'admin' || userRole === 'Agent') {
      return true;
    }

    return voyage.id_pmr === userId ||
      voyage.id_accompagnant === userId;
  }
}

module.exports = new VoyageController();