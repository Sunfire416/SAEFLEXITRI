import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function EditReservation() {
  const { id } = useParams(); // ID de la réservation
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // ✅ Récupération des infos utilisateur

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id_voyage: "",
    nom: "",
    prenom: "",
    photoPasseport: null,
    telephone: "",
    adresse: "",
    mobiliteReduite: true,
    certificatMedical: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Récupérer les détails de la réservation et les infos utilisateur
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupération de la réservation
        const reservationResponse = await axios.get(
          `${API_BASE_URL}/reservations/voyage-of-reservation/${id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (!reservationResponse.data) {
          throw new Error("Réservation introuvable !");
        }

        // Récupération des infos utilisateur
        if (!user) {
          throw new Error("Utilisateur non connecté !");
        }

        // ✅ Pré-remplir les champs avec les données utilisateur
        setFormData({
          id_voyage: reservationResponse.data.id_voyage || "",
          nom: user.name || "",
          prenom: user.surname || "",
          telephone: user.phone || "",
          adresse: user.address || "",
          mobiliteReduite: user.isPMR || true, // Si l'info existe dans l'utilisateur
          photoPasseport: null, // Doit être ajouté par l'utilisateur
          certificatMedical: null, // Doit être ajouté par l'utilisateur
        });

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        setError("Impossible de récupérer les données.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // ✅ Gestion des changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ✅ Gestion des fichiers (photo passeport, certificat médical)
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0],
    });
  };

  // ✅ Passer à l'étape suivante
  const nextStep = () => {
    setStep(step + 1);
  };

  // ✅ Confirmer la réservation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/reservations/RegisterByVoyageID`,
        {
          id_voyage: formData.id_voyage,
          état: true, // ✅ Passage au statut "Confirmé"
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      alert("Réservation confirmée !");
      navigate("/user/pmr-assistance"); // ✅ Redirection vers l'assistance PMR
    } catch (error) {
      console.error("Erreur lors de la confirmation :", error);
      alert("Erreur : Impossible de confirmer la réservation.");
    }
  };

  if (loading) return <p style={styles.loading}>Chargement...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Modifier la réservation #{id}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Étape 1 : Nom & Prénom */}
        {step === 1 && (
          <>
            <label style={styles.label}>Nom :</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <label style={styles.label}>Prénom :</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <button type="button" style={styles.button} onClick={nextStep}>
              Suivant
            </button>
          </>
        )}

        {/* Étape 2 : Photo Passeport */}
        {step === 2 && (
          <>
            <label style={styles.label}>Photo du passeport :</label>
            <input
              type="file"
              name="photoPasseport"
              onChange={handleFileChange}
              style={styles.input}
              required
            />

            <button type="button" style={styles.button} onClick={nextStep}>
              Suivant
            </button>
          </>
        )}

        {/* Étape 3 : Téléphone, Adresse & Mobilité Réduite */}
        {step === 3 && (
          <>
            <label style={styles.label}>Téléphone :</label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <label style={styles.label}>Adresse :</label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="mobiliteReduite"
                checked={formData.mobiliteReduite}
                onChange={handleChange}
              />
              Personne à mobilité réduite
            </label>

            <button type="button" style={styles.button} onClick={nextStep}>
              Suivant
            </button>
          </>
        )}

        {/* Étape 4 : Certificat Médical */}
        {step === 4 && (
          <>
            <label style={styles.label}>Certificat Médical :</label>
            <input
              type="file"
              name="certificatMedical"
              onChange={handleFileChange}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.button}>
              Confirmer la réservation
            </button>
          </>
        )}
      </form>
    </div>
  );
}
export default EditReservation;

// ✅ Styles du composant
const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "16px",
    width: "100%",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
    fontSize: "16px",
    color: "#555",
  },
  button: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    marginTop: "15px",
  },
};
