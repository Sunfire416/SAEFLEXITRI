const axios = require('axios');

/**
 * Service de recherche multimodale avec Google Maps APIs
 * - Directions API pour itinéraires train/bus/transit
 * - Places API pour recherche aéroports et gares
 * - Geocoding API pour localisation
 * 
 * Architecture flexible : train/bus/avion selon besoin utilisateur
 * 
 * Point 1 - Recherche multimodale intelligente
 */

// Configuration Google Maps API
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// API vols (optionnel - pour itinéraires incluant avion)
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY || '';
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

// Temps de transfert minimum par type de transport (minutes)
const TRANSFER_TIMES = {
    'plane': {
        'plane': 90,
        'train': 60,
        'bus': 45,
        'taxi': 30
    },
    'train': {
        'plane': 60,
        'train': 20,
        'bus': 15,
        'taxi': 15
    },
    'bus': {
        'plane': 60,
        'train': 15,
        'bus': 10,
        'taxi': 10
    },
    'taxi': {
        'plane': 45,
        'train': 20,
        'bus': 15,
        'taxi': 10
    }
};

// Temps de transfert supplémentaire pour PMR (minutes)
const PMR_EXTRA_TIME = {
    'wheelchair': 15,
    'cane': 5,
    'walker': 10,
    'none': 0
};

/**
 * Recherche itinéraire transit (train/bus) avec Google Maps Directions API
 */
async function searchTransitRoute(origin, destination, date, pmrNeeds = {}) {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            console.log('⚠️  Google Maps API key non configurée');
            return [];
        }

        const departureTime = date ? Math.floor(new Date(date).getTime() / 1000) : Math.floor(Date.now() / 1000);

        const url = `${GOOGLE_MAPS_BASE_URL}/directions/json`;
        const response = await axios.get(url, {
            params: {
                origin: origin,
                destination: destination,
                mode: 'transit',
                transit_mode: 'train|bus|subway|tram',
                departure_time: departureTime,
                language: 'fr',
                alternatives: true,
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 10000
        });

        if (response.data?.status === 'OK' && response.data.routes) {
            return parseGoogleTransitRoutes(response.data.routes, pmrNeeds, 'transit');
        }

        console.log(`⚠️  Google Directions status: ${response.data?.status}`);
        return [];
    } catch (error) {
        console.error('❌ Erreur Google Directions API (transit):', error.message);
        return [];
    }
}

/**
 * Recherche aéroport le plus proche avec Google Places API
 */
