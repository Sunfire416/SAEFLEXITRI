import React, { createContext, useState, useEffect } from 'react';
import apiService from '../api/apiService';
import { isDemoMode } from '../config/demoConfig';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isTokenValid = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            return decodedToken.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token || !isTokenValid(token)) {
                    localStorage.removeItem('token');
                    setUser(null);
                    return;
                }

                // Utiliser apiService (qui gère DEMO fallback)
                const data = await apiService.get('/auth/me');
                setUser(data.user || data);
            } catch (error) {
                console.error('Erreur lors de la récupération de l’utilisateur :', error);
                // En cas d'erreur réseau, laisser apiService décider du fallback
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (credentials) => {
        try {
            const data = await apiService.post('/auth/login', credentials);

            // apiService retourne directement l'objet mock ou la réponse API
            const token = data.token || data?.data?.token;
            const userResp = data.user || data?.data?.user || data;

            if (token) localStorage.setItem('token', token);
            if (userResp) setUser(userResp);

            return userResp;
        } catch (error) {
            console.error('Erreur de connexion :', error);
            if (error.response?.status === 401) {
                throw new Error('Identifiants invalides. Veuillez réessayer.');
            }
            if (isDemoMode()) {
                // En DEMO, retourner l'utilisateur mock si present
                return null;
            }
            throw new Error('Erreur de connexion. Veuillez réessayer plus tard.');
        }
    };

    const getUserById = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Utilisateur non authentifié');

            const data = await apiService.get(`/users/${id}`);
            return data.user || data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur avec ID ${id} :`, error);
            if (error?.response?.status === 404) throw new Error('Utilisateur non trouvé.');
            throw new Error('Erreur lors de la récupération des données utilisateur.');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Inscription utilisateur
    const signup = async (credentials) => {
        try {
            const data = await apiService.post('/auth/signup', credentials);
            const token = data.token || data?.data?.token;
            const userResp = data.user || data?.data?.user || data;
            if (token) localStorage.setItem('token', token);
            if (userResp) setUser(userResp);
            return userResp;
        } catch (error) {
            console.error('Erreur signup :', error);
            throw new Error('Erreur lors de l\'inscription.');
        }
    };
    const updateUserProfile = async (updates) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Utilisateur non authentifié');

            if (!updates.user_id) {
                throw new Error("L'ID de l'utilisateur est requis pour la mise à jour.");
            }

            // ✅ PUT /api/users/:id via apiService (gère token & DEMO fallback)
            const resp = await apiService.put(`/users/${updates.user_id}`, updates);
            const data = resp?.data || resp;

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

    // TODO DEMO: Kafka supprimé - Utiliser Supabase Realtime à la place
    // Exemple d'implémentation Supabase Realtime :
    // const subscribeToNotifications = () => {
    //   const channel = supabase.channel('notifications')
    //     .on('postgres_changes', { 
    //       event: 'INSERT', 
    //       schema: 'public', 
    //       table: 'notifications' 
    //     }, payload => {
    //       console.log('Nouvelle notification:', payload.new);
    //     })
    //     .subscribe();
    // };
    const startKafkaConsumer = async (onMessage, onError) => {
        console.warn('TODO DEMO: Kafka supprimé - Utiliser Supabase Realtime');
        if (onError) onError('Kafka a été remplacé par Supabase Realtime');
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
