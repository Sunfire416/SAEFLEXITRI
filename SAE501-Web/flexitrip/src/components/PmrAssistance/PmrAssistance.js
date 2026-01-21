import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./PmrAssistance.css";

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kbGozNDBldmszcHBjamZhaG00ZjUifQ.pTtXkitNS0RjYw3LGvf1CQ';

function PMRTracking() {
  // États pour les données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [coordinates, setCoordinates] = useState({
    departure: null,
    destination: null,
  });
  
  // État pour la simulation locale
  const [status, setStatus] = useState("en_route");
  const [helpRequested, setHelpRequested] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Configuration des statuts
  const statusConfig = {
    en_route: {
      text: "Agent en route",
      color: "#f1c40f",
    },
    arrived: {
      text: "Agent arrivé au point de rendez-vous",
      color: "#2ecc71",
    },
    in_mission: {
      text: "Prise en charge en cours",
      color: "#3498db",
    },
  };

  // Récupérer la mission depuis l'API au montage
  useEffect(() => {
    const fetchMission = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:17777/api/dev/pmr-missions/latest', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erreur inconnue');
        }

        setMissionData(data.mission);
        setStatus(data.mission.status);
      } catch (err) {
        console.error('❌ Erreur fetch mission:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
  }, []);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleHelpRequest = () => {
    setHelpRequested(true);
    setTimeout(() => setHelpRequested(false), 3000);
  };

  // Géocoder les adresses de la mission pour obtenir les coordonnées
  useEffect(() => {
    if (!missionData) return;

    const departureAddress = missionData.reservation?.lieu_depart;
    const destinationAddress = missionData.reservation?.lieu_arrivee;

    if (!departureAddress || !destinationAddress) return;

    const geocodeAddress = async (address) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          console.log(`✅ Géocodage pour "${address}":`, [longitude, latitude]);
          return [longitude, latitude];
        } else {
          console.warn(`⚠️ Aucun résultat géocodage pour: ${address}`);
          return null;
        }
      } catch (error) {
        console.error("❌ Erreur géocodage:", error);
        return null;
      }
    };

    const fetchCoordinates = async () => {
      const dept = await geocodeAddress(departureAddress);
      const dest = await geocodeAddress(destinationAddress);
      
      setCoordinates({
        departure: dept,
        destination: dest,
      });
    };

    fetchCoordinates();
  }, [missionData]);

  // Extraire les coordonnées
  const departurePointName = missionData?.reservation?.lieu_depart || 'Départ';
  const destinationName = missionData?.reservation?.lieu_arrivee || 'Destination';
  
  // Utiliser les coordonnées géocodées ou valeurs par défaut
  const departurePoint = coordinates.departure || [2.3553, 48.8809]; // Valeur par défaut (Paris)
  const destination = coordinates.destination || [3.077, 50.637]; // Valeur par défaut (Lille)

  const agentPosition = missionData?.agent_position?.coordinates || departurePoint;

  const currentConfig = statusConfig[status];

  // Convertir ETA secondes en minutes
  const etaMinutes = missionData?.eta_seconds 
    ? Math.ceil(missionData.eta_seconds / 60)
    : 3;

  // Initialisation et mise à jour de la carte MapBox
  useEffect(() => {
    // Guard: only proceed if we have the necessary data
    if (!mapContainer.current || loading || !missionData || !coordinates.departure || !coordinates.destination) return;

    if (!map.current) {
      try {
        console.log('🗺️ Initializing map with container:', mapContainer.current);
        console.log('Departure:', departurePoint, 'Destination:', destination);
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [(departurePoint[0] + destination[0]) / 2, (departurePoint[1] + destination[1]) / 2],
          zoom: 11,
          pitch: 0,
          bearing: 0,
          antialias: true,
        });

        map.current.on("load", () => {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [departurePoint, destination],
              },
            },
          });

          map.current.addSource("agent", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: agentPosition,
                  },
                },
              ],
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#5bbcea",
              "line-width": 3,
            },
          });

          new mapboxgl.Marker({ color: "#2eb378" })
            .setLngLat(departurePoint)
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>Départ:</strong> ${departurePointName}`))
            .addTo(map.current);

          new mapboxgl.Marker({ color: "#EF4444" })
            .setLngLat(destination)
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination:</strong> ${destinationName}`))
            .addTo(map.current);

          map.current.addLayer({
            id: "agent-marker",
            type: "circle",
            source: "agent",
            paint: {
              "circle-radius": 10,
              "circle-color": currentConfig.color,
              "circle-opacity": 1,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          });

          map.current.addControl(new mapboxgl.NavigationControl());
        });

        map.current.on("error", (e) => {
          console.error("MapBox error:", e);
        });
      } catch (error) {
        console.error("MapBox initialization error:", error);
      }
    }
  }, [loading, missionData, departurePoint, destination, agentPosition, coordinates.departure, coordinates.destination]);

  // Mettre à jour uniquement la couleur du marqueur agent sans recréer la carte
  useEffect(() => {
    if (map.current && map.current.getLayer("agent-marker")) {
      map.current.setPaintProperty("agent-marker", "circle-color", currentConfig.color);
    }
  }, [currentConfig.color]);

  // Mettre à jour la position de l'agent sans recréer la carte
  useEffect(() => {
    if (map.current && map.current.getSource("agent")) {
      map.current.getSource("agent").setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: agentPosition,
            },
          },
        ],
      });
    }
  }, [agentPosition]);

  // Affichage Loading - MOVED AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="pmr-container">
        <h1>Suivi de prise en charge PMR</h1>
        <section>
          <p>⏳ Chargement de la mission...</p>
        </section>
      </div>
    );
  }

  // Affichage Erreur - MOVED AFTER ALL HOOKS
  if (error) {
    return (
      <div className="pmr-container">
        <h1>Suivi de prise en charge PMR</h1>
        <section>
          <h3>❌ Erreur</h3>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  // Affichage Pas de donnée - MOVED AFTER ALL HOOKS
  if (!missionData) {
    return (
      <div className="pmr-container">
        <h1>Suivi de prise en charge PMR</h1>
        <section>
          <h3>Aucune mission trouvée</h3>
        </section>
      </div>
    );
  }

  return (
    <div className="pmr-container">
      <h1>Suivi de prise en charge PMR</h1>

      <section>
        <h3>Trajet en cours</h3>
        <div className="route-display">
          <div className="route-item route-start">
            <span className="route-icon">📍</span>
            <div className="route-info">
              <p className="route-label">Départ</p>
              <p className="route-location">{missionData.reservation?.lieu_depart || 'Départ'}</p>
            </div>
          </div>
          <div className="route-arrow">↓</div>
          <div className="route-item route-end">
            <span className="route-icon">🎯</span>
            <div className="route-info">
              <p className="route-label">Destination</p>
              <p className="route-location">{missionData.reservation?.lieu_arrivee || 'Destination'}</p>
            </div>
          </div>
        </div>

        <div
          ref={mapContainer}
          className="pmr-map"
          style={{ height: "400px", borderRadius: "12px" }}
        />
      </section>

      <section>
        <h3>Agent PMR</h3>
        <p>
          👤 <span id="agentName">{missionData.agent?.full_name || 'Agent'}</span>
        </p>
        <p>
          ⏱️ Temps estimé : <span id="eta">{etaMinutes}</span> min
        </p>

        <p id="status" className="status-indicator">
          <svg width="16" height="16" className="status-circle">
            <circle cx="8" cy="8" r="8" fill={currentConfig.color} />
          </svg>
          <span id="statusText">{currentConfig.text}</span>
        </p>

        <div className="button-group">
          <button
            className="btn-status"
            onClick={() => handleStatusChange("arrived")}
          >
            Simuler arrivée agent
          </button>
          <button
            className="btn-status"
            onClick={() => handleStatusChange("in_mission")}
          >
            Simuler prise en charge
          </button>
        </div>
      </section>

      <section>
        <h3>QR Code Voyageur</h3>
        <div className="qrcode-container">
          <QRCodeSVG
            value={missionData.reservation?.qr_code_data || missionData.reservation?.booking_reference || "PMR-SEGMENT-001"}
            size={128}
            level="H"
            includeMargin={true}
          />
        </div>
        <p>
          ID : <span id="qrPayload">{missionData.reservation?.booking_reference || 'N/A'}</span>
        </p>
      </section>

      <section>
        <h3>Support</h3>
        <button className="btn-help" onClick={handleHelpRequest}>
          🚨 Demander de l'aide
        </button>
        {helpRequested && (
          <p className="help-message">✅ Un agent a été alerté.</p>
        )}
      </section>
    </div>
  );
}

export default PMRTracking;
