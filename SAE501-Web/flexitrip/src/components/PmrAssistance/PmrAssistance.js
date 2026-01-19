import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./PmrAssistance.css";

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kYmozNDBldmszcHBjamZhaG00ZjUifQ.pTtXkitNS0RjYw3LGvf1CQ';

function PMRTracking() {
  const [status, setStatus] = useState("en_route");
  const [agentPosition, setAgentPosition] = useState([2.3553, 48.8809]);
  const [helpRequested, setHelpRequested] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);

  const qrPayload = "PMR-SEGMENT-001";
  const meetingPoint = [2.345, 48.886];
  const destination = [3.077, 50.637];
  const departurePoint = [2.3553, 48.8809];

  const statusConfig = {
    en_route: {
      text: "Agent en route",
      color: "#f1c40f",
      position: departurePoint,
    },
    arrived: {
      text: "Agent arrivé au point de rendez-vous",
      color: "#2ecc71",
      position: meetingPoint,
    },
    in_mission: {
      text: "Prise en charge en cours",
      color: "#3498db",
      position: meetingPoint,
    },
  };

  useEffect(() => {
    setAgentPosition(statusConfig[status].position);
  }, [status]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleHelpRequest = () => {
    setHelpRequested(true);
    setTimeout(() => setHelpRequested(false), 3000);
  };

  const currentConfig = statusConfig[status];

  // Initialisation et mise à jour de la carte MapBox
  useEffect(() => {
    if (!mapContainer.current) return;

    // Attendre que le DOM soit bien rendu
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
            // Ajouter les sources de données
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

            // Ajouter la couche de route
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

            // Ajouter les marqueurs de départ, RDV et destination
            new mapboxgl.Marker({ color: "#2eb378" })
              .setLngLat(departurePoint)
              .setPopup(new mapboxgl.Popup().setHTML("<strong>Départ:</strong> Paris Gare du Nord"))
              .addTo(map.current);

            new mapboxgl.Marker({ color: "#5bbcea" })
              .setLngLat(meetingPoint)
              .setPopup(new mapboxgl.Popup().setHTML("<strong>Point RDV:</strong> Voie 5"))
              .addTo(map.current);

            new mapboxgl.Marker({ color: "#EF4444" })
              .setLngLat(destination)
              .setPopup(new mapboxgl.Popup().setHTML("<strong>Destination:</strong> Lille Europe"))
              .addTo(map.current);

            // Ajouter la couche de l'agent
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

            // Ajouter un contrôle de navigation
            map.current.addControl(new mapboxgl.NavigationControl());
          });

          map.current.on("error", (e) => {
            console.error("MapBox error:", e);
          });
        } catch (error) {
          console.error("MapBox initialization error:", error);
        }
      } else {
        // Mettre à jour la position de l'agent
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

        // Mettre à jour la couleur du marqueur de l'agent
        if (map.current.getLayer("agent-marker")) {
          map.current.setPaintProperty("agent-marker", "circle-color", currentConfig.color);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentConfig.color]);

  return (
    <div className="pmr-container">
      <h1>Suivi de prise en charge PMR</h1>

      <section>
        <h3>Trajet en cours</h3>
        <p>
          <strong id="from">Paris Gare du Nord</strong> →{" "}
          <strong id="to">Lille Europe</strong>
        </p>

        <div
          ref={mapContainer}
          className="pmr-map"
          style={{ height: "300px", borderRadius: "12px" }}
        />

        <p id="meetingPointText">
          📍 Point de rendez-vous :{" "}
          <span id="meetingPoint">Voie 5 – Zone Assistance PMR</span>
        </p>
      </section>

      <section>
        <h3>Agent PMR</h3>
        <p>
          👤 <span id="agentName">Sophie Dupont</span>
        </p>
        <p>
          ⏱️ Temps estimé : <span id="eta">3</span> min
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
            value={qrPayload}
            size={128}
            level="H"
            includeMargin={true}
          />
        </div>
        <p>
          ID : <span id="qrPayload">{qrPayload}</span>
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

// ✅ Styles mis à jour
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Arial', sans-serif",
    backgroundColor: "#f4f4f4",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: "30px",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
  },
  reservationCard: {
    backgroundColor: "#fff",
    borderRadius: "15px",
    padding: "25px",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
    marginBottom: "25px",
  },
  reservationTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "15px",
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
  },
  reservationStatus: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  confirmed: {
    color: "green",
  },
  pending: {
    color: "red",
  },
  saveButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "15px",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background-color 0.3s ease",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    color: "#666",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    marginTop: "15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "not-allowed",
  },
  homeButton: {
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "25px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  error: {
    textAlign: "center",
    fontSize: "20px",
    color: "#ff4d4d",
    marginTop: "50px",
  },
  voyageGroup: {
    backgroundColor: '#fff',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  voyageGroupTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px',
  },
  voyageDetails: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  etapesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  etapeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid #dee2e6',
  },
  etapeTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: '10px',
  },
  etapeDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  transportType: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
  },
  icon: {
    marginRight: '8px',
    color: '#007bff',
  },
};
