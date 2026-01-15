import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function ReservationForm() {
    const [reservation, setReservation] = useState({
        num_reza_MMT: "",
        transportType: "",
        company: "",
        departure: "",
        arrival: "",
        price: 0,
        assistance_pmr: false,
        class: "Economy",
    });

    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const transportCompanies = {
        Bus: ["RATP", "FlixBus"],
        Train: ["SNCF", "TGV Inoui", "Ouigo"],
        Vols: ["Air France", "EasyJet", "Ryanair"],
        Métro: ["Métro Parisien", "Métro Lyon"],
        Covoiturage: ["BlaBlaCar"],
    };

    const handleTransportChange = (e) => {
        const selectedType = e.target.value;
        setReservation((prev) => ({ ...prev, transportType: selectedType, company: "" }));
        setCompanyOptions(transportCompanies[selectedType]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReservation((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reservation.num_reza_MMT || !reservation.transportType || !reservation.company) {
            setError("Veuillez remplir tous les champs requis.");
            return;
        }

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
                reservation,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Réservation enregistrée avec succès !');
            setReservation({
                num_reza_MMT: "",
                transportType: "",
                company: "",
                departure: "",
                arrival: "",
                price: 0,
                assistance_pmr: false,
                class: "Economy",
            });
            setCompanyOptions([]);
        } catch (err) {
            console.error('Erreur:', err);
            setError(err.response?.data?.error || 'Erreur lors de la réservation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reservation-form">
            <h2>Réservation Multimodale</h2>
            <form onSubmit={handleSubmit}>
                <label>Numéro de Réservation MMT :</label>
                <input
                    type="text"
                    name="num_reza_MMT"
                    value={reservation.num_reza_MMT}
                    onChange={handleInputChange}
                    className="info-input"
                    placeholder="Entrez le numéro"
                    required
                />

                <label>Type de Transport :</label>
                <select
                    name="transportType"
                    value={reservation.transportType}
                    onChange={handleTransportChange}
                    className="info-input"
                    required
                >
                    <option value="">Sélectionnez un type</option>
                    {Object.keys(transportCompanies).map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>

                <label>Compagnie :</label>
                <select
                    name="company"
                    value={reservation.company}
                    onChange={handleInputChange}
                    className="info-input"
                    disabled={!reservation.transportType}
                    required
                >
                    <option value="">Sélectionnez une compagnie</option>
                    {companyOptions.map((company) => (
                        <option key={company} value={company}>
                            {company}
                        </option>
                    ))}
                </select>

                <label>Ville de Départ :</label>
                <input
                    type="text"
                    name="departure"
                    value={reservation.departure}
                    onChange={handleInputChange}
                    className="info-input"
                    placeholder="Ex : Paris"
                />

                <label>Ville d'Arrivée :</label>
                <input
                    type="text"
                    name="arrival"
                    value={reservation.arrival}
                    onChange={handleInputChange}
                    className="info-input"
                    placeholder="Ex : Lyon"
                />

                <label>Tarif Estimé :</label>
                <input
                    type="number"
                    name="price"
                    value={reservation.price}
                    onChange={handleInputChange}
                    className="info-input"
                />

                <label>Classe :</label>
                <select
                    name="class"
                    value={reservation.class}
                    onChange={handleInputChange}
                    className="info-input"
                >
                    <option value="Economy">Économique</option>
                    <option value="Business">Affaires</option>
                    <option value="First">Première</option>
                </select>

                <label>
                    <input
                        type="checkbox"
                        name="assistance_pmr"
                        checked={reservation.assistance_pmr}
                        onChange={(e) => setReservation({ ...reservation, assistance_pmr: e.target.checked })}
                    />
                    Assistance PMR
                </label>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Envoi...' : 'Soumettre'}
                </button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default ReservationForm;