const SupabaseService = require('../services/SupabaseService');
const { v4: uuidv4 } = require('uuid');

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

      const voyageId = uuidv4();
      const reservationNum = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 1. Récupérer les informations des stations depuis Neo4j
      const stationsDetails = [];
      let prixTotal = 0;
      let dateDebut = null;
      let dateFin = null;

      for (const etape of etapes) {
        if (etape.type === 'transport' && etape.station_start && etape.station_end) {
          // Récupérer les détails des stations
          const startStation = await Neo4jService.getStationById(etape.station_start);
          const endStation = await Neo4jService.getStationById(etape.station_end);

          if (!startStation || !endStation) {
            return res.status(404).json({
              error: `Station non trouvée: ${!startStation ? etape.station_start : etape.station_end}`
            });
          }

          // Trouver l'itinéraire optimal
          const route = await Neo4jService.findOptimalRoute(
            etape.station_start,
            etape.station_end,
            {
              requireAccessibility: pmr_options?.accessibility_required || true,
              maxTransfers: 3
            }
          );

          if (!route) {
            return res.status(404).json({
              error: `Aucun itinéraire trouvé entre ${startStation.name} et ${endStation.name}`
            });
          }

          stationsDetails.push({
            start_station: startStation,
            end_station: endStation,
            route: route,
            etape_data: etape
          });

          prixTotal += route.estimated_price || 0;

          if (!dateDebut && etape.departure_time) {
            dateDebut = new Date(etape.departure_time);
          }
          if (etape.arrival_time) {
            dateFin = new Date(etape.arrival_time);
          }
        } else if (etape.type === 'taxi') {
          // Pour les taxis, on a juste les adresses
          prixTotal += etape.price || 15;
          stationsDetails.push({
            type: 'taxi',
            etape_data: etape
          });
        }
      }

      // 2. Préparer les données du voyage pour Supabase
      const voyageData = {
        id_voyage: voyageId,
        id_pmr: id_pmr || user_id,
        id_accompagnant: id_accompagnant || null,
        date_debut: dateDebut || new Date(),
        date_fin: dateFin || new Date(),
        lieu_depart: stationsDetails[0]?.start_station || etapes[0]?.address_start,
        lieu_arrivee: stationsDetails[stationsDetails.length - 1]?.end_station || etapes[etapes.length - 1]?.address_end,
        bagage: req.body.bagage || [],
        etapes: this.prepareEtapesForStorage(stationsDetails),
        prix_total: prixTotal
      };

      // 3. Créer le voyage dans Supabase
      const voyage = await SupabaseService.createVoyage(voyageData);

      // 4. Créer la réservation
      const reservationData = {
        reservation_id: uuidv4(),
        user_id: id_pmr || user_id,
        id_voyage: voyageId,
        num_reza_mmt: reservationNum,
        num_pax: `PAX-${id_pmr || user_id}-${Date.now()}`,
        booking_reference: reservationNum,
        type_transport: this.determineTransportType(etapes),
        assistance_pmr: Object.keys(pmr_options).length > 0,
        date_reservation: new Date(),
        lieu_depart: JSON.stringify(voyageData.lieu_depart),
        lieu_arrivee: JSON.stringify(voyageData.lieu_arrivee),
        date_depart: voyageData.date_debut,
        date_arrivee: voyageData.date_fin,
        pmr_options: pmr_options,
        ticket_status: 'pending',
        statut: 'CONFIRMED'
      };

      const reservation = await SupabaseService.createReservation(reservationData);

      // 5. Créer la transaction de paiement
      if (prixTotal > 0) {
        await SupabaseService.createTransaction({
          id: uuidv4(),
          user_id: id_pmr || user_id,
          reservation_id: reservation.reservation_id,
          amount: prixTotal,
          payment_status: 'paid',
          type: 'Billet_Voyage',
          date_payement: new Date(),
          description: `Voyage multimodal ${voyageId}`
        });
      }

      // 6. Générer le QR code du billet
      const qrData = {
        reservation_id: reservation.reservation_id,
        num_reza_mmt: reservation.num_reza_mmt,
        voyage_id: voyageId,
        user_id: id_pmr || user_id,
        date_depart: voyageData.date_debut,
        stations: stationsDetails.map(s => s.start_station?.name).filter(Boolean)
      };

      await SupabaseService.updateReservationStatus(reservation.reservation_id, {
        qr_code_data: JSON.stringify(qrData),
        ticket_status: 'generated',
        ticket_generated_at: new Date()
      });

      res.status(201).json({
        success: true,
        voyage: {
          id: voyageId,
          ...voyage
        },
        reservation: {
          id: reservation.reservation_id,
          num_reza_mmt: reservation.num_reza_mmt,
          ticket_status: 'generated'
        },
        price: prixTotal,
        stations: stationsDetails.map(s => ({
          start: s.start_station?.name,
          end: s.end_station?.name,
          price: s.route?.estimated_price
        }))
      });

    } catch (error) {
      console.error('❌ Erreur création voyage:', error);
      res.status(500).json({
        error: 'Erreur lors de la création du voyage',
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

      // Récupérer le voyage depuis Supabase
      const voyage = await SupabaseService.getVoyageById(voyageId);

      if (!voyage) {
        return res.status(404).json({ error: 'Voyage non trouvé' });
      }

      // Vérifier les permissions
      if (!this.canAccessVoyage(voyage, userId, userRole)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Enrichir avec les données Neo4j si nécessaire
      if (voyage.etapes && Array.isArray(voyage.etapes)) {
        const enrichedEtapes = await Promise.all(
          voyage.etapes.map(async etape => {
            if (etape.start_station_id) {
              const station = await Neo4jService.getStationById(etape.start_station_id);
              return { ...etape, station_details: station };
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
        // Recherche par proximité
        stations = await Neo4jService.findNearbyStations(
          parseFloat(lat),
          parseFloat(lon),
          parseInt(radius)
        );

        // Filtrer par query si fourni
        if (query) {
          stations = stations.filter(station =>
            station.name.toLowerCase().includes(query.toLowerCase()) ||
            station.id.includes(query)
          );
        }
      } else if (query) {
        // Recherche par nom
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

      // Récupérer les détails des stations
      const startDetails = await Neo4jService.getStationById(start_station);
      const endDetails = await Neo4jService.getStationById(end_station);

      if (!startDetails || !endDetails) {
        return res.status(404).json({
          error: 'Station(s) non trouvée(s)',
          start_found: !!startDetails,
          end_found: !!endDetails
        });
      }

      // Trouver l'itinéraire optimal
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

      // Calculer l'heure d'arrivée estimée
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

  // ==================== HELPER METHODS ====================

  prepareEtapesForStorage(stationsDetails) {
    return stationsDetails.map(detail => ({
      type: detail.etape_data.type,
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
        station_count: detail.route.stations.length,
        total_duration: detail.route.total_duration,
        total_distance: detail.route.total_distance,
        estimated_price: detail.route.estimated_price
      } : null,
      etape_data: detail.etape_data
    }));
  }

  determineTransportType(etapes) {
    const types = etapes.map(e => e.type);

    if (types.includes('avion')) return 'avion';
    if (types.includes('train')) return 'train';
    if (types.includes('bus')) return 'bus';
    if (types.includes('taxi')) return 'taxi';
    if (types.length > 1) return 'multimodal';
    return 'train'; // default
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