async function findNearestAirport(location) {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return null;
        }

        // Géocoder la localisation d'abord
        const coords = await geocodeLocation(location);
        if (!coords) return null;

        const url = `${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`;
        const response = await axios.get(url, {
            params: {
                location: `${coords.lat},${coords.lng}`,
                radius: 100000, // 100km
                type: 'airport',
                language: 'fr',
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 10000
        });

        if (response.data?.status === 'OK' && response.data.results?.length > 0) {
            const airport = response.data.results[0];
            return {
                name: airport.name,
                place_id: airport.place_id,
                location: airport.geometry.location,
                vicinity: airport.vicinity,
                distance_from_origin: calculateDistance(coords, airport.geometry.location)
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Erreur recherche aéroport:', error.message);
        return null;
    }
}

/**
 * Recherche itinéraire incluant vol si nécessaire
 */
async function searchFlightRoute(originAirport, destinationAirport, date, pmrNeeds = {}) {
    try {
        // Pour l'instant, on retourne une suggestion de vol basique
        // L'utilisateur peut intégrer une API de vols si besoin (Aviationstack, Skyscanner, etc.)
        
        return [{
            id: `flight_${Date.now()}`,
            source: 'flight_suggestion',
            segments: [{
                mode: 'plane',
                operator: 'Compagnie aérienne',
                departure: originAirport.name,
                departure_station: originAirport.name,
                departure_time: date,
                arrival: destinationAirport.name,
                arrival_station: destinationAirport.name,
                arrival_time: null,
                duration: 90, // Estimation
                line: 'Vol',
                accessible: true,
                needs_wheelchair_assistance: pmrNeeds.mobility_aid === 'wheelchair'
            }],
            total_duration: 90,
            total_price: 150,
            departure_time: date,
            arrival_time: null,
            nb_transfers: 0,
            accessibility_score: 0.9,
            visual_guidance_available: true,
            visual_info_available: true,
            pmr_notes: 'Assistance PMR disponible - réserver 48h à l\'avance'
        }];
    } catch (error) {
        console.error('❌ Erreur recherche vol:', error.message);
        return [];
    }
}

/**
 * Recherche multimodale intelligente avec logique flexible
 * - Transit uniquement (train/bus) si distance courte/moyenne
 * - Transit + vol si longue distance et utilisateur accepte avion
 * - Recherche aéroport le plus proche si vol nécessaire
 */
exports.searchMultimodalRoute = async (origin, destination, date, pmrNeeds = {}) => {
    try {
        console.log(`🔍 Recherche multimodale: ${origin} → ${destination}`);
        console.log('👤 Besoins PMR:', pmrNeeds);

        if (!GOOGLE_MAPS_API_KEY) {
            console.error('❌ GOOGLE_MAPS_API_KEY manquante');
            return {
                success: false,
                error: 'Google Maps API Key non configurée',
                routes: []
            };
        }

        let allRoutes = [];

        // 1. Rechercher itinéraires transit (train/bus)
        const transitRoutes = await searchTransitRoute(origin, destination, date, pmrNeeds);
        allRoutes = [...transitRoutes];

        // 2. Calculer distance pour déterminer si vol pertinent
        const originCoords = await geocodeLocation(origin);
        const destCoords = await geocodeLocation(destination);
        
        if (originCoords && destCoords) {
            const distance = calculateDistance(originCoords, destCoords);
            console.log(`📏 Distance: ${distance.toFixed(0)}km`);

            // Si distance > 300km, proposer option avion
            if (distance > 300 && pmrNeeds.accepts_flight !== false) {
                console.log('✈️  Distance longue - recherche d\'aéroports...');
                
                const originAirport = await findNearestAirport(origin);
                const destAirport = await findNearestAirport(destination);

                if (originAirport && destAirport) {
                    console.log(`✅ Aéroports trouvés: ${originAirport.name} → ${destAirport.name}`);
                    
                    // Créer itinéraire multimodal : transport local + vol + transport local
                    const multimodalWithFlight = await buildMultimodalFlightRoute(
                        origin, 
                        originAirport, 
                        destAirport, 
                        destination, 
                        date, 
                        pmrNeeds
                    );
                    
                    allRoutes = [...allRoutes, ...multimodalWithFlight];
                }
            }
        }

        // Filtrer selon besoins PMR
        allRoutes = filterAccessibleOptions(allRoutes, pmrNeeds);

        // Trier par durée
        allRoutes.sort((a, b) => a.total_duration - b.total_duration);

        // Identifier les points de correspondance critiques
        allRoutes = allRoutes.map(route => ({
            ...route,
            transfer_points: identifyTransferPoints(route),
            pmr_compatible: route.accessibility_score >= 0.7
        }));

        return {
            success: true,
            count: allRoutes.length,
            routes: allRoutes.slice(0, 10), // Top 10
            pmr_needs: pmrNeeds,
            has_flight_option: allRoutes.some(r => r.segments.some(s => s.mode === 'plane'))
        };

    } catch (error) {
        console.error('❌ Erreur recherche multimodale:', error);
        return {
            success: false,
            error: error.message,
            routes: []
        };
    }
};

/**
 * Construit itinéraire complet avec vol
 * Domicile → Aéroport départ → Vol → Aéroport arrivée → Destination
 */
async function buildMultimodalFlightRoute(origin, originAirport, destAirport, destination, date, pmrNeeds) {
    try {
        const routes = [];

        // Segment 1: Origin → Origin Airport (transit/taxi)
        const toAirportRoute = await searchTransitRoute(origin, originAirport.vicinity, date, pmrNeeds);
        
        // Segment 2: Flight
        const flightRoutes = await searchFlightRoute(originAirport, destAirport, date, pmrNeeds);
        
        // Segment 3: Destination Airport → Final destination
        const fromAirportRoute = await searchTransitRoute(destAirport.vicinity, destination, date, pmrNeeds);

        // Combiner les 3 segments si tous disponibles
        if (toAirportRoute.length > 0 && flightRoutes.length > 0 && fromAirportRoute.length > 0) {
            const combinedSegments = [
                ...toAirportRoute[0].segments,
                ...flightRoutes[0].segments,
                ...fromAirportRoute[0].segments
            ];

            const totalDuration = combinedSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0);

            routes.push({
                id: `multimodal_flight_${Date.now()}`,
                source: 'google_maps_multimodal',
                segments: combinedSegments,
                total_duration: totalDuration,
                total_price: estimatePrice(combinedSegments),
                departure_time: date,
                arrival_time: null,
                nb_transfers: combinedSegments.length - 1,
                accessibility_score: 0.8,
                visual_guidance_available: true,
                visual_info_available: true,
                pmr_notes: `Itinéraire avec vol - Assistance PMR à réserver pour chaque segment`,
                includes_flight: true
            });
        }

        return routes;
    } catch (error) {
        console.error('❌ Erreur construction itinéraire multimodal avec vol:', error.message);
        return [];
    }
}

