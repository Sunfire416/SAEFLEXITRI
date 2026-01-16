import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "./PmrAssistance.css";
import "leaflet/dist/leaflet.css";

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function PMRTracking() {
  const [status, setStatus] = useState("en_route");
  const [agentPosition, setAgentPosition] = useState([48.8809, 2.3553]);
  const [helpRequested, setHelpRequested] = useState(false);

  const qrPayload = "PMR-SEGMENT-001";
  const meetingPoint = [48.886, 2.345];
  const destination = [50.637, 3.077];
  const routeCoordinates = [[48.8809, 2.3553], meetingPoint, destination];

  const statusConfig = {
    en_route: {
      text: "Agent en route",
      color: "#f1c40f",
      position: [48.8809, 2.3553],
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

  return (
    <div className="pmr-container">
      <h1>Suivi de prise en charge PMR</h1>

      <section>
        <h3>Trajet en cours</h3>
        <p>
          <strong id="from">Paris Gare du Nord</strong> →{" "}
          <strong id="to">Lille Europe</strong>
        </p>

        <MapContainer
          center={[49.3, 2.7]}
          zoom={7}
          style={{ height: "300px", borderRadius: "12px" }}
          className="pmr-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
            maxZoom={19}
          />

          {/* Markers */}
          <Marker position={[48.8809, 2.3553]}>
            <Popup>Départ: Paris Gare du Nord</Popup>
          </Marker>
          <Marker position={meetingPoint}>
            <Popup>Point RDV: Voie 5</Popup>
          </Marker>
          <Marker position={destination}>
            <Popup>Destination: Lille Europe</Popup>
          </Marker>

          {/* Agent circle marker */}
          <CircleMarker
            center={agentPosition}
            radius={10}
            fillColor={currentConfig.color}
            color={currentConfig.color}
            weight={2}
            opacity={1}
            fillOpacity={1}
          >
            <Popup>Agent PMR - {currentConfig.text}</Popup>
          </CircleMarker>

          {/* Route polyline */}
          <Polyline positions={routeCoordinates} color="blue" weight={3} />
        </MapContainer>

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
