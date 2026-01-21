import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ Backend = /api (cf. app.js)
    const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

    const isTokenValid = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            return decodedToken.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    };

    // Charger l'utilisateur au démarrage
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token || !isTokenValid(token)) {
                    localStorage.removeItem('token');
                    setUser(null);
                    return;
                }

                const decodedToken = jwtDecode(token);
                const userId = decodedToken.user_id || decodedToken.id;

                // ✅ GET /api/users/:id (protégé)
                const { data } = await axios.get(`${API_BASE_URL}/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // routes/users.js renvoie: { success: true, user: {...} }
                setUser(data.user);
            } catch (error) {
                console.error('Erreur lors de la récupération de l’utilisateur :', error);
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Connexion utilisateur
    const login = async (credentials) => {
        try {
            // ✅ POST /api/auth/login
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials);

            localStorage.setItem('token', data.token);
            setUser(data.user);

            return data.user;
        } catch (error) {
            console.error('Erreur de connexion :', error);
            if (error.response?.status === 401) {
                throw new Error('Identifiants invalides. Veuillez réessayer.');
            }
            throw new Error('Erreur de connexion. Veuillez réessayer plus tard.');
        }
    };

    // Récupération utilisateur par id
    const getUserById = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Utilisateur non authentifié');

            // ✅ GET /api/users/:id
            const { data } = await axios.get(`${API_BASE_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return data.user;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur avec ID ${id} :`, error);
            if (error.response?.status === 404) throw new Error('Utilisateur non trouvé.');
            throw new Error("Erreur lors de la récupération des données utilisateur.");
        }
    };

    // Déconnexion utilisateur (JWT custom => logout local)
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Inscription utilisateur
    const signup = async (credentials) => {
        try {
            // ✅ POST /api/auth/register
            const { data } = await axios.post(`${API_BASE_URL}/auth/register`, credentials);

            localStorage.setItem('token', data.token);
            setUser(data.user);

            return data.user;
        } catch (error) {
            console.error("Erreur lors de l’inscription :", error);
            throw error;
        }
    };

    // Mise à jour du profil utilisateur
    const updateUserProfile = async (updates) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Utilisateur non authentifié');

            if (!updates.user_id) {
                throw new Error("L'ID de l'utilisateur est requis pour la mise à jour.");
            }

            // ✅ PUT /api/users/:id
            const { data } = await axios.put(`${API_BASE_URL}/users/${updates.user_id}`, updates, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // routes/users.js renvoie: { success: true, user: {...} }
            if (data?.user) {
                setUser(data.user);
            } else {
                // fallback au cas où l'API renverrait différemment
                setUser((prev) => (prev ? { ...prev, ...updates } : prev));
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil utilisateur :', error);

            if (error.response) {
                const msg = error.response.data?.error || error.response.data?.message || `Erreur API : ${error.response.status}`;
                throw new Error(msg);
            }
            if (error.request) {
                throw new Error('Impossible de communiquer avec le serveur. Vérifiez votre connexion.');
            }
            throw new Error(error.message || 'Une erreur inconnue est survenue.');
        }
    };

    // Kafka consumer (si endpoint existe côté API)
    const startKafkaConsumer = async (onMessage, onError) => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/kafka/messages`);
            if (onMessage) onMessage(data.message);
        } catch (error) {
            console.error('Erreur lors du démarrage du consommateur Kafka :', error);
            if (onError) onError('Erreur lors du démarrage du consommateur Kafka.');
        }
    };

    const value = React.useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            signup,
            getUserById,
            updateUserProfile,
            startKafkaConsumer,
        }),
        [user, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {loading ? <div>Chargement...</div> : children}
        </AuthContext.Provider>
    );
};
