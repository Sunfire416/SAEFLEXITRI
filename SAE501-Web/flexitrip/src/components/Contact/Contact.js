import { useState } from "react";
import axios from "axios";
import "./Contact.css";
import avion from "../../assets/images/avion.jpg";

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Envoi en cours...");

    // Validation des champs
    if (!formData.email || !formData.message || !formData.firstName || !formData.lastName) {
      setStatus("Veuillez remplir tous les champs.");
      return;
    }

    // Validation de l'adresse email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus("Veuillez entrer une adresse email valide.");
      return;
    }


    // Préparation des données
    const payload = {
      userEmail: formData.email.trim(),
      message: `Message : ${formData.message.trim()}`,
      Nom: formData.lastName.trim(),
      Prenom: formData.firstName.trim(),
    };

    try {
      console.log("Données envoyées :", payload);

      const response = await axios.post(
        `${API_BASE_URL}/contact/receive-message`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      if (response.status === 200) {
        setStatus("Message envoyé avec succès !");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          message: "",
        });
      } else {
        setStatus("Erreur lors de l'envoi du message. Réessayez plus tard.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error.response || error);

      const errorMessage =
        error.response?.data?.error ||
        "Une erreur s'est produite. Vérifiez vos informations ou réessayez plus tard.";
      setStatus(errorMessage);
    }
  };

  return (
    <div
      className="contact-container"
      style={{
        backgroundImage: `url(${avion})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        minHeight: "100vh",
      }}
    >

      <div className="contact-form-card">
        <h1>Rencontrez-vous un problème ?</h1>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Prénom</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Entrez votre prénom..."
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Nom</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Entrez votre nom..."
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Entrez votre email..."
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              placeholder="Entrez votre message..."
              value={formData.message}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>
          <button type="submit" className="submit-button">
            Envoyer
          </button>
        </form>
        {status && <p className="status-message">{status}</p>}
      </div>
    </div>
  );
}

export default Contact;