/**
 * Filtre les options accessibles selon besoins PMR
 */
function filterAccessibleOptions(routes, pmrRequirements) {
    return routes.filter(route => {
        // Fauteuil roulant : exiger accessibilité complète
        if (pmrRequirements.mobility_aid === 'wheelchair') {
            if (pmrRequirements.wheelchair_type === 'electric') {
                // Fauteuil électrique : infrastructures renforcées
                return route.accessibility_score >= 0.9;
            }
            return route.accessibility_score >= 0.8;
        }

        // Déficience visuelle : guidage nécessaire
        if (pmrRequirements.visual_impairment) {
            return route.visual_guidance_available;
        }

        // Déficience auditive : info visuelle nécessaire
        if (pmrRequirements.hearing_impairment) {
            return route.visual_info_available;
        }

        // Autres cas : accessibilité minimale
        return route.accessibility_score >= 0.5;
    });
}

/**
 * Calcule la durée totale d'un itinéraire
 */
exports.calculateTotalDuration = (segments) => {
    if (!segments || segments.length === 0) return 0;

    let totalMinutes = 0;

    segments.forEach((segment, index) => {
        // Durée du segment
        totalMinutes += segment.duration || 0;

        // Temps de transfert si pas le dernier segment
        if (index < segments.length - 1) {
            const currentMode = segment.mode;
            const nextMode = segments[index + 1].mode;
            totalMinutes += getTransferTime(currentMode, nextMode);
        }
    });

    return totalMinutes;
};

/**
 * Identifie les points de correspondance critiques
 */
function identifyTransferPoints(route) {
    if (!route.segments || route.segments.length <= 1) {
        return [];
    }

    const transferPoints = [];

    for (let i = 0; i < route.segments.length - 1; i++) {
        const current = route.segments[i];
        const next = route.segments[i + 1];

        const transferTime = getTransferTime(current.mode, next.mode);

        transferPoints.push({
            location: current.arrival_station || current.destination,
            from_mode: current.mode,
            to_mode: next.mode,
            transfer_time_minutes: transferTime,
            requires_assistance: transferTime >= 20 || current.mode === 'plane',
            accessibility_info: {
                elevators: true, // À récupérer de l'API
                ramps: true,
                tactile_paths: false
            }
        });
    }

    return transferPoints;
}

/**
 * Obtient le temps de transfert entre 2 modes
 */
function getTransferTime(fromMode, toMode, pmrMobilityAid = 'none') {
    const baseTime = TRANSFER_TIMES[fromMode]?.[toMode] || 15;
    const pmrExtra = PMR_EXTRA_TIME[pmrMobilityAid] || 0;
    return baseTime + pmrExtra;
}

/**
 * Parse les itinéraires Google Maps Transit en format unifié
 */
function parseGoogleTransitRoutes(routes, pmrNeeds, type = 'transit') {
    return routes.map((route, routeIndex) => {
        const segments = [];
        
        route.legs.forEach(leg => {
            leg.steps.forEach(step => {
                if (step.travel_mode === 'TRANSIT') {
                    const transitDetails = step.transit_details;
                    segments.push({
                        mode: mapGoogleTransitMode(transitDetails.line.vehicle.type),
                        operator: transitDetails.line.agencies?.[0]?.name || 'Transport public',
                        departure: transitDetails.departure_stop.name,
                        departure_station: transitDetails.departure_stop.name,
                        departure_time: new Date(transitDetails.departure_time.value * 1000).toISOString(),
                        arrival: transitDetails.arrival_stop.name,
                        arrival_station: transitDetails.arrival_stop.name,
                        arrival_time: new Date(transitDetails.arrival_time.value * 1000).toISOString(),
                        duration: Math.floor(step.duration.value / 60),
                        line: transitDetails.line.short_name || transitDetails.line.name,
                        accessible: transitDetails.line.vehicle.wheelchair_accessible !== 'NOT_WHEELCHAIR_ACCESSIBLE',
                        vehicle_type: transitDetails.line.vehicle.type
                    });
                } else if (step.travel_mode === 'WALKING') {
                    // Segment de marche
                    if (step.duration.value > 120) { // Plus de 2 minutes
                        segments.push({
                            mode: 'walk',
                            operator: 'Marche',
                            departure: step.html_instructions || 'Départ',
                            departure_station: '',
                            departure_time: null,
                            arrival: 'Arrivée',
                            arrival_station: '',
                            arrival_time: null,
                            duration: Math.floor(step.duration.value / 60),
                            line: '',
                            accessible: true,
                            distance_meters: step.distance.value
                        });
                    }
                }
            });
        });

        return {
            id: `google_transit_${routeIndex}_${Date.now()}`,
            source: 'google_maps',
            segments: segments,
            total_duration: Math.floor(route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60),
            total_price: estimatePrice(segments),
            departure_time: route.legs[0]?.departure_time?.text || null,
            arrival_time: route.legs[route.legs.length - 1]?.arrival_time?.text || null,
            nb_transfers: segments.filter(s => s.mode !== 'walk').length - 1,
            accessibility_score: calculateAccessibilityScore(segments),
            visual_guidance_available: true,
            visual_info_available: true,
            pmr_notes: 'Données temps réel Google Maps',
            distance_km: Math.floor(route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000)
        };
    });
}

