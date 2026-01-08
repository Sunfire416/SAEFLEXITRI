import React, { useState } from 'react';
import axios from 'axios';
import './RATPReservation.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

function RATPReservation() {
    const [reservationData, setReservationData] = useState({
        nom: '',
        prenom: '',
        num_reza_RATP: '',
        num_reza_MMT: '',
        prix: '',
        assistance_PMR: false,
        arret_depart: '',
        arret_arrivee: '',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setReservationData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Vous devez être connecté');
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/reservations/insert`,
                reservationData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Réservation RATP créée avec succès !');
            setReservationData({
                nom: '',
                prenom: '',
                num_reza_RATP: '',
                num_reza_MMT: '',
                prix: '',
                assistance_PMR: false,
                arret_depart: '',
                arret_arrivee: '',
            });
        } catch (err) {
            console.error('Erreur:', err);
            setError(err.response?.data?.error || 'Erreur lors de la réservation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ratp-reservation">
            <h3>Réservation RATP</h3>
            <form onSubmit={handleSubmit}>
                <label>
                    Nom:
                    <input type="text" name="nom" value={reservationData.nom} onChange={handleChange} required />
                </label>
                <label>
                    Prénom:
                    <input type="text" name="prenom" value={reservationData.prenom} onChange={handleChange} required />
                </label>
                <label>
                    Numéro Réservation RATP:
                    <input type="text" name="num_reza_RATP" value={reservationData.num_reza_RATP} onChange={handleChange} required />
                </label>
                <label>
                    Numéro Réservation MMT:
                    <input type="text" name="num_reza_MMT" value={reservationData.num_reza_MMT} onChange={handleChange} />
                </label>
                <label>
                    Prix:
                    <input type="number" name="prix" value={reservationData.prix} onChange={handleChange} required />
                </label>
                <label>
                    Arrêt Départ:
                    <input type="text" name="arret_depart" value={reservationData.arret_depart} onChange={handleChange} required />
                </label>
                <label>
                    Arrêt Arrivée:
                    <input type="text" name="arret_arrivee" value={reservationData.arret_arrivee} onChange={handleChange} required />
                </label>
                <label>
                    Assistance PMR:
                    <input type="checkbox" name="assistance_PMR" checked={reservationData.assistance_PMR} onChange={handleChange} />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Envoi...' : 'Enregistrer'}
                </button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default RATPReservation;