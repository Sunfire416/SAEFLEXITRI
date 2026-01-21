/* src/User_Home/UserHome.js */
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function UserHome() {
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('No valid token found. Please log in again.');
            setLoading(false);
            return;
        }

        try {
            // Décoder le token pour obtenir l'user_id
            const decoded = jwtDecode(token);
            const userId = decoded.user_id || decoded.id;

            // Récupérer les données utilisateur avec la bonne route
            fetch(`${API_BASE_URL}/users/get/${userId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => {
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
                    console.log('User Data:', data);
                    setUserName(data.name || 'User');
                    setUserRole(data.role || 'Unknown Role');
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                    setError(error.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        } catch (error) {
            console.error('Error decoding token:', error);
            setError('Invalid token. Please log in again.');
            setLoading(false);
        }
    }, []);

    if (loading) return <p>Loading...</p>;

    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h1>Welcome to Your Dashboard</h1>
            {userName && <p><strong>Name:</strong> {userName}</p>}
            {userRole && <p><strong>Role:</strong> {userRole}</p>}
            <p>This is your personalized dashboard.</p>
        </div>
    );
}

export default UserHome;