/**
 * Mappe les types de véhicules Google Maps vers nos modes
 */
function mapGoogleTransitMode(googleType) {
    const mapping = {
        'BUS': 'bus',
        'HEAVY_RAIL': 'train',
        'HIGH_SPEED_TRAIN': 'train',
        'INTERCITY_BUS': 'bus',
        'METRO_RAIL': 'train',
        'MONORAIL': 'train',
        'OTHER': 'bus',
        'RAIL': 'train',
        'SHARE_TAXI': 'taxi',
        'SUBWAY': 'train',
        'TRAM': 'train',
        'TROLLEYBUS': 'bus'
    };
    return mapping[googleType] || 'bus';
}

/**
 * Calcule un score d'accessibilité (0-1)
 */
function calculateAccessibilityScore(segments) {
    if (!segments || segments.length === 0) return 0;

    let accessibleCount = 0;
    segments.forEach(segment => {
        if (segment.accessible) accessibleCount++;
    });

    return accessibleCount / segments.length;
}

/**
 * Estime le prix total d'un itinéraire
 */
function estimatePrice(segments) {
    const priceMap = {
        'plane': 150,
        'train': 50,
        'bus': 20,
        'taxi': 30,
        'walk': 0,
        'wait': 0
    };

    return segments.reduce((total, segment) => {
        return total + (priceMap[segment.mode] || 10);
    }, 0);
}

/**
 * Géocode une adresse avec Google Maps Geocoding API
 */
async function geocodeLocation(location) {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return null;
        }

        const url = `${GOOGLE_MAPS_BASE_URL}/geocode/json`;
        const response = await axios.get(url, {
            params: {
                address: location,
                language: 'fr',
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 5000
        });

        if (response.data?.status === 'OK' && response.data.results?.length > 0) {
            const result = response.data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formatted_address: result.formatted_address
            };
        }

        console.log(`⚠️  Geocoding status: ${response.data?.status}`);
        return null;
    } catch (error) {
        console.error('❌ Erreur géocodage:', error.message);
        return null;
    }
}

/**
 * Calcule la distance entre 2 coordonnées (formule haversine)
 */
function calculateDistance(coords1, coords2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Autocomplétion d'adresses avec Google Maps Places Autocomplete API
 * @param {string} input - Texte saisi par l'utilisateur
 * @returns {Promise<Array>} - Liste de suggestions d'adresses
 */
async function getPlacesAutocomplete(input) {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('⚠️  GOOGLE_MAPS_API_KEY manquante pour autocomplétion');
            return { success: false, predictions: [] };
        }

        if (!input || input.length < 3) {
            return { success: true, predictions: [] };
        }

        const url = `${GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`;
        const response = await axios.get(url, {
            params: {
                input: input,
                types: 'address',  // Adresses complètes (gares, stations, rues)
                language: 'fr',
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 5000
        });

        if (response.data?.status === 'OK') {
            return {
                success: true,
                predictions: response.data.predictions.map(p => ({
                    description: p.description,
                    place_id: p.place_id,
                    main_text: p.structured_formatting?.main_text || p.description,
                    secondary_text: p.structured_formatting?.secondary_text || ''
                }))
            };
        }

        console.log(`⚠️  Places Autocomplete status: ${response.data?.status}`);
        return { success: false, predictions: [], error: response.data?.status };

    } catch (error) {
        console.error('❌ Erreur Places Autocomplete:', error.message);
        return { success: false, predictions: [], error: error.message };
    }
}

exports.getPlacesAutocomplete = getPlacesAutocomplete;

module.exports = exports;
