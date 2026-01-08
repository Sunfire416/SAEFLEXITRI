import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insertSNCFTrip } from '../../services/authService';
import './SNCFReservation.css';

function SNCFReservation() {
    const [reservationData, setReservationData] = useState({
        departure: '',
        destination: '',
        price: ''
    });

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReservationData((prev) => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || '' : value.trim()
        }));

        if (message) {
            setMessage('');
            setIsError(false);
        }
    };

    const validateForm = () => {
        const { departure, destination, price } = reservationData;
        if (!departure || !destination || !price || price <= 0) {
            setMessage('Tous les champs sont requis et le prix doit être valide.');
            setIsError(true);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            setMessage(`📤 Envoi: ${JSON.stringify(reservationData)}`); // AFFICHE ENVOI
            
            const result = await insertSNCFTrip(reservationData);
            
            setMessage(`✅ Succès! Trajet créé: ${JSON.stringify(result)}`); // AFFICHE RÉSULTAT
            setIsError(false);
            
            setTimeout(() => navigate('/user/ewallet'), 3000);
        } catch (error) {
            setIsError(true);
            setMessage(`❌ ERREUR: ${error.message}`); // AFFICHE ERREUR
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="sncf-reservation">
            <h3>Réserver un trajet SNCF</h3>
            <form onSubmit={handleSubmit}>
                <label>
                    Départ:
                    <input
                        type="text"
                        name="departure"
                        value={reservationData.departure}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Paris"
                        disabled={isLoading}
                    />
                </label>
                <label>
                    Destination:
                    <input
                        type="text"
                        name="destination"
                        value={reservationData.destination}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Lyon"
                        disabled={isLoading}
                    />
                </label>
                <label>
                    Prix:
                    <input
                        type="number"
                        step="0.01"
                        name="price"
                        value={reservationData.price}
                        onChange={handleChange}
                        required
                        placeholder="Ex: 99.90"
                        min="0"
                        disabled={isLoading}
                    />
                </label>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={isLoading ? 'loading' : ''}
                >
                    {isLoading ? 'Réservation en cours...' : 'Réserver'}
                </button>
            </form>
            {message && (
                <p className={isError ? 'error-message' : 'success-message'}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default SNCFReservation;







