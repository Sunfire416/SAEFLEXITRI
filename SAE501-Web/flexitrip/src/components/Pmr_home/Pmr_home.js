/* src/User_Home/UserHome.js */
import React, { useEffect, useState } from 'react';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

function Pmr_home() {
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Pour gérer le chargement

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Débogage

        if (!token) {
            setError('No valid token found. Please log in again.');
            setLoading(false);
            return;
        }

        fetch(`${API_BASE_URL}/users/login`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                console.log('Response status:', response.status); // Débogage

                if (response.status === 401) {
                    throw new Error('Unauthorized. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Forbidden. You do not have access.');
                } else if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('PMR Data:', data); // Débogage
                setUserName(data.name);
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Loading...</p>; // Affiche un état de chargement

    if (error) return <p className="error-message">{error}</p>; // Affiche l'erreur

    return (
        <div>
            <h1>Welcome to Your Dashboard</h1>
            {userName && <p><strong>User:</strong> {userName}</p>}
        </div>

    );
}

export default Pmr_home;