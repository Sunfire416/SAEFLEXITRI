import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faTaxi, faTrain, faBus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function ModifyReservation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groupedReservations, setGroupedReservations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reservations/getByUser/${userId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const reservationsWithDetails = await Promise.all(
        response.data.map(async (reservation) => {
          const voyageDetails = await fetchVoyageDetails(reservation.reservation_id);
          return { ...reservation, ...voyageDetails };
        })
      );

      // Grouper les réservations par num_reza_mmt
      const grouped = reservationsWithDetails.reduce((acc, reservation) => {
        const key = reservation.num_reza_mmt;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(reservation);
        acc[key].sort((a, b) => a.etape_voyage - b.etape_voyage);
        return acc;
      }, {});

      setGroupedReservations(grouped);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les réservations");
      setLoading(false);
    }
  };

  const fetchVoyageDetails = async (reservationId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reservations/voyage-of-reservation/${reservationId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du voyage:", error);
      return {};
    }
  };

  useEffect(() => {
    if (user && user.user_id) {
      fetchReservations(user.user_id);
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (!user) return <div style={styles.error}>Veuillez vous connecter pour accéder à vos réservations.</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mes Réservations</h1>

      {Object.entries(groupedReservations).length > 0 ? (
        Object.entries(groupedReservations).map(([rezaMmt, reservations]) => (
          <div key={rezaMmt} style={styles.voyageGroup}>
            <h2 style={styles.voyageGroupTitle}>Voyage #{rezaMmt}</h2>
            <div style={styles.voyageDetails}>
              <p style={styles.voyageDate}>
                <strong>Date de début :</strong> {new Date(reservations[0].date_debut).toLocaleDateString()}
              </p>
              <p style={styles.voyageDate}>
                <strong>Date de fin :</strong> {new Date(reservations[0].date_fin).toLocaleDateString()}
              </p>
              <p style={styles.voyagePrice}>
                <strong>Prix total :</strong> {reservations.reduce((sum, res) => sum + res.prix_total, 0)} €
              </p>

              {/* Bouton pour rediriger avec l'ID du voyage */}
              <button
                style={styles.saveButton}
                onClick={() => navigate(`/edit-reservation/${reservations[0].reservation_id}`)}
              >
                Enregistrer le voyage
              </button>
            </div>

            <div style={styles.etapesContainer}>
              {reservations.map((reservation) => (
                <div key={reservation.reservation_id} style={styles.etapeCard}>
                  <h3 style={styles.etapeTitle}>Étape {reservation.etape_voyage}</h3>
                  <div style={styles.etapeDetails}>
                    <p style={styles.transportType}>
                      <FontAwesomeIcon
                        icon={
                          reservation.Type_Transport === "avion" ? faPlane :
                            reservation.Type_Transport === "taxi" ? faTaxi :
                              reservation.Type_Transport === "train" ? faTrain : faBus
                        }
                        style={styles.icon}
                      />
                      {reservation.Type_Transport.charAt(0).toUpperCase() + reservation.Type_Transport.slice(1)}
                    </p>
                    <p style={styles.reservationStatus}>
                      <span style={reservation.Enregistré ? styles.confirmed : styles.pending}>
                        {reservation.Enregistré ? "Confirmé ✅" : "En attente ⏳"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={styles.error}>Aucune réservation trouvée.</div>
      )}

      <button style={styles.homeButton} onClick={() => navigate('/')}>
        Retour à l'accueil
      </button>
    </div>
  );
}

export default ModifyReservation;

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
