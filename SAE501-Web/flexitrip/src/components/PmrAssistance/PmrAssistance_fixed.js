import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./PmrAssistance.css";

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kYmozNDBldmszcHBjamZhaG00ZjUifQ.pTtXkitNS0RjYw3LGvf1CQ';

function PMRTracking() {
  // États pour les données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missionData, setMissionData] = useState(null);
  
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

  // Extraire les coordonnées
  // lieu_depart et lieu_arrivee sont des strings simples, pas du JSON
  const departurePointName = missionData?.reservation?.lieu_depart || 'Départ';
  const destinationName = missionData?.reservation?.lieu_arrivee || 'Destination';
  
  // Coordonnées : utiliser la position de l'agent pour le départ, valeurs par défaut pour destination
  const departurePoint = [2.3553, 48.8809]; // Valeur par défaut (Paris)
  const destination = [3.077, 50.637]; // Valeur par défaut (Lille)

  const agentPosition = missionData?.agent_position?.coordinates || [2.3553, 48.8809];
  
  // Estimer un point de rendez-vous entre départ et destination
  const meetingPoint = [
    (departurePoint[0] + destination[0]) / 2,
    (departurePoint[1] + destination[1]) / 2
  ];

  const currentConfig = statusConfig[status];

  // Convertir ETA secondes en minutes
  const etaMinutes = missionData?.eta_seconds 
    ? Math.ceil(missionData.eta_seconds / 60)
    : 3;

  // ⬇️ HOOK TOUJOURS APPELÉ (avant early returns)
  // Initialisation et mise à jour de la carte MapBox
  useEffect(() => {
    // Vérifier à l'intérieur pour éviter avant que les données soient prêtes
    if (!mapContainer.current || loading || !missionData) return;

    const timer = setTimeout(() => {
      if (!map.current) {
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [2.7, 49.3],
            zoom: 7,
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
                  coordinates: [departurePoint, meetingPoint, destination],
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

            new mapboxgl.Marker({ color: "#5bbcea" })
              .setLngLat(meetingPoint)
              .setPopup(new mapboxgl.Popup().setHTML("<strong>Point RDV estimé</strong>"))
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
      } else {
        if (map.current.getSource("agent")) {
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

        if (map.current.getLayer("agent-marker")) {
          map.current.setPaintProperty("agent-marker", "circle-color", currentConfig.color);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [currentConfig.color, agentPosition, loading, missionData, departurePoint, destination, meetingPoint, departurePointName, destinationName]);

  // ⬇️ EARLY RETURNS APRÈS TOUS LES HOOKS
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

  // ⬇️ JSX PRINCIPAL
  return (
    <div className="pmr-container">
      <h1>Suivi de prise en charge PMR</h1>

      <section>
        <h3>Trajet en cours</h3>
        <p>
          <strong id="from">{departurePointName}</strong> →{" "}
          <strong id="to">{destinationName}</strong>
        </p>

        <div
          ref={mapContainer}
          className="pmr-map"
          style={{ height: "300px", borderRadius: "12px" }}
        />

        <p id="meetingPointText">
          📍 Point de rendez-vous : <span id="meetingPoint">Estimé</span>
        </p>
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
